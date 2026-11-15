import { inflateSync } from "node:zlib";
import type { ImportedItem, ImportedSkill, ImportedSkillGem } from "./ninjaImport";

const MAX_COMPRESSED = 8 * 1024 * 1024;
const MAX_XML = 32 * 1024 * 1024;

type Attributes = Record<string, string>;

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

function parseAttributes(source: string): Attributes {
  const result: Attributes = {};
  const pattern = /([\w:-]+)\s*=\s*(["'])(.*?)\2/g;
  for (const match of source.matchAll(pattern)) result[match[1]] = decodeXmlEntities(match[3]);
  return result;
}

function firstOpenTag(xml: string, name: string): Attributes {
  const match = xml.match(new RegExp(`<${name}\\b([^>]*)>`, "i"));
  return match ? parseAttributes(match[1]) : {};
}

function firstBlock(xml: string, name: string): { attributes: Attributes; body: string } | undefined {
  const match = xml.match(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}\\s*>`, "i"));
  return match ? { attributes: parseAttributes(match[1]), body: match[2] } : undefined;
}

function blocks(xml: string, name: string): Array<{ attributes: Attributes; body: string }> {
  const result: Array<{ attributes: Attributes; body: string }> = [];
  const pattern = new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}\\s*>`, "gi");
  for (const match of xml.matchAll(pattern)) result.push({ attributes: parseAttributes(match[1]), body: match[2] });
  return result;
}

function selfClosingTags(xml: string, name: string): Attributes[] {
  const result: Attributes[] = [];
  const pattern = new RegExp(`<${name}\\b([^>]*?)\\s*\\/>`, "gi");
  for (const match of xml.matchAll(pattern)) result.push(parseAttributes(match[1]));
  return result;
}

function normalizeRarity(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toUpperCase();
  const labels: Record<string, string> = { NORMAL: "Normal", MAGIC: "Magic", RARE: "Rare", UNIQUE: "Unique" };
  return labels[value] ?? raw;
}

function parseItemText(id: string, body: string, slot: string, kind: "equipment" | "jewel"): ImportedItem | undefined {
  // PoB stores item descriptions as text nodes with optional nested ModRange tags.
  const plain = decodeXmlEntities(body.replace(/<ModRange\b[^>]*\/?\s*>/gi, "").replace(/<[^>]*>/g, " "));
  const lines = plain.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!lines.length) return undefined;

  const rarityLine = lines.find((line) => /^Rarity:\s*/i.test(line));
  const rarity = normalizeRarity(rarityLine?.replace(/^Rarity:\s*/i, ""));
  const start = rarityLine ? lines.indexOf(rarityLine) + 1 : 0;
  const content = lines.slice(start);
  const metadata = /^(?:Unique ID|Item Level|LevelReq|Quality|Sockets|Rune|Implicits|Radius|Charm Slots|Experience|Stack Size|Map Tier|Map Level)\s*:/i;
  const first = content[0];
  if (!first) return undefined;

  let name = first;
  let baseType: string | undefined;
  let modStart = 1;
  if (rarity === "Rare" || rarity === "Unique") {
    const possibleBase = content[1];
    if (possibleBase && !metadata.test(possibleBase)) {
      baseType = possibleBase;
      modStart = 2;
    }
  } else if (rarity === "Normal") {
    baseType = first;
    modStart = 1;
  } else {
    // Magic item names can include the base (notably flasks); only treat the
    // next line as a base when it clearly precedes metadata/modifier text.
    const possibleBase = content[1];
    if (possibleBase && !metadata.test(possibleBase) && !/^\+?\d/.test(possibleBase) && !/%/.test(possibleBase)) {
      baseType = possibleBase;
      modStart = 2;
    }
  }

  const itemLevel = Number(content.find((line) => /^Item Level:\s*\d+/i.test(line))?.match(/\d+/)?.[0]);
  const quality = content.find((line) => /^Quality:\s*/i.test(line))?.replace(/^Quality:\s*/i, "");
  const mods = content.slice(modStart).filter((line) =>
    !metadata.test(line) && !/^LevelReq\s*:/i.test(line) && !/^Unique ID\s*:/i.test(line)
  );

  return {
    kind,
    slot,
    name,
    baseType,
    rarity,
    itemLevel: Number.isFinite(itemLevel) && itemLevel > 0 ? itemLevel : undefined,
    quality,
    mods,
  };
}

function normalizePobSlot(raw: string): string | undefined {
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  const slots: Record<string, string> = {
    weapon1: "Weapon1",
    weapon1swap: "Weapon1Swap",
    weapon2: "Offhand",
    weapon2swap: "Offhand2",
    helmet: "Helmet",
    bodyarmour: "Body Armour",
    gloves: "Gloves",
    boots: "Boots",
    amulet: "Amulet",
    ring1: "Ring 1",
    ring2: "Ring 2",
    belt: "Belt",
    charm1: "Charm1",
    charm2: "Charm2",
    charm3: "Charm3",
    flask1: "LifeFlask",
    flask2: "ManaFlask",
  };
  return slots[key];
}

export interface ParsedPob2Export {
  level?: number;
  characterClass?: string;
  ascendancy?: string;
  items: ImportedItem[];
  jewels: ImportedItem[];
  skills: ImportedSkill[];
  mainSkill?: string;
  metadata: {
    itemCount: number;
    jewelCount: number;
    skillCount: number;
    xmlBytes: number;
    level: string | null;
    className: string | null;
    ascendancy: string | null;
  };
}

function skillsBlockSkillName(xml: string, oneBasedGroup: number): string | undefined {
  const skillsBlock = firstBlock(xml, "Skills");
  if (!skillsBlock) return undefined;
  const activeSkillSetId = skillsBlock.attributes.activeSkillSet;
  const skillSets = blocks(skillsBlock.body, "SkillSet");
  const activeSkillSet = skillSets.find((set) => set.attributes.id === activeSkillSetId) ?? skillSets[0];
  if (!activeSkillSet) return undefined;
  const target = blocks(activeSkillSet.body, "Skill")[oneBasedGroup - 1];
  if (!target || target.attributes.enabled === "false") return undefined;
  const gems = selfClosingTags(target.body, "Gem");
  const primary = gems.find((attrs) => attrs.nameSpec && !/support/i.test(`${attrs.skillId ?? ""} ${attrs.gemId ?? ""}`))
    ?? gems.find((attrs) => Boolean(attrs.nameSpec));
  return primary?.nameSpec;
}

export function parsePob2Xml(xml: string): ParsedPob2Export {
  if (!/<PathOfBuilding2?(?:\s|>)/i.test(xml) || !/<\/PathOfBuilding2?\s*>/i.test(xml)) {
    throw new Error("완전한 Path of Building XML이 아닙니다.");
  }

  const build = firstOpenTag(xml, "Build");
  const levelValue = Number(build.level);
  const level = Number.isFinite(levelValue) && levelValue > 0 ? levelValue : undefined;
  const characterClass = build.className || undefined;
  const ascendancy = build.ascendClassName || undefined;

  const itemsBlock = firstBlock(xml, "Items");
  const itemMap = new Map<string, ImportedItem>();
  if (itemsBlock) {
    for (const item of blocks(itemsBlock.body, "Item")) {
      const id = item.attributes.id;
      if (!id) continue;
      // Slot is assigned from the active ItemSet below; this first pass indexes
      // exact item text by its PoB item ID without guessing any equipment slot.
      const parsed = parseItemText(id, item.body, "", "equipment");
      if (parsed) itemMap.set(id, parsed);
    }
  }

  const items: ImportedItem[] = [];
  if (itemsBlock) {
    const activeSetId = itemsBlock.attributes.activeItemSet;
    const itemSets = blocks(itemsBlock.body, "ItemSet");
    const activeSet = itemSets.find((set) => set.attributes.id === activeSetId) ?? itemSets[0];
    if (activeSet) {
      for (const slot of selfClosingTags(activeSet.body, "Slot")) {
        const itemId = slot.itemId;
        const slotName = slot.name;
        if (!itemId || itemId === "0" || !slotName) continue;
        const normalizedSlot = normalizePobSlot(slotName);
        const source = itemMap.get(itemId);
        if (!normalizedSlot || !source) continue;
        items.push({ ...source, kind: "equipment", slot: normalizedSlot });
      }
    }
  }

  const jewels: ImportedItem[] = [];
  const tree = firstBlock(xml, "Tree");
  if (tree) {
    const activeSpecId = tree.attributes.activeSpec;
    const specs = blocks(tree.body, "Spec");
    const activeSpec = specs.find((spec) => spec.attributes.id === activeSpecId) ?? specs[0];
    const sockets = activeSpec ? firstBlock(activeSpec.body, "Sockets") : undefined;
    if (sockets) {
      for (const socket of selfClosingTags(sockets.body, "Socket")) {
        const itemId = socket.itemId;
        const nodeId = socket.nodeId;
        const source = itemId ? itemMap.get(itemId) : undefined;
        if (!source || !nodeId) continue;
        jewels.push({ ...source, kind: "jewel", slot: `Jewel ${nodeId}` });
      }
    }
  }

  const skills: ImportedSkill[] = [];
  const skillsBlock = firstBlock(xml, "Skills");
  if (skillsBlock) {
    const activeSkillSetId = skillsBlock.attributes.activeSkillSet;
    const skillSets = blocks(skillsBlock.body, "SkillSet");
    const activeSkillSet = skillSets.find((set) => set.attributes.id === activeSkillSetId) ?? skillSets[0];
    if (activeSkillSet) {
      for (const [index, skill] of blocks(activeSkillSet.body, "Skill").entries()) {
        if (skill.attributes.enabled === "false") continue;
        const rawGemTags = selfClosingTags(skill.body, "Gem");
        const isSupport = (attrs: Attributes) => /support/i.test(`${attrs.skillId ?? ""} ${attrs.gemId ?? ""}`);
        const gems = rawGemTags.flatMap((attrs) => {
          const name = attrs.nameSpec;
          if (!name) return [];
          const levelNumber = Number(attrs.level);
          return [{
            attrs,
            gem: { name, level: Number.isFinite(levelNumber) && levelNumber > 0 ? levelNumber : undefined } satisfies ImportedSkillGem,
          }];
        });
        if (!gems.length) continue;
        const primaryIndex = gems.findIndex(({ attrs }) => !isSupport(attrs));
        const chosenIndex = primaryIndex >= 0 ? primaryIndex : 0;
        const primary = gems[chosenIndex]?.gem;
        if (!primary) continue;
        const supportGems = gems.filter((_, gemIndex) => gemIndex !== chosenIndex).map(({ gem }) => gem);
        skills.push({
          name: primary.name,
          supports: supportGems.map((gem) => gem.name),
          supportGems,
          slot: index,
        });
      }
    }
  }

  const mainSocketGroup = Number(build.mainSocketGroup);
  const mainSkill = Number.isInteger(mainSocketGroup) && mainSocketGroup > 0
    ? skillsBlockSkillName(xml, mainSocketGroup)
    : undefined;

  const parsed: ParsedPob2Export = {
    level,
    characterClass,
    ascendancy,
    items,
    jewels,
    skills,
    mainSkill,
    metadata: {
      itemCount: items.length,
      jewelCount: jewels.length,
      skillCount: skills.length,
      xmlBytes: Buffer.byteLength(xml, "utf8"),
      level: build.level || null,
      className: characterClass || null,
      ascendancy: ascendancy || null,
    },
  };

  if (!items.length && !jewels.length && !skills.length) {
    throw new Error("PoB Export XML에서 장비·주얼·스킬 데이터를 찾지 못했습니다.");
  }
  return parsed;
}

export function decodePob2ExportCode(input: string): { xml: string; parsed: ParsedPob2Export } {
  const code = input.trim().replace(/^\uFEFF/, "").replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!code || code.length > MAX_COMPRESSED * 2 || !/^[A-Za-z0-9+/]*={0,2}$/.test(code)) {
    throw new Error("PoB Export 코드가 없거나 올바르지 않습니다.");
  }

  const compressed = Buffer.from(code, "base64");
  if (compressed.length > MAX_COMPRESSED) throw new Error("Export 데이터 용량 초과");
  let xml: string;
  try {
    xml = inflateSync(compressed, { maxOutputLength: MAX_XML }).toString("utf8");
  } catch {
    throw new Error("PoB Export 압축 데이터를 해독하지 못했습니다.");
  }
  const parsed = parsePob2Xml(xml);
  return { xml, parsed };
}
