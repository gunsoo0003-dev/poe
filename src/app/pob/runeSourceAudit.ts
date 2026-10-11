/** Rune integrity: compare native-reconstructed PoB rune values with official rendered values.
 * This module never computes character damage; it only checks extraction fidelity. */
const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
const numbers = (s: string) => [...s.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
const keyOf = (s: string) => normalize(s.replace(/\d+(?:\.\d+)?/g, "#"));
export function validateReconstructedRunes(
  expected: string[], actual: string[], rawText: string,
): string[] {
  const issues: string[] = [];
  const bonded = (text: string) => /^Bonded:/i.test(text);
  const original = expected.filter(line => !bonded(line));
  const rebuilt = actual.filter(line => !bonded(line));
  const amplifier = /^([\d.]+)% increased effect of Socketed (?:Runes?|Rune Items?)/im.exec(rawText);
  const scale = amplifier ? 1 + Number(amplifier[1]) / 100 : 1;
  const available = [...rebuilt];
  for (const line of original) {
    const index = available.findIndex(candidate => keyOf(candidate) === keyOf(line));
    if (index < 0) {
      issues.push(`PoB가 재구성한 룬 효과가 없습니다: ${line}`);
      continue;
    }
    const rebuiltLine = available.splice(index, 1)[0];
    const expectedNumbers = numbers(line);
    const baseNumbers = numbers(rebuiltLine);
    if (expectedNumbers.length !== baseNumbers.length ||
        expectedNumbers.some((n, i) => !Number.isFinite(baseNumbers[i]) || Math.abs(n - baseNumbers[i] * scale) > Math.max(0.6, Math.abs(n) * 0.005)))
      issues.push(`룬 증폭값 검증 실패: ${line} / PoB ${rebuiltLine}`);
  }
  if (available.length) issues.push(`PoB에만 있는 룬 효과 ${available.length}개: ${available.slice(0,2).join(" / ")}`);
  return issues;
}
