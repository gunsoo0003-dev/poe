/**
 * V208: PoB owns all calculation. FIXLGS stores immutable snapshots per
 * physical weapon set; UI selection never changes the calculation engine.
 */
import { CalcClient } from "./web-engine/calc-client";
import type { SkillsData } from "./web-engine/calc-api";
import type { ImportedCharacter } from "./ninjaImport";
import type { TradeItem } from "./tradeItem";
import { convertTradeToPob } from "./tradeToPob";
import { validateNativeItemAudit } from "./nativeIntegrity";
import { auditSkillChanges, groupInventory, type SkillChange } from "./skillChangeAudit";

export type WeaponSet = 1 | 2;
export type SetSnapshots = Partial<Record<WeaponSet, SetCalculation>>;
/** A DPS result has meaning only for the physical weapon set in which PoB measured it. */
export interface CalculatedSkillResult {
  groupIndex: number;
  weaponSet: WeaponSet;
  dps: number;
  activeSkillNames: string[];
  slot: string;
}
export interface SetCalculation {
  weaponSet: WeaponSet;
  stats: Record<string, number>;
  skills: SkillsData;
  /** Only group indexes actually measured in THIS weapon set. */
  groupDps: Record<number, number>;
  calculatedSkills: Record<number, CalculatedSkillResult>;
}

/** Never borrow a DPS value from the other weapon set or ninja's displayed DPS. */
export function getMeasuredSkill(snapshot: SetCalculation | undefined, skillName: string): CalculatedSkillResult | undefined {
  if (!snapshot) return undefined;
  const normal = (text: string) => text.trim().toLowerCase();
  return Object.values(snapshot.calculatedSkills).find(result =>
    result.weaponSet === snapshot.weaponSet && Number.isFinite(result.dps) &&
    result.activeSkillNames.some(name => normal(name) === normal(skillName))
  );
}
export interface ComparisonResult {
  status: string;
  original: SetSnapshots;
  simulation: SetSnapshots;
  originalWeaponSet: WeaponSet;
  warnings: string[];
  equipmentTrace: string[];
  skillChanges: SkillChange[];
  /** Pass means PoB native item parsing passed, NOT desktop-engine parity. */
  nativeParserStatus: "not-applicable" | "passed" | "blocked";
}

const slots: Record<string, string> = {
  "weapon-set-1": "Weapon 1", "weapon-set-2": "Weapon 1 Swap",
  "offhand-set-1": "Weapon 2", "offhand-set-2": "Weapon 2 Swap",
  helm: "Helmet", body: "Body Armour", gloves: "Gloves", boots: "Boots",
  "ring-a": "Ring 1", "ring-b": "Ring 2", amulet: "Amulet", belt: "Belt",
  "charm-a": "Charm 1", "charm-b": "Charm 2", "charm-c": "Charm 3",
  "flask-a": "Flask 1", "flask-b": "Flask 2",
};

export async function calculateComparison(
  engine: CalcClient,
  character: ImportedCharacter,
  xml: string,
  overrides: Record<string, TradeItem>,
): Promise<ComparisonResult> {
  const loaded = await engine.loadBuild(xml);
  if (!loaded.success) throw new Error(loaded.error || "PoB 원본 빌드 로드 실패");
  const initialSkills = await engine.getSkills({ skipAutoSelect: true });
  if (!initialSkills.groups.length) throw new Error("PoB 원본 스킬 그룹이 비어 있습니다.");
  const originalWeaponSet: WeaponSet = initialSkills.weaponSet === 2 ? 2 : 1;
  const mainGroup = initialSkills.mainSocketGroup;
  const ranked = [...(character.skills || [])]
    .filter(skill => Number.isFinite(skill.dpsValue))
    .sort((a, b) => (b.dpsValue || 0) - (a.dpsValue || 0)).slice(0, 2);
  const selectedGroups = [...new Set(ranked.map(skill => initialSkills.groups.find(group =>
    group.activeSkillNames.some(name => name.trim().toLowerCase() === skill.name.trim().toLowerCase())
  )?.index).filter((index): index is number => Number.isInteger(index)))];
  const secondaryGroups = selectedGroups.filter(index => index !== mainGroup);
  const warnings: string[] = [];
  const equipmentTrace: string[] = [];

  // Secondary skills retain their *original* weapon set. Trying them in an
  // incompatible weapon set can hang Lua; never brute-force both weapon sets.
  async function capture(): Promise<SetSnapshots> {
    const snapshots: SetSnapshots = {};
    const secondaryDps: Record<number, number> = {};
    await engine.setWeaponSet(originalWeaponSet);
    for (const index of secondaryGroups) {
      try {
        const result = await engine.getGroupDps(index, originalWeaponSet);
        if (result.restoredGroup !== mainGroup || result.restoredWeaponSet !== originalWeaponSet ||
            result.weaponSet !== originalWeaponSet || result.groupIndex !== index || !Number.isFinite(result.dps))
          throw new Error("원본 스킬 상태/계산 출처 불일치");
        secondaryDps[index] = result.dps;
      } catch (error) {
        warnings.push(`스킬 그룹 ${index} 독립 계산 실패: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    for (const set of [1, 2] as const) {
      await engine.setWeaponSet(set);
      const measuredMain = await engine.getGroupDps(mainGroup, set);
      if (measuredMain.restoredGroup !== mainGroup || measuredMain.restoredWeaponSet !== set ||
          measuredMain.weaponSet !== set || measuredMain.groupIndex !== mainGroup || !Number.isFinite(measuredMain.dps))
        throw new Error(`Set ${set} PoB 메인 스킬 계산 또는 상태 복원 실패`);
      const skills = await engine.getSkills({ skipAutoSelect: true });
      const stats = await engine.getStats();
      if (skills.weaponSet !== set) throw new Error(`Set ${set} 계산 결과의 무기 세트가 다릅니다.`);
      if (!Number.isFinite(stats.Life) && !Number.isFinite(stats.EnergyShield) && !Number.isFinite(stats.Mana))
        throw new Error(`Set ${set} 캐릭터 기본 수치가 없습니다.`);
      // A secondary skill is measured only in the original weapon set; do not
      // copy its result into the other set's snapshot (V207 bug).
      const measured: Record<number, number> = { [mainGroup]: measuredMain.dps };
      if (set === originalWeaponSet) Object.assign(measured, secondaryDps);
      const calculatedSkills: Record<number, CalculatedSkillResult> = {};
      for (const [key, dps] of Object.entries(measured)) {
        const index = Number(key);
        const group = skills.groups.find(entry => entry.index === index);
        if (!group || !Number.isFinite(dps)) {
          warnings.push(`Set ${set}: 스킬 그룹 ${index} 메타데이터/계산값 확인 불가`);
          continue;
        }
        calculatedSkills[index] = {
          groupIndex: index, weaponSet: set, dps,
          activeSkillNames: [...group.activeSkillNames], slot: group.slot || "",
        };
      }
      snapshots[set] = {
        weaponSet: set, stats: { ...stats }, skills,
        groupDps: Object.fromEntries(Object.entries(calculatedSkills).map(([key, value]) => [key, value.dps])),
        calculatedSkills,
      };
    }
    // No caller may accidentally inherit a different working set.
    await engine.setWeaponSet(originalWeaponSet);
    return snapshots;
  }

  const original = await capture();
  const entries = Object.entries(overrides);
  if (!entries.length) {
    return { status: "PoB2 원본 무기 세트 I·II 계산 완료 · 교체 장비 없음", original,
      simulation: original, originalWeaponSet, warnings, equipmentTrace, skillChanges: [], nativeParserStatus: "not-applicable" };
  }
  // Hold the correct CURRENT snapshots when a candidate item is not fully
  // recognized by upstream PoB. No estimated After DPS is ever emitted.
  function blocked(slot: string, issues: string[]): ComparisonResult {
    return {
      status: `교체 계산 보류 · ${slot}: 원본 PoB 옵션 인식 검증 실패 (DPS·STATS 변화값 표시 안 함)`,
      original, simulation: {}, originalWeaponSet,
      warnings: [`${slot}: ${issues.slice(0, 6).join(" / ")}${issues.length > 6 ? ` (외 ${issues.length - 6}건)` : ""}`],
      equipmentTrace, skillChanges: [], nativeParserStatus: "blocked",
    };
  }
  for (const [slot, item] of entries) {
    const target = slots[slot];
    if (!target) throw new Error(`PoB 미지원 장비 슬롯: ${slot}`);
    const converted = convertTradeToPob(item.raw);
    if (converted.unsupported.length) return blocked(slot, converted.unsupported);
    const added = await engine.addCustomItem(converted.rawText);
    if (!added.success || !added.itemId) return blocked(slot, [added.error || "PoB 아이템 등록 실패"]);
    const audit = validateNativeItemAudit(added.nativeAudit, converted.included);
    equipmentTrace.push(`${slot}: PoB 원본 파서 ${audit.verified ? "인식 확인" : "미해석/불완전"}; ${audit.parsedCount} modifiers; ${audit.issues.length} issues`);
    if (!audit.verified) return blocked(slot, audit.issues);
    const equipped = await engine.equipItem(added.itemId, target);
    if (equipped.error || equipped.equippedItemId !== added.itemId || equipped.equippedSlot !== target)
      throw new Error(`${slot} 실제 장착 실패: ${equipped.error || "슬롯/ID 불일치"}`);
    const slotItems = await engine.getSlotItems(target);
    if (!slotItems.some(entry => entry.itemId === added.itemId && entry.isEquipped))
      throw new Error(`${slot} 장착 상태 재조회 실패`);
    const trace = equipped.diagnostic;
    equipmentTrace.push(`${slot} → ${target}: item ${added.itemId}; modifier ${trace?.parsedModCount ?? "unknown"}; revision ${trace?.previousRevision ?? "?"}→${trace?.nextRevision ?? "?"}`);
    // Validation after native equipment rebuild must also fail closed.
    // An item can have no modifiers (normal base): that alone is NOT an error.
    if (!trace) return blocked(slot, ["PoB 실제 장착 계산 진단 결과 없음"]);
    if (converted.included.length > 0 && (!trace.hasModList || !Number(trace.parsedModCount)))
      return blocked(slot, ["장착한 아이템의 PoB 계산 modifier 확인 불가"]);
    // Upstream PoB may construct rune effects from named socketed augments.
    // Demand the native reconstructed effects are traceable to source lines.
    const expectedRuneLines = converted.rawText.split("\n").filter(line => line.startsWith("{rune}"))
      .map(line => line.slice("{rune}".length).trim()).sort();
    const actualRuneLines = [...(trace.runeParsedLines ?? [])].map(line => line.trim()).sort();
    if (expectedRuneLines.length !== Number(trace.runeLineCount ?? -1) ||
        expectedRuneLines.length !== actualRuneLines.length ||
        expectedRuneLines.some((line, index) => line !== actualRuneLines[index]))
      return blocked(slot, ["룬 원본 데이터와 PoB 계산용 룬 데이터 불일치"]);
    if (trace.runeUnknownLines?.length || trace.runeNamesUnknown?.length ||
        (trace.bondedEnabled && trace.bondedUnknownLines?.length))
      return blocked(slot, ["룬·결속 옵션을 PoB 원본이 완전히 해석하지 못함"]);
    // An inactive set is not an error: we explicitly calculate both sets next.
    if (trace && !trace.inactiveWeaponSet && trace.calculatedItemMatches === false)
      throw new Error(`${slot}: 활성 PoB 계산 장비가 교체 아이템과 불일치`);
  }
  const simulation = await capture();
  // Snapshot original remains frozen even after changing the engine's gear.
  for (const set of [1, 2] as const) {
    if (!original[set] || !simulation[set]) throw new Error(`Set ${set} 비교 결과가 없습니다.`);
  }
  const skillChanges: SkillChange[] = [];
  const baseBefore = original[originalWeaponSet]!.skills.groups;
  const baseAfter = simulation[originalWeaponSet]!.skills.groups;
  // PoB group lists are character-wide. Check that both weapon-set snapshots
  // agree before reporting changes, or we'd give the user false information.
  const reliable = ([original[1], original[2], simulation[1], simulation[2]] as SetCalculation[])
    .every(snapshot => !!snapshot?.skills?.groups?.length) &&
    groupInventory(original[1]!.skills.groups) === groupInventory(original[2]!.skills.groups) &&
    groupInventory(simulation[1]!.skills.groups) === groupInventory(simulation[2]!.skills.groups);
  if (!reliable) {
    warnings.push("스킬 변경 확인 필요");
  } else {
    const audit = auditSkillChanges(baseBefore, baseAfter, new Set(entries.map(([slot]) => slots[slot])));
    skillChanges.push(...audit.changes);
    warnings.push(...audit.warnings);
  }
  return {
    status: `PoB2 원본 대비 장비 ${entries.length}개 교체 · Set I·II 모두 재계산 ${warnings.length ? "(검증 경고 있음)" : "완료"}`,
    original, simulation, originalWeaponSet, warnings: [...new Set(warnings)], equipmentTrace, skillChanges,
    nativeParserStatus: "passed",
  };
}
