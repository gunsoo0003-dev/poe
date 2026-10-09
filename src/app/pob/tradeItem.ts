/** FIXLGS EXPORT clipboard text. This is a preview/parser, NOT a PoB calculation. */
export type TradeItem = {
  raw: string;
  rarity: string;
  name: string;
  baseType: string;
  category: string;
  itemLevel?: number;
  properties: string[];
  modifiers: string[];
  flags: string[];
};

const divider = /^-{4,}$/;
const categoryNames = /^(?:\[[^\]]+\|)?(?:창|검|도끼|철퇴|활|석궁|지팡이|완드|단검|홀|방패|투구|갑옷|장갑|장화|신발|허리띠|반지|목걸이|호신부|플라스크|Spear|Sword|Axe|Mace|Bow|Crossbow|Staff|Wand|Dagger|Sceptre|Shield|Helmet|Body Armour|Gloves|Boots|Belt|Ring|Amulet|Charm|Flask)/i;
const flags = /^(Corrupted|Unidentified|Mirrored|Split|Replica|Synthesised|Veiled|타락|미확인|복제)$/i;

export function parseTradeItem(input: string): TradeItem {
  const raw = input.replace(/\r\n?/g, "\n").replace(/^FIXLGS-EN-V004\n/, "").trim();
  if (!raw || raw.length > 60000) throw new Error("FIXLGS EXPORT 텍스트를 60KB 이내로 붙여넣어 주세요.");
  if (/^https?:\/\//i.test(raw)) throw new Error("거래소 링크가 아니라 FIXLGS EXPORT 버튼으로 복사한 아이템 텍스트를 붙여넣어 주세요.");
  // V004 official English export is line-oriented (no dashed dividers).
  const isEnglish = /^FIXLGS-EN-V004\r?\n/.test(input.trim());
  if (isEnglish) {
    const parts = raw.split('\n').map(x => x.trim()).filter(Boolean).filter(x => !x.startsWith('FIXLGS-META-V1:'));
    const implicitIndex = parts.findIndex(x => /^Implicits:\s*\d+$/i.test(x));
    if (implicitIndex < 2 || !/^Rarity:/i.test(parts[0])) throw new Error('영문 EXPORT 데이터가 불완전합니다.');
    const names = parts.slice(1, implicitIndex).filter(x => !/^(Quality:|Item Level:|Sockets:)/i.test(x));
    const baseType = names[names.length - 1] || '';
    const name = names.length > 1 ? names[0] : baseType;
    const lvl = parts.find(x => /^Item Level:/.test(x));
    const implicitCount = Number(parts[implicitIndex].match(/\d+/)?.[0] || 0);
    return {
      raw: input.trim(), rarity: parts[0].replace(/^Rarity:\s*/i, ''),
      name, baseType, category: '',
      itemLevel: lvl ? Number(lvl.match(/\d+/)?.[0]) : undefined,
      properties: parts.filter(x => /^(Quality:|Item Level:|Implicits:)/i.test(x)),
      modifiers: parts.slice(implicitIndex + 1 + implicitCount).filter(x => !flags.test(x)),
      flags: parts.filter(x => flags.test(x)),
    };
  }

  const parsedRaw = raw.includes("--------") ? raw : raw.replace(/\n(?=Quality:|Item Level:|Implicits:)/g, "\n--------\n");
  const lines = parsedRaw.split("\n").map((s) => s.trim()).filter(Boolean);
  const rarityMatch = /^Rarity:\s*(Normal|Magic|Rare|Unique|Currency|Gem|Divination Card)\s*$/i.exec(lines[0] || "");
  if (!rarityMatch) throw new Error("아이템 데이터 형식을 인식하지 못했어. 거래소 매물의 FIXLGS EXPORT를 눌러 다시 복사해 줘.");
  const headerEnd = lines.findIndex((line, i) => i > 0 && divider.test(line));
  if (headerEnd < 2) throw new Error("아이템 이름/베이스 정보가 부족해. EXPORT 결과 전체를 복사해 줘.");
  const names = lines.slice(1, headerEnd);
  const baseType = names.length > 1 ? names[names.length - 1] : names[0];
  const name = names[0];
  const blocks = parsedRaw.split(/\n\s*-{4,}\s*\n/).slice(1);
  const details = blocks.flatMap((block) => block.split("\n").map((s) => s.trim()).filter(Boolean));
  const itemLevelText = details.find((line) => /^Item Level:\s*\d+/i.test(line));
  const level = itemLevelText ? Number(itemLevelText.match(/\d+/)?.[0]) : undefined;
  const category = details.find((line) => categoryNames.test(line)) ?? "";
  const properties = details.filter((line) => /(?:피해:|Damage:|확률:|Chance:|횟수:|Second:|Quality|퀄리티|Sockets:|스킬 부여|Grants Skill|Requirements:|레벨:|Strength|Dexterity|Intelligence|힘:|민첩:|지능:)/i.test(line));
  const modifiers = blocks.slice(1).flatMap((block) => block.split("\n").map((s) => s.trim()).filter(Boolean)).filter((line) => !flags.test(line) && !/^Item Level:|^Requirements:|^Sockets:|^\s*(?:레벨|Strength|Dexterity|Intelligence|힘|민첩|지능):/i.test(line) && !categoryNames.test(line));
  return {raw, rarity:rarityMatch[1], name, baseType, category, itemLevel:level, properties, modifiers, flags: details.filter((s) => flags.test(s))};
}
