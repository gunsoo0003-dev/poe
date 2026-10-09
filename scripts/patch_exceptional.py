from pathlib import Path
p=Path('/mnt/data/fix_filter_v214/src/app/filter/filterExport.ts');s=p.read_text()
pos=s.index('\nfunction transformExceptionalCustomization(')
s=s[:pos]+'''
function enableCommentedExceptionalUnique(baseText: string, item: FilterItem, state: ExportItemState, descriptor?: ExportSoundDescriptor) {
  if (item.rarity !== "Unique" || !item.exceptionalRule) return { text: baseText, changed: 0 };
  const lines = baseText.replace(/\\r/g, "").split("\\n");
  const sectionStart = lines.findIndex((line) => /^#\\s*\\[\\[2903\\]\\]/.test(line));
  const sectionEnd = lines.findIndex((line, index) => index > sectionStart && /^#\\s*\\[\\[2904\\]\\]/.test(line));
  if (sectionStart < 0) return { text: baseText, changed: 0 };
  const marker = item.exceptionalRule === "overquality" ? /\\$tier->overqualityuniques\\b/ : /\\$tier->oversocketuniques[12]\\b/;
  const matches: Array<{ start: number; end: number; block: string[] }> = [];
  for (let i = sectionStart; i < (sectionEnd < 0 ? lines.length : sectionEnd); i++) {
    if (!/^#Show\\b/.test(lines[i]) || !marker.test(lines[i])) continue;
    let end = i + 1;
    while (end < lines.length && /^#\\s+\\S/.test(lines[end]) && !/^#Show\\b/.test(lines[end])) end++;
    const block = lines.slice(i, end).map((line) => line.slice(1));
    matches.push({ start: i, end, block });
    i = end - 1;
  }
  for (const match of matches.reverse()) {
    let block = match.block;
    if (state.importance !== "default" && state.importance !== "dynamic")
      block = replaceVisualStyle(block, findStyleBlock(baseText, state.importance, item.family));
    block = replaceSound(block, descriptor);
    block[0] += ` # FIXLGS enabled exceptional override · ${item.id}`;
    lines.splice(match.start, match.end - match.start, ...block);
  }
  return { text: lines.join("\\n"), changed: matches.length };
}
''' +s[pos:]
s=s.replace('''  descriptor?: ExportSoundDescriptor,
) {
  if (item.family !== "exceptional"''','''  descriptor?: ExportSoundDescriptor,
  forceEnable = false,
) {
  if (item.family !== "exceptional"''',1)
s=s.replace('''  if (!state.enabled || (state.importance === "default" && (!descriptor || descriptor.choice === "default"))) {''','''  if (!state.enabled || (!forceEnable && state.importance === "default" && (!descriptor || descriptor.choice === "default"))) {''',1)
s=s.replace('''  if (!targets.length) return { text: baseText, changed: 0 };

  const lines = parsed.lines;
  let changed = 0;
  for (const block of [...targets].sort((a, b) => b.start - a.start)) {''','''  if (!targets.length) return enableCommentedExceptionalUnique(baseText, item, state, descriptor);

  const lines = parsed.lines;
  let changed = 0;
  for (const block of [...targets].sort((a, b) => b.start - a.start)) {''',1)
s=s.replace('''    if (state.enabled && (state.importance !== "default" || choice !== "default")) {
      const result = transformExceptionalCustomization(text, item, state, descriptor);''','''    if (state.enabled && (state.enabled !== baseline || state.visibilityExplicit || state.importance !== "default" || choice !== "default")) {
      const result = transformExceptionalCustomization(text, item, state, descriptor, state.enabled !== baseline || state.visibilityExplicit === true);
      if (!result.changed && (state.enabled !== baseline || state.importance !== "default" || choice !== "default")) notes.push(`${item.labelKo ?? item.label}: 특출난 원본 규칙을 찾지 못했습니다.`);''')
p.write_text(s)
print('exceptional patched')
