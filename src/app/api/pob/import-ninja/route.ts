import { NextRequest, NextResponse } from "next/server";
import {
  parseNinjaCharacterUrl,
  type ImportedCharacter,
  type ImportedItem,
  type ImportedSkill,
  type ImportedCharacterStat,
} from "../../../pob/ninjaImport";

export const dynamic = "force-dynamic";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return stripTags(match[1]);
  }
  return undefined;
}

function decodeJsString(value: string) {
  return decodeEntities(value)
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u002f/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .trim();
}

function normalizePublicImageUrl(raw: string | undefined, pageUrl: string) {
  if (!raw) return undefined;
  const decoded = decodeJsString(raw);
  try {
    const absolute = new URL(decoded, pageUrl);
    // Next.js image optimization URLs keep the real remote image in the `url` query param.
    if (absolute.pathname.includes("/_next/image")) {
      const nested = absolute.searchParams.get("url");
      if (nested) return new URL(decodeURIComponent(nested), pageUrl).toString();
    }
    return absolute.toString();
  } catch {
    return undefined;
  }
}

function srcFromSrcset(srcset: string | undefined) {
  if (!srcset) return undefined;
  const parts = decodeJsString(srcset)
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
  return parts.at(-1);
}

function attrValue(tag: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}=["']([^"']*)["']`, "i"));
  return match?.[1] ? decodeJsString(match[1]) : undefined;
}

function isLikelyImageUrl(value: string) {
  return /(?:\.(?:png|jpe?g|webp|avif|gif)(?:[?#].*)?$|\/_next\/image\?)/i.test(value);
}

function imageCandidatesFromText(text: string, pageUrl: string) {
  const out: string[] = [];
  const seen = new Set<string>();
  const decoded = decodeJsString(text);
  const rawCandidates = decoded.match(/(?:https?:\\?\/\\?\/[^"'<>\s]+|\/_next\/image\?[^"'<>\s]+|\/[^"'<>\s]+\.(?:png|jpe?g|webp|avif|gif)(?:\?[^"'<>\s]*)?)/gi) ?? [];
  for (const raw of rawCandidates) {
    const cleaned = raw.replace(/[),;}]+$/g, "");
    if (!isLikelyImageUrl(cleaned)) continue;
    const normalized = normalizePublicImageUrl(cleaned, pageUrl);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function isRejectedPortraitCandidate(tag: string, url: string) {
  const label = [attrValue(tag, "alt"), attrValue(tag, "title"), attrValue(tag, "aria-label")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const lowerUrl = url.toLowerCase();
  return (
    /poe\.?ninja|logo|favicon|site[-_ ]?icon|brand/.test(label) ||
    /logo|favicon|apple-touch|site-icon|poe-ninja|poeninja/.test(lowerUrl)
  );
}

function numericAttr(tag: string, name: string) {
  const raw = attrValue(tag, name);
  if (!raw) return undefined;
  const match = raw.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function portraitCandidateScore(tag: string, imageIndex: number, headingIndex: number) {
  let score = headingIndex - imageIndex;
  // Portrait must be before the visible character heading.
  if (imageIndex >= headingIndex) return Number.POSITIVE_INFINITY;

  const width = numericAttr(tag, "width");
  const height = numericAttr(tag, "height");
  if (width && height) {
    const ratio = Math.max(width, height) / Math.min(width, height);
    if (ratio <= 1.12) score -= 600;
    else score += 1200;
    if (width >= 40 && width <= 192 && height >= 40 && height <= 192) score -= 350;
    if (width <= 28 || height <= 28) score += 1600;
  }
  return score;
}

function findPublicPortrait(html: string, characterName: string | undefined, pageUrl: string) {
  if (!characterName || !html) return undefined;
  const decodedHtml = decodeJsString(html);
  const escapedName = characterName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

  // IMPORTANT: only anchor on the actual visible heading that contains the character name.
  // Do not use plain string occurrences because the name also appears in OpenGraph metadata,
  // serialized build-preview data and other page resources.
  const headingRe = new RegExp(
    `<h([1-6])\\b[^>]*>[\\s\\S]{0,800}?${escapedName}[\\s\\S]{0,800}?<\\/h\\1>`,
    "gi"
  );
  const headings = [...decodedHtml.matchAll(headingRe)];
  if (!headings.length) return undefined;

  const indexedImages = [...decodedHtml.matchAll(/<img\\b[^>]*>/gi)]
    .map((match) => {
      const tag = match[0];
      const raw = attrValue(tag, "src") ?? attrValue(tag, "data-src") ?? srcFromSrcset(attrValue(tag, "srcset"));
      const url = normalizePublicImageUrl(raw, pageUrl);
      return { index: match.index ?? -1, tag, url };
    })
    .filter((entry) => entry.index >= 0 && Boolean(entry.url)) as Array<{ index: number; tag: string; url: string }>;

  for (const heading of headings) {
    const headingIndex = heading.index ?? -1;
    if (headingIndex < 0) continue;

    // On poe.ninja the profile portrait is the small square image immediately before
    // the character-title block. Limit the search to a very tight preceding window.
    const candidates = indexedImages
      .filter((entry) => entry.index < headingIndex && headingIndex - entry.index <= 1800)
      .filter((entry) => !isRejectedPortraitCandidate(entry.tag, entry.url))
      .map((entry) => ({ ...entry, score: portraitCandidateScore(entry.tag, entry.index, headingIndex) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => a.score - b.score);

    if (candidates[0]?.url) return candidates[0].url;
  }

  // Fail closed. A missing portrait is better than showing a logo, equipment image,
  // OpenGraph build preview or another unrelated image.
  return undefined;
}

function ninjaClassPortraitUrl(ascendancy: string | undefined) {
  if (!ascendancy) return undefined;
  const slug = ascendancy
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return undefined;
  return `https://assets.poe.ninja/poe2/classes/${slug}.webp`;
}

function parsePublicSummary(html: string, pageUrl: string, characterName?: string) {
  const title = firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
  const visible = stripTags(html);
  const levelText = firstMatch(visible, [/(?:Level|레벨)\s*(\d{1,3})/i]);
  const level = levelText ? Number(levelText) : undefined;
  const ascendancy = firstMatch(visible, [
    /(?:Level|레벨)\s*\d{1,3}\s+([A-Za-z][A-Za-z '\-]{2,40})/i,
  ]);
  const mainSkill = firstMatch(visible, [
    /(?:DPS|Main Skill|주력 스킬)\s*[:\-]?\s*([A-Za-z][A-Za-z '\-]{2,40})/i,
  ]);
  const portraitUrl = findPublicPortrait(html, characterName, pageUrl);
  return { title, level, ascendancy, mainSkill, portraitUrl };
}

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

function textValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  }
  return undefined;
}

function collectTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry) => {
      if (typeof entry === "string") return [stripTags(entry)];
      const obj = asObject(entry);
      if (!obj) return [];
      const text = textValue(obj.text, obj.name, obj.value, obj.mod);
      return text ? [stripTags(text)] : [];
    })
    .filter(Boolean);
}

function normalizeRarity(raw: JsonObject) {
  const explicit = textValue(raw.rarity, raw.rarityName, raw.frameTypeName);
  if (explicit) return explicit;
  const frameType = numberValue(raw.frameType);
  const map: Record<number, string> = { 0: "Normal", 1: "Magic", 2: "Rare", 3: "Unique" };
  return frameType === undefined ? undefined : map[frameType];
}

function normalizeItemEntries(rawItems: unknown[], kind: ImportedItem["kind"] = "equipment"): ImportedItem[] {
  return rawItems
    .map((entry): ImportedItem | null => {
      const outer = asObject(entry);
      if (!outer) return null;
      const inner = asObject(outer.itemData) ?? asObject(outer.item) ?? outer;

      const mods = [
        inner.implicitMods,
        inner.implicits,
        inner.explicitMods,
        inner.explicitModifiers,
        inner.enchantMods,
        inner.enchants,
        inner.craftedMods,
        inner.craftedModifiers,
        inner.fracturedMods,
        inner.fracturedModifiers,
        inner.runeMods,
        inner.runes,
        inner.desecratedMods,
        outer.implicitMods,
        outer.explicitMods,
        outer.runeMods,
        outer.craftedMods,
        outer.fracturedMods,
      ].flatMap(collectTextArray);

      const properties = Array.isArray(inner.properties) ? inner.properties : [];
      let quality: string | undefined;
      for (const property of properties) {
        const obj = asObject(property);
        const name = textValue(obj?.name);
        if (name?.toLowerCase().includes("quality")) {
          quality = textValue(obj?.value, Array.isArray(obj?.values) ? obj?.values?.[0] : undefined);
        }
      }

      const rawSlot = textValue(
        outer.inventoryId,
        outer.inventorySlot,
        outer.slot,
        outer.location,
        inner.inventoryId,
        inner.inventorySlot,
        inner.slot,
        inner.location,
        inner.itemClass
      );
      const slotX = numberValue(
        outer.x,
        inner.x,
        outer.slotX,
        inner.slotX,
        outer.inventoryX,
        inner.inventoryX
      );
      const normalizedRawSlot = (rawSlot ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      let resolvedSlot = rawSlot;

      // POE2 puts both flasks and all three charms in the same `Flask` inventory.
      // Their x-position identifies the actual slot:
      //   x=0 life flask, x=1 mana flask, x=2/3/4 charm 1/2/3.
      // This matches Path of Building PoE2's character import logic.
      if (normalizedRawSlot === "flask" && slotX !== undefined) {
        if (slotX === 0) resolvedSlot = "LifeFlask";
        else if (slotX === 1) resolvedSlot = "ManaFlask";
        else if (slotX >= 2 && slotX <= 4) resolvedSlot = `Charm${slotX - 1}`;
      }

      return {
        kind,
        slot: resolvedSlot,
        name: textValue(inner.name, outer.name),
        baseType: textValue(inner.baseType, inner.typeLine, outer.baseType, outer.typeLine),
        rarity: normalizeRarity(inner),
        icon: textValue(inner.icon, outer.icon),
        itemLevel: numberValue(inner.itemLevel, inner.ilvl, outer.itemLevel, outer.ilvl),
        quality,
        mods: Array.from(new Set(mods)).filter(Boolean),
      };
    })
    .filter((item): item is ImportedItem => Boolean(item?.name || item?.baseType));
}

function looksLikeJewel(item: ImportedItem) {
  const haystack = `${item.slot ?? ""} ${item.baseType ?? ""} ${item.name ?? ""}`.toLowerCase();
  return /jewel|주얼/.test(haystack);
}

function collectEquipmentArrays(payload: JsonObject): unknown[] {
  const arrays = [
    payload.equipment,
    payload.items,
    payload.flasks,
    asObject(payload.character)?.equipment,
    asObject(payload.character)?.items,
    asObject(payload.character)?.flasks,
    asObject(payload.build)?.equipment,
    asObject(payload.build)?.items,
    asObject(payload.build)?.flasks,
  ].filter(Array.isArray) as unknown[][];

  // poe.ninja/build payloads can expose the same equipped item through more than
  // one view. Merge all known arrays first; de-duplication happens after
  // normalization so Flask inventory entries (life/mana/charm) are not lost.
  return arrays.flat();
}

function importedItemKey(item: ImportedItem) {
  return [item.slot, item.name, item.baseType, item.icon, item.itemLevel, ...item.mods]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join("|");
}

function normalizeItems(payload: JsonObject): ImportedItem[] {
  const rawItems = collectEquipmentArrays(payload);
  if (!rawItems.length) return [];

  const unique = new Map<string, ImportedItem>();
  for (const item of normalizeItemEntries(rawItems, "equipment").filter((entry) => !looksLikeJewel(entry))) {
    const key = importedItemKey(item);
    if (!unique.has(key)) unique.set(key, item);
  }
  return Array.from(unique.values());
}

function collectJewelArrays(payload: JsonObject): unknown[] {
  const found: unknown[] = [];
  const seen = new Set<unknown>();

  function walk(value: unknown, depth: number, keyHint = "") {
    if (depth > 3 || !value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      if (/jewel/i.test(keyHint)) found.push(...value);
      return;
    }
    const obj = value as JsonObject;
    for (const [key, child] of Object.entries(obj)) {
      if (Array.isArray(child) && /jewel/i.test(key)) found.push(...child);
      else if (child && typeof child === "object") walk(child, depth + 1, key);
    }
  }

  walk(payload, 0);
  return found;
}

function normalizeJewels(payload: JsonObject): ImportedItem[] {
  const explicit = collectJewelArrays(payload);
  const rawItems = collectEquipmentArrays(payload);
  const fromItems = rawItems.length ? normalizeItemEntries(rawItems, "jewel").filter(looksLikeJewel) : [];
  const fromJewelArrays = normalizeItemEntries(explicit, "jewel");

  const unique = new Map<string, ImportedItem>();
  for (const item of [...fromJewelArrays, ...fromItems]) {
    const key = [item.name, item.baseType, item.slot, item.icon, ...item.mods].filter(Boolean).join("|");
    if (!unique.has(key)) unique.set(key, item);
  }
  return Array.from(unique.values());
}

function numericCandidate(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (/^-?\d+(?:\.\d+)?$/.test(cleaned)) {
      const num = Number(cleaned);
      if (Number.isFinite(num)) return num;
    }
  }
  return undefined;
}

function extractDpsValue(value: unknown, depth = 0): number | undefined {
  if (depth > 4 || value == null) return undefined;
  const direct = numericCandidate(value);
  if (direct !== undefined) return direct;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractDpsValue(entry, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const obj = asObject(value);
  if (!obj) return undefined;

  const preferredKeys = [
    "dps", "totalDps", "combinedDps", "damagePerSecond", "value", "amount", "total", "damage",
  ];
  for (const key of preferredKeys) {
    if (!(key in obj)) continue;
    const found = extractDpsValue(obj[key], depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

function formatDps(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2).replace(/\.0+$|(?<=\.[0-9])0$/, "")}m`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return Math.round(value).toLocaleString("en-US");
}

function normalizeSkillGem(value: unknown) {
  const obj = asObject(value);
  if (!obj) return undefined;
  const itemData = asObject(obj.itemData);
  const name = textValue(obj.name, obj.skillName, obj.label, itemData?.name, itemData?.baseType, itemData?.typeLine);
  if (!name) return undefined;
  return {
    name,
    icon: textValue(obj.icon, itemData?.icon),
    level: numberValue(obj.level, obj.gemLevel, itemData?.level, itemData?.gemLevel),
  };
}

function normalizeSkills(payload: JsonObject): ImportedSkill[] {
  const candidates = [payload.skills, asObject(payload.character)?.skills, asObject(payload.build)?.skills];
  const rawSkills = candidates.find(Array.isArray) as unknown[] | undefined;
  if (!rawSkills) return [];

  return rawSkills
    .map((entry): ImportedSkill | null => {
      if (typeof entry === "string") return { name: entry, supports: [] };
      const obj = asObject(entry);
      if (!obj) return null;

      const allGems = Array.isArray(obj.allGems) ? obj.allGems : [];
      const normalizedGems = allGems.map(normalizeSkillGem).filter(Boolean) as Array<{ name: string; icon?: string; level?: number }>;
      const primaryGem = normalizedGems[0];
      const gem = asObject(obj.gem);
      const name = textValue(primaryGem?.name, obj.name, obj.skillName, obj.label, gem?.name);
      if (!name) return null;

      const supportGems = normalizedGems.slice(1).filter((support) => support.name !== name);
      const fallbackSupports = [obj.supports, obj.supportGems, obj.gems]
        .flatMap((v) => collectTextArray(v))
        .filter((v) => v !== name);
      const supports = supportGems.length ? supportGems.map((support) => support.name) : fallbackSupports;

      const dpsValue = extractDpsValue(obj.dps);
      return {
        name,
        icon: primaryGem?.icon ?? textValue(obj.icon, gem?.icon),
        supports: Array.from(new Set(supports)),
        supportGems,
        dps: formatDps(dpsValue),
        dpsValue,
        slot: numberValue(obj.slot, obj.skillSlot, obj.index, primaryGem ? asObject(allGems[0])?.x : undefined),
      };
    })
    .filter((skill): skill is ImportedSkill => Boolean(skill));
}


function normalizeLookupKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function collectStatSources(payload: JsonObject): JsonObject[] {
  const out: JsonObject[] = [];
  const seen = new Set<JsonObject>();

  // Character-state data has moved between root/stats/summary-style objects in
  // poe.ninja snapshots. Walk object-only branches a few levels deep, while
  // deliberately skipping arrays so item/skill records cannot be mistaken for
  // character stats.
  function walk(value: unknown, depth: number) {
    if (depth > 4 || Array.isArray(value)) return;
    const obj = asObject(value);
    if (!obj || seen.has(obj)) return;
    seen.add(obj);
    out.push(obj);
    for (const child of Object.values(obj)) {
      if (child && typeof child === "object" && !Array.isArray(child)) walk(child, depth + 1);
    }
  }

  walk(payload, 0);
  return out;
}

function findStatRaw(sources: JsonObject[], aliases: string[]) {
  const wanted = new Set(aliases.map(normalizeLookupKey));
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (wanted.has(normalizeLookupKey(key)) && value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
  }
  return undefined;
}

function statNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace(/%/g, "").trim();
    const match = cleaned.match(/^-?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  const obj = asObject(value);
  if (obj) {
    return statNumber(obj.value ?? obj.amount ?? obj.total ?? obj.current ?? obj.max);
  }
  return undefined;
}

function statText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const obj = asObject(value);
  if (obj) return textValue(obj.value, obj.text, obj.amount, obj.total, obj.current, obj.max);
  return undefined;
}

function formatWhole(value: unknown) {
  const n = statNumber(value);
  if (n === undefined) return statText(value);
  return Math.round(n).toLocaleString("en-US");
}

function formatPercent(value: unknown) {
  const text = statText(value);
  if (text?.includes("%")) return text;
  const n = statNumber(value);
  return n === undefined ? text : `${Math.round(n * 100) / 100}%`;
}

function formatPerSecond(value: unknown) {
  const text = statText(value);
  if (text && /\/s|per second/i.test(text)) return text;
  const n = statNumber(value);
  return n === undefined ? text : `${Math.round(n * 10) / 10}/s`;
}

function formatCompact(value: unknown) {
  const n = statNumber(value);
  if (n === undefined) return statText(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2).replace(/\.0+$|(?<=\.[0-9])0$/, "")}m`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return Math.round(n).toLocaleString("en-US");
}

function normalizeCharacterStats(payload: JsonObject): ImportedCharacterStat[] {
  const sources = collectStatSources(payload);
  const result: ImportedCharacterStat[] = [];

  const get = (...aliases: string[]) => findStatRaw(sources, aliases);
  const push = (key: string, label: string, value: string | undefined, group?: string) => {
    if (value !== undefined && value !== "") result.push({ key, label, value, group });
  };

  const str = get("str", "strength");
  const dex = get("dex", "dexterity");
  const int = get("int", "intelligence");
  if ([str, dex, int].some((value) => value !== undefined)) {
    push(
      "attributes",
      "Strength / Dexterity / Intelligence",
      [formatWhole(str) ?? "-", formatWhole(dex) ?? "-", formatWhole(int) ?? "-"].join(" / "),
      "overview"
    );
  }

  push("movementSpeed", "Movement Speed", formatPercent(get("movementSpeed", "movespeed")), "overview");
  push("itemRarity", "Item Rarity", formatPercent(get("itemRarity", "rarity", "increasedItemRarity")), "overview");

  const endurance = get("eCharges", "enduranceCharges", "enduranceCharge");
  const frenzy = get("fCharges", "frenzyCharges", "frenzyCharge");
  const power = get("pCharges", "powerCharges", "powerCharge");
  if ([endurance, frenzy, power].some((value) => value !== undefined)) {
    push(
      "charges",
      "Charges (Endurance / Frenzy / Power)",
      [formatWhole(endurance) ?? "-", formatWhole(frenzy) ?? "-", formatWhole(power) ?? "-"].join(" / "),
      "overview"
    );
  }

  const basic: Array<[string, string, string[], (value: unknown) => string | undefined]> = [
    ["life", "Life", ["life", "maximumLife", "maxLife"], formatWhole],
    ["energyShield", "Energy Shield", ["energyShield", "es", "maximumEnergyShield", "maxEnergyShield"], formatWhole],
    ["runicWard", "Runic Ward", ["runicWard", "ward", "runeward"], formatWhole],
    ["mana", "Mana", ["mana", "maximumMana", "maxMana"], formatWhole],
    ["spirit", "Spirit", ["spirit", "maximumSpirit", "maxSpirit"], formatWhole],
    ["armour", "Armour", ["armour", "armor"], formatWhole],
    ["evasion", "Evasion", ["evasion", "evasionRating"], formatWhole],
    ["evasionChance", "Evasion Chance", ["evasionChance", "evadeChance", "chanceToEvade"], formatPercent],
    ["deflection", "Deflection", ["deflect", "deflection", "deflectionRating"], formatWhole],
    ["deflectionChance", "Deflection Chance", ["deflectChance", "deflectionChance"], formatPercent],
    ["block", "Block Chance", ["block", "blockChance"], formatPercent],
    ["physicalDamageReduction", "Physical Damage Reduction", ["physicalDamageReduction", "physicalReduction", "physReduction"], formatPercent],
  ];
  for (const [key, label, aliases, formatter] of basic) push(key, label, formatter(get(...aliases)), "defence");

  const fireRes = get("fireRes", "fireResistance");
  const coldRes = get("coldRes", "coldResistance");
  const lightningRes = get("lightningRes", "lightningResistance");
  const chaosRes = get("chaosRes", "chaosResistance");
  if ([fireRes, coldRes, lightningRes, chaosRes].some((value) => value !== undefined)) {
    push(
      "resistances",
      "Resistances (Fire / Cold / Lightning / Chaos)",
      [fireRes, coldRes, lightningRes, chaosRes].map((value) => value === undefined ? "-" : formatPercent(value) ?? "-").join(" / "),
      "defence"
    );
  }

  push("effectiveHealthPool", "Effective Health Pool", formatCompact(get("effectiveHealthPool", "effectiveHealth", "ehp")), "survival");

  const maxHitDefs: Array<[string, string[]]> = [
    ["Physical", ["physicalMax", "physicalMaxHit", "maxPhysicalHit"]],
    ["Fire", ["fireMax", "fireMaxHit", "maxFireHit"]],
    ["Cold", ["coldMax", "coldMaxHit", "maxColdHit"]],
    ["Lightning", ["lightningMax", "lightningMaxHit", "maxLightningHit"]],
    ["Chaos", ["chaosMax", "chaosMaxHit", "maxChaosHit"]],
  ];
  const maxHits = maxHitDefs
    .map(([label, aliases]) => ({ label, value: get(...aliases) }))
    .filter((entry) => entry.value !== undefined);
  if (maxHits.length) {
    push("maxHit", "Max Hit", maxHits.map((entry) => `${entry.label} ${formatCompact(entry.value)}`).join(" · "), "survival");
  }

  push("lifeRegen", "Life Regen", formatPerSecond(get("lifeRegen", "lifeRegeneration")), "recovery");
  push("manaRegen", "Mana Regen", formatPerSecond(get("manaRegen", "manaRegeneration")), "recovery");
  push("energyShieldRecharge", "Energy Shield Recharge", formatPerSecond(get("energyShieldRecharge", "esRecharge", "energyShieldRechargeRate")), "recovery");
  push("energyShieldRechargeDelay", "Energy Shield Recharge Delay", statText(get("energyShieldRechargeDelay", "esRechargeDelay")), "recovery");

  return result;
}


function findSnapshot(indexState: unknown, leagueSlug: string) {
  const root = asObject(indexState);
  const versions = root?.snapshotVersions;
  if (!Array.isArray(versions)) return undefined;
  const normalized = leagueSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return versions.find((entry) => {
    const obj = asObject(entry);
    const url = textValue(obj?.url)?.toLowerCase().replace(/[^a-z0-9]/g, "");
    const name = textValue(obj?.snapshotName)?.toLowerCase().replace(/[^a-z0-9]/g, "");
    return url === normalized || name === normalized;
  }) as JsonObject | undefined;
}

async function fetchJson(url: string, referer?: string) {
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": BROWSER_UA,
      ...(referer ? { referer } : {}),
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ref = parseNinjaCharacterUrl(String(body?.url ?? ""));

    let verified = false;
    let pageTitle: string | undefined;
    let level: number | undefined;
    let ascendancy: string | undefined;
    let portraitUrl: string | undefined;
    let publicHtml: string | undefined;
    let mainSkill: string | undefined;
    let detailSource: ImportedCharacter["detailSource"] = "url-only";
    let detailMessage = "링크 구조는 확인했습니다.";
    let snapshotVersion: string | undefined;
    let snapshotName: string | undefined;
    let items: ImportedItem[] = [];
    let jewels: ImportedItem[] = [];
    let skills: ImportedSkill[] = [];
    let stats: ImportedCharacterStat[] = [];
    let pathOfBuildingExport: string | undefined;

    try {
      const response = await fetch(ref.originalUrl, {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": BROWSER_UA,
        },
      });
      if (response.ok) {
        verified = true;
        const html = await response.text();
        publicHtml = html;
        const summary = parsePublicSummary(html, ref.originalUrl, ref.character);
        pageTitle = summary.title;
        level = summary.level;
        ascendancy = summary.ascendancy;
        // Portrait is derived from the final ascendancy name after character JSON is loaded.
        portraitUrl = undefined;
        mainSkill = summary.mainSkill;
        detailSource = "public-page";
        detailMessage = "poe.ninja 캐릭터 페이지를 확인했습니다.";
      }
    } catch {
      detailMessage = "공개 페이지 연결은 실패했지만 링크 정보로 계속 시도합니다.";
    }

    // EXPERIMENTAL / LOCAL VALIDATION ONLY:
    // poe.ninja documents builds/character endpoints as internal and unsupported for third-party apps.
    // Keep this adapter disabled in production until a supported production ingestion path is chosen.
    if (process.env.NODE_ENV !== "production") {
      try {
        const indexState = await fetchJson("https://poe.ninja/poe2/api/data/index-state", ref.originalUrl);
        const snapshot = findSnapshot(indexState, ref.leagueSlug);
        if (!snapshot) throw new Error("해당 리그 snapshot을 찾지 못했습니다.");

        snapshotVersion = textValue(snapshot.version);
        snapshotName = textValue(snapshot.snapshotName, snapshot.name);
        if (!snapshotVersion || !snapshotName) throw new Error("snapshot version/name이 없습니다.");

        const characterUrl = new URL(`https://poe.ninja/poe2/api/builds/${encodeURIComponent(snapshotVersion)}/character`);
        characterUrl.searchParams.set("account", ref.account);
        characterUrl.searchParams.set("name", ref.character);
        characterUrl.searchParams.set("overview", snapshotName);

        const raw = await fetchJson(
          characterUrl.toString(),
          `https://poe.ninja/poe2/builds/${encodeURIComponent(ref.leagueSlug)}`
        );
        const payload = asObject(raw);
        if (!payload) throw new Error("캐릭터 JSON 형식이 아닙니다.");

        items = normalizeItems(payload);
        jewels = normalizeJewels(payload);
        skills = normalizeSkills(payload);
        stats = normalizeCharacterStats(payload);
        pathOfBuildingExport = textValue(
          payload.pathOfBuildingExport,
          asObject(payload.character)?.pathOfBuildingExport,
          asObject(payload.build)?.pathOfBuildingExport
        );

        level = numberValue(payload.level, asObject(payload.character)?.level) ?? level;
        ascendancy = textValue(
          payload.ascendancy,
          payload.class,
          payload.className,
          asObject(payload.character)?.ascendancy,
          asObject(payload.character)?.class
        ) ?? ascendancy;

        // poe.ninja class portraits follow a stable asset convention.
        // Example: "Gemling Legionnaire" -> "gemling-legionnaire.webp".
        // Derive the exact poe.ninja asset URL from the final ascendancy value.
        portraitUrl = ninjaClassPortraitUrl(ascendancy);

        mainSkill = textValue(payload.mainSkill, asObject(payload.character)?.mainSkill) ?? mainSkill;

        detailSource = "poe-ninja-character-json";
        detailMessage = `로컬 실험 경로로 상세 데이터 수신: 장비 ${items.length}개 · 주얼 ${jewels.length}개 · 스킬 ${skills.length}개 · 스탯 ${stats.length}개${pathOfBuildingExport ? " · PoB export 있음" : ""}`;
      } catch (error) {
        const reason = error instanceof Error ? error.message : "상세 데이터 요청 실패";
        detailMessage = `${detailMessage} 상세 데이터 실험 요청은 실패했습니다: ${reason}`;
      }
    } else {
      detailMessage = `${detailMessage} 운영 배포에서는 poe.ninja 비공개 builds API 실험 호출을 사용하지 않습니다.`;
    }

    const result: ImportedCharacter = {
      ...ref,
      verified,
      pageTitle,
      level,
      ascendancy,
      portraitUrl,
      mainSkill,
      fetchedAt: new Date().toISOString(),
      detailSource,
      detailMessage,
      snapshotVersion,
      snapshotName,
      items,
      jewels,
      skills,
      stats,
      pathOfBuildingExport,
    };

    return NextResponse.json({ ok: true, character: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "캐릭터 링크를 확인하지 못했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
