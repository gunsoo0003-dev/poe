"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  EXCEPTIONAL_GROUPS,
  WAYSTONE_GROUPS,
  UNIQUE_GROUPS,
  UNIQUE_ARMOUR_GROUPS,
  OTHER_UNIQUE_GROUPS,
  TABLET_GROUPS,
  JEWEL_GROUPS,
  FLASK_GROUPS,
  CHARM_GROUPS,
  MISC_GROUPS,
  CURRENCY_GROUPS,
  ESSENCE_GROUPS,
  DELIRIUM_GROUPS,
  BREACH_GROUPS,
  ABYSS_GROUPS,
  ATZIRI_GROUPS,
  FRAGMENT_GROUPS,
  RUNE_GROUPS,
  RITUAL_GROUPS,
  SOUL_CORE_GROUPS,
  IDOL_GROUPS,
  UNCUT_GEM_GROUPS,
  EXPEDITION_GROUPS,
  LINEAGE_GEM_GROUPS,
  GEAR_CATEGORIES,
  NORMAL_GEAR_GROUPS,
  NORMAL_ITEM_LEVEL_RULES,
  RARE_GEAR_IMPORTANCE_OPTIONS,
  MAGIC_GEAR_IMPORTANCE_OPTIONS,
  NORMAL_GEAR_IMPORTANCE_OPTIONS,
  IMPORTANCE_OPTIONS,
  NEVER_SINK,
  NEVER_SINK_STRICTNESSES,
  RARE_TIERS,
  MAGIC_TIERS,
  SKILL_GEM_LEVELS,
  SPIRIT_GEM_LEVELS,
  type FilterItem,
  type ImportanceFamily,
  type ItemGroup,
  type NeverSinkStrictnessId,
} from "./filterData";
import { loadNeverSinkBase } from "./neversinkBase";
import { createFilterPackageZip, type FilterSoundAsset } from "./customSoundPackage";
import {
  buildCustomizedFilter,
  defaultExportBaseName,
  sanitizeExportBaseName,
  type ExportSoundDescriptor,
} from "./filterExport";

type SectionId = "exceptional" | "rare" | "magic" | "normal" | "waystones" | "unique-armour" | "unique" | "other-unique" | "tablets" | "jewels" | "flasks" | "charms" | "currency" | "essence" | "delirium" | "breach" | "abyss" | "atziri" | "fragments" | "runes" | "ritual" | "soulcores" | "idols" | "uncutgems" | "expedition" | "gems" | "misc";
type ItemState = { enabled: boolean; importance: string };
type TierState = { enabled: boolean; importance: string };
type NormalLevelState = { enabled: boolean; importance: string };
type GearPreviewState = { kind: "tier" | "normal" | "normal-level"; rarity: "Rare" | "Magic" | "Normal"; id: string; label: string; note: string; enabled: boolean; importance: string };
type BuiltInSoundChoice = "default" | "masitda" | "oishie" | "divine-power";
type UserSoundChoice = `user:${string}`;
type SoundChoice = BuiltInSoundChoice | UserSoundChoice;
type UserCustomSound = {
  id: string;
  file: File;
  safeName: string;
  originalName: string;
  duration: number;
  size: number;
  objectUrl: string;
};

type NeverSinkBaselineStatus = "show" | "hide" | "conditional" | "missing";
type NeverSinkBaselineEntry = {
  status: NeverSinkBaselineStatus;
  enabled?: boolean;
  matches: number;
  tiers?: string[];
  tags?: string[];
  sounds?: string[];
  importance?: string;
};
type NeverSinkBaselineBundle = {
  items: Record<string, NeverSinkBaselineEntry>;
  normal: Record<string, NeverSinkBaselineEntry>;
  ruleCount: number;
};

type LocalPresetPayload = {
  schema: 1;
  strictness: NeverSinkStrictnessId;
  neverSinkVersion: string;
  savedAt: string;
  itemState: Record<string, ItemState>;
  skillGems: Record<string, boolean>;
  spiritGems: Record<string, boolean>;
  normalGear: Record<string, boolean>;
  magicGear: Record<string, boolean>;
  rareGear: Record<string, boolean>;
  normalGearImportance: Record<string, string>;
  normalLevelRules: Record<string, NormalLevelState>;
  rareTiers: Record<string, TierState>;
  magicTiers: Record<string, TierState>;
  soundState: Record<string, SoundChoice>;
};

type LocalPresetMeta = Pick<LocalPresetPayload, "neverSinkVersion" | "savedAt">;
type EditSource = "original" | "preset";

const presetStorageKey = (strictness: NeverSinkStrictnessId) => `fixlgs-poe2-preset:${strictness}`;

type InstallDirectoryHandle = {
  name: string;
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob | string) => Promise<void>; close: () => Promise<void> }>;
  }>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<{
    getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
      createWritable: () => Promise<{ write: (data: Blob | string) => Promise<void>; close: () => Promise<void> }>;
    }>;
  }>;
};

const INSTALL_FOLDER_DB = "fixlgs-poe2-install";
const INSTALL_FOLDER_STORE = "handles";
const INSTALL_FOLDER_KEY = "poe2-folder";
const LAST_PRESET_TARGET_KEY = "fixlgs-poe2-last-preset-target";

function openInstallFolderDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INSTALL_FOLDER_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INSTALL_FOLDER_STORE)) db.createObjectStore(INSTALL_FOLDER_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("설치 폴더 저장소를 열 수 없습니다."));
  });
}

async function loadInstallDirectory(): Promise<InstallDirectoryHandle | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openInstallFolderDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(INSTALL_FOLDER_STORE, "readonly");
      const request = tx.objectStore(INSTALL_FOLDER_STORE).get(INSTALL_FOLDER_KEY);
      request.onsuccess = () => resolve((request.result as InstallDirectoryHandle | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("설치 폴더를 불러올 수 없습니다."));
    });
  } finally { db.close(); }
}

async function saveInstallDirectory(handle: InstallDirectoryHandle) {
  const db = await openInstallFolderDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(INSTALL_FOLDER_STORE, "readwrite");
      tx.objectStore(INSTALL_FOLDER_STORE).put(handle, INSTALL_FOLDER_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("설치 폴더를 저장할 수 없습니다."));
    });
  } finally { db.close(); }
}

async function requestInstallPermission(handle: InstallDirectoryHandle) {
  if (!handle.queryPermission) return true;
  const current = await handle.queryPermission({ mode: "readwrite" });
  if (current === "granted") return true;
  if (!handle.requestPermission) return false;
  return (await handle.requestPermission({ mode: "readwrite" })) === "granted";
}

const BASELINE_LABELS: Record<NeverSinkBaselineStatus, string> = {
  show: "NS 표시",
  hide: "NS 숨김",
  conditional: "NS 조건부",
  missing: "NS 매칭 없음",
};

// 웹 체크박스는 NeverSink의 기본/plain Show/Hide를 그대로 따른다.
// conditional은 제3상태가 아니라 NS 조건 정보이며, 실제 체크값은 entry.enabled가 결정한다.
// 사용자가 체크/비체크를 바꾸면 export에서 그 값이 1:1 Show/Hide override가 된다.
// FIXLGS 가상 규칙은 별도 초기화 함수에서 계속 OFF를 유지한다.
function baselineEnabled(entry?: NeverSinkBaselineEntry): boolean {
  if (!entry) return false;
  if (typeof entry.enabled === "boolean") return entry.enabled;
  return entry.status === "show" || entry.status === "conditional";
}


function baselineTierLabel(entry?: NeverSinkBaselineEntry): string {
  if (!entry?.tiers?.length) return "";
  return entry.tiers.join(" / ");
}

function effectiveImportance(customImportance: string, baseline?: NeverSinkBaselineEntry): string {
  return customImportance === "default" ? (baseline?.importance ?? "default") : customImportance;
}

const CUSTOM_SOUND_MAX_BYTES = 2 * 1024 * 1024;
const CUSTOM_SOUND_MAX_DURATION = 15;
const CUSTOM_SOUND_RECOMMENDED_DURATION = "1~5초";

const SECTION_META: Array<{
  id: SectionId;
  label: string;
  ko: string;
  description: string;
}> = [
  { id: "exceptional", label: "EXCEPTIONAL", ko: "특출난", description: "과퀄리티·과소켓 드롭만 단순하게 8종으로 관리합니다. 고유/레어/매직/일반을 각각 2개로 분리하며, 이중타락·Vaal 고유·찬싱 베이스 전용 추가 예외는 커스텀하지 않고 NeverSink 0-SOFT 원본 규칙을 그대로 유지합니다." },
  { id: "rare", label: "RARE", ko: "레어 장비", description: "FIXLGS 단계 필터입니다. 단계와 장비 종류를 각각 선택하며, 둘 다 하나 이상 선택되면 커스텀 모드가 켜집니다. 그때는 선택한 단계 × 선택한 종류만 표시하고 나머지 일반 레어는 숨깁니다. 특출난 등 상위 NeverSink 규칙은 그대로 유지합니다." },
  { id: "magic", label: "MAGIC", ko: "매직 장비", description: "FIXLGS 단계 필터입니다. 단계와 장비 종류를 각각 선택하며, 둘 다 하나 이상 선택되면 커스텀 모드가 켜집니다. 그때는 선택한 단계 × 선택한 종류만 표시하고 나머지 일반 매직은 숨깁니다. 특출난 등 상위 NeverSink 규칙은 그대로 유지합니다." },
  { id: "normal", label: "NORMAL", ko: "일반 장비", description: "아이템 레벨 82·81·80·79·78은 최상위 예외 규칙으로 표시/숨김과 중요도를 직접 지정합니다. 그 외 레벨은 NeverSink 0-SOFT의 원본 조건을 유지하며, 아래 BaseType 커스텀은 원본 노출 조건을 바꾸지 않고 표시 여부 또는 중요도/스타일만 변경합니다. 과퀄리티·과소켓은 EXCEPTIONAL에서 별도로 관리합니다." },
  { id: "unique-armour", label: "UNIQUE ARMOUR", ko: "고유 방어구", description: "고유 방어구 219개를 현재 DB 기준 드롭 순간 필터가 구분하는 208개 BaseType으로 통합했습니다. 갑옷·투구·장갑·장화·방패·버클러·집중구로 나누고, 각 항목의 초기 중요도는 NeverSink 0-SOFT 원본 Tier를 그대로 표시합니다." },
  { id: "unique", label: "UNIQUE WEAPONS", ko: "고유 무기", description: "고유 무기 88개를 드롭 순간 필터가 구분하는 81개 BaseType으로 통합했습니다. 각 항목의 초기 중요도는 NeverSink 0-SOFT 원본 Tier를 그대로 표시하며, 원본에서 별도 Tier 매칭이 없는 예외만 NS로 유지합니다." },
  { id: "other-unique", label: "OTHER", ko: "기타 고유", description: "PoE2DB Other 고유 138개 중 이미 전용 카테고리로 관리하는 주얼·플라스크·호신부·서판을 제외했습니다. 남은 유물·화살통·목걸이·반지·허리띠를 같은 BaseType끼리 통합한 49개 항목만 표시합니다." },
  {
    id: "waystones",
    label: "WAYSTONES",
    ko: "경로석",
    description: "경로석 1~16등급을 NeverSink 0-SOFT 2403의 WaystoneTier 규칙에 연결합니다. 각 등급은 원본 표시가 기본이며 변경한 등급만 override 합니다.",
  },
  { id: "tablets", label: "TABLETS", ko: "서판", description: "고유 서판 BaseType 6종 + 일반 서판 8종을 NeverSink 0-SOFT 원본 규칙에 연결합니다. 개별 고유 이름이 아니라 드랍 시 구분 가능한 BaseType 단위로 커스텀합니다." },
  { id: "jewels", label: "JEWELS", ko: "주얼", description: "NeverSink 기준 실제 드랍 시 구분 가능한 주얼 BaseType과 희귀도 규칙을 목록화합니다. 같은 BaseType의 여러 고유 이름은 하나의 드랍 설정으로 처리합니다." },
  { id: "flasks", label: "FLASKS", ko: "플라스크", description: "인게임 플라스크 18종과 고유 플라스크 BaseType 5종을 NeverSink 0-SOFT 0900/2900/3400/3500 규칙에 연결합니다. 개별 고유 이름은 BaseType 단위로 묶습니다." },
  { id: "charms", label: "CHARMS", ko: "호신부", description: "인게임 호신부 아이템 13종과 고유 호신부 BaseType 12종을 NeverSink 0-SOFT 1000/2900/3503 규칙에 연결합니다. 개별 고유 이름이 아니라 드랍 시 구분 가능한 BaseType 단위로 커스텀합니다." },
  { id: "currency", label: "CURRENCY", ko: "화폐", description: "한국 POE2 기준 순수 화폐만 목록으로 정리했습니다. 각 항목은 NeverSink 0-SOFT의 현재 중요도가 먼저 선택되어 있고, 변경한 항목만 override 합니다." },
  { id: "essence", label: "ESSENCE", ko: "에센스", description: "인게임 분류 순서와 명칭을 그대로 사용합니다. NeverSink 0-SOFT 2703의 기본 중요도를 유지하고, 변경한 항목만 override 합니다." },
  { id: "delirium", label: "DELIRIUM", ko: "환영", description: "인게임 환영 분류를 그대로 사용합니다. 환영 전용 아이템과 액체 감정을 NeverSink 원본 규칙에 연결합니다." },
  { id: "breach", label: "BREACH", ko: "균열", description: "인게임 균열 분류를 그대로 사용합니다. 균열 파편·균열석·기폭제·최종 조각을 NeverSink 원본 규칙에 연결합니다." },
  { id: "abyss", label: "ABYSS", ko: "심연", description: "인게임 심연 분류를 그대로 사용합니다. 심연의 뼈·징조·최종 조각·심연의 눈을 NeverSink 원본 규칙에 연결합니다." },
  { id: "atziri", label: "ATZIRI'S TEMPLE", ko: "앗지리의 사원", description: "인게임 앗지리의 사원 분류를 그대로 사용합니다. 사원 화폐와 고대 영혼 핵을 NeverSink 원본 규칙에 연결합니다." },
  { id: "fragments", label: "FRAGMENTS", ko: "조각", description: "인게임 조각 분류를 그대로 사용합니다. 결전 조각·최종 조각·성유물 보관실 열쇠를 NeverSink 원본 규칙에 연결합니다." },
  { id: "runes", label: "RUNES", ko: "룬", description: "인게임 룬 분류와 순서를 그대로 사용합니다. 147개 룬을 NeverSink 0-SOFT 1900 원본 규칙에 연결합니다." },
  { id: "ritual", label: "RITUAL", ko: "의식", description: "인게임 의식 분류를 그대로 사용합니다. 징조·특별 징조·최종 조각·의식 아이템을 NeverSink 원본 규칙에 연결합니다." },
  { id: "soulcores", label: "SOUL CORES", ko: "영혼 핵", description: "인게임 영혼 핵 47개를 NeverSink 0-SOFT 1900의 실제 S/A/B/C 티어에 연결합니다." },
  { id: "idols", label: "IDOLS", ko: "우상", description: "인게임 우상 35개를 NeverSink 0-SOFT의 실제 고정 티어에 연결합니다." },
  { id: "uncutgems", label: "UNCUT GEMS", ko: "미가공 젬", description: "인게임 미가공 젬 42개를 GemLevel 단위로 분리하고 NeverSink 2200의 레벨·지역 조건을 그대로 반영합니다." },
  { id: "expedition", label: "EXPEDITION", ko: "탐험", description: "인게임 탐험 54개를 유동체·탐험·징조·베리시움·합금·별빛 광석 순서로 NeverSink 원본 규칙에 연결합니다." },
  { id: "gems", label: "GEMS", ko: "젬", description: "인게임 젬 카테고리의 혈통 보조 젬 77개를 NeverSink 0-SOFT 원본 중요도에 연결합니다." },
  { id: "misc", label: "MISC", ko: "기타", description: "장비 아이템을 제외하고 마지막으로 직접 커스텀할 가치가 있는 골드와 키류를 모았습니다. 목록 밖 특수 드랍은 NeverSink 0-SOFT 원본 규칙을 그대로 유지합니다." },
];

const ALL_ITEMS = [...EXCEPTIONAL_GROUPS, ...WAYSTONE_GROUPS, ...UNIQUE_ARMOUR_GROUPS, ...UNIQUE_GROUPS, ...OTHER_UNIQUE_GROUPS, ...TABLET_GROUPS, ...JEWEL_GROUPS, ...FLASK_GROUPS, ...CHARM_GROUPS, ...CURRENCY_GROUPS, ...ESSENCE_GROUPS, ...DELIRIUM_GROUPS, ...BREACH_GROUPS, ...ABYSS_GROUPS, ...ATZIRI_GROUPS, ...FRAGMENT_GROUPS, ...RUNE_GROUPS, ...RITUAL_GROUPS, ...SOUL_CORE_GROUPS, ...IDOL_GROUPS, ...UNCUT_GEM_GROUPS, ...EXPEDITION_GROUPS, ...LINEAGE_GEM_GROUPS, ...MISC_GROUPS].flatMap((group) => group.items);

function makeInitialItemState(): Record<string, ItemState> {
  return Object.fromEntries(
    ALL_ITEMS.map((item) => [
      item.id,
      { enabled: true, importance: "default" },
    ]),
  );
}

function makeInitialGemState(prefix: string) {
  return Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`${prefix}-${index + 1}`, true]));
}

function makeInitialGearState(prefix: string) {
  const state: Record<string, boolean> = {};
  GEAR_CATEGORIES.forEach((group) => {
    group.classes.forEach((className) => {
      // Rare/Magic class selectors are FIXLGS convenience rules, not a 1:1 NeverSink baseline.
      // Keep them inactive until the user explicitly enables an override.
      state[`${prefix}:${className}`] = false;
    });
  });
  return state;
}

function makeInitialNormalGearState() {
  return Object.fromEntries(
    NORMAL_GEAR_GROUPS.flatMap((group) => group.items.map((item) => [item.id, true])),
  );
}

function makeInitialNormalImportance() {
  return Object.fromEntries(
    NORMAL_GEAR_GROUPS.flatMap((group) => group.items.map((item) => [item.id, "default"])),
  );
}

function makeInitialNormalLevelState(): Record<string, NormalLevelState> {
  return Object.fromEntries(
    NORMAL_ITEM_LEVEL_RULES.map((rule) => [rule.id, { enabled: false, importance: "default" }]),
  );
}

function ItemToggle({
  item,
  state,
  selected,
  onSelect,
  onToggle,
  onImportance,
  baseline,
  selectedStrictness,
}: {
  item: FilterItem;
  state: ItemState;
  selected: boolean;
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
  onImportance: (importance: string) => void;
  baseline?: NeverSinkBaselineEntry;
  selectedStrictness: NeverSinkStrictnessId;
}) {
  const options = item.family ? IMPORTANCE_OPTIONS[item.family] : [];
  const shownImportance = effectiveImportance(state.importance, baseline);
  return (
    <article
      className={`filter-v2-item-row${selected ? " is-selected" : ""}${!state.enabled ? " is-off" : ""}`}
      onClick={onSelect}
    >
      <label className="filter-v2-switch" onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <span aria-hidden="true" />
      </label>

      <div className="filter-v2-item-name">
        <strong>{item.labelKo ?? item.label}</strong>
        {baseline && (baseline.status !== "conditional" || state.importance === "default") ? (
          <small className={`filter-v2-ns-baseline is-${baseline.status}`} title="선택한 NeverSink 원본 상태">
            {BASELINE_LABELS[baseline.status]}
          </small>
        ) : null}
        {item.uniqueNamesKo?.length ? <small className="filter-v2-unique-names">관련 고유: {item.uniqueNamesKo.join(" / ")}</small> : null}
        {(item.family === "exceptional" || item.family === "currency" || item.family === "waystone" || item.family === "unique" || item.family === "flask" || item.family === "misc") && baseline?.tiers?.length ? (
          <em>
            {selectedStrictness} 원본 {baseline.tiers.join(" / ")}
          </em>
        ) : null}
      </div>

      {state.enabled && item.family ? (
        <div className="filter-v2-importance" onClick={(event) => event.stopPropagation()}>
          <span>중요도</span>
          <div>
            {options
              .filter((option) => option.value !== "dynamic" || item.defaultImportance === "dynamic")
                            .map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={shownImportance === option.value ? "is-active" : ""}
                  title={option.note}
                  onClick={() => onImportance(option.value)}
                >
                  {option.label}
                </button>
              ))}
          </div>
        </div>
      ) : (
        <div className="filter-v2-importance-off">
          {state.enabled ? "NeverSink 기본 유지" : "비활성"}
        </div>
      )}
    </article>
  );
}

function ItemGroups({
  groups,
  itemState,
  selectedId,
  search,
  onSelect,
  onToggle,
  onImportance,
  baselineItems,
  selectedStrictness,
}: {
  groups: ItemGroup[];
  itemState: Record<string, ItemState>;
  selectedId: string;
  search: string;
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onImportance: (id: string, importance: string) => void;
  baselineItems?: Record<string, NeverSinkBaselineEntry>;
  selectedStrictness: NeverSinkStrictnessId;
}) {
  const query = search.trim().toLowerCase();
  return (
    <div className="filter-v2-groups">
      {groups.map((group) => {
        const items = query
          ? group.items.filter((item) =>
              `${item.label} ${item.labelKo ?? ""} ${item.note ?? ""} ${(item.uniqueNamesKo ?? []).join(" ")}`.toLowerCase().includes(query),
            )
          : group.items;
        if (items.length === 0) return null;

        const enabledCount = items.filter((item) => (itemState[item.id]?.enabled ?? baselineEnabled(baselineItems?.[item.id]))).length;
        return (
          <section className="filter-v2-group" key={group.id}>
            <header>
              <div>
                <h2>{group.title}</h2>
                {group.subtitle ? <p>{group.subtitle}</p> : null}
              </div>
              <span>{enabledCount}/{items.length} ACTIVE</span>
            </header>
            <div>
              {items.map((item) => (
                <ItemToggle
                  key={item.id}
                  item={item}
                  state={itemState[item.id] ?? { enabled: baselineEnabled(baselineItems?.[item.id]), importance: "default" }}
                  selected={selectedId === item.id}
                  onSelect={() => onSelect(item.id)}
                  onToggle={(enabled) => onToggle(item.id, enabled)}
                  onImportance={(importance) => onImportance(item.id, importance)}
                  baseline={baselineItems?.[item.id]}
                  selectedStrictness={selectedStrictness}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function FilterCustomizer() {
  const [activeSection, setActiveSection] = useState<SectionId>("exceptional");
  const [selectedStrictness, setSelectedStrictness] = useState<NeverSinkStrictnessId>(NEVER_SINK.strictness);
  const [neverSinkBaseline, setNeverSinkBaseline] = useState<NeverSinkBaselineBundle | null>(null);
  const [neverSinkBaselineError, setNeverSinkBaselineError] = useState("");
  const [itemState, setItemState] = useState<Record<string, ItemState>>({});
  const [skillGems, setSkillGems] = useState<Record<string, boolean>>(() => makeInitialGemState("skill"));
  const [spiritGems, setSpiritGems] = useState<Record<string, boolean>>(() => makeInitialGemState("spirit"));
  const [normalGear, setNormalGear] = useState<Record<string, boolean>>({});
  const [magicGear, setMagicGear] = useState<Record<string, boolean>>(() => makeInitialGearState("magic"));
  const [rareGear, setRareGear] = useState<Record<string, boolean>>(() => makeInitialGearState("rare"));
  const [normalGearImportance, setNormalGearImportance] = useState<Record<string, string>>(makeInitialNormalImportance);
  const [normalLevelRules, setNormalLevelRules] = useState<Record<string, NormalLevelState>>(makeInitialNormalLevelState);
  const [rareTiers, setRareTiers] = useState<Record<string, TierState>>(() =>
    Object.fromEntries(RARE_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])),
  );
  const [magicTiers, setMagicTiers] = useState<Record<string, TierState>>(() =>
    Object.fromEntries(MAGIC_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])),
  );
  const [gearPreview, setGearPreview] = useState<GearPreviewState | null>(null);
  const [selectedId, setSelectedId] = useState(EXCEPTIONAL_GROUPS[0].items[0].id);
  const [search, setSearch] = useState("");
  const [soundState, setSoundState] = useState<Record<string, SoundChoice>>({});
  const [soundMessage, setSoundMessage] = useState("");
  const [customSounds, setCustomSounds] = useState<UserCustomSound[]>([]);
  const [customSoundMessage, setCustomSoundMessage] = useState("");
  const [customSoundBusy, setCustomSoundBusy] = useState(false);
  const customSoundInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [exportBaseName, setExportBaseName] = useState(() => defaultExportBaseName(NEVER_SINK.strictness));
  const [exportBusy, setExportBusy] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [installFolderName, setInstallFolderName] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadInstallDirectory().then((handle) => { if (!cancelled && handle) setInstallFolderName(handle.name); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const [presetMeta, setPresetMeta] = useState<LocalPresetMeta | null>(null);
  const [presetAvailability, setPresetAvailability] = useState<Partial<Record<NeverSinkStrictnessId, LocalPresetMeta>>>({});
  const [presetMessage, setPresetMessage] = useState("");
  const [editSource, setEditSource] = useState<EditSource>("original");
  const pendingPresetLoadRef = useRef<NeverSinkStrictnessId | null>(null);
  const rareTiersRef = useRef(rareTiers);
  const magicTiersRef = useRef(magicTiers);
  const rareGearRef = useRef(rareGear);
  const magicGearRef = useRef(magicGear);
  const soundStateRef = useRef(soundState);
  const hasRestoredLastPresetRef = useRef(false);

  useEffect(() => { rareTiersRef.current = rareTiers; }, [rareTiers]);
  useEffect(() => { magicTiersRef.current = magicTiers; }, [magicTiers]);
  useEffect(() => { rareGearRef.current = rareGear; }, [rareGear]);
  useEffect(() => { magicGearRef.current = magicGear; }, [magicGear]);
  useEffect(() => { soundStateRef.current = soundState; }, [soundState]);

  // Restore the last explicitly saved/installed preset after a reload.
  // The preset itself remains the source of truth; this key only remembers which fixed slot to reopen.
  useEffect(() => {
    if (hasRestoredLastPresetRef.current) return;
    hasRestoredLastPresetRef.current = true;
    try {
      const strictness = window.localStorage.getItem(LAST_PRESET_TARGET_KEY) as NeverSinkStrictnessId | null;
      if (!strictness || !NEVER_SINK_STRICTNESSES.some((option) => option.id === strictness)) return;
      const raw = window.localStorage.getItem(presetStorageKey(strictness));
      if (!raw) return;
      pendingPresetLoadRef.current = strictness;
      setEditSource("original");
      setSelectedStrictness(strictness);
    } catch {
      // If storage is unavailable, continue with the normal NeverSink original target.
    }
  }, []);

  useEffect(() => {
    setExportBaseName(defaultExportBaseName(selectedStrictness));
    setExportMessage("");
  }, [selectedStrictness]);

  useEffect(() => {
    setPresetMessage("");
    const availability: Partial<Record<NeverSinkStrictnessId, LocalPresetMeta>> = {};
    NEVER_SINK_STRICTNESSES.forEach((option) => {
      try {
        const raw = window.localStorage.getItem(presetStorageKey(option.id));
        if (!raw) return;
        const parsed = JSON.parse(raw) as LocalPresetPayload;
        if (parsed?.schema !== 1 || parsed.strictness !== option.id) return;
        availability[option.id] = { neverSinkVersion: parsed.neverSinkVersion, savedAt: parsed.savedAt };
      } catch {
        // Ignore a broken local slot and leave it unavailable.
      }
    });
    setPresetAvailability(availability);
    setPresetMeta(availability[selectedStrictness] ?? null);
  }, [selectedStrictness]);

  useEffect(() => {
    let cancelled = false;
    setNeverSinkBaselineError("");
    fetch(`/neversink/${NEVER_SINK.version}/baseline/${selectedStrictness}.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`baseline ${response.status}`);
        return response.json() as Promise<NeverSinkBaselineBundle>;
      })
      .then((data) => {
        if (cancelled) return;

        // V126 source-of-truth rule:
        // fetching/re-fetching NeverSink data NEVER mutates user editor state.
        // This is essential in React development/StrictMode where effects may run again.
        // Target switching explicitly clears overrides before selectedStrictness changes,
        // and a pending preset is applied only after the requested baseline arrives.
        setNeverSinkBaseline(data);

        const pending = pendingPresetLoadRef.current;
        if (pending === selectedStrictness) {
          pendingPresetLoadRef.current = null;
          try {
            const raw = window.localStorage.getItem(presetStorageKey(selectedStrictness));
            if (!raw) throw new Error("NO_PRESET");
            const payload = JSON.parse(raw) as LocalPresetPayload;
            if (payload?.schema !== 1 || payload.strictness !== selectedStrictness) throw new Error("INVALID_PRESET");

            const presetItemOverrides = payload.itemState ?? {};
            const presetNormalOverrides = payload.normalGear ?? {};
            const baselineNormalImportance = makeInitialNormalImportance();
            Object.entries(payload.normalGearImportance ?? {}).forEach(([id, importance]) => { baselineNormalImportance[id] = importance; });

            setItemState(presetItemOverrides);
            setSkillGems(payload.skillGems ?? makeInitialGemState("skill"));
            setSpiritGems(payload.spiritGems ?? makeInitialGemState("spirit"));
            setNormalGear(presetNormalOverrides);
            setMagicGear(payload.magicGear ?? makeInitialGearState("magic"));
            setRareGear(payload.rareGear ?? makeInitialGearState("rare"));
            setNormalGearImportance(baselineNormalImportance);
            setNormalLevelRules(payload.normalLevelRules ?? makeInitialNormalLevelState());
            setRareTiers(payload.rareTiers ?? Object.fromEntries(RARE_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
            setMagicTiers(payload.magicTiers ?? Object.fromEntries(MAGIC_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
            setSoundState(Object.fromEntries(Object.entries(payload.soundState ?? {}).map(([key, choice]) => [key, String(choice).startsWith("user:") ? "default" : choice])) as Record<string, SoundChoice>);
            setEditSource("preset");
            setPresetMeta({ neverSinkVersion: payload.neverSinkVersion, savedAt: payload.savedAt });
            const oldVersion = payload.neverSinkVersion !== NEVER_SINK.version;
            setPresetMessage(oldVersion
              ? `저장 커스텀 적용 · 기준 NeverSink ${payload.neverSinkVersion} → 현재 ${NEVER_SINK.version} · 확인 후 다시 저장 권장`
              : `${defaultExportBaseName(selectedStrictness)} 저장 커스텀 적용`);
          } catch {
            setPresetMessage("저장된 커스텀을 불러오지 못했습니다.");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNeverSinkBaseline(null);
          setNeverSinkBaselineError("NeverSink 원본 매핑 데이터를 불러오지 못했습니다.");
        }
      });
    return () => { cancelled = true; };
  }, [selectedStrictness]);

  const section = SECTION_META.find((entry) => entry.id === activeSection) ?? SECTION_META[0];
  const selectedBase = NEVER_SINK_STRICTNESSES.find((entry) => entry.id === selectedStrictness) ?? NEVER_SINK_STRICTNESSES[0];
  const selectedItem = ALL_ITEMS.find((item) => item.id === selectedId);
  // Fast Refresh can preserve itemState from the previous build when a new category is added.
  // Fall back to the item's NeverSink default so newly-added rows always have a live preview immediately.
  const selectedState = selectedItem
    ? itemState[selectedItem.id] ?? { enabled: baselineEnabled(neverSinkBaseline?.items[selectedItem.id]), importance: "default" }
    : undefined;
  const selectedBaseline = selectedItem ? neverSinkBaseline?.items[selectedItem.id] : undefined;
  const defaultSoundForItem = (_item?: FilterItem): SoundChoice => "default";
  const selectedSound: SoundChoice = selectedItem
    ? soundState[selectedItem.id] ?? defaultSoundForItem(selectedItem)
    : "default";

  const gearSoundKey = (preview: GearPreviewState) => {
    if (preview.kind === "tier") return `gear:tier:${preview.rarity.toLowerCase()}:${preview.id}`;
    if (preview.kind === "normal-level") return `gear:normal-level:${preview.id}`;
    return `gear:normal:${preview.id}`;
  };
  const selectedGearSound: SoundChoice = gearPreview
    ? soundState[gearSoundKey(gearPreview)] ?? "default"
    : "default";

  const soundChoiceLabel = (choice: SoundChoice) => {
    if (choice === "default") return "NeverSink 기본 사운드";
    if (choice === "masitda") return "음~ 맛있다";
    if (choice === "oishie") return "OISHIE";
    if (choice === "divine-power") return "DIVINE POWER!";
    return customSounds.find((sound) => `user:${sound.id}` === choice)?.safeName ?? "내 커스텀 사운드";
  };

  const playSound = (src: string, label: string) => {
    audioRef.current?.pause();
    const audio = new Audio(src);
    audioRef.current = audio;
    setSoundMessage(`${label} 재생 중`);
    audio.play().catch(() => setSoundMessage("사운드 파일 연결 대기"));
    audio.onended = () => setSoundMessage("");
  };

  const stopSound = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSoundMessage("");
  };

  const isMp3Signature = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 3) return false;
    const hasId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const scanLimit = Math.min(bytes.length - 1, 65536);
    let hasMpegFrame = false;
    for (let index = 0; index < scanLimit; index += 1) {
      if (bytes[index] === 0xff && (bytes[index + 1] & 0xe0) === 0xe0) {
        hasMpegFrame = true;
        break;
      }
    }
    return hasId3 || hasMpegFrame;
  };

  const getNextCustomSoundName = () => {
    const used = new Set(customSounds.map((sound) => sound.safeName));
    let index = 1;
    while (used.has(`custom_sound_${String(index).padStart(2, "0")}.mp3`)) index += 1;
    return `custom_sound_${String(index).padStart(2, "0")}.mp3`;
  };

  const registerCustomSound = async (file: File) => {
    setCustomSoundMessage("");
    if (!file.name.toLowerCase().endsWith(".mp3")) {
      setCustomSoundMessage("MP3 파일만 등록할 수 있습니다.");
      return;
    }
    if (file.size <= 0 || file.size > CUSTOM_SOUND_MAX_BYTES) {
      setCustomSoundMessage("파일 용량은 2MB 이하만 등록할 수 있습니다.");
      return;
    }
    if (file.type && !["audio/mpeg", "audio/mp3", "audio/x-mp3"].includes(file.type)) {
      setCustomSoundMessage("브라우저가 MP3 오디오로 인식하지 못한 파일입니다.");
      return;
    }

    setCustomSoundBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      if (!isMp3Signature(buffer)) {
        throw new Error("MP3_SIGNATURE");
      }

      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error("AUDIO_CONTEXT");
      const context = new AudioContextClass();
      let decoded: AudioBuffer;
      try {
        decoded = await context.decodeAudioData(buffer.slice(0));
      } finally {
        await context.close().catch(() => undefined);
      }

      if (!Number.isFinite(decoded.duration) || decoded.duration <= 0) throw new Error("DECODE");
      if (decoded.duration > CUSTOM_SOUND_MAX_DURATION) throw new Error("DURATION");

      const safeName = getNextCustomSoundName();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const objectUrl = URL.createObjectURL(file);
      setCustomSounds((current) => [
        ...current,
        {
          id,
          file,
          safeName,
          originalName: file.name,
          duration: decoded.duration,
          size: file.size,
          objectUrl,
        },
      ]);
      setCustomSoundMessage(`${safeName} 등록 완료 · ${decoded.duration.toFixed(1)}초`);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setCustomSoundMessage(
        code === "DURATION"
          ? `재생 시간이 너무 깁니다. ${CUSTOM_SOUND_MAX_DURATION}초 이하 MP3를 사용해 주세요.`
          : code === "MP3_SIGNATURE"
            ? "확장자만 MP3인 파일이거나 MP3 데이터가 손상되었습니다."
            : "브라우저에서 실제 재생 가능한 MP3로 확인되지 않았습니다.",
      );
    } finally {
      setCustomSoundBusy(false);
      if (customSoundInputRef.current) customSoundInputRef.current.value = "";
    }
  };

  const removeCustomSound = (sound: UserCustomSound) => {
    const choice: SoundChoice = `user:${sound.id}`;
    const usedCount = Object.values(soundState).filter((value) => value === choice).length;
    if (usedCount > 0 && !window.confirm(`${usedCount}개 항목에서 사용 중입니다. 삭제하면 해당 항목은 NeverSink 기본 사운드로 돌아갑니다. 계속할까요?`)) return;
    URL.revokeObjectURL(sound.objectUrl);
    setCustomSounds((current) => current.filter((entry) => entry.id !== sound.id));
    setSoundState((current) => {
      const next = { ...current };
      Object.entries(next).forEach(([id, value]) => {
        if (value !== choice) return;
        const item = ALL_ITEMS.find((entry) => entry.id === id);
        if (item?.baseType === "Divine Orb") delete next[id];
        else next[id] = "default";
      });
      return next;
    });
    stopSound();
    setCustomSoundMessage(`${sound.safeName} 삭제 완료`);
  };
  const linkedTabletUniqueItems = (item: FilterItem) => {
    if (item.rarity !== "Unique" || !item.id.startsWith("tu-") || !item.baseType) return [item];
    return TABLET_GROUPS.flatMap((group) => group.items).filter(
      (candidate) => candidate.rarity === "Unique" && candidate.baseType === item.baseType,
    );
  };

  const applySoundChoice = (choice: SoundChoice) => {
    if (!selectedItem) return;
    const linked = linkedTabletUniqueItems(selectedItem);
    setSoundState((current) => {
      const next = { ...current };
      linked.forEach((item) => { next[item.id] = choice; });
      return next;
    });
  };

  const resetSelectedItem = () => {
    if (!selectedItem || !selectedItem.family) return;
    const linked = linkedTabletUniqueItems(selectedItem);
    setItemState((current) => {
      const next = { ...current };
      linked.forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      linked.forEach((item) => { delete next[item.id]; });
      return next;
    });
    stopSound();
  };

  const resetCurrentGear = () => {
    if (!gearPreview) return;
    if (gearPreview.kind === "tier") {
      const isRare = gearPreview.rarity === "Rare";
      const tiers = isRare ? RARE_TIERS : MAGIC_TIERS;
      const setter = isRare ? setRareTiers : setMagicTiers;
      const tier = tiers.find((entry) => entry.id === gearPreview.id);
      if (!tier) return;
      setter((current) => ({
        ...current,
        [tier.id]: { enabled: false, importance: tier.defaultImportance },
      }));
      setGearPreview({ ...gearPreview, enabled: false, importance: tier.defaultImportance });
    } else if (gearPreview.kind === "normal-level") {
      setNormalLevelRules((current) => ({
        ...current,
        [gearPreview.id]: { enabled: false, importance: "default" },
      }));
      setGearPreview({ ...gearPreview, enabled: false, importance: "default" });
    } else {
      const enabled = baselineEnabled(neverSinkBaseline?.normal[gearPreview.id]);
      setNormalGear((current) => ({ ...current, [gearPreview.id]: enabled }));
      setNormalGearImportance((current) => ({ ...current, [gearPreview.id]: "default" }));
      setGearPreview({ ...gearPreview, enabled, importance: "default" });
    }
    setSoundState((current) => {
      const next = { ...current };
      delete next[gearSoundKey(gearPreview)];
      return next;
    });
    stopSound();
  };

  const resetAllRare = () => {
    if (!window.confirm("레어 장비의 변경사항을 현재 NeverSink 기준으로 되돌리고, FIXLGS 가상 단계 규칙은 비활성화할까요?")) return;
    setRareTiers(Object.fromEntries(RARE_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
    setRareGear(makeInitialGearState("rare"));
    setSoundState((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !id.startsWith("gear:tier:rare:"))));
    const tier = RARE_TIERS[0];
    setGearPreview({ kind: "tier", rarity: "Rare", id: tier.id, label: tier.label, note: tier.note, enabled: false, importance: tier.defaultImportance });
    stopSound();
  };

  const resetAllMagic = () => {
    if (!window.confirm("매직 장비의 변경사항을 현재 NeverSink 기준으로 되돌리고, FIXLGS 가상 단계 규칙은 비활성화할까요?")) return;
    setMagicTiers(Object.fromEntries(MAGIC_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
    setMagicGear(makeInitialGearState("magic"));
    setSoundState((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !id.startsWith("gear:tier:magic:"))));
    const tier = MAGIC_TIERS[0];
    setGearPreview({ kind: "tier", rarity: "Magic", id: tier.id, label: tier.label, note: tier.note, enabled: false, importance: tier.defaultImportance });
    stopSound();
  };

  const resetAllNormal = () => {
    if (!window.confirm("일반 장비의 변경사항을 현재 NeverSink 기준으로 되돌리고, FIXLGS 가상 레벨 규칙은 비활성화할까요?")) return;
    setNormalGear(Object.fromEntries(
      NORMAL_GEAR_GROUPS.flatMap((group) => group.items.map((item) => [item.id, baselineEnabled(neverSinkBaseline?.normal[item.id])])),
    ));
    setNormalGearImportance(makeInitialNormalImportance());
    setNormalLevelRules(makeInitialNormalLevelState());
    setSoundState((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !id.startsWith("gear:normal:") && !id.startsWith("gear:normal-level:"))));
    const group = NORMAL_GEAR_GROUPS.find((entry) => entry.items.length > 0);
    const base = group?.items[0];
    setGearPreview(base && group ? { kind: "normal", rarity: "Normal", id: base.id, label: base.labelKo, note: `${group.labelKo} · 드롭 BaseType`, enabled: baselineEnabled(neverSinkBaseline?.normal[base.id]), importance: "default" } : null);
    stopSound();
  };

  const resetAllExceptional = () => {
    if (!window.confirm("특출난 8종의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      EXCEPTIONAL_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      EXCEPTIONAL_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllWaystones = () => {
    if (!window.confirm("경로석의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      WAYSTONE_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      WAYSTONE_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllUniqueArmour = () => {
    if (!window.confirm("고유 방어구의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      UNIQUE_ARMOUR_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      UNIQUE_ARMOUR_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllUnique = () => {
    if (!window.confirm("고유 무기의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      UNIQUE_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      UNIQUE_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllOtherUnique = () => {
    if (!window.confirm("기타 고유의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      OTHER_UNIQUE_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      OTHER_UNIQUE_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllTablets = () => {
    if (!window.confirm("서판의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      TABLET_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      TABLET_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllJewels = () => {
    if (!window.confirm("주얼의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      JEWEL_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      JEWEL_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllFlasks = () => {
    if (!window.confirm("플라스크의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      FLASK_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      FLASK_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllCharms = () => {
    if (!window.confirm("호신부의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      CHARM_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      CHARM_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllMisc = () => {
    if (!window.confirm("기타의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      MISC_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      MISC_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllCurrency = () => {
    if (!window.confirm("Currency의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;

    setItemState((current) => {
      const next = { ...current };
      CURRENCY_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = {
          enabled: baselineEnabled(neverSinkBaseline?.items[item.id]),
          importance: "default",
        };
      });
      return next;
    });

    setSoundState((current) => {
      const next = { ...current };
      CURRENCY_GROUPS.flatMap((group) => group.items).forEach((item) => {
        delete next[item.id];
      });
      return next;
    });

    stopSound();
  };

  const resetAllEssence = () => {
    if (!window.confirm("에센스의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;

    setItemState((current) => {
      const next = { ...current };
      ESSENCE_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = {
          enabled: baselineEnabled(neverSinkBaseline?.items[item.id]),
          importance: "default",
        };
      });
      return next;
    });

    setSoundState((current) => {
      const next = { ...current };
      ESSENCE_GROUPS.flatMap((group) => group.items).forEach((item) => {
        delete next[item.id];
      });
      return next;
    });

    stopSound();
  };

  const resetAllDelirium = () => {
    if (!window.confirm("환영의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      DELIRIUM_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      DELIRIUM_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllBreach = () => {
    if (!window.confirm("균열의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      BREACH_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      BREACH_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllAbyss = () => {
    if (!window.confirm("심연의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      ABYSS_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      ABYSS_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllAtziri = () => {
    if (!window.confirm("앗지리의 사원의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      ATZIRI_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      ATZIRI_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllFragments = () => {
    if (!window.confirm("조각의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      FRAGMENT_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      FRAGMENT_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllRunes = () => {
    if (!window.confirm("룬의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      RUNE_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      RUNE_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllRitual = () => {
    if (!window.confirm("의식의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      RITUAL_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      RITUAL_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllSoulCores = () => {
    if (!window.confirm("영혼 핵의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      SOUL_CORE_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      SOUL_CORE_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllIdols = () => {
    if (!window.confirm("우상의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      IDOL_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      IDOL_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllUncutGems = () => {
    if (!window.confirm("미가공 젬의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      UNCUT_GEM_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      UNCUT_GEM_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllExpedition = () => {
    if (!window.confirm("탐험의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      EXPEDITION_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      EXPEDITION_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };

  const resetAllLineageGems = () => {
    if (!window.confirm("젬의 모든 변경사항을 현재 선택한 NeverSink 원본 기준으로 되돌릴까요?")) return;
    setItemState((current) => {
      const next = { ...current };
      LINEAGE_GEM_GROUPS.flatMap((group) => group.items).forEach((item) => {
        next[item.id] = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
      });
      return next;
    });
    setSoundState((current) => {
      const next = { ...current };
      LINEAGE_GEM_GROUPS.flatMap((group) => group.items).forEach((item) => delete next[item.id]);
      return next;
    });
    stopSound();
  };


  const triggerBrowserDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const buildSoundDescriptorMap = () => {
    const map: Record<string, ExportSoundDescriptor> = {
      "masitda": { choice: "masitda", filterPath: "FIXLGS_SOUNDS/um-masitda.mp3" },
      "oishie": { choice: "oishie", filterPath: "FIXLGS_SOUNDS/oishie-poe-final.mp3" },
      "divine-power": { choice: "divine-power", filterPath: "FIXLGS_SOUNDS/divine-power.mp3" },
    };
    customSounds.forEach((sound) => {
      map[`user:${sound.id}`] = { choice: `user:${sound.id}`, filterPath: `FIXLGS_SOUNDS/${sound.safeName}` };
    });
    return map;
  };

  const collectSoundAssets = async (choices: string[]): Promise<FilterSoundAsset[]> => {
    const unique = [...new Set(choices)].filter((choice) => choice !== "default");
    const assets: FilterSoundAsset[] = [];
    for (const choice of unique) {
      if (choice === "masitda" || choice === "oishie" || choice === "divine-power") {
        const source = choice === "masitda" ? "/sounds/um-masitda.mp3" : choice === "oishie" ? "/sounds/oishie-poe-final.mp3" : "/sounds/divine-power.mp3";
        const target = choice === "masitda" ? "FIXLGS_SOUNDS/um-masitda.mp3" : choice === "oishie" ? "FIXLGS_SOUNDS/oishie-poe-final.mp3" : "FIXLGS_SOUNDS/divine-power.mp3";
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) throw new Error(`공용 사운드를 불러오지 못했습니다: ${source}`);
        assets.push({ fileName: target, file: await response.blob() });
        continue;
      }
      if (choice.startsWith("user:")) {
        const id = choice.slice(5);
        const custom = customSounds.find((sound) => sound.id === id);
        if (!custom) throw new Error("사용 중인 개인 MP3를 찾을 수 없습니다.");
        assets.push({ fileName: `FIXLGS_SOUNDS/${custom.safeName}`, file: custom.file });
      }
    }
    return assets;
  };

  const buildLocalPresetPayload = (): LocalPresetPayload => {
    const serializableSoundState = Object.fromEntries(
      Object.entries(soundState).map(([key, choice]) => [key, choice.startsWith("user:") ? "default" : choice]),
    ) as Record<string, SoundChoice>;
    return {
      schema: 1,
      strictness: selectedStrictness,
      neverSinkVersion: NEVER_SINK.version,
      savedAt: new Date().toISOString(),
      itemState: { ...itemState },
      skillGems: { ...skillGems },
      spiritGems: { ...spiritGems },
      normalGear: { ...normalGear },
      magicGear: { ...magicGear },
      rareGear: { ...rareGear },
      normalGearImportance: { ...normalGearImportance },
      normalLevelRules: { ...normalLevelRules },
      rareTiers: { ...rareTiers },
      magicTiers: { ...magicTiers },
      soundState: serializableSoundState,
    };
  };

  const persistCurrentPreset = (message = true) => {
    const payload = buildLocalPresetPayload();
    window.localStorage.setItem(presetStorageKey(selectedStrictness), JSON.stringify(payload));
    window.localStorage.setItem(LAST_PRESET_TARGET_KEY, selectedStrictness);
    const meta = { neverSinkVersion: payload.neverSinkVersion, savedAt: payload.savedAt };
    setPresetMeta(meta);
    setPresetAvailability((current) => ({ ...current, [selectedStrictness]: meta }));
    setEditSource("preset");
    if (message) {
      const hadUserSound = Object.values(soundState).some((choice) => choice.startsWith("user:"));
      setPresetMessage(hadUserSound
        ? `${defaultExportBaseName(selectedStrictness)} 저장 완료 · 개인 MP3는 보안상 다시 등록 필요`
        : `${defaultExportBaseName(selectedStrictness)} 저장 완료`);
    }
    return payload;
  };

  const saveLocalPreset = () => {
    try {
      persistCurrentPreset(true);
    } catch {
      setPresetMessage("브라우저 로컬 저장에 실패했습니다.");
    }
  };

  const loadLocalPreset = () => {
    try {
      const raw = window.localStorage.getItem(presetStorageKey(selectedStrictness));
      if (!raw) {
        setPresetMessage("이 단계에 저장된 커스텀이 없습니다.");
        return;
      }
      const payload = JSON.parse(raw) as LocalPresetPayload;
      if (payload?.schema !== 1 || payload.strictness !== selectedStrictness) throw new Error("INVALID_PRESET");
      if (!neverSinkBaseline) {
        setPresetMessage("NeverSink 원본 매핑을 불러온 뒤 다시 시도하세요.");
        return;
      }
      const presetItemOverrides = payload.itemState ?? {};
      const presetNormalOverrides = payload.normalGear ?? {};
      const baselineNormalImportance = makeInitialNormalImportance();
      Object.entries(payload.normalGearImportance ?? {}).forEach(([id, importance]) => { baselineNormalImportance[id] = importance; });

      setItemState(presetItemOverrides);
      setSkillGems(payload.skillGems ?? makeInitialGemState("skill"));
      setSpiritGems(payload.spiritGems ?? makeInitialGemState("spirit"));
      setNormalGear(presetNormalOverrides);
      setMagicGear(payload.magicGear ?? makeInitialGearState("magic"));
      setRareGear(payload.rareGear ?? makeInitialGearState("rare"));
      setNormalGearImportance(baselineNormalImportance);
      setNormalLevelRules(payload.normalLevelRules ?? makeInitialNormalLevelState());
      setRareTiers(payload.rareTiers ?? Object.fromEntries(RARE_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
      setMagicTiers(payload.magicTiers ?? Object.fromEntries(MAGIC_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
      setSoundState(Object.fromEntries(Object.entries(payload.soundState ?? {}).map(([key, choice]) => [key, String(choice).startsWith("user:") ? "default" : choice])) as Record<string, SoundChoice>);
      setGearPreview(null);
      setSelectedId(EXCEPTIONAL_GROUPS[0].items[0].id);
      setExportBaseName(defaultExportBaseName(selectedStrictness));
      const oldVersion = payload.neverSinkVersion !== NEVER_SINK.version;
      setPresetMeta({ neverSinkVersion: payload.neverSinkVersion, savedAt: payload.savedAt });
      setEditSource("preset");
      window.localStorage.setItem(LAST_PRESET_TARGET_KEY, selectedStrictness);
      setPresetMessage(oldVersion
        ? `저장본 불러옴 · 기준 NeverSink ${payload.neverSinkVersion} → 현재 ${NEVER_SINK.version} · 확인 후 다시 저장 권장`
        : `${defaultExportBaseName(selectedStrictness)} 저장본 불러옴`);
    } catch {
      setPresetMessage("저장된 커스텀을 불러오지 못했습니다.");
    }
  };

  const deleteLocalPreset = () => {
    window.localStorage.removeItem(presetStorageKey(selectedStrictness));
    if (window.localStorage.getItem(LAST_PRESET_TARGET_KEY) === selectedStrictness) window.localStorage.removeItem(LAST_PRESET_TARGET_KEY);
    setPresetMeta(null);
    setPresetAvailability((current) => { const next = { ...current }; delete next[selectedStrictness]; return next; });
    if (editSource === "preset") setEditSource("original");
    setPresetMessage(`${defaultExportBaseName(selectedStrictness)} 저장본 삭제 완료`);
  };

  const deleteAllLocalPresets = () => {
    NEVER_SINK_STRICTNESSES.forEach((option) => window.localStorage.removeItem(presetStorageKey(option.id)));
    window.localStorage.removeItem(LAST_PRESET_TARGET_KEY);
    setPresetMeta(null);
    setPresetAvailability({});
    if (editSource === "preset") setEditSource("original");
    setPresetMessage("00~06 로컬 저장본 전체 삭제 완료");
  };

  const prepareExportPayload = async () => {
    const base = await loadNeverSinkBase(selectedStrictness);
    const soundDescriptors = buildSoundDescriptorMap();
    // Snapshot the latest gear/sound state at the exact export click. This avoids a stale
    // render closure ever producing an old Rare/Magic configuration.
    const exportRareTiers = rareTiersRef.current;
    const exportMagicTiers = magicTiersRef.current;
    const exportRareGear = rareGearRef.current;
    const exportMagicGear = magicGearRef.current;
    const exportSoundState = soundStateRef.current;

    const result = buildCustomizedFilter({
      base,
      items: ALL_ITEMS,
      itemState,
      baselineEnabled: (id) => baselineEnabled(neverSinkBaseline?.items[id]),
      baselineStatus: (id) => neverSinkBaseline?.items[id]?.status ?? "missing",
      soundState: exportSoundState,
      soundDescriptors,
      rareTiers: exportRareTiers,
      magicTiers: exportMagicTiers,
      rareGear: exportRareGear,
      magicGear: exportMagicGear,
      normalItems: NORMAL_GEAR_GROUPS.flatMap((group) => group.items),
      normalGear,
      normalBaselineEnabled: (id) => baselineEnabled(neverSinkBaseline?.normal[id]),
      normalBaselineStatus: (id) => neverSinkBaseline?.normal[id]?.status ?? "missing",
      normalBaselineImportance: (id) => neverSinkBaseline?.normal[id]?.importance ?? "default",
      normalImportance: normalGearImportance,
      normalLevelRules,
    });

    const assertGearModeExport = (rarity: "rare" | "magic", tiers: Record<string, TierState>) => {
      const enabled = Object.entries(tiers).filter(([, state]) => state?.enabled);
      if (!enabled.length) return;
      const label = rarity === "rare" ? "RARE" : "MAGIC";
      if (!result.text.includes(`# ===== FIXLGS ${label} MODE =====`)) {
        throw new Error(`${label} 등급 커스텀이 화면에는 켜져 있지만 생성 필터에 반영되지 않았습니다. 다운로드를 중단했습니다.`);
      }
      for (const [id] of enabled) {
        const tier = Number(id.match(/(\d+)$/)?.[1] ?? 0);
        if (!tier) continue;
        if (!result.text.includes(`Show # FIXLGS ${rarity === "rare" ? "Rare" : "Magic"} tier ${tier}`)) {
          throw new Error(`${label} ${tier}등급 규칙 생성 검증에 실패했습니다.`);
        }
        const soundChoice = exportSoundState[`gear:tier:${rarity}:${id}`] ?? "default";
        const descriptor = soundDescriptors[soundChoice];
        if (descriptor && soundChoice !== "default" && !result.text.includes(descriptor.filterPath)) {
          throw new Error(`${label} ${tier}등급 커스텀 사운드가 생성 필터에서 누락되었습니다.`);
        }
      }
    };
    assertGearModeExport("rare", exportRareTiers);
    assertGearModeExport("magic", exportMagicTiers);
    const fallback = defaultExportBaseName(selectedStrictness);
    const safeBaseName = sanitizeExportBaseName(exportBaseName, fallback);
    setExportBaseName(safeBaseName);
    const soundAssets = await collectSoundAssets(result.usedSoundChoices);
    return { result, safeBaseName, soundAssets };
  };

  const handleCustomizedExport = async () => {
    if (exportBusy) return;
    setExportBusy(true);
    setExportMessage("");
    try {
      const { result, safeBaseName, soundAssets } = await prepareExportPayload();
      if (soundAssets.length) {
        const zip = await createFilterPackageZip(result.text, `${safeBaseName}.filter`, soundAssets);
        triggerBrowserDownload(zip, `${safeBaseName}.zip`);
        setExportMessage(`ZIP 생성 완료 · ${safeBaseName}.filter + FIXLGS_SOUNDS`);
      } else {
        triggerBrowserDownload(new Blob([result.text], { type: "text/plain;charset=utf-8" }), `${safeBaseName}.filter`);
        setExportMessage(`필터 생성 완료 · ${safeBaseName}.filter`);
      }
      if (result.notes.length) setExportMessage((current) => `${current} · 검토 ${result.notes.length}건`);
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "필터 생성 중 오류가 발생했습니다.");
    } finally {
      setExportBusy(false);
    }
  };

  const getDirectoryPicker = () => (window as Window & {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<InstallDirectoryHandle>;
  }).showDirectoryPicker;

  const chooseInstallDirectory = async () => {
    const picker = getDirectoryPicker();
    if (!picker) throw new Error("게임 폴더 직접 설치는 Chrome/Edge의 폴더 접근 기능이 필요합니다.");
    const directory = await picker({ mode: "readwrite" });
    if (!(await requestInstallPermission(directory))) throw new Error("선택한 폴더의 쓰기 권한이 필요합니다.");
    return directory;
  };

  const writeInstallPayload = async (
    directory: InstallDirectoryHandle,
    payload: Awaited<ReturnType<typeof prepareExportPayload>>,
  ) => {
    const { result, safeBaseName, soundAssets } = payload;
    const filterHandle = await directory.getFileHandle(`${safeBaseName}.filter`, { create: true });
    const filterWritable = await filterHandle.createWritable();
    await filterWritable.write(new Blob([result.text], { type: "text/plain;charset=utf-8" }));
    await filterWritable.close();

    if (soundAssets.length) {
      const soundDirectory = await directory.getDirectoryHandle("FIXLGS_SOUNDS", { create: true });
      for (const asset of soundAssets) {
        const fileName = asset.fileName.split("/").pop() || asset.fileName;
        const soundHandle = await soundDirectory.getFileHandle(fileName, { create: true });
        const soundWritable = await soundHandle.createWritable();
        await soundWritable.write(asset.file);
        await soundWritable.close();
      }
    }
    return { result, safeBaseName, soundAssets };
  };

  const handleChangeInstallFolder = async () => {
    if (exportBusy) return;
    setExportBusy(true);
    setExportMessage("");
    try {
      // Folder picker must happen directly from the user's click. After choosing a
      // new folder, install the current filter immediately so "change folder" never
      // leaves the user with a remembered path but no file written there.
      const directory = await chooseInstallDirectory();
      const payload = await prepareExportPayload();
      const { result, safeBaseName, soundAssets } = await writeInstallPayload(directory, payload);
      await saveInstallDirectory(directory);
      setInstallFolderName(directory.name);
      persistCurrentPreset(false);
      setExportMessage(`설치 폴더 변경 + 저장 완료 · ${directory.name}\\${safeBaseName}.filter${soundAssets.length ? " + FIXLGS_SOUNDS" : ""}`);
      if (result.notes.length) setExportMessage((current) => `${current} · 검토 ${result.notes.length}건`);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "AbortError") setExportMessage("게임 폴더 선택을 취소했습니다.");
      else setExportMessage(error instanceof Error ? error.message : "설치 폴더 변경 중 오류가 발생했습니다.");
    } finally {
      setExportBusy(false);
    }
  };

  const handleInstallToGameFolder = async () => {
    if (exportBusy) return;
    if (!getDirectoryPicker()) {
      setExportMessage("게임 폴더 직접 설치는 Chrome/Edge의 폴더 접근 기능이 필요합니다. 지원되지 않는 브라우저에서는 ZIP/필터 다운로드를 사용해주세요.");
      return;
    }

    setExportBusy(true);
    setExportMessage("");
    try {
      // Resolve permission/folder first while the click still counts as a user
      // gesture. Only then build the filter and overwrite the remembered folder.
      let directory = await loadInstallDirectory();
      let directoryWasNew = false;
      if (!directory || !(await requestInstallPermission(directory))) {
        directory = await chooseInstallDirectory();
        directoryWasNew = true;
      }
      const payload = await prepareExportPayload();
      const { result, safeBaseName, soundAssets } = await writeInstallPayload(directory, payload);
      if (directoryWasNew) await saveInstallDirectory(directory);
      setInstallFolderName(directory.name);
      persistCurrentPreset(false);

      setExportMessage(`설치 + 설정 저장 완료 · ${directory.name}\\${safeBaseName}.filter${soundAssets.length ? " + FIXLGS_SOUNDS" : ""}`);
      if (result.notes.length) setExportMessage((current) => `${current} · 검토 ${result.notes.length}건`);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "AbortError") setExportMessage("게임 폴더 선택을 취소했습니다.");
      else setExportMessage(error instanceof Error ? error.message : "게임 폴더 설치 중 오류가 발생했습니다.");
    } finally {
      setExportBusy(false);
    }
  };

  const customCount = useMemo(() => {
    const itemChanges = ALL_ITEMS.filter((item) => {
      const state = itemState[item.id];
      if (!state) return false;
      return state.enabled !== baselineEnabled(neverSinkBaseline?.items[item.id]) || state.importance !== "default";
    }).length;
    const soundChanges = Object.values(soundState).filter((sound) => sound !== "default").length;
    const gemChanges =
      Object.values(skillGems).filter((enabled) => !enabled).length +
      Object.values(spiritGems).filter((enabled) => !enabled).length;
    const normalVisibilityChanges = NORMAL_GEAR_GROUPS.flatMap((group) => group.items).filter(
      (item) => (normalGear[item.id] ?? baselineEnabled(neverSinkBaseline?.normal[item.id])) !== baselineEnabled(neverSinkBaseline?.normal[item.id]),
    ).length;
    const rareTierSelections = Object.values(rareTiers).filter((state) => state.enabled).length;
    const magicTierSelections = Object.values(magicTiers).filter((state) => state.enabled).length;
    const rareTypeSelections = Object.values(rareGear).filter(Boolean).length;
    const magicTypeSelections = Object.values(magicGear).filter(Boolean).length;
    const rareModeEnabled = rareTierSelections > 0;
    const magicModeEnabled = magicTierSelections > 0;
    const gearChanges =
      normalVisibilityChanges +
      Object.values(normalGearImportance).filter((importance) => importance !== "default").length +
      Object.values(normalLevelRules).filter((state) => state.enabled || state.importance !== "default").length +
      (rareModeEnabled ? rareTypeSelections : 0) +
      (magicModeEnabled ? magicTypeSelections : 0);
    const rareChanges = rareModeEnabled
      ? Object.values(rareTiers).filter((state) => state.enabled || state.importance !== "default").length
      : 0;
    const magicChanges = magicModeEnabled
      ? Object.values(magicTiers).filter((state) => state.enabled || state.importance !== "default").length
      : 0;
    return itemChanges + soundChanges + gemChanges + gearChanges + rareChanges + magicChanges;
  }, [itemState, soundState, skillGems, spiritGems, normalGear, magicGear, rareGear, normalGearImportance, normalLevelRules, rareTiers, magicTiers, neverSinkBaseline]);

  const editTargetValue = `${editSource}:${selectedStrictness}`;
  const currentEditLabel = editSource === "preset"
    ? `${defaultExportBaseName(selectedStrictness)} 저장 커스텀`
    : customCount > 0
      ? `NeverSink ${selectedStrictness} 원본 · 수정 중`
      : `NeverSink ${selectedStrictness} 원본`;

  const resetCurrentToOriginal = () => {
    if (!neverSinkBaseline) {
      setPresetMessage("NeverSink 원본 매핑을 불러오는 중입니다.");
      return;
    }
    setItemState({});
    setSkillGems(makeInitialGemState("skill"));
    setSpiritGems(makeInitialGemState("spirit"));
    setNormalGear({});
    setMagicGear(makeInitialGearState("magic"));
    setRareGear(makeInitialGearState("rare"));
    setNormalGearImportance(makeInitialNormalImportance());
    setNormalLevelRules(makeInitialNormalLevelState());
    setRareTiers(Object.fromEntries(RARE_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
    setMagicTiers(Object.fromEntries(MAGIC_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
    setSoundState({});
    setGearPreview(null);
    setSelectedId(EXCEPTIONAL_GROUPS[0].items[0].id);
    setExportBaseName(defaultExportBaseName(selectedStrictness));
    setEditSource("original");
    try { window.localStorage.removeItem(LAST_PRESET_TARGET_KEY); } catch {}
    setPresetMessage(`NeverSink ${selectedStrictness} 원본을 편집 대상으로 열었습니다.`);
  };

  const handleEditTargetChange = (value: string) => {
    const [source, ...strictnessParts] = value.split(":");
    const strictness = strictnessParts.join(":") as NeverSinkStrictnessId;
    if ((source !== "original" && source !== "preset") || !NEVER_SINK_STRICTNESSES.some((option) => option.id === strictness)) return;
    if (strictness === selectedStrictness) {
      if (source === "original") {
        if (editSource !== "original" || customCount > 0) {
          if (!window.confirm("현재 화면 설정을 닫고 선택한 NeverSink 원본 상태로 돌아갈까요? 저장하지 않은 변경은 화면에서 사라집니다.")) return;
        }
        resetCurrentToOriginal();
      } else {
        loadLocalPreset();
      }
      return;
    }
    if (customCount > 0 && !window.confirm("현재 화면 설정을 닫고 다른 편집 대상을 열까요? 저장하지 않은 변경은 화면에서 사라집니다.")) return;

    // Switching target is the ONLY place that clears the previous target's overrides.
    // The baseline fetch effect itself must never clear them, otherwise a re-fetch can
    // erase a just-loaded preset (rare/magic tiers, item sounds, etc.).
    setItemState({});
    setSkillGems(makeInitialGemState("skill"));
    setSpiritGems(makeInitialGemState("spirit"));
    setNormalGear({});
    setMagicGear(makeInitialGearState("magic"));
    setRareGear(makeInitialGearState("rare"));
    setNormalGearImportance(makeInitialNormalImportance());
    setNormalLevelRules(makeInitialNormalLevelState());
    setRareTiers(Object.fromEntries(RARE_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
    setMagicTiers(Object.fromEntries(MAGIC_TIERS.map((tier) => [tier.id, { enabled: false, importance: tier.defaultImportance }])));
    setSoundState({});
    setGearPreview(null);
    setSelectedId(EXCEPTIONAL_GROUPS[0].items[0].id);
    pendingPresetLoadRef.current = source === "preset" ? strictness : null;
    if (source === "original") { try { window.localStorage.removeItem(LAST_PRESET_TARGET_KEY); } catch {} }
    setEditSource("original");
    setSelectedStrictness(strictness);
  };

  const updateItem = (id: string, patch: Partial<ItemState>) => {
    const target = ALL_ITEMS.find((item) => item.id === id);
    const linked = target ? linkedTabletUniqueItems(target) : [];
    setItemState((current) => {
      const next = { ...current };
      (linked.length ? linked : target ? [target] : []).forEach((item) => {
        const baselineState: ItemState = { enabled: baselineEnabled(neverSinkBaseline?.items[item.id]), importance: "default" };
        const resolved = { ...(current[item.id] ?? baselineState), ...patch };
        if (resolved.enabled === baselineState.enabled && resolved.importance === "default") delete next[item.id];
        else next[item.id] = resolved;
      });
      return next;
    });
    setSelectedId(id);
  };

  const setGearGroup = (
    prefix: "normal" | "magic" | "rare",
    classes: string[],
    enabled: boolean,
  ) => {
    const setter = prefix === "normal" ? setNormalGear : prefix === "magic" ? setMagicGear : setRareGear;
    setter((current) => {
      const next = { ...current };
      classes.forEach((className) => {
        next[`${prefix}:${className}`] = enabled;
      });
      return next;
    });
  };

  const getGearCustomMode = (rarity: "rare" | "magic") => {
    const tierState = rarity === "rare" ? rareTiers : magicTiers;
    const gearState = rarity === "rare" ? rareGear : magicGear;
    const enabledTiers = (rarity === "rare" ? RARE_TIERS : MAGIC_TIERS).filter((tier) => tierState[tier.id]?.enabled);
    const enabledClasses = GEAR_CATEGORIES.filter((group) =>
      group.classes.some((className) => gearState[`${rarity}:${className}`]),
    );
    return {
      // A tier alone is sufficient: no class selection means "all gear".
      enabled: enabledTiers.length > 0,
      enabledTiers,
      enabledClasses,
      allGear: enabledClasses.length === 0,
    };
  };

  const renderGearModeSummary = (rarity: "rare" | "magic") => {
    const mode = getGearCustomMode(rarity);
    const label = rarity === "rare" ? "레어" : "매직";
    return (
      <div className={`filter-v2-rule-legend${mode.enabled ? " is-active" : ""}`}>
        {mode.enabled ? (
          <span>
            <strong>{label} 커스텀 모드 ON</strong> · 선택한 {mode.enabledTiers.length}개 등급 × {mode.allGear ? "전체 장비" : `${mode.enabledClasses.length}개 종류`}만 표시 · 그 외 일반 {label}는 숨김 · 특출난/이중타락 등 상위 NeverSink 규칙은 유지
          </span>
        ) : (
          <span>
            <strong>{label} 커스텀 모드 OFF</strong> · 등급을 하나 이상 선택하면 작동 · 장비 종류를 선택하지 않으면 전체 장비에 적용
          </span>
        )}
      </div>
    );
  };

  const renderTierList = (rarity: "rare" | "magic") => {
    const tiers = rarity === "rare" ? RARE_TIERS : MAGIC_TIERS;
    const state = rarity === "rare" ? rareTiers : magicTiers;
    const setter = rarity === "rare" ? setRareTiers : setMagicTiers;
    return (
      <div className="filter-v2-tier-list">
        {tiers.map((tier) => {
          const current = state[tier.id] ?? { enabled: false, importance: "default" };
          return (
            <article
              className={!current.enabled ? "is-off" : ""}
              key={tier.id}
              onClick={() => setGearPreview({ kind: "tier", rarity: rarity === "rare" ? "Rare" : "Magic", id: tier.id, label: tier.label, note: tier.note, enabled: current.enabled, importance: current.importance })}
            >
              <label className="filter-v2-switch">
                <input
                  type="checkbox"
                  checked={current.enabled}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setter((prev) => ({ ...prev, [tier.id]: { ...current, enabled } }));
                    setGearPreview({ kind: "tier", rarity: rarity === "rare" ? "Rare" : "Magic", id: tier.id, label: tier.label, note: tier.note, enabled, importance: current.importance });
                  }}
                />
                <span aria-hidden="true" />
              </label>
              <div className="filter-v2-tier-name">
                <strong>{tier.label}</strong>
                <small>{tier.note}</small>
              </div>
              {current.enabled ? (
                <div className="filter-v2-importance">
                  <span>중요도</span>
                  <div>
                    {(rarity === "rare" ? RARE_GEAR_IMPORTANCE_OPTIONS : MAGIC_GEAR_IMPORTANCE_OPTIONS).map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={current.importance === option.value ? "is-active" : ""}
                        title={option.note}
                        onClick={(event) => {
                          event.stopPropagation();
                          setter((prev) => ({ ...prev, [tier.id]: { ...current, importance: option.value } }));
                          setGearPreview({ kind: "tier", rarity: rarity === "rare" ? "Rare" : "Magic", id: tier.id, label: tier.label, note: tier.note, enabled: current.enabled, importance: option.value });
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : <div className="filter-v2-importance-off">미선택</div>}
            </article>
          );
        })}
      </div>
    );
  };

  const renderGearChecks = (prefix: "magic" | "rare") => {
    const state = prefix === "magic" ? magicGear : rareGear;
    const setter = prefix === "magic" ? setMagicGear : setRareGear;
    return (
      <div className="filter-v2-gear-section">
        <div className="filter-v2-gear-section-head">
          <div><strong>장비 종류 선택</strong><small>선택하지 않으면 전체 장비에 적용 · 하나 이상 선택하면 체크한 종류만 표시 대상</small></div>
          <div className="filter-v2-gear-bulk-actions">
            <button
              type="button"
              onClick={() => {
                const next: Record<string, boolean> = {};
                GEAR_CATEGORIES.forEach((group) => group.classes.forEach((className) => { next[`${prefix}:${className}`] = true; }));
                setter(next);
              }}
            >
              종류 전체 활성
            </button>
            <button
              type="button"
              onClick={() => setter(makeInitialGearState(prefix))}
            >
              종류 전체 해제
            </button>
          </div>
        </div>
        <div className="filter-v2-gear-type-grid">
          {GEAR_CATEGORIES.map((group) => {
            const className = group.classes[0];
            const key = `${prefix}:${className}`;
            const enabled = state[key] !== false;
            return (
              <label className={`filter-v2-gear-type${enabled ? " is-on" : ""}`} key={group.id}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setter((current) => ({ ...current, [key]: event.target.checked }))}
                />
                <span>{group.labelKo}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNormalLevelRules = () => (
    <section className="filter-v2-normal-level-rules">
      <div className="filter-v2-normal-level-head">
        <div>
          <strong>아이템 레벨 우선 규칙</strong>
          <small>FIXLGS 편의 규칙 · 기본 비활성 · 사용자가 켠 경우에만 원본 위에 추가 적용</small>
        </div>
        <em>TOP PRIORITY</em>
      </div>
      <div className="filter-v2-normal-level-list">
        {NORMAL_ITEM_LEVEL_RULES.map((rule) => {
          const state = normalLevelRules[rule.id] ?? { enabled: false, importance: "default" };
          return (
            <article
              className={!state.enabled ? "is-off" : ""}
              key={rule.id}
              onClick={() => setGearPreview({ kind: "normal-level", rarity: "Normal", id: rule.id, label: rule.label, note: `Normal · ItemLevel = ${rule.level} · FIXLGS 가상 규칙`, enabled: state.enabled, importance: state.importance })}
            >
              <label className="filter-v2-switch" onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={state.enabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setNormalLevelRules((current) => ({
                      ...current,
                      [rule.id]: { ...(current[rule.id] ?? state), enabled },
                    }));
                    setGearPreview({ kind: "normal-level", rarity: "Normal", id: rule.id, label: rule.label, note: `Normal · ItemLevel = ${rule.level} · FIXLGS 가상 규칙`, enabled, importance: state.importance });
                  }}
                />
                <span aria-hidden="true" />
              </label>
              <div className="filter-v2-tier-name">
                <strong>{rule.label}</strong>
                <small>Normal · ItemLevel = {rule.level} · 최상위 예외</small>
              </div>
              {state.enabled ? (
                <div className="filter-v2-importance">
                  <span>중요도</span>
                  <div>
                    {NORMAL_GEAR_IMPORTANCE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={state.importance === option.value ? "is-active" : ""}
                        title={option.value === "default" ? "가상 레벨 규칙을 켠 상태에서 선택한 NeverSink 스타일을 사용" : option.note}
                        onClick={(event) => {
                          event.stopPropagation();
                          setNormalLevelRules((current) => ({
                            ...current,
                            [rule.id]: { ...(current[rule.id] ?? state), importance: option.value },
                          }));
                          setGearPreview({ kind: "normal-level", rarity: "Normal", id: rule.id, label: rule.label, note: `Normal · ItemLevel = ${rule.level} · FIXLGS 가상 규칙`, enabled: state.enabled, importance: option.value });
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : <div className="filter-v2-importance-off">미선택</div>}
            </article>
          );
        })}
      </div>
      <div className="filter-v2-normal-level-foot">
        <strong>우선순위</strong>
        <span>NeverSink 원본 → 사용자가 활성화한 FIXLGS 가상 레벨 규칙/개별 커스텀만 override</span>
      </div>
    </section>
  );

  const setNormalGearGroup = (groupId: string, enabled: boolean) => {
    const group = NORMAL_GEAR_GROUPS.find((entry) => entry.id === groupId);
    if (!group) return;
    setNormalGear((current) => {
      const next = { ...current };
      group.items.forEach((item) => { next[item.id] = enabled; });
      return next;
    });
  };

  const renderNormalGear = () => (
    <>
      {renderNormalLevelRules()}
      <div className="filter-v2-normal-base-caption">
        <strong>BaseType 커스텀</strong>
        <span>82~78 이외에는 NeverSink의 레벨·지역·진행도 조건을 그대로 따르며, 중요도 변경은 스타일만 바꿉니다.</span>
      </div>
      <div className="filter-v2-normal-groups">
      {NORMAL_GEAR_GROUPS.map((group) => {
        const query = search.trim().toLowerCase();
        const items = query
          ? group.items.filter((item) =>
              `${item.labelKo} ${item.baseType}`.toLowerCase().includes(query),
            )
          : group.items;
        if (items.length === 0) return null;
        const enabledCount = items.filter((item) => (normalGear[item.id] ?? baselineEnabled(neverSinkBaseline?.normal[item.id]))).length;
        const allEnabled = items.length > 0 && enabledCount === items.length;
        return (
          <section className="filter-v2-normal-group" key={group.id}>
            <div className="filter-v2-normal-group-head">
              <label className="filter-v2-switch" onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={allEnabled}
                  onChange={(event) => setNormalGearGroup(group.id, event.target.checked)}
                />
                <span aria-hidden="true" />
              </label>
              <div>
                <strong>{group.labelKo}</strong>
                <small>{items.length}개 BaseType · 검색 결과 기준 · 상위 체크로 표시/숨김</small>
              </div>
              <em>{enabledCount}/{items.length}</em>
            </div>

            <div className="filter-v2-normal-list">
              {items.map((item) => {
                const enabled = normalGear[item.id] ?? baselineEnabled(neverSinkBaseline?.normal[item.id]);
                const importance = normalGearImportance[item.id] ?? "default";
                const shownImportance = effectiveImportance(importance, neverSinkBaseline?.normal[item.id]);
                return (
                  <article
                    className={!enabled ? "is-off" : ""}
                    key={item.id}
                    onClick={() => setGearPreview({ kind: "normal", rarity: "Normal", id: item.id, label: item.labelKo, note: `${group.labelKo} · 드롭 BaseType`, enabled, importance: shownImportance })}
                  >
                    <label className="filter-v2-switch">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const nextEnabled = event.target.checked;
                          setNormalGear((current) => ({ ...current, [item.id]: nextEnabled }));
                          setGearPreview({ kind: "normal", rarity: "Normal", id: item.id, label: item.labelKo, note: `${group.labelKo} · 드롭 BaseType`, enabled: nextEnabled, importance: shownImportance });
                        }}
                      />
                      <span aria-hidden="true" />
                    </label>
                    <div className="filter-v2-tier-name">
                      <strong>{item.labelKo}</strong>
                      {neverSinkBaseline?.normal[item.id] && (neverSinkBaseline.normal[item.id].status !== "conditional" || importance === "default") ? (
                        <small className={`filter-v2-ns-baseline is-${neverSinkBaseline.normal[item.id].status}`} title={`NeverSink 원본 매칭 규칙 ${neverSinkBaseline.normal[item.id].matches}개`}>
                          {BASELINE_LABELS[neverSinkBaseline.normal[item.id].status]}
                        </small>
                      ) : null}
                      <small>{group.labelKo} · 일반</small>
                    </div>
                    {enabled ? (
                      <div className="filter-v2-importance">
                        <span>중요도</span>
                        <div>
                          {NORMAL_GEAR_IMPORTANCE_OPTIONS.map((option) => (
                            <button
                              type="button"
                              key={option.value}
                              className={shownImportance === option.value ? "is-active" : ""}
                              title={option.note}
                              onClick={(event) => {
                                event.stopPropagation();
                                setNormalGearImportance((current) => ({ ...current, [item.id]: option.value }));
                                setGearPreview({ kind: "normal", rarity: "Normal", id: item.id, label: item.labelKo, note: `${group.labelKo} · 드롭 BaseType`, enabled, importance: option.value });
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : <div className="filter-v2-importance-off">숨김</div>}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      </div>
    </>
  );

  return (
    <div className="filter-v2-shell">
      <aside className="filter-v2-sidebar">
        <div className="filter-v2-sidebar-head">
          <span>FILTER EDITOR</span>
          <strong>{selectedStrictness}</strong>
        </div>

        <div className="filter-v2-base filter-v2-base-top filter-v2-edit-target">
          <span>CURRENT FILTER</span>
          <label className="filter-v2-base-select">
            <select
              value={editTargetValue}
              onChange={(event) => handleEditTargetChange(event.target.value)}
              aria-label="현재 편집 필터 선택"
            >
              <optgroup label="NeverSink 원본">
                {NEVER_SINK_STRICTNESSES.map((option) => (
                  <option value={`original:${option.id}`} key={`original:${option.id}`}>
                    NeverSink {option.id} · {option.ko}
                  </option>
                ))}
              </optgroup>
              {Object.keys(presetAvailability).length ? (
                <optgroup label="FIXLGS 저장 커스텀">
                  {NEVER_SINK_STRICTNESSES.filter((option) => presetAvailability[option.id]).map((option) => (
                    <option value={`preset:${option.id}`} key={`preset:${option.id}`}>
                      {defaultExportBaseName(option.id)} · {option.ko}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </label>
          <small>여기서 선택한 원본 또는 저장 커스텀 상태가 아래 목록 전체에 그대로 연결됩니다.</small>
        </div>

        <div className={`filter-v2-current-edit is-${editSource}`}>
          <span>현재 편집</span>
          <strong>{currentEditLabel}</strong>
          <small>BASE · NeverSink {selectedStrictness} · v{NEVER_SINK.version}</small>
          <em>{customCount === 0 ? "원본 변경 없음" : `현재 변경 ${customCount}개`}</em>
        </div>

        <div className="filter-v2-preset">
          <div className="filter-v2-preset-head">
            <span>LOCAL PRESET</span>
            <strong>{defaultExportBaseName(selectedStrictness)}</strong>
          </div>
          {presetMeta ? (
            <small>저장됨 · NS {presetMeta.neverSinkVersion} · {new Date(presetMeta.savedAt).toLocaleDateString("ko-KR")}</small>
          ) : (
            <small>이 단계에 저장된 커스텀 없음</small>
          )}
          <div className="filter-v2-preset-actions">
            <button type="button" onClick={saveLocalPreset}>현재 설정 저장</button>
            <button type="button" onClick={loadLocalPreset} disabled={!presetMeta}>저장본 다시 적용</button>
            <button type="button" onClick={deleteLocalPreset} disabled={!presetMeta}>삭제</button>
          </div>
          <button type="button" className="filter-v2-preset-delete-all" onClick={deleteAllLocalPresets}>00~06 전체 삭제</button>
          {presetMessage ? <p>{presetMessage}</p> : null}
        </div>

        <nav className="filter-v2-section-nav" aria-label="필터 분류">
          {SECTION_META.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={item.id === activeSection ? "is-active" : ""}
              onClick={() => {
                setActiveSection(item.id);
                setSearch("");
                if (item.id === "exceptional") { setSelectedId(EXCEPTIONAL_GROUPS[0].items[0].id); setGearPreview(null); }
                if (item.id === "rare") {
                  setSelectedId("");
                  const tier = RARE_TIERS[0];
                  const state = rareTiers[tier.id] ?? { enabled: false, importance: tier.defaultImportance };
                  setGearPreview({ kind: "tier", rarity: "Rare", id: tier.id, label: tier.label, note: tier.note, enabled: state.enabled, importance: state.importance });
                }
                if (item.id === "magic") {
                  setSelectedId("");
                  const tier = MAGIC_TIERS[0];
                  const state = magicTiers[tier.id] ?? { enabled: false, importance: tier.defaultImportance };
                  setGearPreview({ kind: "tier", rarity: "Magic", id: tier.id, label: tier.label, note: tier.note, enabled: state.enabled, importance: state.importance });
                }
                if (item.id === "normal") {
                  setSelectedId("");
                  const group = NORMAL_GEAR_GROUPS.find((entry) => entry.items.length > 0);
                  const base = group?.items[0];
                  setGearPreview(base && group ? { kind: "normal", rarity: "Normal", id: base.id, label: base.labelKo, note: `${group.labelKo} · 드롭 BaseType`, enabled: normalGear[base.id] ?? baselineEnabled(neverSinkBaseline?.normal[base.id]), importance: effectiveImportance(normalGearImportance[base.id] ?? "default", neverSinkBaseline?.normal[base.id]) } : null);
                }
                if (item.id !== "rare" && item.id !== "magic" && item.id !== "normal" && item.id !== "exceptional") setGearPreview(null);
                if (item.id === "waystones") setSelectedId(WAYSTONE_GROUPS[0].items[0].id);
                if (item.id === "unique-armour") setSelectedId(UNIQUE_ARMOUR_GROUPS[0].items[0].id);
                if (item.id === "unique") setSelectedId(UNIQUE_GROUPS[0].items[0].id);
                if (item.id === "other-unique") setSelectedId(OTHER_UNIQUE_GROUPS[0].items[0].id);
                if (item.id === "tablets") setSelectedId(TABLET_GROUPS[0].items[0].id);
                if (item.id === "jewels") setSelectedId(JEWEL_GROUPS[0].items[0].id);
                if (item.id === "flasks") setSelectedId(FLASK_GROUPS[0].items[0].id);
                if (item.id === "charms") setSelectedId(CHARM_GROUPS[0].items[0].id);
                if (item.id === "currency") setSelectedId(CURRENCY_GROUPS[0].items[0].id);
                if (item.id === "essence") setSelectedId(ESSENCE_GROUPS[0].items[0].id);
                if (item.id === "delirium") setSelectedId(DELIRIUM_GROUPS[0].items[0].id);
                if (item.id === "breach") setSelectedId(BREACH_GROUPS[0].items[0].id);
                if (item.id === "abyss") setSelectedId(ABYSS_GROUPS[0].items[0].id);
                if (item.id === "atziri") setSelectedId(ATZIRI_GROUPS[0].items[0].id);
                if (item.id === "fragments") setSelectedId(FRAGMENT_GROUPS[0].items[0].id);
                if (item.id === "runes") setSelectedId(RUNE_GROUPS[0].items[0].id);
                if (item.id === "ritual") setSelectedId(RITUAL_GROUPS[0].items[0].id);
                if (item.id === "soulcores") setSelectedId(SOUL_CORE_GROUPS[0].items[0].id);
                if (item.id === "idols") setSelectedId(IDOL_GROUPS[0].items[0].id);
                if (item.id === "uncutgems") setSelectedId(UNCUT_GEM_GROUPS[0].items[0].id);
                if (item.id === "expedition") setSelectedId(EXPEDITION_GROUPS[0].items[0].id);
                if (item.id === "gems") setSelectedId(LINEAGE_GEM_GROUPS[0].items[0].id);
                if (item.id === "misc") setSelectedId(MISC_GROUPS[0].items[0].id);
              }}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <span>
                <strong>{item.label}</strong>
                <em>{item.ko}</em>
              </span>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
        </nav>

      </aside>

      <section className="filter-v2-editor">
        <header className="filter-v2-editor-head">
          <div>
            <span>FIX POE2 · NEVER SINK CUSTOMIZER</span>
            <h1>{section.label}</h1>
            <p>{section.description.replaceAll("0-SOFT", selectedStrictness)}</p>
          </div>

          <div className="filter-v2-head-actions">
            {(activeSection === "normal" || activeSection === "exceptional" || activeSection === "waystones" || activeSection === "unique-armour" || activeSection === "unique" || activeSection === "other-unique" || activeSection === "tablets" || activeSection === "jewels" || activeSection === "flasks" || activeSection === "charms" || activeSection === "currency" || activeSection === "essence" || activeSection === "delirium" || activeSection === "breach" || activeSection === "uncutgems" || activeSection === "expedition" || activeSection === "abyss" || activeSection === "atziri" || activeSection === "fragments" || activeSection === "runes" || activeSection === "ritual" || activeSection === "soulcores" || activeSection === "idols" || activeSection === "gems" || activeSection === "misc") && (
              <label>
                <span>SEARCH</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="아이템 검색"
                  aria-label="아이템 검색"
                />
              </label>
            )}
            {activeSection === "rare" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllRare}>
                레어 전체 초기화
              </button>
            ) : activeSection === "magic" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllMagic}>
                매직 전체 초기화
              </button>
            ) : activeSection === "normal" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllNormal}>
                일반 전체 초기화
              </button>
            ) : activeSection === "exceptional" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllExceptional}>
                특출난 전체 초기화
              </button>
            ) : activeSection === "waystones" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllWaystones}>
                경로석 전체 초기화
              </button>
            ) : activeSection === "unique-armour" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllUniqueArmour}>
                고유 방어구 전체 초기화
              </button>
            ) : activeSection === "unique" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllUnique}>
                고유 무기 전체 초기화
              </button>
            ) : activeSection === "other-unique" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllOtherUnique}>
                기타 고유 전체 초기화
              </button>
            ) : activeSection === "tablets" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllTablets}>
                서판 전체 초기화
              </button>
            ) : activeSection === "jewels" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllJewels}>
                주얼 전체 초기화
              </button>
            ) : activeSection === "flasks" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllFlasks}>
                플라스크 전체 초기화
              </button>
            ) : activeSection === "charms" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllCharms}>
                호신부 전체 초기화
              </button>
            ) : activeSection === "currency" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllCurrency}>
                화폐 전체 초기화
              </button>
            ) : activeSection === "essence" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllEssence}>
                에센스 전체 초기화
              </button>
            ) : activeSection === "delirium" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllDelirium}>
                환영 전체 초기화
              </button>
            ) : activeSection === "breach" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllBreach}>
                균열 전체 초기화
              </button>
            ) : activeSection === "abyss" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllAbyss}>
                심연 전체 초기화
              </button>
            ) : activeSection === "atziri" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllAtziri}>
                앗지리의 사원 전체 초기화
              </button>
            ) : activeSection === "fragments" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllFragments}>
                조각 전체 초기화
              </button>
            ) : activeSection === "runes" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllRunes}>
                룬 전체 초기화
              </button>
            ) : activeSection === "ritual" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllRitual}>
                의식 전체 초기화
              </button>
            ) : activeSection === "soulcores" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllSoulCores}>
                영혼 핵 전체 초기화
              </button>
            ) : activeSection === "idols" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllIdols}>
                우상 전체 초기화
              </button>
            ) : activeSection === "uncutgems" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllUncutGems}>
                미가공 젬 전체 초기화
              </button>
            ) : activeSection === "expedition" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllExpedition}>
                탐험 전체 초기화
              </button>
            ) : activeSection === "gems" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllLineageGems}>
                젬 전체 초기화
              </button>
            ) : activeSection === "misc" ? (
              <button type="button" className="filter-v2-currency-reset-top" onClick={resetAllMisc}>
                기타 전체 초기화
              </button>
            ) : null}
          </div>
        </header>
<div className="filter-v2-rule-strip">
          <span><b>체크</b> = {activeSection === "exceptional" ? "특출난 규칙 활성" : (activeSection === "rare" || activeSection === "magic") ? "커스텀 선택에 포함" : "표시"}</span>
          <span><b>체크 해제</b> = {activeSection === "exceptional" ? "특출난 override 해제 · 아래 NeverSink 원본 규칙으로 복귀" : (activeSection === "rare" || activeSection === "magic") ? "커스텀 선택에서 제외" : activeSection === "normal" ? "해당 규칙 숨김" : "비활성"}</span>
          <span><b>중요도</b> = 선택한 NeverSink 베이스의 현재값이 기본 선택 · 다른 값 클릭 시 override</span>
        </div>

        <div className="filter-v2-editor-body">

          {activeSection === "exceptional" && (
            <div className="filter-v2-rule-legend">
              <span><strong>8종만 커스텀</strong> = 고유/레어/매직/일반 × 과퀄리티/과소켓 · 중요도 S~E는 공통 커스텀 스타일 · 이중타락/Vaal/찬싱 전용 추가 예외는 NeverSink 원본 유지</span>
            </div>
          )}

          {(activeSection === "unique-armour" || activeSection === "unique" || activeSection === "other-unique" || activeSection === "flasks" || activeSection === "charms" || activeSection === "misc" || activeSection === "runes" || activeSection === "ritual" || activeSection === "delirium" || activeSection === "breach" || activeSection === "uncutgems" || activeSection === "expedition" || activeSection === "abyss") && (
            <div className="filter-v2-rule-legend">
              {(activeSection === "unique-armour" || activeSection === "unique" || activeSection === "other-unique" || activeSection === "runes" || activeSection === "abyss" || activeSection === "uncutgems") && (
                <span><strong>NS</strong> = NeverSink {selectedStrictness} 원본 중요도/스타일 유지 · <strong>원본 분류</strong> = 현재 선택한 베이스에서 해당 항목이 연결된 실제 NeverSink 규칙</span>
              )}
              {(activeSection === "flasks" || activeSection === "charms" || activeSection === "misc" || activeSection === "delirium" || activeSection === "breach" || activeSection === "uncutgems" || activeSection === "expedition") && (
                <span><strong>DYNAMIC</strong> = 조건에 따라 NeverSink 중요도가 자동 변경</span>
              )}
            </div>
          )}


          {activeSection === "rare" && (
            <div className="filter-v2-gear-editor">
              {renderGearModeSummary("rare")}
              <div className="filter-v2-rule-legend"><span><strong>동작</strong> = 선택한 단계 × 선택한 종류만 표시 · 나머지 일반 레어는 숨김 · 아무 선택이 완성되지 않으면 NeverSink 원본 유지 · 특출난/이중타락 등 상위 규칙은 별도 유지</span></div>
              {renderTierList("rare")}
              {renderGearChecks("rare")}
            </div>
          )}

          {activeSection === "magic" && (
            <div className="filter-v2-gear-editor">
              {renderGearModeSummary("magic")}
              <div className="filter-v2-rule-legend"><span><strong>동작</strong> = 선택한 단계 × 선택한 종류만 표시 · 나머지 일반 매직은 숨김 · 아무 선택이 완성되지 않으면 NeverSink 원본 유지 · 특출난/이중타락 등 상위 규칙은 별도 유지</span></div>
              {renderTierList("magic")}
              {renderGearChecks("magic")}
            </div>
          )}

          {activeSection === "normal" && (
            <div className="filter-v2-gear-editor">
              <div className="filter-v2-rule-legend"><span><strong>일반 장비</strong> = 82~78은 최상위 레벨 예외 · 그 외는 NeverSink 원본 조건 유지 · BaseType 중요도 변경은 원본 레벨/지역 조건을 바꾸지 않고 스타일만 변경 · 과퀄/과소켓은 EXCEPTIONAL에서 관리</span></div>
              {renderNormalGear()}
            </div>
          )}

          {activeSection === "exceptional" && (
            <ItemGroups
              groups={EXCEPTIONAL_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "waystones" && (
            <ItemGroups
              groups={WAYSTONE_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "unique-armour" && (
            <ItemGroups
              groups={UNIQUE_ARMOUR_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "unique" && (
            <ItemGroups
              groups={UNIQUE_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "other-unique" && (
            <ItemGroups
              groups={OTHER_UNIQUE_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "tablets" && (
            <ItemGroups
              groups={TABLET_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "jewels" && (
            <ItemGroups
              groups={JEWEL_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "flasks" && (
            <ItemGroups
              groups={FLASK_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "charms" && (
            <ItemGroups
              groups={CHARM_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "misc" && (
            <ItemGroups
              groups={MISC_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "currency" && (
            <ItemGroups
              groups={CURRENCY_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "essence" && (
            <ItemGroups
              groups={ESSENCE_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "delirium" && (
            <ItemGroups
              groups={DELIRIUM_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "breach" && (
            <ItemGroups
              groups={BREACH_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "abyss" && (
            <ItemGroups
              groups={ABYSS_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "atziri" && (
            <ItemGroups
              groups={ATZIRI_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "fragments" && (
            <ItemGroups
              groups={FRAGMENT_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "runes" && (
            <ItemGroups
              groups={RUNE_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "ritual" && (
            <ItemGroups
              groups={RITUAL_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "soulcores" && (
            <ItemGroups
              groups={SOUL_CORE_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "idols" && (
            <ItemGroups
              groups={IDOL_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "uncutgems" && (
            <ItemGroups
              groups={UNCUT_GEM_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}

          {activeSection === "expedition" && (
            <ItemGroups
              groups={EXPEDITION_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}


          {activeSection === "gems" && (
            <ItemGroups
              groups={LINEAGE_GEM_GROUPS}
              itemState={itemState}
              selectedId={selectedId}
              search={search}
              onSelect={setSelectedId}
              onToggle={(id, enabled) => updateItem(id, { enabled })}
              onImportance={(id, importance) => updateItem(id, { importance })}
              baselineItems={neverSinkBaseline?.items}
              selectedStrictness={selectedStrictness}
            />
          )}


        </div>
      </section>

      <aside className="filter-v2-preview">
        <div className="filter-v2-preview-head">
          <div className="filter-v2-preview-head-meta">
            <span>LIVE STATUS</span>
            <strong>{customCount} CHANGED</strong>
          </div>
        </div>

        <div className="filter-v2-export filter-v2-export-top">
          <div className="filter-v2-export-title">
            <div>
              <span>FILTER EXPORT</span>
              <strong>{customCount === 0 ? "NEVERSINK ORIGINAL" : `${customCount} CUSTOM`}</strong>
            </div>
            <em>{selectedStrictness}</em>
          </div>
          <label className="filter-v2-export-name">
            <span>파일명</span>
            <div>
              <input
                value={exportBaseName}
                onChange={(event) => setExportBaseName(event.target.value)}
                onBlur={() => setExportBaseName((current) => sanitizeExportBaseName(current, defaultExportBaseName(selectedStrictness)))}
                aria-label="생성 필터 파일명"
              />
              <em>{Object.values(soundState).some((choice) => choice !== "default") ? ".zip" : ".filter"}</em>
            </div>
          </label>
          <div className="filter-v2-export-actions">
            <button type="button" className="filter-v2-export-download is-install" disabled={exportBusy} onClick={handleInstallToGameFolder}>
              {exportBusy ? "처리 중..." : "게임 폴더에 설치 (권장)"}
            </button>
            <button type="button" className="filter-v2-export-download is-secondary" disabled={exportBusy} onClick={handleCustomizedExport}>
              {exportBusy ? "처리 중..." : Object.values(soundState).some((choice) => choice !== "default") ? "ZIP 다운로드" : "필터 다운로드"}
            </button>
            <button type="button" className="filter-v2-export-download is-secondary" disabled={exportBusy} onClick={handleChangeInstallFolder}>
              설치 폴더 변경
            </button>
          </div>
          <p>기본 이름은 FIXLGS_POE2_00~06입니다. 필요하면 저장 전에 파일명을 수정할 수 있습니다.</p>

          <Link className="filter-v2-guide-link" href="/filter/guide">
            <span>처음 오셨나요?</span>
            <strong>사용 가이드 보기</strong>
          </Link>

          {exportMessage ? <div className="filter-v2-export-message">{exportMessage}</div> : null}

          <div className="filter-v2-save-final">
            <button type="button" disabled={exportBusy} onClick={handleInstallToGameFolder}>
              {exportBusy ? "처리 중..." : "현재 필터 저장"}
            </button>
            <small>현재 커스텀 설정을 게임 필터 폴더에 저장·적용합니다.</small>
          </div>
        </div>

        <div className="filter-v2-preview-stage">
          {selectedItem && selectedState ? (
            <>
              <div
                className={`filter-v2-item-preview family-${selectedItem.family ?? "plain"} importance-${selectedState.importance}${!selectedState.enabled ? " is-off" : ""}`}
              >
                {selectedItem.labelKo ?? selectedItem.label}
              </div>
              <strong>{selectedItem.label}</strong>
              <p>
                {selectedState.importance === "default"
                  ? selectedBaseline
                    ? `${selectedStrictness} 원본 규칙 사용${baselineTierLabel(selectedBaseline) ? ` · ${baselineTierLabel(selectedBaseline)}` : ""}`
                    : `${selectedStrictness} 원본 매핑 확인 중`
                  : selectedState.enabled
                    ? `사용자 중요도 ${selectedItem.family ? (IMPORTANCE_OPTIONS[selectedItem.family]?.find((option) => option.value === selectedState.importance)?.label ?? selectedState.importance.toUpperCase()) : selectedState.importance.toUpperCase()}`
                    : selectedItem.family === "exceptional" ? "특출난 규칙 OFF · 아래 NeverSink 원본 규칙으로 복귀" : "사용자 override · 숨김"}
              </p>
              {selectedItem.defaultNote ? (
                <small className="filter-v2-default-note">{selectedItem.defaultNote}</small>
              ) : null}

              {(activeSection === "exceptional" || activeSection === "waystones" || activeSection === "unique-armour" || activeSection === "unique" || activeSection === "other-unique" || activeSection === "tablets" || activeSection === "jewels" || activeSection === "flasks" || activeSection === "charms" || activeSection === "currency" || activeSection === "essence" || activeSection === "delirium" || activeSection === "breach" || activeSection === "uncutgems" || activeSection === "expedition" || activeSection === "abyss" || activeSection === "atziri" || activeSection === "fragments" || activeSection === "runes" || activeSection === "ritual" || activeSection === "soulcores" || activeSection === "idols" || activeSection === "gems" || activeSection === "misc") ? (
                <button
                  type="button"
                  className="filter-v2-current-reset filter-v2-current-reset-preview"
                  onClick={resetSelectedItem}
                >
                  현재 항목 초기화
                </button>
              ) : null}

              {(activeSection === "exceptional" || activeSection === "waystones" || activeSection === "unique-armour" || activeSection === "unique" || activeSection === "other-unique" || activeSection === "tablets" || activeSection === "jewels" || activeSection === "flasks" || activeSection === "charms" || activeSection === "currency" || activeSection === "essence" || activeSection === "delirium" || activeSection === "breach" || activeSection === "uncutgems" || activeSection === "expedition" || activeSection === "abyss" || activeSection === "atziri" || activeSection === "fragments" || activeSection === "runes" || activeSection === "ritual" || activeSection === "soulcores" || activeSection === "idols" || activeSection === "gems" || activeSection === "misc") ? (
                <div className="filter-v2-sound-panel">
                  <div className="filter-v2-sound-title">
                    <span>CUSTOM SOUND</span>
                    <small>{soundChoiceLabel(selectedSound)}</small>
                  </div>

                  <>
                      <div className={`filter-v2-sound-option${selectedSound === "default" ? " is-selected" : ""}`}>
                        <button type="button" disabled>NS</button>
                        <div><strong>NeverSink 기본</strong><small>{selectedStrictness} 원본{selectedBaseline?.sounds?.length ? ` · ${selectedBaseline.sounds.join(" / ")}` : " · 원본 사운드 규칙 유지"}</small></div>
                        <button type="button" className="filter-v2-sound-apply" onClick={() => applySoundChoice("default")}>적용</button>
                      </div>
                      <div className={`filter-v2-sound-option${selectedSound === "masitda" ? " is-selected" : ""}`}>
                        <button type="button" onClick={() => playSound("/sounds/um-masitda.mp3", "음~ 맛있다")}>▶</button>
                        <div><strong>음~ 맛있다</strong><small>FIXLGS 공용 커스텀 드롭 사운드</small></div>
                        <button type="button" className="filter-v2-sound-apply" onClick={() => applySoundChoice("masitda")}>적용</button>
                      </div>
                      <div className={`filter-v2-sound-option filter-v2-sound-oishie${selectedSound === "oishie" ? " is-selected" : ""}`}>
                        <button type="button" onClick={() => playSound("/sounds/oishie-poe-final.mp3", "OISHIE")}>▶</button>
                        <div><strong>OISHIE</strong><small>FIXLGS 공용 커스텀 사운드 · 미리듣기 가능</small></div>
                        <button type="button" className="filter-v2-sound-apply" onClick={() => applySoundChoice("oishie")}>적용</button>
                      </div>
                      <div className={`filter-v2-sound-option${selectedSound === "divine-power" ? " is-selected" : ""}`}>
                        <button type="button" onClick={() => playSound("/sounds/divine-power.mp3", "DIVINE POWER!")}>▶</button>
                        <div><strong>DIVINE POWER!</strong><small>FIXLGS 공용 특수 드롭 사운드 · 사용자가 선택할 때만 적용</small></div>
                        <button type="button" className="filter-v2-sound-apply" onClick={() => applySoundChoice("divine-power")}>적용</button>
                      </div>
                      <div className="filter-v2-user-sound-head">
                        <div>
                          <strong>내 커스텀 사운드</strong>
                          <small>브라우저 로컬 처리 · 서버 업로드 없음</small>
                        </div>
                        <label className={`filter-v2-user-sound-add${customSoundBusy ? " is-busy" : ""}`}>
                          {customSoundBusy ? "검사 중..." : "+ MP3 추가"}
                          <input
                            ref={customSoundInputRef}
                            type="file"
                            accept="audio/mpeg,.mp3"
                            disabled={customSoundBusy}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void registerCustomSound(file);
                            }}
                          />
                        </label>
                      </div>

                      {customSounds.length === 0 ? (
                        <div className="filter-v2-user-sound-empty">
                          MP3를 등록하면 안전한 파일명으로 자동 변환되어 이 목록에 나타납니다.
                        </div>
                      ) : (
                        customSounds.map((sound) => {
                          const choice: SoundChoice = `user:${sound.id}`;
                          return (
                            <div className={`filter-v2-sound-option filter-v2-user-sound-option${selectedSound === choice ? " is-selected" : ""}`} key={sound.id}>
                              <button type="button" onClick={() => playSound(sound.objectUrl, sound.safeName)}>▶</button>
                              <div>
                                <strong>{sound.safeName}</strong>
                                <small>{sound.originalName} · {sound.duration.toFixed(1)}초 · {(sound.size / 1024).toFixed(0)}KB</small>
                              </div>
                              <div className="filter-v2-user-sound-actions">
                                <button type="button" className="filter-v2-sound-apply" onClick={() => applySoundChoice(choice)}>적용</button>
                                <button type="button" className="filter-v2-user-sound-delete" onClick={() => removeCustomSound(sound)}>삭제</button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {customSoundMessage ? <div className="filter-v2-user-sound-message">{customSoundMessage}</div> : null}

                      <details className="filter-v2-user-sound-guide">
                        <summary>개인 커스텀 사운드 가이드</summary>
                        <div>
                          <p>지원 형식은 우선 MP3이며, 권장 길이는 {CUSTOM_SOUND_RECOMMENDED_DURATION}입니다. 최대 2MB / {CUSTOM_SOUND_MAX_DURATION}초까지 등록할 수 있습니다.</p>
                          <p>등록 시 MP3 데이터와 브라우저 오디오 디코딩을 함께 검사하며, 깨진 파일은 차단합니다. 등록 후 ▶ 버튼으로 반드시 미리듣기할 수 있습니다.</p>
                          <p>최종 필터 다운로드에서는 .filter와 실제 사용 중인 개인 MP3가 하나의 ZIP에 포함되고, 내부 파일명은 custom_sound_01.mp3처럼 자동 정리됩니다.</p>
                          <p>Windows 기본 “모두 추출”은 ZIP 이름의 하위 폴더를 자동으로 만들 수 있습니다. ZIP을 열어 내부의 .filter 파일과 FIXLGS_SOUNDS 폴더를 문서 → My Games → Path of Exile 2 바로 아래로 복사하세요. 개인 음원 사용에 따른 저작권 책임은 사용자 본인에게 있습니다.</p>
                          <p>필터 엔진에서는 누락 사운드로 전체 필터가 깨지지 않도록 CustomAlertSoundOptional 사용을 우선합니다.</p>
                        </div>
                      </details>
                  </>

                  <div className="filter-v2-sound-controls">
                    <button type="button" onClick={stopSound}>■ 정지</button>
                    <span>{soundMessage || "미리듣기 버튼으로 확인"}</span>
                  </div>
</div>
              ) : null}
            </>
          ) : gearPreview && (activeSection === "rare" || activeSection === "magic" || activeSection === "normal") ? (
            <>
              <div
                className={`filter-v2-item-preview family-gear rarity-${gearPreview.rarity.toLowerCase()} importance-${gearPreview.importance}${!gearPreview.enabled ? " is-off" : ""}`}
              >
                {gearPreview.label}
              </div>
              <strong>{gearPreview.rarity} · {gearPreview.label}</strong>
              <p>
                {gearPreview.enabled
                  ? `현재 중요도 ${(gearPreview.rarity === "Rare" ? RARE_GEAR_IMPORTANCE_OPTIONS : gearPreview.rarity === "Magic" ? MAGIC_GEAR_IMPORTANCE_OPTIONS : NORMAL_GEAR_IMPORTANCE_OPTIONS).find((option) => option.value === gearPreview.importance)?.label ?? gearPreview.importance.toUpperCase()}`
                  : "이 단계/종류는 필터에서 숨김"}
              </p>
              <small className="filter-v2-default-note">{gearPreview.note}</small>
              <button
                type="button"
                className="filter-v2-current-reset filter-v2-current-reset-preview"
                onClick={resetCurrentGear}
              >
                현재 항목 초기화
              </button>

              <div className="filter-v2-sound-panel">
                <div className="filter-v2-sound-title">
                  <span>CUSTOM SOUND</span>
                  <small>{soundChoiceLabel(selectedGearSound)}</small>
                </div>

                <div className={`filter-v2-sound-option${selectedGearSound === "default" ? " is-selected" : ""}`}>
                  <button type="button" disabled>NS</button>
                  <div><strong>NeverSink 기본</strong><small>{selectedStrictness} 원래 PlayAlertSound 유지</small></div>
                  <button type="button" className="filter-v2-sound-apply" onClick={() => {
                    if (!gearPreview) return;
                    setSoundState((current) => ({ ...current, [gearSoundKey(gearPreview)]: "default" }));
                  }}>적용</button>
                </div>
                <div className={`filter-v2-sound-option${selectedGearSound === "masitda" ? " is-selected" : ""}`}>
                  <button type="button" onClick={() => playSound("/sounds/um-masitda.mp3", "음~ 맛있다")}>▶</button>
                  <div><strong>음~ 맛있다</strong><small>FIXLGS 공용 커스텀 드롭 사운드</small></div>
                  <button type="button" className="filter-v2-sound-apply" onClick={() => {
                    if (!gearPreview) return;
                    setSoundState((current) => ({ ...current, [gearSoundKey(gearPreview)]: "masitda" }));
                  }}>적용</button>
                </div>
                <div className={`filter-v2-sound-option filter-v2-sound-oishie${selectedGearSound === "oishie" ? " is-selected" : ""}`}>
                  <button type="button" onClick={() => playSound("/sounds/oishie-poe-final.mp3", "OISHIE")}>▶</button>
                  <div><strong>OISHIE</strong><small>FIXLGS 공용 커스텀 사운드 · 미리듣기 가능</small></div>
                  <button type="button" className="filter-v2-sound-apply" onClick={() => {
                    if (!gearPreview) return;
                    setSoundState((current) => ({ ...current, [gearSoundKey(gearPreview)]: "oishie" }));
                  }}>적용</button>
                </div>
                <div className={`filter-v2-sound-option${selectedGearSound === "divine-power" ? " is-selected" : ""}`}>
                  <button type="button" onClick={() => playSound("/sounds/divine-power.mp3", "DIVINE POWER!")}>▶</button>
                  <div><strong>DIVINE POWER!</strong><small>FIXLGS 공용 특수 드롭 사운드</small></div>
                  <button type="button" className="filter-v2-sound-apply" onClick={() => {
                    if (!gearPreview) return;
                    setSoundState((current) => ({ ...current, [gearSoundKey(gearPreview)]: "divine-power" }));
                  }}>적용</button>
                </div>

                <div className="filter-v2-user-sound-head">
                  <div>
                    <strong>내 커스텀 사운드</strong>
                    <small>브라우저 로컬 처리 · 서버 업로드 없음</small>
                  </div>
                  <label className={`filter-v2-user-sound-add${customSoundBusy ? " is-busy" : ""}`}>
                    {customSoundBusy ? "검사 중..." : "+ MP3 추가"}
                    <input
                      ref={customSoundInputRef}
                      type="file"
                      accept="audio/mpeg,.mp3"
                      disabled={customSoundBusy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void registerCustomSound(file);
                      }}
                    />
                  </label>
                </div>

                {customSounds.length === 0 ? (
                  <div className="filter-v2-user-sound-empty">
                    MP3를 등록하면 안전한 파일명으로 자동 변환되어 이 목록에 나타납니다.
                  </div>
                ) : (
                  customSounds.map((sound) => {
                    const choice: SoundChoice = `user:${sound.id}`;
                    return (
                      <div className={`filter-v2-sound-option filter-v2-user-sound-option${selectedGearSound === choice ? " is-selected" : ""}`} key={sound.id}>
                        <button type="button" onClick={() => playSound(sound.objectUrl, sound.safeName)}>▶</button>
                        <div>
                          <strong>{sound.safeName}</strong>
                          <small>{sound.originalName} · {sound.duration.toFixed(1)}초 · {(sound.size / 1024).toFixed(0)}KB</small>
                        </div>
                        <div className="filter-v2-user-sound-actions">
                          <button type="button" className="filter-v2-sound-apply" onClick={() => {
                            if (!gearPreview) return;
                            setSoundState((current) => ({ ...current, [gearSoundKey(gearPreview)]: choice }));
                          }}>적용</button>
                          <button type="button" className="filter-v2-user-sound-delete" onClick={() => removeCustomSound(sound)}>삭제</button>
                        </div>
                      </div>
                    );
                  })
                )}

                {customSoundMessage ? <div className="filter-v2-user-sound-message">{customSoundMessage}</div> : null}
                <details className="filter-v2-user-sound-guide">
                  <summary>개인 커스텀 사운드 가이드</summary>
                  <div>
                    <p>지원 형식은 우선 MP3이며, 권장 길이는 {CUSTOM_SOUND_RECOMMENDED_DURATION}입니다. 최대 2MB / {CUSTOM_SOUND_MAX_DURATION}초까지 등록할 수 있습니다.</p>
                    <p>등록 후 ▶ 버튼으로 미리듣기하고 현재 단계/BaseType에 적용할 수 있습니다.</p>
                    <p>최종 필터 다운로드에서는 실제 사용 중인 개인 MP3가 .filter와 함께 ZIP에 포함됩니다.</p>
                  </div>
                </details>

                <div className="filter-v2-sound-controls">
                  <button type="button" onClick={stopSound}>■ 정지</button>
                  <span>{soundMessage || "미리듣기 버튼으로 확인"}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="filter-v2-item-preview">NeverSink {selectedStrictness}</div>
              <strong>{section.ko}</strong>
              <p>왼쪽 설정을 변경하면 현재 상태가 여기에 표시됩니다.</p>
            </>
          )}
        </div>

        <div className="filter-v2-preview-info">
          <div>
            <span>BASE</span>
            <strong>NeverSink {selectedStrictness}</strong>
          </div>
          <div>
            <span>VERSION</span>
            <strong>{NEVER_SINK.version}</strong>
          </div>
          <div>
            <span>BASE FILE</span>
            <strong>{selectedBase.id}</strong>
          </div>
          <div>
            <span>RULE INDEX</span>
            <strong>{neverSinkBaseline ? `${neverSinkBaseline.ruleCount} RULES` : neverSinkBaselineError ? "ERROR" : "LOADING"}</strong>
          </div>
          <div>
            <span>OUTPUT</span>
            <strong>{sanitizeExportBaseName(exportBaseName, defaultExportBaseName(selectedStrictness))}.filter</strong>
          </div>
        </div>

      </aside>
    </div>
  );
}
