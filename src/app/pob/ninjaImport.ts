export type NinjaCharacterRef = {
  originalUrl: string;
  leagueSlug: string;
  account: string;
  character: string;
};

export type ImportedItem = {
  slot?: string;
  kind?: "equipment" | "jewel";
  name?: string;
  baseType?: string;
  rarity?: string;
  icon?: string;
  itemLevel?: number;
  quality?: string;
  mods: string[];
};

export type ImportedSkillGem = {
  name: string;
  icon?: string;
  level?: number;
};

export type ImportedCharacterStat = {
  key: string;
  label: string;
  value: string;
  group?: string;
};

export type ImportedSkill = {
  name: string;
  icon?: string;
  supports: string[];
  supportGems?: ImportedSkillGem[];
  dps?: string;
  dpsValue?: number;
  slot?: number;
};

export type RawInventoryDebug = {
  path: string;
  inventoryId?: string;
  x?: number;
  slot?: string;
  name?: string;
  baseType?: string;
};

export type ImportedCharacter = NinjaCharacterRef & {
  verified: boolean;
  pageTitle?: string;
  level?: number;
  ascendancy?: string;
  portraitUrl?: string;
  mainSkill?: string;
  dps?: string;
  life?: string;
  energyShield?: string;
  fetchedAt: string;
  detailSource: "poe-ninja-character-json" | "public-page" | "url-only";
  detailMessage?: string;
  snapshotVersion?: string;
  snapshotName?: string;
  items?: ImportedItem[];
  jewels?: ImportedItem[];
  skills?: ImportedSkill[];
  stats?: ImportedCharacterStat[];
  pathOfBuildingExport?: string;
  rawInventoryDebug?: RawInventoryDebug[];
  pathOfBuildingExportLength?: number;
};

const NINJA_HOSTS = new Set(["poe.ninja", "www.poe.ninja"]);

export function parseNinjaCharacterUrl(input: string): NinjaCharacterRef {
  const raw = input.trim();
  if (!raw) throw new Error("poe.ninja 캐릭터 링크를 입력해 주세요.");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("올바른 URL 형식이 아닙니다.");
  }

  if (url.protocol !== "https:" || !NINJA_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("poe.ninja의 HTTPS 캐릭터 링크만 지원합니다.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const poe2Index = parts.indexOf("poe2");
  const buildsIndex = parts.indexOf("builds");
  const characterIndex = parts.indexOf("character");

  if (
    poe2Index < 0 ||
    buildsIndex < 0 ||
    characterIndex < 0 ||
    characterIndex + 2 >= parts.length
  ) {
    throw new Error("POE2 poe.ninja 캐릭터 상세 링크를 입력해 주세요.");
  }

  const leagueSlug = decodeURIComponent(parts[buildsIndex + 1] ?? "");
  const account = decodeURIComponent(parts[characterIndex + 1] ?? "");
  const character = decodeURIComponent(parts[characterIndex + 2] ?? "");

  if (!leagueSlug || !account || !character) {
    throw new Error("링크에서 리그·계정·캐릭터 정보를 확인할 수 없습니다.");
  }

  return {
    originalUrl: url.toString(),
    leagueSlug,
    account,
    character,
  };
}
