import {
  GEAR_CATEGORIES,
  NORMAL_ITEM_LEVEL_RULES,
  type FilterItem,
  type NeverSinkStrictnessId,
} from "./filterData";
import type { NeverSinkBasePayload } from "./neversinkBase";

export type ExportItemState = { enabled: boolean; importance: string };
export type ExportTierState = { enabled: boolean; importance: string };
export type ExportNormalLevelState = { enabled: boolean; importance: string };
export type ExportSoundChoice = "default" | "masitda" | "oishie" | "divine-power" | "risenne-geoje-yaho" | "risenne-gripgam" | "risenne-neo-do-na-do" | "risenne-sori-jilleo" | "risenne-drama" | "risenne-an-ttaeryeosseo" | "risenne-niga-mwonde" | "risenne-onaka-ippai-zenbu-tabeta" | `user:${string}`;

export type ExportSoundDescriptor = {
  choice: ExportSoundChoice;
  filterPath: string;
};

export type NeverSinkRuleStatus = "show" | "hide" | "conditional" | "missing";

export type FilterExportInput = {
  base: NeverSinkBasePayload;
  items: FilterItem[];
  itemState: Record<string, ExportItemState>;
  baselineEnabled: (itemId: string) => boolean;
  baselineStatus: (itemId: string) => NeverSinkRuleStatus;
  soundState: Record<string, ExportSoundChoice>;
  soundDescriptors: Record<string, ExportSoundDescriptor>;
  rareTiers: Record<string, ExportTierState>;
  magicTiers: Record<string, ExportTierState>;
  rareGear: Record<string, boolean>;
  magicGear: Record<string, boolean>;
  normalItems: Array<{ id: string; baseType: string }>;
  normalGear: Record<string, boolean>;
  normalBaselineEnabled: (itemId: string) => boolean;
  normalBaselineStatus: (itemId: string) => NeverSinkRuleStatus;
  normalBaselineImportance: (itemId: string) => string;
  normalImportance: Record<string, string>;
  normalLevelRules: Record<string, ExportNormalLevelState>;
};

export type FilterExportResult = {
  text: string;
  changedRules: number;
  usedSoundChoices: ExportSoundChoice[];
  notes: string[];
};

type RuleBlock = {
  start: number;
  end: number;
  section: string;
  lines: string[];
};

const VISUAL_COMMAND = /^\s*(SetFontSize|SetTextColor|SetBorderColor|SetBackgroundColor|PlayEffect|MinimapIcon)\b/i;
const SOUND_COMMAND = /^\s*(PlayAlertSound|PlayAlertSoundPositional|CustomAlertSound|CustomAlertSoundOptional)\b/i;
const CONDITION_COMMAND = /^\s*(BaseType|Class|Rarity|GemLevel|WaystoneTier|ItemLevel|AreaLevel|Quality|Sockets|Corrupted|TwiceCorrupted|HasVaalUniqueMod|DropLevel|StackSize|AnyEnchantment|HasExplicitMod|Mirrored)\b/i;

function stripComment(line: string) {
  const index = line.indexOf("#");
  return (index >= 0 ? line.slice(0, index) : line).trim();
}

function parseBlocks(text: string): { lines: string[]; blocks: RuleBlock[] } {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: RuleBlock[] = [];
  let section = "";
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const major = trimmed.match(/^#\s*\[\[(\d{4})\]\]/);
    const sub = trimmed.match(/^#\s*\[(\d{4})\]/);
    if (major) section = major[1];
    else if (sub) section = sub[1];

    if (/^(Show|Hide)\b/i.test(trimmed)) {
      const start = i;
      let end = i + 1;
      while (end < lines.length) {
        const t = lines[end].trim();
        if (!t) break;
        if (/^(Show|Hide)\b/i.test(t)) break;
        if (/^#\s*\[\[?\d{4}\]?\]/.test(t)) break;
        end += 1;
      }
      blocks.push({ start, end, section, lines: lines.slice(start, end) });
      i = end;
      continue;
    }
    i += 1;
  }
  return { lines, blocks };
}

function quotedValues(line: string) {
  return [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
}

function sourceSections(item: FilterItem) {
  return [...String(item.sourceSection ?? "").matchAll(/\b(\d{4})\b/g)].map((match) => match[1]);
}

function rarityMatches(block: RuleBlock, rarity?: FilterItem["rarity"]) {
  if (!rarity) return true;
  const rarityLine = block.lines.find((line) => /^\s*Rarity\b/i.test(stripComment(line)));
  if (!rarityLine) return true;
  const clean = stripComment(rarityLine).replace(/^Rarity\s*(==|=)?\s*/i, "").trim();
  if (/(<=|>=|<|>)/.test(clean)) return true;
  const values = quotedValues(clean).length ? quotedValues(clean) : clean.split(/\s+/).filter(Boolean);
  return values.includes(rarity);
}


function inferredRarityCondition(item: FilterItem): string | null {
  if (item.rarity) return `Rarity ${item.rarity}`;
  if (item.id.startsWith("j-magic-")) return "Rarity Normal Magic";
  if (item.id.startsWith("j-time-lost-")) return "Rarity <= Rare";
  if (item.family === "flask" || item.family === "charm") return "Rarity Normal Magic";
  if (item.id.startsWith("t-") && item.baseType?.endsWith("Tablet")) return "Rarity <= Rare";
  return null;
}

function blockMatchesItemRarityScope(block: RuleBlock, item: FilterItem) {
  if (item.rarity) return rarityMatches(block, item.rarity);
  const inferred = inferredRarityCondition(item);
  if (!inferred) return true;
  const rarityLine = block.lines.find((line) => /^\s*Rarity\b/i.test(stripComment(line)));
  if (!rarityLine) return true;
  const clean = stripComment(rarityLine);
  // Non-unique web rows must never edit/copy a Unique-only rule that shares the
  // same BaseType (flasks, charms, jewels, tablets).
  if (/^Rarity\s+(?:==\s*)?Unique\s*$/i.test(clean)) return false;
  if (item.id.startsWith("j-magic-") && /^Rarity\s+(?:==\s*)?Rare\s*$/i.test(clean)) return false;
  return true;
}
function blockContainsBaseType(block: RuleBlock, baseType: string) {
  return block.lines.some((line) => /^\s*BaseType\b/i.test(stripComment(line)) && quotedValues(line).includes(baseType));
}

function replaceBaseTypeWithOnly(lines: string[], baseType: string) {
  return lines.map((line) => {
    if (!/^\s*BaseType\b/i.test(stripComment(line)) || !quotedValues(line).includes(baseType)) return line;
    const clean = stripComment(line);
    const operator = clean.match(/^BaseType\s*(!=|==|=)?/i)?.[1] ?? "==";
    const indent = line.match(/^\s*/)?.[0] ?? "\t";
    return `${indent}BaseType ${operator} "${baseType.replaceAll('"', "")}"`;
  });
}

function removeBaseType(lines: string[], baseType: string): { lines: string[]; empty: boolean } {
  let found = false;
  let empty = false;
  const out = lines.map((line) => {
    if (!/^\s*BaseType\b/i.test(stripComment(line))) return line;
    const values = quotedValues(line);
    if (!values.includes(baseType)) return line;
    found = true;
    const remaining = values.filter((value) => value !== baseType);
    if (!remaining.length) {
      empty = true;
      return line;
    }
    const clean = stripComment(line);
    const operator = clean.match(/^BaseType\s*(!=|==|=)?/i)?.[1] ?? "==";
    const indent = line.match(/^\s*/)?.[0] ?? "\t";
    return `${indent}BaseType ${operator} ${remaining.map((value) => `"${value.replaceAll('"', "")}"`).join(" ")}`;
  });
  return { lines: out, empty: found && empty };
}

function blockTier(block: RuleBlock) {
  return (block.lines[0].match(/\$tier->([^\s!]+)/) ?? [])[1] ?? "";
}

function visualLines(block: RuleBlock) {
  return block.lines.filter((line) => VISUAL_COMMAND.test(line));
}

function findStyleBlock(baseText: string, importance: string, family?: FilterItem["family"]): RuleBlock | undefined {
  const { blocks } = parseBlocks(baseText);
  const tierCandidates: string[] = (() => {
    if (family === "unique") {
      if (importance === "t1") return ["t1"];
      if (importance === "t2") return ["t2"];
      if (importance === "t3") return ["t3"];
      if (importance === "t4") return ["hideable"];
      if (importance === "x") return ["multispecialhigh", "multispecial"];
    }
    if (family === "waystone") {
      if (importance === "ws16") return ["waystone_t16"];
      if (importance === "ws15") return ["waystone_t15"];
      if (importance === "ws12_14") return ["waystone_t12", "waystone_t13", "waystone_t14"];
      if (importance === "ws7_11") return ["waystone_t7", "waystone_t8", "waystone_t9", "waystone_t10", "waystone_t11"];
      if (importance === "ws1_6") return ["waystone_t1", "waystone_t2", "waystone_t3", "waystone_t4", "waystone_t5", "waystone_t6"];
    }
    if (family === "jewel") {
      if (importance === "timelost") return ["anytimelost"];
      if (importance === "rare") return ["anyrare"];
      if (importance === "magic") return ["anymagic"];
    }
    if (family === "flask") {
      if (importance === "flask_endgame") return ["toplevelflasks", "toplevelqualityflasks"];
      if (importance === "flask_level") return ["t1", "selected"];
      if (importance === "flask_low") return ["outdatedlevelflaska", "outdatedlevelflaskb"];
    }
    if (family === "charm") {
      if (importance === "charm_high") return ["hight1charms", "highothercharms"];
      if (importance === "charm_other") return ["earlymappingcharms"];
      if (importance === "charm_quality") return ["qualitycharms", "topqualitycharms"];
      if (importance === "charm_any") return ["anycharm"];
    }
    if (["s", "a", "b", "c", "d", "e", "supplymagic", "supplieslow"].includes(importance)) return [importance];
    if (importance === "misc_high") return ["vaultkeysrare", "superkeys", "s"];
    if (importance === "misc_standard") return ["vaultkeys", "b"];
    if (importance === "misc_low") return ["d", "e", "supplieslow"];
    return [];
  })();

  const familyHeaderMatch = (block: RuleBlock) => {
    const head = block.lines[0];
    if (family === "currency") return /\$type->currency(?:->|\s)/.test(head);
    if (family === "unique") return /\$type->uniques\b/.test(head);
    if (family === "waystone") return /\$type->waystones\b/.test(head);
    if (family === "jewel") return /\$type->jewels\b/.test(head);
    if (family === "flask") return /flask/i.test(head);
    if (family === "charm") return /charm/i.test(head);
    return true;
  };
  for (const tier of tierCandidates) {
    const exactFamily = blocks.find((block) => blockTier(block) === tier && familyHeaderMatch(block) && visualLines(block).length);
    if (exactFamily) return exactFamily;
    const exact = blocks.find((block) => blockTier(block) === tier && visualLines(block).length);
    if (exact) return exact;
  }
  return undefined;
}

function findActiveTierBlock(baseText: string, tier: string, typePattern?: RegExp) {
  const { blocks } = parseBlocks(baseText);
  return blocks.find((block) => {
    if (blockTier(block) !== tier) return false;
    if (typePattern && !typePattern.test(block.lines[0])) return false;
    return visualLines(block).length > 0;
  });
}

function topGearVisualLines() {
  return [
    "\tSetFontSize 45",
    "\tSetTextColor 212 0 0 255",
    "\tSetBorderColor 212 0 0 255",
    "\tSetBackgroundColor 255 255 255 255",
  ];
}

function findGearVisualLines(baseText: string, rarity: "Rare" | "Magic" | "Normal", importance: string): string[] {
  if (importance === "default") return [];
  if (importance === "s") return topGearVisualLines();

  let block: RuleBlock | undefined;
  if (rarity === "Rare") {
    if (importance === "a") block = findActiveTierBlock(baseText, "gear4a", /\$type->ut->rare\b/);
    if (importance === "b") block = findActiveTierBlock(baseText, "gear3a", /\$type->ut->rare\b/);
    if (importance === "c") block = findActiveTierBlock(baseText, "gear2a", /\$type->ut->rare\b/);
    if (importance === "d") block = findActiveTierBlock(baseText, "t1", /\$type->rr->jewellery(?:eg)?\b/);
  } else if (rarity === "Magic") {
    if (importance === "a") block = findActiveTierBlock(baseText, "j4a", /\$type->ut->magic\b/);
    if (importance === "b") block = findActiveTierBlock(baseText, "gear4a", /\$type->ut->magic\b/);
    if (importance === "c") block = findActiveTierBlock(baseText, "gear2a", /\$type->ut->magic\b/);
  } else {
    if (importance === "a") block = findActiveTierBlock(baseText, "normal82", /\$type->endgame->normalcraft->decorator\b/)
      ?? findActiveTierBlock(baseText, "wands", /\$type->endgame->normalcraft->extra\b/);
    if (importance === "b") block = findActiveTierBlock(baseText, "jt1ideallevel", /\$type->endgame->jewellery\b/);
    if (importance === "c") block = findActiveTierBlock(baseText, "normaldecoratorremover", /\$type->endgame->normalcraft->decorator\b/);
  }
  return block ? visualLines(block) : [];
}

function replaceVisualStyleWithLines(lines: string[], styles: string[]) {
  if (!styles.length) return lines;
  const out = lines.filter((line) => !VISUAL_COMMAND.test(line));
  let insertAt = out.length;
  for (let index = 1; index < out.length; index += 1) {
    if (SOUND_COMMAND.test(out[index])) { insertAt = index; break; }
  }
  out.splice(insertAt, 0, ...styles);
  return out;
}

function replaceVisualStyle(lines: string[], template?: RuleBlock) {
  return replaceVisualStyleWithLines(lines, template ? visualLines(template) : []);
}

function replaceSound(lines: string[], descriptor?: ExportSoundDescriptor) {
  if (!descriptor || descriptor.choice === "default") return lines;
  const out = lines.filter((line) => !SOUND_COMMAND.test(line));
  const indent = lines.find((line) => /^\s+/.test(line))?.match(/^\s*/)?.[0] ?? "\t";
  out.push(`${indent}CustomAlertSoundOptional "${descriptor.filterPath.replaceAll('"', "")}" 300`);
  return out;
}

function numericConditionMatches(line: string, field: string, value: number) {
  const clean = stripComment(line);
  const match = clean.match(new RegExp(`^${field}\\s*(>=|<=|==|=|>|<)\\s*(-?\\d+)`, "i"));
  if (!match) return true;
  const n = Number(match[2]);
  switch (match[1]) {
    case ">=": return value >= n;
    case "<=": return value <= n;
    case ">": return value > n;
    case "<": return value < n;
    default: return value === n;
  }
}

function cloneNumericRule(block: RuleBlock, item: FilterItem, importance: string, descriptor: ExportSoundDescriptor | undefined, baseText: string) {
  let lines = [...block.lines];
  if (item.baseType) lines = replaceBaseTypeWithOnly(lines, item.baseType);
  if (item.gemLevel != null) {
    lines = lines.filter((line) => !/^\s*GemLevel\b/i.test(stripComment(line)));
    const actionIndex = 0;
    lines.splice(actionIndex + 1, 0, `\tGemLevel == ${item.gemLevel}`);
  }
  if (item.waystoneTier != null) {
    lines = lines.filter((line) => !/^\s*WaystoneTier\b/i.test(stripComment(line)));
    lines.splice(1, 0, `\tWaystoneTier == ${item.waystoneTier}`);
  }
  if (importance !== "default" && importance !== "dynamic") {
    lines = replaceVisualStyle(lines, findStyleBlock(baseText, importance, item.family));
  }
  lines = replaceSound(lines, descriptor);
  lines[0] = `${lines[0]} # FIXLGS override`;
  return lines;
}

function simpleSelector(item: FilterItem) {
  const lines: string[] = [];
  if (item.baseType) lines.push(`\tBaseType == "${item.baseType.replaceAll('"', "")}"`);
  if (item.classNames?.length) lines.push(`\tClass == ${item.classNames.map((value) => `"${value.replaceAll('"', "")}"`).join(" ")}`);
  const rarityCondition = inferredRarityCondition(item);
  if (rarityCondition) lines.push(`\t${rarityCondition}`);
  if (item.gemLevel != null) lines.push(`\tGemLevel == ${item.gemLevel}`);
  if (item.waystoneTier != null) lines.push(`\tWaystoneTier == ${item.waystoneTier}`);
  return lines;
}

function buildHideRule(item: FilterItem, label: string) {
  const conditions = simpleSelector(item);
  if (!conditions.length) return [];
  return [`Hide # FIXLGS disabled · ${label}`, ...conditions, ""];
}

function buildShowRule(item: FilterItem, label: string, importance: string, descriptor: ExportSoundDescriptor | undefined, baseText: string) {
  const conditions = simpleSelector(item);
  if (!conditions.length) return [];
  let lines = [`Show # FIXLGS override · ${label}`, ...conditions];
  if (importance !== "default" && importance !== "dynamic") {
    const template = findStyleBlock(baseText, importance, item.family);
    if (template) lines.push(...visualLines(template));
  }
  if (descriptor && descriptor.choice !== "default") lines.push(`\tCustomAlertSoundOptional "${descriptor.filterPath.replaceAll('"', "")}" 300`);
  lines.push("");
  return lines;
}


function originalPresentationLines(baseText: string, item: FilterItem) {
  if (!item.baseType) return [] as string[];
  const parsed = parseBlocks(baseText);
  const sections = sourceSections(item);
  const candidates = parsed.blocks.filter((block) => {
    if (sections.length && !sections.includes(block.section)) return false;
    if (!blockContainsBaseType(block, item.baseType!)) return false;
    if (!blockMatchesItemRarityScope(block, item)) return false;
    return true;
  });
  for (const block of candidates) {
    const presentation = block.lines.filter((line) => VISUAL_COMMAND.test(stripComment(line)) || SOUND_COMMAND.test(stripComment(line)));
    if (presentation.length) return presentation;
  }
  return [] as string[];
}

function buildVisibilityOverrideRule(item: FilterItem, enabled: boolean, importance: string, descriptor: ExportSoundDescriptor | undefined, baseText: string) {
  const conditions = simpleSelector(item);
  if (!conditions.length) return [] as string[];
  if (!enabled) return [`Hide # FIXLGS visibility override · ${item.labelKo ?? item.label}`, ...conditions, ""];

  const lines = [`Show # FIXLGS visibility override · ${item.labelKo ?? item.label}`, ...conditions];
  if (importance !== "default" && importance !== "dynamic") {
    const template = findStyleBlock(baseText, importance, item.family);
    if (template) lines.push(...visualLines(template));
  } else {
    lines.push(...originalPresentationLines(baseText, item));
  }
  if (descriptor && descriptor.choice !== "default") {
    const withoutSound = lines.filter((line) => !SOUND_COMMAND.test(stripComment(line)));
    withoutSound.push(`	CustomAlertSoundOptional "${descriptor.filterPath.replaceAll('"', '')}" 300`, "");
    return withoutSound;
  }
  lines.push("");
  return lines;
}

function buildGearShowRule(item: FilterItem, label: string, rarity: "Rare" | "Magic" | "Normal", importance: string, descriptor: ExportSoundDescriptor | undefined, baseText: string) {
  const conditions = simpleSelector(item);
  if (!conditions.length) return [];
  let lines = [`Show # FIXLGS override · ${label}`, ...conditions];
  if (importance !== "default" && importance !== "dynamic") {
    lines.push(...findGearVisualLines(baseText, rarity, importance));
  }
  if (descriptor && descriptor.choice !== "default") lines.push(`\tCustomAlertSoundOptional "${descriptor.filterPath.replaceAll('"', "")}" 300`);
  lines.push("");
  return lines;
}

function mutateExceptional(baseText: string, item: FilterItem, enabled: boolean) {
  if (enabled || item.family !== "exceptional" || !item.rarity || !item.exceptionalRule) return { text: baseText, changed: 0 };
  const parsed = parseBlocks(baseText);
  const targetUnique = item.rarity === "Unique";
  const targets = parsed.blocks.filter((block) => {
    const head = block.lines[0];
    if (targetUnique) {
      if (block.section !== "2903") return false;
      if (item.exceptionalRule === "overquality") return /\$tier->overqualityuniques\b/.test(head);
      return /\$tier->oversocketuniques[12]\b/.test(head);
    }
    if (block.section !== "0300") return false;
    if (!/\$type->exotic->exceptional\b/.test(head)) return false;
    if (item.exceptionalRule === "overquality") return block.lines.some((line) => /^\s*Quality\b/i.test(stripComment(line)));
    return block.lines.some((line) => /^\s*Sockets\b/i.test(stripComment(line)));
  });
  if (!targets.length) return { text: baseText, changed: 0 };

  const lines = parsed.lines;
  let changed = 0;
  for (const block of [...targets].sort((a, b) => b.start - a.start)) {
    if (targetUnique) {
      lines.splice(block.start, block.end - block.start, `# FIXLGS disabled exceptional rule: ${item.id}`);
      changed += 1;
      continue;
    }
    const rarityIndex = block.lines.findIndex((line) => /^\s*Rarity\b/i.test(stripComment(line)));
    if (rarityIndex < 0) continue;
    const original = block.lines[rarityIndex];
    const clean = stripComment(original);
    const values = clean.replace(/^Rarity\s*/i, "").split(/\s+/).filter(Boolean).filter((value) => value !== item.rarity);
    const replacement = [...block.lines];
    if (!values.length) {
      lines.splice(block.start, block.end - block.start, `# FIXLGS disabled exceptional rule: ${item.id}`);
    } else {
      const indent = original.match(/^\s*/)?.[0] ?? "\t";
      replacement[rarityIndex] = `${indent}Rarity ${values.join(" ")}`;
      lines.splice(block.start, block.end - block.start, ...replacement);
    }
    changed += 1;
  }
  return { text: lines.join("\n"), changed };
}

function transformExceptionalCustomization(
  baseText: string,
  item: FilterItem,
  state: ExportItemState,
  descriptor?: ExportSoundDescriptor,
) {
  if (item.family !== "exceptional" || !item.rarity || !item.exceptionalRule) return { text: baseText, changed: 0 };
  if (!state.enabled || (state.importance === "default" && (!descriptor || descriptor.choice === "default"))) {
    return { text: baseText, changed: 0 };
  }
  const parsed = parseBlocks(baseText);
  const targetUnique = item.rarity === "Unique";
  const targets = parsed.blocks.filter((block) => {
    const head = block.lines[0];
    if (targetUnique) {
      if (block.section !== "2903") return false;
      if (item.exceptionalRule === "overquality") return /\$tier->overqualityuniques\b/.test(head);
      return /\$tier->oversocketuniques[12]\b/.test(head);
    }
    if (block.section !== "0300") return false;
    if (!/\$type->exotic->exceptional\b/.test(head)) return false;
    if (item.exceptionalRule === "overquality") return block.lines.some((line) => /^\s*Quality\b/i.test(stripComment(line)));
    return block.lines.some((line) => /^\s*Sockets\b/i.test(stripComment(line)));
  });
  if (!targets.length) return { text: baseText, changed: 0 };

  const lines = parsed.lines;
  let changed = 0;
  for (const block of [...targets].sort((a, b) => b.start - a.start)) {
    let clone = [...block.lines];
    const rarityIndex = clone.findIndex((line) => /^\s*Rarity\b/i.test(stripComment(line)));
    if (rarityIndex < 0) continue;
    const rarityLine = clone[rarityIndex];
    const indent = rarityLine.match(/^\s*/)?.[0] ?? "\t";
    clone[rarityIndex] = `${indent}Rarity ${item.rarity}`;
    if (state.importance !== "default" && state.importance !== "dynamic") {
      clone = replaceVisualStyle(clone, findStyleBlock(baseText, state.importance, item.family));
    }
    clone = replaceSound(clone, descriptor);
    clone[0] = `${clone[0]} # FIXLGS exceptional override · ${item.id}`;

    if (targetUnique) {
      lines.splice(block.start, block.end - block.start, ...clone);
      changed += 1;
      continue;
    }

    const clean = stripComment(rarityLine).replace(/^Rarity\s*/i, "").trim();
    const values = clean.split(/\s+/).filter(Boolean).filter((value) => value !== item.rarity);
    if (!values.length) {
      lines.splice(block.start, block.end - block.start, ...clone);
    } else {
      const remainder = [...block.lines];
      remainder[rarityIndex] = `${indent}Rarity ${values.join(" ")}`;
      lines.splice(block.start, block.end - block.start, ...clone, "", ...remainder);
    }
    changed += 1;
  }
  return { text: lines.join("\n"), changed };
}

function transformBaseTypeItem(baseText: string, item: FilterItem, state: ExportItemState, baseline: boolean, descriptor?: ExportSoundDescriptor, gearRarity?: "Rare" | "Magic" | "Normal") {
  if (!item.baseType || item.gemLevel != null) return { text: baseText, changed: 0, handled: false };
  const hasOverride = state.enabled !== baseline || state.importance !== "default" || (descriptor && descriptor.choice !== "default");
  if (!hasOverride) return { text: baseText, changed: 0, handled: true };

  const parsed = parseBlocks(baseText);
  const sections = sourceSections(item);
  const candidates = parsed.blocks.filter((block) => {
    if (sections.length && !sections.includes(block.section)) return false;
    if (!blockContainsBaseType(block, item.baseType!)) return false;
    if (!blockMatchesItemRarityScope(block, item)) return false;
    return true;
  });
  if (!candidates.length) return { text: baseText, changed: 0, handled: false };

  const lines = parsed.lines;
  let changed = 0;
  for (const block of [...candidates].sort((a, b) => b.start - a.start)) {
    const removed = removeBaseType(block.lines, item.baseType);
    if (state.enabled === false && baseline !== false) {
      if (removed.empty) lines.splice(block.start, block.end - block.start, `# FIXLGS disabled mapped rule · ${item.id}`);
      else lines.splice(block.start, block.end - block.start, ...removed.lines);
      changed += 1;
      continue;
    }

    let clone = replaceBaseTypeWithOnly(block.lines, item.baseType);
    if (state.importance !== "default" && state.importance !== "dynamic") {
      clone = gearRarity
        ? replaceVisualStyleWithLines(clone, findGearVisualLines(baseText, gearRarity, state.importance))
        : replaceVisualStyle(clone, findStyleBlock(baseText, state.importance, item.family));
    }
    clone = replaceSound(clone, descriptor);
    clone[0] = `${clone[0]} # FIXLGS override · ${item.id}`;

    if (removed.empty) lines.splice(block.start, block.end - block.start, ...clone);
    else lines.splice(block.start, block.end - block.start, ...clone, "", ...removed.lines);
    changed += 1;
  }
  return { text: lines.join("\n"), changed, handled: true };
}

function numericOverrideBlocks(baseText: string, item: FilterItem, state: ExportItemState, baseline: boolean, descriptor?: ExportSoundDescriptor) {
  const visibilityChanged = state.enabled !== baseline;
  const custom = visibilityChanged || state.importance !== "default" || (descriptor && descriptor.choice !== "default");
  if (!custom || (item.gemLevel == null && item.waystoneTier == null)) return [] as string[];

  // Checkbox meaning is absolute and 1:1: ON = Show, OFF = Hide. Once the
  // user flips a numeric row (GemLevel/WaystoneTier), do not carry NeverSink's
  // AreaLevel or other runtime gates into that explicit visibility override.
  if (visibilityChanged) {
    return state.enabled
      ? buildVisibilityOverrideRule(item, true, state.importance, descriptor, baseText)
      : buildHideRule(item, item.labelKo ?? item.label);
  }

  const parsed = parseBlocks(baseText);
  const sections = sourceSections(item);
  const candidates = parsed.blocks.filter((block) => {
    if (sections.length && !sections.includes(block.section)) return false;
    if (item.baseType && !blockContainsBaseType(block, item.baseType)) return false;
    if (!blockMatchesItemRarityScope(block, item)) return false;
    if (item.gemLevel != null) {
      const numeric = block.lines.filter((line) => /^\s*GemLevel\b/i.test(stripComment(line)));
      if (numeric.length && !numeric.every((line) => numericConditionMatches(line, "GemLevel", item.gemLevel!))) return false;
    }
    if (item.waystoneTier != null) {
      const numeric = block.lines.filter((line) => /^\s*WaystoneTier\b/i.test(stripComment(line)));
      if (numeric.length && !numeric.every((line) => numericConditionMatches(line, "WaystoneTier", item.waystoneTier!))) return false;
    }
    return true;
  });
  if (!candidates.length) return buildShowRule(item, item.labelKo ?? item.label, state.importance, descriptor, baseText);
  return candidates.flatMap((block) => [...cloneNumericRule(block, item, state.importance, descriptor, baseText), ""]);
}

function selectedGearClasses(state: Record<string, boolean>, rarity: "rare" | "magic") {
  return GEAR_CATEGORIES.flatMap((group) => group.classes.filter((className) => state[`${rarity}:${className}`] === true));
}

function gearTierNumber(id: string) {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function findGearTierStyleLines(baseText: string, rarity: "Rare" | "Magic", tier: number, importance: string) {
  if (importance !== "default") return findGearVisualLines(baseText, rarity, importance);
  const { blocks } = parseBlocks(baseText);
  const block = blocks.find((entry) => {
    if (!rarityMatches(entry, rarity)) return false;
    const line = entry.lines.find((value) => /^\s*UnidentifiedItemTier\b/i.test(stripComment(value)));
    if (!line) return false;
    return numericConditionMatches(line, "UnidentifiedItemTier", tier) && visualLines(entry).length > 0;
  });
  return block ? visualLines(block) : [];
}

function normalizeTierEntries(tiers: Record<string, ExportTierState>) {
  return Object.entries(tiers)
    .filter(([, state]) => state?.enabled === true)
    .map(([id, state]) => ({ id, state, tier: gearTierNumber(id) }))
    .filter((entry) => entry.tier >= 1 && entry.tier <= 5)
    .sort((a, b) => b.tier - a.tier);
}

function buildGearMode(baseText: string, rarity: "rare" | "magic", tiers: Record<string, ExportTierState>, gear: Record<string, boolean>, soundState: Record<string, ExportSoundChoice>, soundDescriptors: Record<string, ExportSoundDescriptor>) {
  const selectedClasses = selectedGearClasses(gear, rarity);
  const allClasses = GEAR_CATEGORIES.flatMap((group) => group.classes);
  // Tier selection alone means "all gear". Class selection is only an optional narrowing tool.
  const classes = selectedClasses.length ? selectedClasses : allClasses;
  const selectedTiers = normalizeTierEntries(tiers);
  if (!selectedTiers.length) return [] as string[];

  const rarityName = rarity === "rare" ? "Rare" : "Magic";
  const out: string[] = [
    `# ===== FIXLGS ${rarityName.toUpperCase()} MODE =====`,
    `# selected tiers: ${selectedTiers.map((entry) => entry.tier).join(",")}`,
    `# selected classes: ${selectedClasses.length ? selectedClasses.join(",") : "ALL"}`,
  ];

  for (const { id, state, tier } of selectedTiers) {
    const rule = [
      `Show # FIXLGS ${rarityName} tier ${tier}`,
      `\tRarity ${rarityName}`,
      `\tClass == ${classes.map((value) => `"${value}"`).join(" ")}`,
      // Use the same numeric comparator syntax as NeverSink itself. Two bounds mean exact tier.
      `\tUnidentifiedItemTier >= ${tier}`,
      `\tUnidentifiedItemTier <= ${tier}`,
    ];
    const styleLines = findGearTierStyleLines(baseText, rarityName, tier, state.importance);
    if (styleLines.length) rule.push(...styleLines);
    const choice = soundState[`gear:tier:${rarity}:${id}`] ?? "default";
    const descriptor = soundDescriptors[choice];
    if (descriptor && choice !== "default") rule.push(`\tCustomAlertSoundOptional "${descriptor.filterPath}" 300`);
    out.push(...rule, "");
  }

  // Once the mode is active, every ordinary Rare/Magic item in the controlled class range
  // that did not match one of the selected exact tiers must fall through to Hide.
  // This block is inserted after NeverSink Exceptional and before ordinary gear rules.
  out.push(
    `Hide # FIXLGS ${rarityName} mode fallback`,
    `\tRarity ${rarityName}`,
    `\tClass == ${classes.map((value) => `"${value}"`).join(" ")}`,
    "",
  );
  return out;
}

function buildNormalLevelRules(baseText: string, states: Record<string, ExportNormalLevelState>, soundState: Record<string, ExportSoundChoice>, soundDescriptors: Record<string, ExportSoundDescriptor>) {
  const allClasses = GEAR_CATEGORIES.flatMap((group) => group.classes);
  const out: string[] = [];
  for (const rule of NORMAL_ITEM_LEVEL_RULES) {
    const state = states[rule.id];
    if (!state?.enabled) continue;
    const lines = [
      `Show # FIXLGS Normal ItemLevel ${rule.level}`,
      `\tRarity Normal`,
      `\tClass == ${allClasses.map((value) => `"${value}"`).join(" ")}`,
      `\tItemLevel == ${rule.level}`,
    ];
    if (state.importance !== "default") {
      lines.push(...findGearVisualLines(baseText, "Normal", state.importance));
    }
    const choice = soundState[`gear:normal-level:${rule.id}`] ?? "default";
    const descriptor = soundDescriptors[choice];
    if (descriptor && choice !== "default") lines.push(`\tCustomAlertSoundOptional "${descriptor.filterPath}" 300`);
    out.push(...lines, "");
  }
  return out;
}

function insertAfterExceptional(text: string, blockLines: string[]) {
  if (!blockLines.length) return text;
  const markerStart = text.lastIndexOf("# [[0300]] Exceptional Items");
  if (markerStart < 0) return `${blockLines.join("\n")}\n${text}`;
  const markerEnd = text.indexOf("# [[0400]] IDENTIFIED MODS", markerStart);
  if (markerEnd < 0) return `${blockLines.join("\n")}\n${text}`;
  return `${text.slice(0, markerEnd)}#===============================================================================================================\n# FIXLGS CUSTOM GEAR OVERRIDES\n#===============================================================================================================\n${blockLines.join("\n")}\n${text.slice(markerEnd)}`;
}

function insertTop(text: string, blockLines: string[]) {
  if (!blockLines.length) return text;
  const header = [
    "#===============================================================================================================",
    "# FIXLGS CUSTOM OVERRIDES",
    "# Only user-changed entries are listed here. Unlisted NeverSink rules remain untouched.",
    "#===============================================================================================================",
    ...blockLines,
    "#===============================================================================================================",
    "# ORIGINAL NEVERSINK FILTER CONTINUES BELOW",
    "#===============================================================================================================",
    "",
  ].join("\n");
  return `${header}${text}`;
}

export function buildCustomizedFilter(input: FilterExportInput): FilterExportResult {
  let text = input.base.text;
  let changedRules = 0;
  const topOverrides: string[] = [];
  const notes: string[] = [];
  const usedSoundChoices = new Set<ExportSoundChoice>();

  const descriptorFor = (choice?: ExportSoundChoice) => {
    if (!choice || choice === "default") return undefined;
    const descriptor = input.soundDescriptors[choice];
    if (descriptor) usedSoundChoices.add(choice);
    return descriptor;
  };

  // Exceptional is the only category where OFF means "disable the exceptional rule and fall through".
  // Importance/sound customization must still be persisted into the matching original
  // exceptional rule, including the Rare/Magic/Normal split of NeverSink's shared block.
  for (const item of input.items.filter((entry) => entry.family === "exceptional")) {
    const rawState = input.itemState[item.id];
    const choice = input.soundState[item.id] ?? "default";
    if (!rawState && choice === "default") continue;
    const baseline = input.baselineEnabled(item.id);
    const state: ExportItemState = rawState ?? { enabled: baseline, importance: "default" };
    const descriptor = descriptorFor(choice);
    if (!state.enabled && baseline) {
      const result = mutateExceptional(text, item, false);
      text = result.text;
      changedRules += result.changed;
      continue;
    }
    if (state.enabled && (state.importance !== "default" || choice !== "default")) {
      const result = transformExceptionalCustomization(text, item, state, descriptor);
      text = result.text;
      changedRules += result.changed;
    }
  }

  // Exact BaseType entries are edited/split in-place. This preserves all NeverSink runtime conditions.
  // Sound-only customization must also be exported even when the user never changed
  // the checkbox/importance state for that item. In that case synthesize the current
  // NeverSink state instead of skipping the item entirely.
  for (const item of input.items.filter((entry) => entry.family !== "exceptional")) {
    const rawState = input.itemState[item.id];
    const choice = input.soundState[item.id] ?? "default";
    if (!rawState && choice === "default") continue;
    const baseline = input.baselineEnabled(item.id);
    const state: ExportItemState = rawState ?? { enabled: baseline, importance: "default" };
    const baselineStatus = input.baselineStatus(item.id);
    const descriptor = descriptorFor(choice);

    // NS/default keeps NeverSink's original conditional rule.
    // Choosing a custom importance means the user's override wins, so do not keep the NS conditional gate.
    if (state.enabled && state.importance !== "default" && baselineStatus === "conditional") {
      const rule = buildShowRule(item, item.labelKo ?? item.label, state.importance, descriptor, input.base.text);
      if (rule.length) {
        topOverrides.push(...rule);
        changedRules += 1;
        continue;
      }
    }

    if (item.baseType && item.gemLevel == null) {
      // Checkbox is a hard user visibility override. NeverSink's original Show/Hide status is
      // only the starting state; once the user flips the switch, the generated rule must win.
      if (state.enabled !== baseline) {
        const rule = buildVisibilityOverrideRule(item, state.enabled, state.importance, descriptor, input.base.text);
        if (rule.length) {
          topOverrides.push(...rule);
          changedRules += 1;
          continue;
        }
      }
      const result = transformBaseTypeItem(text, item, state, baseline, descriptor);
      text = result.text;
      changedRules += result.changed;
      if (result.handled) continue;
    }

    if (item.gemLevel != null || item.waystoneTier != null) {
      const rules = numericOverrideBlocks(input.base.text, item, state, baseline, descriptor);
      if (rules.length) {
        topOverrides.push(...rules);
        changedRules += 1;
      }
      continue;
    }

    const changed = state.enabled !== baseline || state.importance !== "default" || choice !== "default";
    if (!changed) continue;
    const rule = state.enabled
      ? buildShowRule(item, item.labelKo ?? item.label, state.importance, descriptor, input.base.text)
      : buildHideRule(item, item.labelKo ?? item.label);
    if (rule.length) {
      topOverrides.push(...rule);
      changedRules += 1;
    } else {
      notes.push(`${item.labelKo ?? item.label}: 직접 생성 조건을 만들 수 없어 원본 유지`);
    }
  }

  // Normal BaseType rows use the same split-in-place strategy, keeping NeverSink level/area conditions.
  for (const item of input.normalItems) {
    const baseline = input.normalBaselineEnabled(item.id);
    const baselineStatus = input.normalBaselineStatus(item.id);
    const enabled = input.normalGear[item.id] ?? baseline;
    const importance = input.normalImportance[item.id] ?? "default";
    const choice = input.soundState[`gear:normal:${item.id}`] ?? "default";
    const descriptor = descriptorFor(choice);
    const pseudo: FilterItem = { id: item.id, label: item.baseType, baseType: item.baseType, rarity: "Normal", family: "exceptional" };

    // Normal BaseType checkboxes are hard visibility overrides, exactly like the main item lists.
    // Many Normal bases are controlled by Class-level NeverSink rules rather than an exact BaseType
    // block, so split-in-place alone cannot guarantee the user's checkbox choice.
    if (enabled !== baseline) {
      if (!enabled) {
        const rule = buildHideRule(pseudo, `Normal visibility override · ${item.baseType}`);
        if (rule.length) {
          topOverrides.push(...rule);
          changedRules += 1;
          continue;
        }
      } else {
        const originalImportance = input.normalBaselineImportance(item.id) || "default";
        const resolvedImportance = importance !== "default" ? importance : originalImportance;
        const rule = buildGearShowRule(pseudo, `Normal visibility override · ${item.baseType}`, "Normal", resolvedImportance, descriptor, input.base.text);
        if (rule.length) {
          topOverrides.push(...rule);
          changedRules += 1;
          continue;
        }
      }
    }

    if (enabled && importance !== "default" && baselineStatus === "conditional") {
      const rule = buildGearShowRule(pseudo, item.baseType, "Normal", importance, descriptor, input.base.text);
      if (rule.length) {
        topOverrides.push(...rule);
        changedRules += 1;
        continue;
      }
    }

    const result = transformBaseTypeItem(text, pseudo, { enabled, importance }, baseline, descriptor, "Normal");
    text = result.text;
    changedRules += result.changed;
  }

  const gearOverrides = [
    ...buildNormalLevelRules(input.base.text, input.normalLevelRules, input.soundState, input.soundDescriptors),
    ...buildGearMode(input.base.text, "rare", input.rareTiers, input.rareGear, input.soundState, input.soundDescriptors),
    ...buildGearMode(input.base.text, "magic", input.magicTiers, input.magicGear, input.soundState, input.soundDescriptors),
  ];

  // Register every assigned non-default sound so the ZIP collector cannot omit an
  // MP3 that the user selected. Item sounds are normally registered by descriptorFor(),
  // while gear builders emit paths directly; this final pass safely covers both paths.
  for (const choice of Object.values(input.soundState)) {
    if (choice === "default") continue;
    if (input.soundDescriptors[choice]) usedSoundChoices.add(choice);
  }
  text = insertAfterExceptional(text, gearOverrides);
  text = insertTop(text, topOverrides);
  if (gearOverrides.length) changedRules += 1;

  const banner = `# FIXLGS EXPORT\n# BASE: NeverSink ${input.base.id}\n# VERSION: ${input.base.version}\n# CUSTOMIZED: YES\n`;
  if (changedRules > 0 && !text.startsWith("# FIXLGS EXPORT")) text = `${banner}${text}`;

  return { text, changedRules, usedSoundChoices: [...usedSoundChoices], notes };
}

export function strictnessFileCode(id: NeverSinkStrictnessId) {
  const level = Number(id.split("-")[0]);
  return Number.isFinite(level) ? String(level).padStart(2, "0") : "00";
}

export function defaultExportBaseName(id: NeverSinkStrictnessId) {
  return `FIXLGS_POE2_${strictnessFileCode(id)}`;
}

export function sanitizeExportBaseName(value: string, fallback: string) {
  const cleaned = value
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.(filter|zip)$/i, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return cleaned || fallback;
}
