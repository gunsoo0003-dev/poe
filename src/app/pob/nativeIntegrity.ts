/** V227: compare original PoB parse evidence with typed item input; no FIXLGS DPS arithmetic. */
import type { NativeModAudit } from "./web-engine/calc-api";

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
const nativeKind = (entry: { group: string; line: string }) => {
  const prefix = /^\{(rune|enchant)\}/i.exec(entry.line);
  const kind = prefix?.[1]?.toLowerCase() ||
    (entry.group === "rune" || entry.group === "enchant" ? entry.group : "plain");
  const label = normalize(entry.line.replace(/^\{(?:rune|enchant)\}/i, ""));
  return `${kind}:${label}`;
};
const inputKind = (line: string) => {
  const prefix = /^\{(rune|enchant)\}/i.exec(line);
  return nativeKind({ group: prefix?.[1] || "plain", line });
};
// Each entry below is a structural field handled in upstream PoB Item.lua,
// NOT an excuse to accept arbitrary zero-modifier or unknown lines.
const structuralFlag = (line: string) =>
  /^(?:implicit modifiers cannot be changed|[+]\d+ (?:prefix|suffix) modifiers? allowed|only runes can be socketed in this item)$/i.test(normalize(line));

export interface AuditOptions {
  /** Pre-equip only. Rune identity + native reconstructed effects must be verified after equipping. */
  deferNamedRunes?: boolean;
  /** Pre-equip only. Native PoB decides Bonded activation after equip. */
  deferBonded?: boolean;
}
export function validateNativeItemAudit(
  upstream: NativeModAudit | undefined,
  exportedModLines: string[],
  options: AuditOptions = {},
): { verified: boolean; issues: string[]; parsedCount: number } {
  if (!upstream || !Array.isArray(upstream.lines) || !Array.isArray(upstream.unrecognized) ||
      !Array.isArray(upstream.emptyModifier))
    return { verified: false, parsedCount: 0, issues: ["원본 PoB 옵션 파서 검사 결과가 없습니다."] };
  const issues: string[] = [];
  const deferred = (group: string, line: string) =>
    (options.deferNamedRunes && group === "rune" && !/^\s*Bonded:/i.test(line)) ||
    (options.deferBonded && (group === "rune" || group === "explicit") && /^\s*Bonded:/i.test(line));
  for (const entry of upstream.unrecognized) {
    if (!deferred(entry.group, entry.line))
      issues.push(`${entry.group}: ${entry.line} (원본 PoB 미해석: ${entry.extra || "상세 없음"})`);
  }
  for (const entry of upstream.emptyModifier) {
    if (!deferred(entry.group, entry.line) && !structuralFlag(entry.line))
      issues.push(`${entry.group}: ${entry.line} (PoB 계산 modifier 생성 확인 불가)`);
  }
  const seen = new Map<string, number>();
  for (const entry of upstream.lines) {
    if (!entry || typeof entry.line !== "string") continue;
    const key = nativeKind(entry);
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const original of exportedModLines) {
    if ((options.deferNamedRunes && /^\{rune\}/i.test(original) && !/^\{rune\}Bonded:/i.test(original)) ||
        (options.deferBonded && /^(?:\{rune\})?Bonded:/i.test(original))) continue;
    const key = inputKind(original);
    const remaining = seen.get(key) || 0;
    if (!remaining) issues.push(`원본 입력 옵션 누락 또는 변경: ${original}`);
    else seen.set(key, remaining - 1);
  }
  if (exportedModLines.length && upstream.total === 0) issues.push("PoB에서 옵션을 하나도 확인하지 못했습니다.");
  return { verified: issues.length === 0, issues: [...new Set(issues)], parsedCount: upstream.nativeModifiers };
}
