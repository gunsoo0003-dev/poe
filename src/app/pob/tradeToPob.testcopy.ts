/** Strict FIXLGS Export -> PoB2 item-text adapter. Never silently approximate unsupported mods. */
import { parseTradeItem } from './tradeItem.ts';

const knownBases: Record<string, string> = { '솟구치는 창': 'Soaring Spear' };

export type ConvertedPobItem = { rawText: string; baseName: string; unsupported: string[]; included: string[] };
export function convertTradeToPob(source: string): ConvertedPobItem {
  const item = parseTradeItem(source);
  const baseName = knownBases[item.baseType] ?? (/^[a-z][a-z '-]+$/i.test(item.baseType) ? item.baseType : '');
  if (!baseName) throw new Error(`PoB2 베이스 미확인: ${item.baseType}`);
  if (item.rarity !== 'Rare') throw new Error(`현재 변환 검증 범위 밖: ${item.rarity}`);
  const blocks = source.replace(/\r\n?/g, '\n').split(/\n-{4,}\n/);
  const explicitBlock = blocks.find(b => /\[Attack\|공격\] 속도 \d+% 증가/.test(b)) ?? '';
  const explicitLines = explicitBlock.split('\n').map(x => x.trim()).filter(Boolean);
  const supported: string[] = [];
  const unsupported: string[] = [];
  for (const line of explicitLines) {
    let result: string | undefined;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^\[Attack\|공격\] 속도 (\d+)% 증가$/))) result = `${m[1]}% increased Attack Speed`;
    else if ((m = line.match(/^\[Lightning\|번개\] 피해 (\d+)~(\d+) 추가$/))) result = `Adds ${m[1]} to ${m[2]} Lightning Damage`;
    else if ((m = line.match(/^\[Accuracy\|정확도\] \+(\d+)$/))) result = `+${m[1]} to Accuracy Rating`;
    else if ((m = line.match(/^\[Stun\|기절\] 지속시간 (\d+)% 증가$/))) result = `${m[1]}% increased Stun Duration`;
    if (result) supported.push(result);
    else unsupported.push(line);
  }
  if (!supported.length) throw new Error('PoB2가 해석할 수 있는 명시 옵션이 없습니다.');
  const quality = source.match(/\[Quality\|퀄리티\]:\s*\+(\d+)%/)?.[1];
  const rawText = [
    'Rarity: RARE', 'FIXLGS Converted Item', baseName,
    ...(quality ? [`Quality: ${quality}`] : []),
    ...(item.itemLevel ? [`Item Level: ${item.itemLevel}`] : []),
    'Implicits: 0',
    ...supported,
    ...(item.flags.includes('Corrupted') ? ['Corrupted'] : []),
  ].join('\n');
  return { rawText, baseName, unsupported, included: supported };
}
