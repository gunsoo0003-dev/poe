/** V225: Validate *upstream* PoB Item:ParseRaw evidence; no custom damage/modifier rules. */
import type { NativeModAudit } from "./web-engine/calc-api";

const canonical = (value: string) => value.replace(/^\{(?:rune|enchant)\}/i, "").replace(/\s+/g, " ").trim().toLowerCase();

/** A parse failure is not a zero DPS modifier. Do not claim a reliable delta. */
export function validateNativeItemAudit(
  upstream: NativeModAudit | undefined,
  exportedModLines: string[],
): { verified: boolean; issues: string[]; parsedCount: number } {
  if (!upstream || !Array.isArray(upstream.lines) || !Array.isArray(upstream.unrecognized) ||
      !Array.isArray(upstream.emptyModifier))
    return { verified: false, parsedCount: 0, issues: ["원본 PoB 옵션 파서 검사 결과가 없습니다."] };
  const issues: string[] = [];
  for (const entry of upstream.unrecognized) {
    issues.push(`${entry.group}: ${entry.line} (원본 PoB 미해석: ${entry.extra || "상세 없음"})`);
  }
  for (const entry of upstream.emptyModifier) {
    // Some structural lines may change an upstream Item flag rather than a
    // numeric modList. Without original PoB evidence of effect, fail closed.
    issues.push(`${entry.group}: ${entry.line} (PoB 계산 modifier 생성 확인 불가)`);
  }
  const seen = new Map<string, number>();
  for (const entry of upstream.lines) {
    if (!entry || typeof entry.line !== "string") continue;
    const key = canonical(entry.line);
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const original of exportedModLines) {
    const key = canonical(original);
    const remaining = seen.get(key) || 0;
    if (!remaining) issues.push(`원본 입력 옵션 누락 또는 변경: ${original}`);
    else seen.set(key, remaining - 1);
  }
  if (exportedModLines.length && upstream.total === 0) issues.push("PoB에서 옵션을 하나도 확인하지 못했습니다.");
  return { verified: issues.length === 0, issues: [...new Set(issues)], parsedCount: upstream.nativeModifiers };
}
