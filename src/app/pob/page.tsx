"use client";

import { FormEvent, MouseEvent, ReactNode, useMemo, useState } from "react";
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
      : ["weapon2", "mainhand2", "mainweapon2"].includes(key);
  }
  return set === 1
    ? ["offhand", "offhand1", "shield", "shield1"].includes(key)
    : ["offhand2", "shield2"].includes(key);
}

export default function Home() {
  const [screen, setScreen] = useState<"landing" | "game">("landing");
  const [ninjaUrl, setNinjaUrl] = useState("");
  const [importedCharacter, setImportedCharacter] = useState<ImportedCharacter | null>(null);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<ImportedItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 24, y: 24 });
  const [weaponSet, setWeaponSet] = useState<1 | 2>(1);
  const [simulationWeaponSet, setSimulationWeaponSet] = useState<1 | 2>(1);
  const [simulationLinks, setSimulationLinks] = useState<Record<string, string>>({});
  const [simulationSlot, setSimulationSlot] = useState<string | null>(null);
  const [simulationDraft, setSimulationDraft] = useState("");
  const [simulationError, setSimulationError] = useState("");
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
      setImportedCharacter(payload.character as ImportedCharacter);
      setWeaponSet(1);
      setSimulationWeaponSet(1);
      setSimulationLinks({});
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
    setSimulationDraft(simulationLinks[slot] ?? "");
    setSimulationError("");
  }

  function saveSimulationLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!simulationSlot) return;
    try {
      const parsed = new URL(simulationDraft.trim());
      const host = parsed.hostname.toLowerCase();
      if (parsed.protocol !== "https:" || !(host === "pathofexile.com" || host.endsWith(".pathofexile.com"))) {
        throw new Error("Path of Exile HTTPS trade link only.");
      }
      setSimulationLinks((current) => ({ ...current, [simulationSlot]: parsed.toString() }));
      setSimulationSlot(null);
      setSimulationDraft("");
      setSimulationError("");
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : "Invalid trade link.");
    }
  }

  function clearSimulationLink(slot: string) {
    setSimulationLinks((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
    if (simulationSlot === slot) {
      setSimulationSlot(null);
      setSimulationDraft("");
      setSimulationError("");
    }
  }

  if (screen === "game") {
    const changedCount = Object.keys(simulationLinks).length;
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

            <section className="build-half current-build">
              <div className="build-half-label">
                <div><small>ORIGINAL BUILD</small><strong>CURRENT CHARACTER</strong></div>
                <span>poe.ninja imported state · read only</span>
              </div>
              <div className="character-grid">
                <EquipmentPanel
                  character={importedCharacter}
                  weaponSet={weaponSet}
                  setWeaponSet={setWeaponSet}
                  onHover={moveItemTooltip}
                  onLeave={() => setHoveredItem(null)}
                />
                <StatsCard title="Stats" stats={actualStats} mainSkills={mainSkills} />
              </div>
              <SkillsPanel character={importedCharacter} />
            </section>

            <div className="simulation-divider" role="separator">
              <div className="simulation-divider-line" />
              <div className="simulation-divider-copy">
                <small>VIRTUAL EQUIPMENT TEST</small>
                <strong>SIMULATION / CHANGED BUILD</strong>
                <span>아래 장비 슬롯을 클릭해 거래소 링크를 넣으면 이 영역만 변경됩니다.</span>
              </div>
              <div className="simulation-divider-line" />
            </div>

            <section className="build-half simulation-build">
              <div className="build-half-label simulation-label">
                <div><small>AFTER CHANGE</small><strong>SIMULATION</strong></div>
                <span>{changedCount ? `${changedCount} SLOT${changedCount > 1 ? "S" : ""} LINKED` : "No equipment changed yet"}</span>
              </div>
              <div className="character-grid">
                <EquipmentPanel
                  character={importedCharacter}
                  weaponSet={simulationWeaponSet}
                  setWeaponSet={setSimulationWeaponSet}
                  onHover={moveItemTooltip}
                  onLeave={() => setHoveredItem(null)}
                  simulation
                  linkedSlots={simulationLinks}
                  activeSlot={simulationSlot}
                  onSlotClick={openSimulationSlot}
                  onClearSlot={clearSimulationLink}
                >
                  {simulationSlot && (
                    <form className="simulation-link-editor" onSubmit={saveSimulationLink}>
                      <div className="simulation-link-head">
                        <div><small>TRADE ITEM</small><strong>{simulationSlot.toUpperCase()}</strong></div>
                        <button type="button" onClick={() => setSimulationSlot(null)}>×</button>
                      </div>
                      <input
                        autoFocus
                        type="url"
                        inputMode="url"
                        placeholder="https://www.pathofexile.com/trade2/..."
                        value={simulationDraft}
                        onChange={(event) => setSimulationDraft(event.target.value)}
                      />
                      <div className="simulation-link-actions">
                        <span>{simulationError || "Paste the trade item link for this slot."}</span>
                        <button type="submit">APPLY LINK</button>
                      </div>
                    </form>
                  )}
                </EquipmentPanel>
                <StatsCard title="Stats · After Change" stats={actualStats} mainSkills={mainSkills} />
              </div>
              <SkillsPanel character={importedCharacter} simulation />
              <div className="simulation-stage-note">
                <b>UI STEP COMPLETE</b>
                <span>현재는 아래 슬롯별 거래소 링크 입력/보존까지 연결되어 있습니다. 거래소 아이템 파싱과 Stats/DPS 재계산은 다음 단계에서 연결합니다.</span>
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
                  placeholder="https://poe.ninja/poe2/builds/.../character/.../..."
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
                <small>거래소의 원하는 매물을 Export해 Simulation 장비로 가져옵니다.</small>
                <button type="button" disabled title="확장프로그램 제작 후 다운로드를 연결합니다.">설치 준비 중</button>
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


function EquipmentPanel({
  character,
  weaponSet,
  setWeaponSet,
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
  setWeaponSet: (set: 1 | 2) => void;
  onHover: (event: MouseEvent<HTMLElement>, item: ImportedItem) => void;
  onLeave: () => void;
  simulation?: boolean;
  linkedSlots?: Record<string, string>;
  activeSlot?: string | null;
  onSlotClick?: (slot: string) => void;
  onClearSlot?: (slot: string) => void;
  children?: ReactNode;
}) {
  return (
    <section className={`equipment-card panel-card ${simulation ? "simulation-equipment" : ""}`}>
      <div className="panel-title">{simulation ? "Equipment · Simulation" : "Equipment"}</div>
      <div className="equipment-stage">
        <div className="weapon-set-toggle weapon-set-toggle-left" aria-label="왼쪽 무기 세트 선택">
          <button type="button" className={weaponSet === 1 ? "active" : ""} onClick={() => setWeaponSet(1)}>I</button>
          <button type="button" className={weaponSet === 2 ? "active" : ""} onClick={() => setWeaponSet(2)}>II</button>
        </div>
        <div className="weapon-set-toggle weapon-set-toggle-right" aria-label="오른쪽 무기 세트 선택">
          <button type="button" className={weaponSet === 1 ? "active" : ""} onClick={() => setWeaponSet(1)}>I</button>
          <button type="button" className={weaponSet === 2 ? "active" : ""} onClick={() => setWeaponSet(2)}>II</button>
        </div>
        {equipment.map((item) => {
          const importedItem = character?.items?.find((candidate) =>
            item.cls === "weapon" || item.cls === "offhand"
              ? weaponSlotMatches(item.cls, weaponSet, candidate.slot)
              : slotMatches(item.cls, candidate.slot)
          );
          const displayName = importedItem?.name || importedItem?.baseType;
          const linked = Boolean(linkedSlots[item.cls]);
          return (
            <div className={`equipment-slot-wrap ${item.cls}`} key={item.cls}>
              <button
                type="button"
                className={`equipment-slot-inner ${importedItem ? "loaded" : ""} ${linked ? "trade-linked" : ""} ${activeSlot === item.cls ? "editing" : ""}`}
                aria-label={simulation ? `${item.label} 거래소 링크 입력` : `${displayName ?? item.label} 상세 보기`}
                onClick={() => simulation && onSlotClick?.(item.cls)}
                onMouseEnter={(event) => !linked && importedItem && onHover(event, importedItem)}
                onMouseMove={(event) => !linked && importedItem && onHover(event, importedItem)}
                onMouseLeave={onLeave}
              >
                {linked ? (
                  <div className="trade-slot-copy">
                    <small>TRADE ITEM</small>
                    <strong>LINKED</strong>
                    <span>{item.label}{item.sub ? ` ${item.sub}` : ""}</span>
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

function SkillsPanel({ character, simulation = false }: { character: ImportedCharacter | null; simulation?: boolean }) {
  const uiSkills = character?.skills?.length ? character.skills.map(toUiSkill) : skills;
  return (
    <section className={`all-skills panel-card build-skill-panel ${simulation ? "simulation-skills" : ""}`}>
      <div className="panel-title">{simulation ? "All Skills · After Change" : "All Skills"}</div>
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
        <div className="stat-group-label">MAIN SKILLS</div>
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
