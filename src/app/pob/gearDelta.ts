import type { ImportedCharacter, ImportedItem } from "./ninjaImport";
import type { TradeItem } from "./tradeItem";

export type GearDelta = { key: string; label: string; before: number; after: number; delta: number };
const patterns: { key: string; label: string; rx: RegExp }[] = [
  { key: "str", label: "Strength (장비 고정 수치)", rx: /^(?:\[Strength\|힘\]|Strength|힘)\s*\+?(\d+)$/i },
  { key: "dex", label: "Dexterity (장비 고정 수치)", rx: /^(?:\[Dexterity\|민첩\]|Dexterity|민첩)\s*\+?(\d+)$/i },
  { key: "int", label: "Intelligence (장비 고정 수치)", rx: /^(?:\[Intelligence\|지능\]|Intelligence|지능)\s*\+?(\d+)$/i },
  { key: "life", label: "Maximum Life (장비 고정 수치)", rx: /^(?:\+?(\d+)\s*(?:to maximum Life|최대 생명력)|(?:최대 생명력|Life)\s*\+?(\d+))$/i },
  { key: "mana", label: "Maximum Mana (장비 고정 수치)", rx: /^(?:\+?(\d+)\s*(?:to maximum Mana|최대 마나)|(?:최대 마나|Mana)\s*\+?(\d+))$/i },
  { key: "fire", label: "Fire Resistance (장비 고정 %p)", rx: /^(?:\+?(\d+)%?\s*(?:to Fire Resistance|화염 저항)|(?:화염 저항|Fire Resistance)\s*\+?(\d+)%?)$/i },
  { key: "cold", label: "Cold Resistance (장비 고정 %p)", rx: /^(?:\+?(\d+)%?\s*(?:to Cold Resistance|냉기 저항)|(?:냉기 저항|Cold Resistance)\s*\+?(\d+)%?)$/i },
  { key: "lightning", label: "Lightning Resistance (장비 고정 %p)", rx: /^(?:\+?(\d+)%?\s*(?:to Lightning Resistance|번개 저항)|(?:번개 저항|Lightning Resistance)\s*\+?(\d+)%?)$/i },
  { key: "chaos", label: "Chaos Resistance (장비 고정 %p)", rx: /^(?:\+?(\d+)%?\s*(?:to Chaos Resistance|카오스 저항)|(?:카오스 저항|Chaos Resistance)\s*\+?(\d+)%?)$/i },
];
function flattenTag(s: string) { return s.replace(/\[([^|\]]+)\|([^\]]+)\]/g, "$2").trim(); }
function readMods(lines: string[]) {
  const totals: Record<string,number> = {};
  for (const raw of lines) {
    const text = flattenTag(raw).replace(/\s*\((?:implicit|crafted|fractured|enchant)\)\s*$/i, "").trim();
    for (const p of patterns) {
      const match = p.rx.exec(text);
      if (match) { totals[p.key] = (totals[p.key] ?? 0) + Number(match[1] ?? match[2]); break; }
    }
  }
  return totals;
}
function norm(value?: string) { return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
export function sourceItemForSlot(character: ImportedCharacter, slot: string, weaponSet: 1 | 2): ImportedItem | undefined {
  const aliases: Record<string,string[]> = {
    weapon: weaponSet === 1 ? ["weapon","weapon1","mainhand"] : ["weapon2","mainhand2"],
    offhand: weaponSet === 1 ? ["offhand","offhand1"] : ["offhand2"],
    helm:["helm","helmet"],body:["bodyarmour","bodyarmor"],gloves:["gloves"],boots:["boots"],
    "ring-a":["ring","ring1"],"ring-b":["ring2"],amulet:["amulet"],belt:["belt"],
    "charm-a":["charm1"],"charm-b":["charm2"],"charm-c":["charm3"],
    "flask-a":["lifeflask"],"flask-b":["manaflask"]
  };
  return character.items?.find(item => (aliases[slot] ?? []).includes(norm(item.slot)));
}
export function calculateGearDelta(character: ImportedCharacter | null, selected: Record<string, TradeItem>, weaponSet: 1 | 2): { rows: GearDelta[]; warnings: string[] } {
  if (!character) return {rows:[],warnings:[]};
  const previous: Record<string,number> = {}, next: Record<string,number> = {};
  const warnings: string[] = [];
  for (const [slot,item] of Object.entries(selected)) {
    const match = /^(weapon|offhand)-set-([12])$/.exec(slot);
    const effectiveSlot = match ? match[1] : slot;
    const effectiveSet = match ? (Number(match[2]) as 1 | 2) : weaponSet;
    const existing = sourceItemForSlot(character,effectiveSlot,effectiveSet);
    if (!existing) { warnings.push(`${slot}: 기존 장비 데이터를 찾지 못해 비교를 제외했어.`); continue; }
    const before = readMods(existing.mods ?? []), after = readMods(item.modifiers);
    for (const key of new Set([...Object.keys(before),...Object.keys(after)])) {
      previous[key]=(previous[key]??0)+(before[key]??0);
      next[key]=(next[key]??0)+(after[key]??0);
    }
  }
  const rows=patterns.filter(x => (previous[x.key]??0)!==(next[x.key]??0)).map(x=>({key:x.key,label:x.label,before:previous[x.key]??0,after:next[x.key]??0,delta:(next[x.key]??0)-(previous[x.key]??0)}));
  return {rows,warnings};
}
