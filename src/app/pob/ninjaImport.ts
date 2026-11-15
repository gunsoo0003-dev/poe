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
  characterClass?: string;
  ascendancy?: string;
  portraitUrl?: string;
  mainSkill?: string;
  dps?: string;
  life?: string;
  energyShield?: string;
  fetchedAt: string;
  detailSource: "poe-ninja-character-json" | "public-page" | "url-only" | "path-of-building-export";
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
  const poe2Index = parts.findIndex((part) => part.toLowerCase() === "poe2");
  if (poe2Index < 0) throw new Error("POE2 캐릭터 링크가 아닙니다.");

  // poe.ninja has used both public route shapes. Locale prefixes such as /ko/
  // are intentionally ignored; account and character path segments are decoded
  // exactly once so Korean/Japanese/Chinese names remain intact.
  let leagueRaw = "";
  let accountRaw = "";
  let characterRaw = "";
  const routeType = (parts[poe2Index + 1] ?? "").toLowerCase();

  if (routeType === "builds") {
    leagueRaw = parts[poe2Index + 2] ?? "";
    if ((parts[poe2Index + 3] ?? "").toLowerCase() !== "character") {
      throw new Error("POE2 Builds 캐릭터 상세 링크를 입력해 주세요.");
    }
    accountRaw = parts[poe2Index + 4] ?? "";
    characterRaw = parts[poe2Index + 5] ?? "";
  } else if (routeType === "profile") {
    accountRaw = parts[poe2Index + 2] ?? "";
    leagueRaw = parts[poe2Index + 3] ?? "";
    if ((parts[poe2Index + 4] ?? "").toLowerCase() !== "character") {
      throw new Error("POE2 Profile 캐릭터 상세 링크를 입력해 주세요.");
    }
    characterRaw = parts[poe2Index + 5] ?? "";
  } else {
    throw new Error("POE2 poe.ninja Builds 또는 Profile 캐릭터 링크를 입력해 주세요.");
  }

  let leagueSlug: string;
  let account: string;
  let character: string;
  try {
    leagueSlug = decodeURIComponent(leagueRaw);
    account = decodeURIComponent(accountRaw);
    character = decodeURIComponent(characterRaw);
  } catch {
    throw new Error("링크의 리그·계정·캐릭터 이름 인코딩을 해석할 수 없습니다.");
  }

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
