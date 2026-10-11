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
  let leaguePart: string | undefined;
  let accountPart: string | undefined;
  let characterPart: string | undefined;

  // poe.ninja supports more than one POE2 character URL layout.
  // Legacy builds URL: /poe2/builds/{league}/character/{account}/{character}
  // Profile URL:       /poe2/profile/{account}/{league}/character/{character}
  // In particular, never assume that "account" always follows /character/.
  if (
    parts.length === 6 &&
    parts[0] === "poe2" &&
    parts[1] === "builds" &&
    parts[3] === "character"
  ) {
    leaguePart = parts[2];
    accountPart = parts[4];
    characterPart = parts[5];
  } else if (
    parts.length === 6 &&
    parts[0] === "poe2" &&
    parts[1] === "profile" &&
    parts[4] === "character"
  ) {
    accountPart = parts[2];
    leaguePart = parts[3];
    characterPart = parts[5];
  } else {
    throw new Error("POE2 poe.ninja 캐릭터 상세 링크를 입력해 주세요.");
  }

  // URL.pathname stores non-ASCII segments percent-encoded. Decode every segment
  // exactly once (including Korean/Japanese/Chinese account and character names).
  let leagueSlug: string;
  let account: string;
  let character: string;
  try {
    leagueSlug = decodeURIComponent(leaguePart);
    account = decodeURIComponent(accountPart);
    character = decodeURIComponent(characterPart);
  } catch {
    throw new Error("링크의 계정명 또는 캐릭터명 URL 인코딩이 올바르지 않습니다.");
  }

  if (!leagueSlug.trim() || !account.trim() || !character.trim()) {
    throw new Error("링크에서 리그·계정·캐릭터 정보를 확인할 수 없습니다.");
  }

  return {
    originalUrl: url.toString(),
    leagueSlug,
    account,
    character,
  };
}
