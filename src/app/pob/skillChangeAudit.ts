/**
 * Compare PoB socket groups by content, never by mutable group index.
 * PoB can add/remove item-granted skills and shift every subsequent index.
 * Only single-skill groups in an explicitly replaced item slot are reported
 * as confirmed additions/removals. Ambiguities remain warnings, never guesses.
 */
import type { SocketGroupInfo } from "./web-engine/calc-api";

export interface SkillChange {
  kind: "added" | "removed";
  name: string;
  slot: string;
}

export interface SkillChangeAudit {
  changes: SkillChange[];
  warnings: string[];
}

function signature(group: SocketGroupInfo): string {
  const names = (group.activeSkillNames || []).map(name => name.trim().toLowerCase()).sort();
  return JSON.stringify([group.slot || "", names]);
}

function unmatchedGroups(before: SocketGroupInfo[], after: SocketGroupInfo[]) {
  const unmatchedBefore: SocketGroupInfo[] = [];
  const remaining = new Map<string, number>();
  for (const group of after) remaining.set(signature(group), (remaining.get(signature(group)) || 0) + 1);
  for (const group of before) {
    const key = signature(group);
    const count = remaining.get(key) || 0;
    if (count) remaining.set(key, count - 1);
    else unmatchedBefore.push(group);
  }
  const unmatchedAfter: SocketGroupInfo[] = [];
  const beforeRemaining = new Map<string, number>();
  for (const group of before) beforeRemaining.set(signature(group), (beforeRemaining.get(signature(group)) || 0) + 1);
  for (const group of after) {
    const key = signature(group);
    const count = beforeRemaining.get(key) || 0;
    if (count) beforeRemaining.set(key, count - 1);
    else unmatchedAfter.push(group);
  }
  return { unmatchedBefore, unmatchedAfter };
}

/** Returns a content-based signature for verifying snapshots from both sets agree. */
export function groupInventory(groups: SocketGroupInfo[]): string {
  return groups.map(signature).sort().join("\n");
}

export function auditSkillChanges(
  before: SocketGroupInfo[],
  after: SocketGroupInfo[],
  changedSlots: ReadonlySet<string>,
): SkillChangeAudit {
  const { unmatchedBefore, unmatchedAfter } = unmatchedGroups(before, after);
  const changes: SkillChange[] = [];
  let ambiguous = false;
  for (const [list, kind] of [
    [unmatchedBefore, "removed"],
    [unmatchedAfter, "added"],
  ] as const) {
    for (const group of list) {
      const names = group.activeSkillNames || [];
      // We cannot attribute a change outside the replaced item's slot, or a
      // composite/unnamed group, to the replacement with enough confidence.
      if (!changedSlots.has(group.slot || "") || names.length !== 1 || !names[0].trim()) {
        ambiguous = true;
        continue;
      }
      changes.push({ kind, name: names[0].trim(), slot: group.slot });
    }
  }
  return { changes, warnings: ambiguous ? ["스킬 변경 확인 필요"] : [] };
}
