"use client";

import { FormEvent, MouseEvent, ReactNode, useMemo, useState, useEffect } from "react";
import { parseTradeItem, type TradeItem } from "./tradeItem";
import { calculateGearDelta } from "./gearDelta";
import { calculateComparison, getMeasuredSkill, type ComparisonResult, type SetSnapshots, type SetCalculation, type WeaponSet } from "./pobCompare";
import { CalcClient } from "./web-engine/calc-client";
import type { SkillsData } from "./web-engine/calc-api";
import type { ImportedCharacter, ImportedCharacterStat, ImportedItem, ImportedSkill } from "./ninjaImport";

const guideLinks = [
  "DPS 이해하기",
  "Increased vs More",
  "적 저항과 관통",
  "버프와 차지",
  "패시브 계산 방식",
  "간편 PoB 이용안내",
  "FAQ",
];

const skills = [
  { name: "Whirling Slash", support: "Rage III · Rapid Attacks III · Blazing Critical", dps: "391k", tone: "gold" },
  { name: "Twister", support: "Magnified Area III · Rigwald's Ferocity", dps: "8.1k", tone: "gold" },
  { name: "Barrage", support: "Heightened Charges · Perpetual Charge", dps: "2.7k", tone: "green" },
  { name: "Sniper's Mark", support: "Charge Profusion II · Eternal Mark", dps: "Utility", tone: "green" },
  { name: "Herald of Ice", support: "Elemental Armament II · Magnified Area II", dps: "1.6k", tone: "blue" },
  { name: "Armour Demolisher II", support: "Breachlord's Rite", dps: "Utility", tone: "red" },
];

const equipment = [
  { cls: "weapon", label: "창", sub: "무기" },
  { cls: "offhand", label: "방패", sub: "보조" },
  { cls: "helm", label: "투구", sub: "" },
  { cls: "body", label: "갑옷", sub: "" },
  { cls: "gloves", label: "장갑", sub: "" },
  { cls: "boots", label: "장화", sub: "" },
  { cls: "ring-a", label: "반지", sub: "I" },
  { cls: "ring-b", label: "반지", sub: "II" },
  { cls: "amulet", label: "목걸이", sub: "" },
  { cls: "belt", label: "벨트", sub: "" },
  { cls: "charm-a", label: "호신부", sub: "I" },
  { cls: "charm-b", label: "호신부", sub: "II" },
  { cls: "charm-c", label: "호신부", sub: "III" },
  { cls: "flask-a", label: "생명력", sub: "플라스크" },
  { cls: "flask-b", label: "마나", sub: "플라스크" },
];


function normalizedSlotKey(value?: string) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function slotMatches(cls: string, slot?: string) {
  const key = normalizedSlotKey(slot);
  const rules: Record<string, string[]> = {
    weapon: ["weapon", "mainhand", "weapon1", "mainweapon"],
    offhand: ["offhand", "offhand1", "weapon2", "shield"],
    helm: ["helmet", "helm"],
    body: ["bodyarmour", "bodyarmor", "chest"],
    gloves: ["gloves", "glove"],
    boots: ["boots", "boot"],
    "ring-a": ["ring", "ring1", "leftring"],
    "ring-b": ["ring2", "rightring"],
    amulet: ["amulet"],
    belt: ["belt"],
    "charm-a": ["charm1"],
    "charm-b": ["charm2"],
    "charm-c": ["charm3"],
    "flask-a": ["lifeflask"],
    "flask-b": ["manaflask"],
  };

  // Flask/Charm slots are already normalized by the importer from inventoryId + x.
  // These must use exact matching; otherwise `manaflask` also matches the generic
  // token `flask`, causing both flask UI slots to render the same item.
  if (cls.startsWith("flask-") || cls.startsWith("charm-")) {
    return (rules[cls] ?? []).some((token) => key === token);
  }

  return (rules[cls] ?? []).some((token) => key === token || key.includes(token));
}

function weaponSlotMatches(cls: "weapon" | "offhand", set: 1 | 2, slot?: string) {
  const key = normalizedSlotKey(slot);
  if (cls === "weapon") {
    return set === 1
      ? ["weapon", "weapon1", "mainhand", "mainhand1", "mainweapon"].includes(key)
      : ["weapon2", "weapon1swap", "weaponswap", "mainhand2", "mainweapon2"].includes(key);
  }
  return set === 1
    ? ["offhand", "offhand1", "shield", "shield1"].includes(key)
    : ["offhand2", "weapon2swap", "shield2"].includes(key);
}

// Persist weapon overrides by physical weapon set, not by the currently visible tab.
const physicalSlotKey = (slot: string, set: 1 | 2) =>
  slot === "weapon" || slot === "offhand" ? `${slot}-set-${set}` : slot;
export default function Home() {
  const [screen, setScreen] = useState<"landing" | "game">("landing");
  const [ninjaUrl, setNinjaUrl] = useState("");
  const [importedCharacter, setImportedCharacter] = useState<ImportedCharacter | null>(null);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [exportCheck, setExportCheck] = useState<{ stage: string; message: string } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<ImportedItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 24, y: 24 });
  const [weaponSet, setWeaponSet] = useState<1 | 2>(1);
  const [simulationWeaponSet, setSimulationWeaponSet] = useState<1 | 2>(1);
  const [simulationItems, setSimulationItems] = useState<Record<string, TradeItem>>({});
  const [simulationSlot, setSimulationSlot] = useState<string | null>(null);
  const [editingWeaponSet, setEditingWeaponSet] = useState<1 | 2>(1);
  const [simulationDraft, setSimulationDraft] = useState("");
  const [simulationError, setSimulationError] = useState("");
  const [pobState, setPobState] = useState<ComparisonResult | null>(null);
  const [pobStatus, setPobStatus] = useState("PoB2 엔진 대기 중");
  useEffect(() => {
    if (!importedCharacter?.pathOfBuildingExport) {
      setPobState(null); setPobStatus("PoB Export가 없어 계산할 수 없습니다."); return;
    }
    let cancelled = false;
    let engine: CalcClient | null = null;
    const run = async () => {
      setPobState(null); setPobStatus("PoB2 원본 Set I·II 계산 준비 중...");
      try {
        const response = await fetch("/api/pob/prepare-export", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ exportCode: importedCharacter.pathOfBuildingExport }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok || typeof payload.xml !== "string")
          throw new Error(payload.error || "캐릭터 XML 변환 실패");
        if (cancelled) return;
        engine = new CalcClient();
        if (!await engine.init()) throw new Error("PoB2 WASM 엔진 초기화 실패");
        const result = await calculateComparison(engine, importedCharacter, payload.xml, simulationItems);
        if (!cancelled) { setPobState(result); setPobStatus(result.status); }
      } catch (error) {
        if (!cancelled) { setPobState(null); setPobStatus(`계산 실패: ${error instanceof Error ? error.message : String(error)}`); }
      } finally { engine?.terminate(); }
    };
    void run();
    return () => { cancelled = true; engine?.terminate(); };
  }, [importedCharacter, simulationItems]);
  // The UI tabs choose only which already-computed immutable snapshot to show.
  // They never call setWeaponSet or alter PoB's working state.
  const beforeSnapshot = pobState?.original[weaponSet];
  const compareBeforeSnapshot = pobState?.original[simulationWeaponSet];
  const afterSnapshot = pobState?.simulation[simulationWeaponSet];
  const statsFor = (stats?: Record<string, number>): ImportedCharacterStat[] =>
    stats ? Object.entries(stats).filter(([key, value]) => !key.startsWith("_") && Number.isFinite(value))
      .map(([key, value]) => ({ key, label: key, value: value.toLocaleString("en-US", { maximumFractionDigits: 2 }), group: "overview" })) : [];
  const engineStatsBefore = statsFor(beforeSnapshot?.stats);
  const engineStatsAfter = statsFor(afterSnapshot?.stats);
  const pobStats = useMemo(() => {
    if (!compareBeforeSnapshot || !afterSnapshot) return [];
    const labels: Record<string, string> = { TotalDPS: "Main Skill DPS", CombinedDPS: "Combined DPS", Life: "Life", EnergyShield: "Energy Shield", Mana: "Mana", Armour: "Armour", Evasion: "Evasion", FireResist: "Fire Resistance", ColdResist: "Cold Resistance", LightningResist: "Lightning Resistance", ChaosResist: "Chaos Resistance" };
    return Object.entries(compareBeforeSnapshot.stats)
      .filter(([key, value]) => !key.startsWith("_") && Number.isFinite(value) && Number.isFinite(afterSnapshot.stats[key]))
      .map(([key, before]) => ({ key, label: labels[key] || key, before, after: afterSnapshot.stats[key], delta: afterSnapshot.stats[key] - before }));
  }, [compareBeforeSnapshot, afterSnapshot]);
  const skillDeltas = useMemo(() => {
    if (!compareBeforeSnapshot || !afterSnapshot) return [];
    return [...(importedCharacter?.skills || [])].filter(skill => Number.isFinite(skill.dpsValue))
      .sort((a, b) => (b.dpsValue || 0) - (a.dpsValue || 0)).slice(0, 2)
      .flatMap(skill => {
        const before = getMeasuredSkill(compareBeforeSnapshot, skill.name);
        const after = getMeasuredSkill(afterSnapshot, skill.name);
        // The same PoB group MUST have been calculated in the same physical set.
        if (!before || !after || before.weaponSet !== after.weaponSet || before.groupIndex !== after.groupIndex || before.slot !== after.slot)
          return [];
        return [{ name: skill.name, before: before.dps, after: after.dps, weaponSet: after.weaponSet, groupIndex: after.groupIndex }];
      });
  }, [compareBeforeSnapshot, afterSnapshot, importedCharacter]);
  const gearComparison = useMemo(() => calculateGearDelta(importedCharacter, simulationItems, simulationWeaponSet), [importedCharacter, simulationItems, simulationWeaponSet]);
  const actualSkills = useMemo(() => importedCharacter?.skills ?? [], [importedCharacter]);
  const actualStats = useMemo(() => importedCharacter?.stats ?? [], [importedCharacter]);
  const mainSkills = useMemo(() => {
    if (!actualSkills.length) return skills.slice(0, 2);
    const ranked = actualSkills
      .filter((skill) => skill.dpsValue !== undefined)
      .sort((a, b) => (b.dpsValue ?? 0) - (a.dpsValue ?? 0));
    const source = ranked.length ? ranked : actualSkills;
    return source.slice(0, 2).map(toUiSkill);
  }, [actualSkills]);

  // The visual skill names/supports come from ninja; DPS comes only from PoB2.
  // Do not substitute ninja DPS when PoB has not computed a matching skill.
  const engineMainSkills = (snapshot?: SetCalculation): UiSkill[] => {
    if (!snapshot) return [];
    return mainSkills.flatMap(skill => {
      const result = getMeasuredSkill(snapshot, skill.name);
      if (!result) return []; // Not measured in this set: don't reuse another set's DPS.
      return [{ ...skill, name: `${skill.name} · Set ${result.weaponSet === 1 ? "I" : "II"}`,
        dps: result.dps.toLocaleString("en-US", { maximumFractionDigits: 2 }) }];
    });
  };

  function moveItemTooltip(event: MouseEvent<HTMLElement>, item: ImportedItem) {
    const tooltipWidth = 360;
    const tooltipHeight = 460;
    const gap = 18;
    const x = Math.min(event.clientX + gap, Math.max(12, window.innerWidth - tooltipWidth - 12));
    const y = Math.min(event.clientY + gap, Math.max(12, window.innerHeight - tooltipHeight - 12));
    setTooltipPos({ x, y });
    if (hoveredItem !== item) setHoveredItem(item);
  }

  async function handleNinjaImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImportError("");
    setImporting(true);
    setExportCheck(null);

    try {
      const response = await fetch("/api/pob/import-ninja", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: ninjaUrl }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "캐릭터 링크를 불러오지 못했습니다.");
      }
      const character = payload.character as ImportedCharacter;
      setImportedCharacter(character);
      if (character.pathOfBuildingExport) {
        setExportCheck({ stage: "CHECKING", message: "PoB 캐릭터 데이터를 웹에서 확인 중..." });
        void fetch("/api/pob/prepare-export", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ exportCode: character.pathOfBuildingExport }),
        }).then(async (result) => {
          const data = await result.json();
          if (!result.ok || !data.ok) throw new Error(data.error || "Export 검사 실패");
          setExportCheck({ stage: "VALIDATED", message: `PoB Export 확인 완료 · 장비 ${data.metadata.itemCount}개 · 스킬 ${data.metadata.skillCount}개 · 계산 연결 전` });
        }).catch((error) => setExportCheck({ stage: "ERROR", message: error instanceof Error ? error.message : "Export 검사 실패" }));
      } else {
        setExportCheck({ stage: "MISSING", message: "poe.ninja에서 PoB Export가 제공되지 않았습니다. 현재 정보만 표시합니다." });
      }
      setWeaponSet(1);
      setSimulationWeaponSet(1);
      setSimulationItems({});
      setSimulationSlot(null);
      setSimulationDraft("");
      setScreen("game");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "캐릭터 링크를 불러오지 못했습니다.");
    } finally {
      setImporting(false);
    }
  }

  function openSimulationSlot(slot: string) {
    setSimulationSlot(slot);
    setEditingWeaponSet(simulationWeaponSet);
    setSimulationDraft(simulationItems[physicalSlotKey(slot, simulationWeaponSet)]?.raw ?? "");
    setSimulationError("");
  }

  function saveSimulationItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!simulationSlot) return;
    try {
      const item = parseTradeItem(simulationDraft);
      setSimulationItems((current) => ({ ...current, [physicalSlotKey(simulationSlot, editingWeaponSet)]: item }));
      setSimulationSlot(null);
      setSimulationDraft("");
      setSimulationError("");
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : "아이템 정보를 읽을 수 없습니다.");
    }
  }

  function clearSimulationLink(slot: string) {
    setSimulationItems((current) => {
      const next = { ...current };
      delete next[physicalSlotKey(slot, simulationWeaponSet)];
      return next;
    });
    if (simulationSlot === slot) {
      setSimulationSlot(null);
      setSimulationDraft("");
      setSimulationError("");
    }
  }

  if (screen === "game") {
    const changedCount = Object.keys(simulationItems).length;
    return (
      <main className="game-shell">
        <div className="game-frame">
          <aside className="ad-rail left" aria-label="좌측 광고 영역">
            <div className="ad-placeholder"><small>ADSENSE</small><strong>좌측 광고 자리</strong></div>
          </aside>

          <div className="game-main">
            <header className="character-header">
              <div className={`portrait ${importedCharacter?.portraitUrl ? "has-image" : ""}`}>
                {importedCharacter?.portraitUrl ? (
                  <img src={importedCharacter.portraitUrl} alt={`${importedCharacter.character} portrait`} draggable={false} />
                ) : "FIX"}
              </div>
              <div className="character-title">
                <span>{importedCharacter ? `${importedCharacter.leagueSlug.toUpperCase()} LEAGUE` : "POE2 CHARACTER"}</span>
                <h1>{importedCharacter?.character ?? "Character"}</h1>
                <p>
                  {importedCharacter?.level ? `Level ${importedCharacter.level}` : "Level pending"}
                  {importedCharacter?.ascendancy ? ` ${importedCharacter.ascendancy}` : ""}
                  {importedCharacter?.account ? ` · ${importedCharacter.account}` : ""}
                </p>
              </div>
              <div className="character-head-actions">
                <button className="head-button" onClick={() => setScreen("landing")}>메인으로</button>
                <button className="head-button accent" onClick={() => setScreen("landing")}>다른 캐릭터</button>
                <div className="sync-state"><small>LAST FETCHED</small><b>{importedCharacter ? "방금 전" : "-"}</b></div>
              </div>
            </header>

            {importedCharacter?.detailMessage && (
              <div className={`import-source-note ${importedCharacter.verified ? "ok" : "warn"}`}>
                <b>{importedCharacter.verified ? "poe.ninja 링크 확인 완료" : "링크 정보로 진입"}</b>
                <span>{importedCharacter.detailMessage}</span>
              </div>
            )}

            {exportCheck && <div className={`import-source-note ${exportCheck.stage === "VALIDATED" ? "ok" : "warn"}`} role="status">
              <b>PoB 웹 데이터 검사 · {exportCheck.stage}</b><span>{exportCheck.message}</span>
            </div>}
            <div className="import-source-note" role="note">
              <b>PoB2 WEB ENGINE · V210</b>
              <span>PoB2 브라우저 계산엔진을 사용합니다. 실계산 결과는 아래 비교표에서 확인할 수 있으며, 지원하지 않는 옵션은 경고로 표시합니다.</span>
              <button className="head-button" type="button" onClick={() => {
                try {
                  if (importedCharacter?.pathOfBuildingExport) sessionStorage.setItem("fixlgs.pob2.engineLabExport", importedCharacter.pathOfBuildingExport);
                  else sessionStorage.removeItem("fixlgs.pob2.engineLabExport");
                } catch { /* optional temporary diagnostics */ }
                window.location.assign("/pob/engine-lab");
              }}>웹 계산엔진 진단 열기</button>
            </div>
            <section className="build-half current-build">
              <div className="build-half-label">
                <div><small>ORIGINAL BUILD</small><strong>CURRENT CHARACTER</strong></div>
                <span>poe.ninja imported state · read only</span>
              </div>
              <WeaponSetSummary data={pobState?.original} chosen={weaponSet} onChoose={setWeaponSet} title="CURRENT · 원본 두 무기 세트" character={importedCharacter} />
              <div className="character-grid">
                <EquipmentPanel
                  character={importedCharacter}
                  weaponSet={weaponSet}
                  onHover={moveItemTooltip}
                  onLeave={() => setHoveredItem(null)}
                />
                <StatsCard title={`Stats · CURRENT (PoB2 · Set ${weaponSet === 1 ? "I" : "II"})`} stats={engineStatsBefore} mainSkills={engineMainSkills(beforeSnapshot)} />
              </div>
              <SkillsPanel character={importedCharacter} />
            </section>

            <div className="simulation-divider" role="separator">
              <div className="simulation-divider-line" />
              <div className="simulation-divider-copy">
                <small>VIRTUAL EQUIPMENT TEST</small>
                <strong>SIMULATION / CHANGED BUILD</strong>
                <span>아래 장비 슬롯을 클릭해 FIXLGS EXPORT 텍스트를 붙여넣으면 이 영역만 변경됩니다.</span>
              </div>
              <div className="simulation-divider-line" />
            </div>

            <section className="build-half simulation-build">
              <div className="build-half-label simulation-label">
                <div><small>AFTER CHANGE</small><strong>SIMULATION</strong></div>
                <span>{changedCount ? `${changedCount} SLOT${changedCount > 1 ? "S" : ""} IMPORTED` : "No equipment changed yet"}</span>
              </div>
              <WeaponSetSummary data={pobState?.simulation} chosen={simulationWeaponSet}
                onChoose={(set) => { setSimulationWeaponSet(set); setSimulationSlot(null); setSimulationError(""); }} title="SIMULATION · 변경 후 두 무기 세트" character={importedCharacter} overrides={simulationItems} />
              <div className="character-grid">
                <EquipmentPanel
                  character={importedCharacter}
                  weaponSet={simulationWeaponSet}
                  onHover={moveItemTooltip}
                  onLeave={() => setHoveredItem(null)}
                  simulation
                  linkedSlots={simulationItems}
                  activeSlot={simulationSlot}
                  onSlotClick={openSimulationSlot}
                  onClearSlot={clearSimulationLink}
                >
                  {simulationSlot && (
                    <form className="simulation-link-editor" onSubmit={saveSimulationItem}>
                      <div className="simulation-link-head">
                        <div><small>FIXLGS EXPORT · 붙여넣기</small><strong>{simulationSlot.toUpperCase()}</strong></div>
                        <button type="button" onClick={() => setSimulationSlot(null)}>×</button>
                      </div>
                      <textarea
                        autoFocus
                        rows={9}
                        placeholder={"Rarity: Rare\n아이템 이름\n베이스 타입\n--------\n..."}
                        value={simulationDraft}
                        onChange={(event) => setSimulationDraft(event.target.value)}
                      />
                      {/^(?:FIXLGS-EN-V004\s+)?Rarity:/i.test(simulationDraft.trim()) && (
                        <p className="trade-preview">{(() => { try { const x = parseTradeItem(simulationDraft); return `${x.rarity} · ${x.name} · ${x.baseType} · 옵션 ${x.modifiers.length}줄`; } catch { return "텍스트를 모두 붙여넣어 주세요."; } })()}</p>
                      )}
                      <div className="simulation-link-actions">
                        <span>{simulationError || "거래소에서 FIXLGS EXPORT를 누르고 여기에 Ctrl+V 하세요."}</span>
                        <button type="submit">아이템 적용</button>
                      </div>
                    </form>
                  )}
                </EquipmentPanel>
                <StatsCard title={`Stats · After Change (PoB2 · Set ${simulationWeaponSet === 1 ? "I" : "II"})`} stats={engineStatsAfter} mainSkills={engineMainSkills(afterSnapshot)} />
              </div>
              <section className="gear-delta-panel" aria-live="polite">
                <strong>PoB2 WASM · 엔진 계산 비교 (검증용)</strong>
                <p>{pobStatus}</p><p>증감량은 SIMULATION에서 선택한 동일 무기 세트의 원본과 변경 후를 비교합니다. CURRENT는 별도로 보존됩니다.</p>
                {changedCount > 0 && pobStats.length > 0 && <div className="gear-delta-grid">{pobStats.map(row => <div className="gear-delta-row" key={row.key}><span>{row.label}</span><b>{row.after.toLocaleString("en-US", {maximumFractionDigits:2})} ({row.delta >= 0 ? "+" : ""}{row.delta.toLocaleString("en-US", {maximumFractionDigits:2})})</b><small>기존 {row.before.toLocaleString("en-US", {maximumFractionDigits:2})} → 변경 {row.after.toLocaleString("en-US", {maximumFractionDigits:2})}</small></div>)}</div>}
                {changedCount > 0 && skillDeltas.length > 0 && <div className="gear-delta-grid">{skillDeltas.map((skill, i) => <div className="gear-delta-row" key={`${skill.name}-${i}`}><span>{skill.name} DPS</span><b>{skill.after.toLocaleString("en-US", {maximumFractionDigits: 2})}</b><small>{skill.before === undefined ? "이전 스킬 식별자 없음" : `${skill.before.toLocaleString("en-US")} → ${skill.after.toLocaleString("en-US")} (${skill.after - skill.before >= 0 ? "+" : ""}${(skill.after - skill.before).toLocaleString("en-US")})`}</small></div>)}</div>}
                {changedCount > 0 && !!pobState?.skillChanges?.length && <div className="gear-delta-grid" aria-label="스킬 변경">
                  {pobState.skillChanges.map((change, i) => <p key={`${change.kind}-${change.slot}-${change.name}-${i}`}>
                    {change.name} {change.kind === "added" ? "추가" : "제거"}
                  </p>)}
                </div>}
                {(pobState?.warnings || []).map((warning, i) => <p key={i} style={{color: "#f3b870"}}>부분 계산 주의: {warning}</p>)}
                {changedCount > 0 && pobState?.equipmentTrace && <details style={{marginTop: 12}}><summary>PoB2 실제 장착·재계산 확인 기록</summary><pre style={{whiteSpace: "pre-wrap", fontSize: 12}}>{pobState.equipmentTrace.join("\n")}</pre></details>}
              </section>
              {changedCount > 0 && <section className="gear-delta-panel" aria-live="polite">
                <strong>장비 옵션 차이 · 웹 계산</strong>
                <p>교체한 슬롯의 기존/신규 장비에서 직접 확인 가능한 고정 옵션만 비교해. 캐릭터 최종 Stats나 DPS 계산값은 아니야.</p>
                {gearComparison.rows.length ? <div className="gear-delta-grid">{gearComparison.rows.map(row => <div className="gear-delta-row" key={row.key}><span>{row.label}</span><b>{row.delta > 0 ? "+" : ""}{row.delta}</b><small>기존 {row.before} → 변경 {row.after}</small></div>)}</div> : <p>현재 지원하는 고정 옵션에서 확인 가능한 변화가 없어. 무기 피해·공격 속도·스킬 DPS 등은 PoB2 웹 엔진 연결 후 계산해야 해.</p>}
                {gearComparison.warnings.map(w => <p key={w}>{w}</p>)}
              </section>}
              <SkillsPanel character={importedCharacter} simulation engineSkills={afterSnapshot?.skills} />
              <div className="simulation-stage-note">
                <b>PoB2 ENGINE TEST</b>
                <span>CURRENT와 SIMULATION Stats는 PoB2 엔진 계산값을 사용합니다. 미인식 옵션 및 빌드 누락이 있으면 완전한 계산으로 간주하지 마세요.</span>
              </div>
            </section>

            {hoveredItem && <ItemHoverCard item={hoveredItem} x={tooltipPos.x} y={tooltipPos.y} />}
          </div>

          <aside className="ad-rail right" aria-label="우측 광고 영역">
            <div className="ad-placeholder"><small>ADSENSE</small><strong>우측 광고 자리</strong></div>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <section className="top-strip">
        <div className="brand-panel">
          <div>
            <p className="eyebrow">PATH OF EXILE 2 · FAN-MADE TOOL</p>
            <h1>FIX <span>PoB</span></h1>
            <p className="brand-copy">
              복잡한 PoB 계산은 그대로.<br />내 캐릭터의 실전 DPS는 더 간단하게.
            </p>
          </div>
          <div className="trust-line">PoB2 Community 계산 로직 기반</div>
        </div>

        <div className="season-header" aria-label="현재 시즌 비주얼">
          <img src="/season-header.jpg" alt="Path of Exile 2 시즌 이미지" />
          <div className="season-label">CURRENT SEASON</div>
        </div>
      </section>

      <section className="hero-stage">
        <div className="tree-column">
          <div className="tree-art" aria-hidden="true" />
          <nav className="guide-panel" id="pob-guide" aria-label="가이드">
            <div className="guide-heading">
              <span>GUIDE</span>
              <strong>필요할 때만 보는 간단 가이드</strong>
            </div>
            <div className="guide-links">
              {guideLinks.map((item) => (
                <a href="#" key={item}>{item}</a>
              ))}
            </div>
          </nav>
        </div>

        <div className="content-column">
          <section className="character-panel" id="character">
            <div className="character-copy">
              <p className="panel-kicker">START</p>
              <h2>내 캐릭터 불러오기</h2>
              <p>
                본인의 poe.ninja POE2 캐릭터 링크를 입력하면 캐릭터 정보를 확인하고
                기존 캐릭터 화면으로 불러옵니다.
              </p>
            </div>

            <form className="character-actions ninja-import" onSubmit={handleNinjaImport}>
              <label htmlFor="ninja-character-url">poe.ninja 캐릭터 링크</label>
              <div className="ninja-import-row">
                <input
                  id="ninja-character-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://poe.ninja/poe2/profile/.../.../character/..."
                  value={ninjaUrl}
                  onChange={(event) => setNinjaUrl(event.target.value)}
                  disabled={importing}
                  required
                />
                <button type="submit" disabled={importing}>{importing ? "확인 중..." : "확인"}</button>
              </div>
              <small>poe.ninja에 등록된 POE2 캐릭터 상세 링크만 지원합니다.</small>
              {importError && <p className="ninja-import-error" role="alert">{importError}</p>}
            </form>

            <div className="start-tools" aria-label="시작 도구">
              <a className="start-tool-card" href="#pob-guide">
                <span className="start-tool-kicker">GUIDE</span>
                <strong>사용 가이드</strong>
                <small>캐릭터 불러오기부터 거래소 아이템 비교까지 사용 순서를 확인합니다.</small>
                <b>가이드 보기 →</b>
              </a>

              <div className="start-tool-card extension-card">
                <span className="start-tool-kicker">TRADE EXTENSION</span>
                <strong>거래소 확장프로그램 설치</strong>
                <small>Google Chrome에서 거래소를 열고 원하는 매물을 Export해 Simulation 장비로 가져옵니다.</small>
                <a className="extension-download" href="/downloads/FIXLGS_POE2_ITEM_EXPORT_V004.zip" download>설치파일 ↓</a>
              </div>
            </div>
          </section>

          <section className="video-panel">
            <div className="video-head">
              <div>
                <p className="panel-kicker">OFFICIAL VIDEO</p>
                <h2>Path of Exile 2</h2>
              </div>
              <span>Grinding Gear Games 공식 YouTube</span>
            </div>

            <div className="video-frame">
              <iframe
                src="https://www.youtube.com/embed/WMo3RYyr4vY?autoplay=1&mute=1&loop=1&playlist=WMo3RYyr4vY&rel=0&playsinline=1"
                title="Path of Exile 2 official video"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      </section>

      <footer>
        <a href="/"><strong>← FIX POE2</strong></a>
        <span>FIX PoB · Unofficial fan-made tool. Not affiliated with or endorsed by Grinding Gear Games.</span>
      </footer>
    </main>
  );
}


function WeaponSetSummary({ data, chosen, onChoose, title, character, overrides }: {
  data?: SetSnapshots;
  character: ImportedCharacter | null;
  overrides?: Record<string, TradeItem>;
  chosen: WeaponSet;
  onChoose: (set: WeaponSet) => void;
  title: string;
}) {
  return <div className="set-overview" aria-label={title}>
    <div className="set-overview-label">{title}</div>
    <div className="set-overview-grid">{([1, 2] as const).map(set => {
      const result = data?.[set];
      const dps = result?.stats.CombinedDPS;
      const originalWeapon = character?.items?.find(item => weaponSlotMatches("weapon", set, item.slot));
      const override = overrides?.[physicalSlotKey("weapon", set)];
      const weaponName = override?.name || originalWeapon?.name || originalWeapon?.baseType || "No main-hand weapon";
      return <button type="button" key={set} className={`set-overview-option ${chosen === set ? "selected" : ""}`}
        onClick={() => onChoose(set)} aria-pressed={chosen === set}>
        <b>WEAPON SET {set === 1 ? "I" : "II"}</b>
        <small className="set-weapon-label">{weaponName}{override ? " · TRADE REPLACEMENT" : ""}</small>
        <span>{Number.isFinite(dps) ? dps!.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " DPS" : "계산 대기 / 실패"}</span>
        <small>{chosen === set ? "선택된 상세 STATS" : "선택해 상세 STATS 보기"}</small>
      </button>;
    })}</div>
  </div>;
}

function EquipmentPanel({
  character,
  weaponSet,
  onHover,
  onLeave,
  simulation = false,
  linkedSlots = {},
  activeSlot,
  onSlotClick,
  onClearSlot,
  children,
}: {
  character: ImportedCharacter | null;
  weaponSet: 1 | 2;
  onHover: (event: MouseEvent<HTMLElement>, item: ImportedItem) => void;
  onLeave: () => void;
  simulation?: boolean;
  linkedSlots?: Record<string, TradeItem>;
  activeSlot?: string | null;
  onSlotClick?: (slot: string) => void;
  onClearSlot?: (slot: string) => void;
  children?: ReactNode;
}) {
  return (
    <section className={`equipment-card panel-card ${simulation ? "simulation-equipment" : ""}`}>
      <div className="panel-title">{simulation ? "Equipment · Simulation" : "Equipment"}</div>
      <div className="equipment-stage">
        {equipment.map((item) => {
          const importedItem = character?.items?.find((candidate) =>
            item.cls === "weapon" || item.cls === "offhand"
              ? weaponSlotMatches(item.cls, weaponSet, candidate.slot)
              : slotMatches(item.cls, candidate.slot)
          );
          const displayName = importedItem?.name || importedItem?.baseType;
          const tradeItem = linkedSlots[physicalSlotKey(item.cls, weaponSet)];
          const linked = Boolean(tradeItem);
          return (
            <div className={`equipment-slot-wrap ${item.cls}`} key={item.cls}>
              <button
                type="button"
                className={`equipment-slot-inner ${importedItem ? "loaded" : ""} ${linked ? "trade-linked" : ""} ${activeSlot === item.cls ? "editing" : ""}`}
                aria-label={simulation ? `${item.label} FIXLGS EXPORT 텍스트 붙여넣기` : `${displayName ?? item.label} 상세 보기`}
                onClick={() => simulation && onSlotClick?.(item.cls)}
                onMouseEnter={(event) => !linked && importedItem && onHover(event, importedItem)}
                onMouseMove={(event) => !linked && importedItem && onHover(event, importedItem)}
                onMouseLeave={onLeave}
              >
                {linked ? (
                  <div className="trade-slot-copy">
                    <small>TRADE ITEM</small>
                    <strong>{tradeItem?.name ?? "IMPORTED"}</strong>
                    <span>{tradeItem?.baseType ?? item.label}</span>
                  </div>
                ) : importedItem?.icon ? (
                  <img className="equipment-image" src={importedItem.icon} alt="" draggable={false} />
                ) : (
                  <>
                    <span>{displayName ?? item.label}</span>
                    <small>{importedItem?.baseType && importedItem.baseType !== displayName ? importedItem.baseType : (item.sub || importedItem?.slot || "")}</small>
                  </>
                )}
              </button>
              {simulation && linked && (
                <button className="simulation-slot-reset" type="button" onClick={() => onClearSlot?.(item.cls)} title="Reset to current item">↺</button>
              )}
            </div>
          );
        })}
        {children}
      </div>

      <div className="jewel-wrap">
        <div className="jewel-heading-row">
          <div className="sub-title">BASE JEWELS</div>
          {character?.jewels && <small>{character.jewels.length}</small>}
        </div>
        {character?.jewels?.length ? (
          <div className="jewel-row">
            {character.jewels.map((jewel, idx) => {
              const jewelName = jewel.name || jewel.baseType || `Jewel ${idx + 1}`;
              return (
                <button
                  type="button"
                  className="jewel loaded-jewel"
                  key={`${jewelName}-${jewel.slot ?? "jewel"}-${idx}`}
                  aria-label={`${jewelName} 상세 보기`}
                  onMouseEnter={(event) => onHover(event, jewel)}
                  onMouseMove={(event) => onHover(event, jewel)}
                  onMouseLeave={onLeave}
                >
                  {jewel.icon ? <img src={jewel.icon} alt="" draggable={false} /> : <span>{jewelName}</span>}
                  <small>{jewelName}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="jewel-empty">No jewel data received.</div>
        )}
      </div>
    </section>
  );
}

function SkillsPanel({ character, simulation = false, engineSkills }: { character: ImportedCharacter | null; simulation?: boolean; engineSkills?: SkillsData }) {
  // Display the original skill gems in both panes. PoB2's SkillDPS is a
  // computed subset, not the inventory of socket groups; an empty SkillDPS
  // response must not erase the character's actual gem list.
  const originalSkills = character?.skills?.length ? character.skills.map(toUiSkill) : skills;
  const uiSkills = simulation ? originalSkills.map(skill => {
    const matching = engineSkills?.skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
    return { ...skill, dps: matching ? matching.dps.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—" };
  }) : originalSkills;
  return (
    <section className={`all-skills panel-card build-skill-panel ${simulation ? "simulation-skills" : ""}`}>
      <div className="panel-title">{simulation ? "All Skills · After Change (PoB2 일부 결과)" : "All Skills · poe.ninja 참고값"}</div>
      {character?.skills && character.skills.length > 0 && (
        <div className="actual-skill-note">{character.skills.length} SKILL SETS</div>
      )}
      <div className="skill-list">
        {uiSkills.map((skill, idx) => (
          <article className="skill-row" key={`${skill.name}-${idx}`}>
            <SkillIcon skill={skill} />
            <div className="skill-copy"><strong>{skill.name}</strong><span>{skill.support}</span></div>
            <b>{skill.dps}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function ItemHoverCard({ item, x, y }: { item: ImportedItem; x: number; y: number }) {
  const name = item.name || item.baseType || "Unknown Item";
  const rarity = (item.rarity || "Normal").toLowerCase();
  return (
    <aside className={`item-hover-card rarity-${rarity}`} style={{ left: x, top: y }} aria-hidden="true">
      <div className="item-hover-name">{name}</div>
      {item.baseType && item.baseType !== name && <div className="item-hover-base">{item.baseType}</div>}
      <div className="item-hover-meta">
        {item.rarity && <span>{item.rarity}</span>}
        {item.itemLevel !== undefined && <span>Item Level {item.itemLevel}</span>}
        {item.quality && <span>Quality {item.quality}</span>}
        {item.slot && <span>{item.slot}</span>}
      </div>
      {item.mods.length > 0 ? (
        <div className="item-hover-mods">
          {item.mods.map((mod, idx) => <div key={`${mod}-${idx}`}>{mod}</div>)}
        </div>
      ) : (
        <div className="item-hover-empty">표시할 옵션 정보가 없습니다.</div>
      )}
    </aside>
  );
}

type UiSkill = { name: string; support: string; dps: string; tone: string; icon?: string };

function toUiSkill(skill: ImportedSkill): UiSkill {
  return {
    name: skill.name,
    support: skill.supports.join(" · ") || "연결된 서포트젬 없음",
    dps: skill.dps ?? (skill.dpsValue !== undefined ? Math.round(skill.dpsValue).toLocaleString("en-US") : "Utility"),
    tone: "gold",
    icon: skill.icon,
  };
}

function SkillIcon({ skill }: { skill: UiSkill }) {
  if (skill.icon) {
    return <div className="skill-icon image"><img src={skill.icon} alt="" draggable={false} /></div>;
  }
  return <div className={`skill-icon ${skill.tone}`}>{skill.name.slice(0, 1)}</div>;
}

function StatsCard({
  title,
  stats,
  mainSkills,
}: {
  title: string;
  stats: ImportedCharacterStat[];
  mainSkills: UiSkill[];
}) {
  const groups = [
    { key: "overview", label: "CHARACTER" },
    { key: "defence", label: "DEFENSIVE" },
    { key: "survival", label: "SURVIVAL" },
    { key: "recovery", label: "RECOVERY" },
  ];

  return (
    <section className="stats-card panel-card">
      <div className="panel-title">{title}</div>
      <div className="stats-scroll">
        {stats.length ? groups.map((group) => {
          const rows = stats.filter((stat) => stat.group === group.key);
          if (!rows.length) return null;
          return (
            <div className="stat-group" key={group.key}>
              <div className="stat-group-label">{group.label}</div>
              {rows.map((stat) => (
                <StatRow key={stat.key} name={stat.label} value={stat.value} />
              ))}
            </div>
          );
        }) : (
          <div className="stats-empty">No character stats received from poe.ninja.</div>
        )}
      </div>
      <div className="main-skills-block">
        <div className="stat-group-label">MAIN SKILLS · 현재 선택한 세트의 PoB2 실계산</div>
        {!mainSkills.length && <div className="stats-empty">이 세트에서 검증된 메인 스킬 DPS가 없습니다.</div>}
        {mainSkills.map((skill) => (
          <div className="main-skill" key={skill.name}>
            <SkillIcon skill={skill} />
            <div>
              <strong>{skill.name}</strong>
              <span>{skill.support}</span>
            </div>
            <b>{skill.dps}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatRow({ name, value, cls }: { name: string; value: string; cls?: string }) {
  return (
    <div className={`stat-row ${cls || ""}`}>
      <span>{name}</span>
      <b>{value}</b>
    </div>
  );
}
