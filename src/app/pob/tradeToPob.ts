/** Strict FIXLGS Export -> PoB2 item-text adapter. Never silently approximate unsupported mods. */
import { parseTradeItem } from './tradeItem';

const knownBases: Record<string, string> = { '솟구치는 창': 'Soaring Spear' };

export type ConvertedPobItem = { rawText: string; baseName: string; unsupported: string[]; included: string[] };
export function convertTradeToPob(source: string): ConvertedPobItem {
  if (/^FIXLGS-EN-V004\r?\n/.test(source.trim())) {
    // V004.2 compatible. V004.3's metadata is for auditing only, NEVER passed
    // as an item modifier to the upstream PoB engine.
    const exportedLines = source.replace(/\r\n?/g, "\n").trim().split("\n").slice(1).map(x => x.trim()).filter(Boolean);
    const warnings: string[] = [];
    type ExportMeta = { warnings?: string[]; unknownModGroups?: Record<string, string[]>;
      unresolvedMods?: string[]; unknownGrantedData?: unknown[]; sockets?: string; socketed?: Array<{ type?: string; mods?: string[] }> };
    let metadata: ExportMeta | undefined;
    const lines = exportedLines.filter(line => {
      if (!line.startsWith('FIXLGS-META-V1:')) return true;
      try {
        metadata = JSON.parse(line.slice('FIXLGS-META-V1:'.length)) as ExportMeta;
        if (Array.isArray(metadata?.warnings)) {
          for (const text of metadata.warnings) {
            if (typeof text !== 'string') continue;
            // Presence of a socket is not itself evidence that an effect was omitted.
            // PoB's rune parser and the engine audit below decide applicability.
            if (/Socketed item effects/i.test(text)) continue;
            if (/Unknown modifier groups/i.test(text)) warnings.push('신규 옵션 그룹 확인 필요');
            else if (/Unparsed official modifier/i.test(text)) warnings.push('옵션 데이터 확인 필요');
            else if (/Unidentified item/i.test(text)) warnings.push('미확인 아이템 옵션 확인 불가');
            else warnings.push('추가 옵션 확인 필요');
          }
        }
        if (metadata?.unknownModGroups && Object.values(metadata.unknownModGroups).some(v => Array.isArray(v) && v.length))
          warnings.push('신규 옵션 그룹 확인 필요');
        if (metadata?.unresolvedMods?.length || metadata?.unknownGrantedData?.length)
          warnings.push('일부 옵션 확인 필요');
      } catch { warnings.push('EXPORT 메타데이터 확인 필요'); }
      return false;
    });
    const rarity = /^Rarity:\s*(RARE|MAGIC|UNIQUE|NORMAL)$/i.exec(lines[0] || "");
    if (!rarity) throw new Error('PoB2 장착 불가 아이템 종류 또는 영문 EXPORT 형식 오류');
    const implicitIndex = lines.findIndex(x => /^Implicits:\s*\d+$/i.test(x));
    if (implicitIndex < 2) throw new Error('영문 EXPORT에 Implicits 정보가 없습니다.');
    const header = lines.slice(1, implicitIndex).filter(x => !/^(Quality:|Item Level:|Sockets:)/i.test(x));
    const baseName = header[header.length - 1] || '';
    const itemName = header.length > 1 ? header[0] : '';
    if (!baseName || /[^\x00-\x7f]/.test(baseName)) throw new Error('영문 아이템 베이스를 확인할 수 없습니다.');
    const tagFree = (s: string) => s.replace(/\[([^\]\n]+)\]/g, (_full, content: string) => content.includes('|') ? content.slice(content.lastIndexOf('|') + 1) : content);
    const normaliseMod = (s: string) => {
      const line = tagFree(s).trim();
      // PoB Item:ParseRaw detects (rune) / {rune} and Bonded: itself.
      // Do not flatten rune/enchant lines into ordinary explicit modifiers.
      const marker = /\s*\((rune|enchant)\)\s*$/i.exec(line);
      return marker ? `{${marker[1].toLowerCase()}}${line.slice(0, marker.index).trim()}` : line;
    };
    const quality = lines.find(x => /^Quality:\s*\+?\d+/.test(x));
    const itemLevel = lines.find(x => /^Item Level:\s*\d+/.test(x));
    const implicitCount = Number(lines[implicitIndex].match(/\d+/)?.[0] || '0');
    if (!Number.isInteger(implicitCount) || implicitCount < 0 || implicitCount > 40) throw new Error('Implicits 개수 오류');
    const implicitLines = lines.slice(implicitIndex + 1, implicitIndex + 1 + implicitCount);
    if (implicitLines.length !== implicitCount) throw new Error('Implicits 항목 부족');
    const remaining = lines.slice(implicitIndex + 1 + implicitCount);
    const flags = remaining.filter(x => /^(Corrupted|Mirrored|Unidentified)$/i.test(x));
    // The game's exporter reports 0 natural implicits even when socketed
    // runes appear before explicit modifiers. PoB BuildRaw counts rune/enchant
    // lines in Implicits, so normalize to that canonical shape.
    const classified = [...implicitLines, ...remaining.filter(x => !/^(Corrupted|Mirrored|Unidentified)$/i.test(x))]
      .map(normaliseMod);
    const special = classified.filter(line => /^(\{rune\}|\{enchant\})/.test(line));
    const natural = implicitLines.map(normaliseMod).filter(line => !/^(\{rune\}|\{enchant\})/.test(line));
    const implicit = [...special, ...natural];
    const explicit = remaining.filter(x => !/^(Corrupted|Mirrored|Unidentified)$/i.test(x))
      .map(normaliseMod).filter(line => !/^(\{rune\}|\{enchant\})/.test(line));
    // A socket count can be reported without rune identities. Preserve the
    // count but do not invent which augment is socketed or double-count mods.
    const sockets = metadata?.sockets?.trim();
    const socketCount = sockets ? sockets.split(/\s+/).length : 0;
    if (sockets && (!/^S(?:\s+S)*$/.test(sockets) || socketCount > 20))
      warnings.push('소켓 구성 확인 필요');
    const reliableSockets = sockets && /^S(?:\s+S)*$/.test(sockets) && socketCount <= 20;
    // The official metadata also contains virtual granted skills. Do not
    // mistake them for augments. Rune identities are passed to upstream PoB
    // only if we have an unambiguous 1:1 assignment to every socket.
    const augments = (metadata?.socketed ?? []).filter(entry =>
      typeof entry.type === 'string' && !!entry.type.trim() &&
      Array.isArray(entry.mods) && entry.mods.length > 0);
    const completeAugments = reliableSockets && augments.length === socketCount;
    // Rune/Soul Core-specific scalars require augment identities. Do not
    // claim exact scaling when the exporter supplies only a socket count.
    if (!completeAugments && [...implicit, ...explicit].some(line => /increased effect of Socketed (?:Rune|Soul Core) Items/i.test(line)))
      warnings.push('소켓 증폭 확인 필요');
    const runeSpecs = completeAugments ? augments.map(entry => `Rune: ${entry.type!.trim()}`) : [];
    const rawText = [
      `Rarity: ${rarity[1].toUpperCase()}`, ...(itemName ? [itemName] : []), baseName,
      ...(quality ? [quality] : []), ...(itemLevel ? [itemLevel] : []),
      ...(reliableSockets ? [`Sockets: ${sockets}`] : []), ...runeSpecs,
      `Implicits: ${implicit.length}`, ...implicit, ...explicit, ...flags,
    ].join('\n');
    return { rawText, baseName, unsupported: [...new Set(warnings)], included: [...implicit, ...explicit] };
  }

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
