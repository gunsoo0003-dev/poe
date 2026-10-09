from pathlib import Path
p=Path('/mnt/data/fix_filter_v214/src/app/filter/filterExport.ts')
s=p.read_text()
s=s.replace('export type ExportItemState = { enabled: boolean; importance: string };','export type ExportItemState = { enabled: boolean; importance: string; visibilityExplicit?: boolean };')
s=s.replace('normalItems: Array<{ id: string; baseType: string }>;','normalItems: Array<{ id: string; baseType: string; classNames?: string[] }>;')
a=s.index('function numericConditionMatches('); b=s.index('\nfunction cloneNumericRule(',a)
s=s[:a]+'''function numericConditionMatches(line: string, field: string, value: number) {
  const clean = stripComment(line);
  // NeverSink accepts `GemLevel 19` as equality, without an explicit operator.
  const match = clean.match(new RegExp(`^${field}\\\\s*(>=|<=|==|=|>|<)?\\\\s*(-?\\\\d+)\\\\s*$`, "i"));
  if (!match) return false; // Never assume that an unknown condition matches everything.
  const n = Number(match[2]);
  switch (match[1] ?? "==") {
    case ">=": return value >= n;
    case "<=": return value <= n;
    case ">": return value > n;
    case "<": return value < n;
    default: return value === n;
  }
}
''' + s[b:]
# Ensure computed regex string escaping survives script.
s=s.replace('const visibilityChanged = state.enabled !== baseline;','const visibilityChanged = state.enabled !== baseline || state.visibilityExplicit === true;')
s=s.replace('if (state.enabled !== baseline) {\n        const rule = buildVisibilityOverrideRule', 'if (state.enabled !== baseline || state.visibilityExplicit === true) {\n        const rule = buildVisibilityOverrideRule')
# item conditional importance only when choice changed and visibility explicit false? explicit must win. 
s=s.replace('if (state.enabled && state.importance !== "default" && baselineStatus === "conditional") {','if (state.enabled && !state.visibilityExplicit && state.importance !== "default" && baselineStatus === "conditional") {',1)
# Numeric sound-only avoid top priority rules, inject a selected clone in place BEFORE original with original conditions intact.
pos=s.index('\nfunction selectedGearClasses(')
s=s[:pos]+'''
function transformNumericSoundInPlace(baseText: string, item: FilterItem, descriptor: ExportSoundDescriptor) {
  const parsed = parseBlocks(baseText);
  const sections = sourceSections(item);
  const matches = parsed.blocks.filter((block) => {
    if (sections.length && !sections.includes(block.section)) return false;
    if (item.baseType && !blockContainsBaseType(block, item.baseType)) return false;
    if (!blockMatchesItemRarityScope(block, item)) return false;
    const field = item.gemLevel != null ? "GemLevel" : "WaystoneTier";
    const level = item.gemLevel ?? item.waystoneTier;
    if (level == null) return false;
    const numericLines = block.lines.filter((line) => new RegExp(`^\\\\s*${field}\\\\b`, "i").test(stripComment(line)));
    return numericLines.length > 0 && numericLines.every((line) => numericConditionMatches(line, field, level));
  });
  const lines = parsed.lines;
  let changed = 0;
  for (const block of [...matches].sort((a, b) => b.start - a.start)) {
    // Original Hide must remain Hide: adding a sound cannot turn a hidden item visible.
    // For broad range rules retain the untouched original after the narrowed clone.
    if (!/^Show\\b/i.test(block.lines[0].trim())) continue;
    let clone = [...block.lines];
    if (item.baseType) clone = replaceBaseTypeWithOnly(clone, item.baseType);
    if (item.gemLevel != null) {
      clone = clone.filter((line) => !/^\\s*GemLevel\\b/i.test(stripComment(line)));
      clone.splice(1, 0, `\\tGemLevel == ${item.gemLevel}`);
    }
    if (item.waystoneTier != null) {
      clone = clone.filter((line) => !/^\\s*WaystoneTier\\b/i.test(stripComment(line)));
      clone.splice(1, 0, `\\tWaystoneTier == ${item.waystoneTier}`);
    }
    clone = replaceSound(clone, descriptor);
    clone[0] += ` # FIXLGS sound override · ${item.id}`;
    lines.splice(block.start, 0, ...clone, "");
    changed++;
  }
  return { text: lines.join("\\n"), changed };
}

function transformNormalSoundFallback(baseText: string, item: FilterItem, classNames: string[], descriptor: ExportSoundDescriptor) {
  if (!classNames.length || !item.baseType) return { text: baseText, changed: 0 };
  const parsed = parseBlocks(baseText);
  const blocks = parsed.blocks.filter((block) => {
    if (!/^Show\\b/i.test(block.lines[0].trim())) return false;
    if (block.lines.some((line) => /^\\s*Continue\\b/i.test(stripComment(line)))) return false;
    const base = block.lines.find((line) => /^\\s*BaseType\\b/i.test(stripComment(line)));
    if (base) return false; // An exact BaseType block is handled separately.
    if (!rarityMatches(block, "Normal")) return false;
    const rarity = block.lines.find((line) => /^\\s*Rarity\\b/i.test(stripComment(line)));
    if (rarity && /^Rarity\\s+(?:==\\s*)?(Rare|Magic|Unique)\\s*$/i.test(stripComment(rarity))) return false;
    const classLine = block.lines.find((line) => /^\\s*Class\\b/i.test(stripComment(line)));
    if (!classLine) return !!rarity && /^Rarity\\s+(?:==\\s*)?Normal\\s*$/i.test(stripComment(rarity));
    const clean = stripComment(classLine);
    if (/^Class\\s*(!=|<|>)/i.test(clean)) return false;
    return classNames.some((name) => quotedValues(clean).includes(name));
  });
  const lines = parsed.lines;
  let changed = 0;
  for (const block of [...blocks].sort((a, b) => b.start - a.start)) {
    let clone = [...block.lines];
    clone.splice(1, 0, `\\tBaseType == "${item.baseType.replaceAll('"', '')}"`, `\\tRarity Normal`);
    // Retain original regional/level/quality gates and the unchanged original rule.
    clone = replaceSound(clone, descriptor);
    clone[0] += ` # FIXLGS normal sound override · ${item.id}`;
    lines.splice(block.start, 0, ...clone, "");
    changed++;
  }
  return { text: lines.join("\\n"), changed };
}
''' + s[pos:]
# numeric sound-only special case before numericOverrideBlocks, ensure descriptor always if choice not default
needle='''      const rules = numericOverrideBlocks(input.base.text, item, state, baseline, descriptor);'''
replacement='''      if (descriptor && state.importance === "default" && state.enabled === baseline && !state.visibilityExplicit) {
        const soundResult = transformNumericSoundInPlace(text, item, descriptor);
        text = soundResult.text;
        changedRules += soundResult.changed;
        if (!soundResult.changed) notes.push(`${item.labelKo ?? item.label}: 원본 표시 규칙에서 사운드를 지정할 위치를 찾지 못했습니다.`);
        continue;
      }
      const rules = numericOverrideBlocks(input.base.text, item, state, baseline, descriptor);'''
assert needle in s;s=s.replace(needle,replacement)
# fallback for normal gear exact in-place failures
needle='''    const result = transformBaseTypeItem(text, pseudo, { enabled, importance }, baseline, descriptor, "Normal");
    text = result.text;
    changedRules += result.changed;'''
replacement='''    const result = transformBaseTypeItem(text, pseudo, { enabled, importance }, baseline, descriptor, "Normal");
    text = result.text;
    changedRules += result.changed;
    if (!result.changed && descriptor && enabled === baseline && importance === "default") {
      const fallback = transformNormalSoundFallback(text, pseudo, item.classNames ?? [], descriptor);
      text = fallback.text;
      changedRules += fallback.changed;
      if (!fallback.changed) notes.push(`${item.baseType}: NeverSink 표시 조건을 보존한 사운드 적용 지점을 찾지 못했습니다.`);
    }'''
assert needle in s;s=s.replace(needle,replacement)
# prevent sound-only fallthrough unconditional Show/Hide from missing BaseType
needle='''    const changed = state.enabled !== baseline || state.importance !== "default" || choice !== "default";
    if (!changed) continue;'''
replacement='''    const changed = state.enabled !== baseline || state.visibilityExplicit === true || state.importance !== "default" || choice !== "default";
    if (!changed) continue;
    if (state.enabled === baseline && !state.visibilityExplicit && state.importance === "default" && choice !== "default") {
      notes.push(`${item.labelKo ?? item.label}: 원본 표시 조건을 유지하면서 사운드를 지정할 규칙을 찾지 못했습니다.`);
      continue;
    }'''
assert needle in s;s=s.replace(needle,replacement)
# rare magic fallback hide all supported gear classes
needle='''    `\\tClass == ${classes.map((value) => `"${value}"`).join(" ")}`,
    "",
  );'''
assert needle in s;s=s.replace(needle,'''    `\\tClass == ${allClasses.map((value) => `"${value}"`).join(" ")}`,
    "",
  );''',1)
# Don't silently pass missing transformations to users via zip or direct folder.
needle='''  // Register every assigned non-default sound so the ZIP collector cannot omit an'''
assert needle in s;s=s.replace(needle,'''  // Never package an MP3 for a setting whose rule could not be materialized.
  // Stop instead of reporting a successful download that ignores user selections.
  if (notes.length) throw new Error(`필터 적용 불일치 ${notes.length}건: ${notes.slice(0, 3).join(" / ")} 다운로드를 중단했습니다.`);

  // Register every assigned non-default sound so the ZIP collector cannot omit an''')
p.write_text(s)
print('engine patched',len(s))
