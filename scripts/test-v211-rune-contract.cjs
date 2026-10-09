const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const output={};
const input=fs.readFileSync(__dirname+'/../src/app/pob/tradeToPob.ts','utf8');
vm.runInNewContext(ts.transpileModule(input,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports:output,require:(m)=>m==='./tradeItem'?{}:null});
const convert=output.convertTradeToPob;
function make(mods, meta) {
  return `FIXLGS-EN-V004\nRarity: RARE\nGrim Edge\nAkoyan Spear\nQuality: 27\nItem Level: 81\nImplicits: 0\n${mods.join('\n')}\n${meta?'FIXLGS-META-V1:'+JSON.stringify(meta)+'\n':''}`;
}
let cases=0;
function check(fn){fn();cases++}
const meta={version:1,sockets:'S',socketed:[{type:"Saqawal's Rune of the Sky",mods:['Gain 5% of Damage as Extra Damage of all Elements']},{type:'Spear Throw',mods:[]}],warnings:['Socketed item effects require PoB verification'],unresolvedMods:[],unknownModGroups:{}};
const modLines=['[Gain] 5% of Damage as Extra Damage of all [ElementalDamage|Elements] (rune)','[ShamanOnlyMods|Bonded]: 8% chance to gain an additional random [Charges|Charge] when you gain a Charge (rune)','134% increased [Physical] Damage','Grants Skill: Spear Throw'];
const result=convert(make(modLines,meta));
check(()=>assert.match(result.rawText,/Sockets: S\nRune: Saqawal's Rune of the Sky\nImplicits: 2\n\{rune\}Gain 5%/));
check(()=>assert.match(result.rawText,/\{rune\}Bonded: 8% chance/));
check(()=>assert.ok(!result.rawText.includes('FIXLGS-META-')));
check(()=>assert.equal(result.unsupported.length,0));
check(()=>assert.match(result.rawText,/\n134% increased Physical Damage\n/));
check(()=>assert.match(result.rawText,/\nQuality: 27\n/));
check(()=>assert.equal(result.included.filter(x=>x.includes('{rune}')).length,2));
const none=convert(make(['30% increased effect of Socketed Rune Items', '20% increased Physical Damage (rune)'],{sockets:'S S',socketed:[{type:'Perfect Iron Rune',mods:['20% increased Physical Damage']}],warnings:['Socketed item effects require PoB verification']}));
check(()=>assert.ok(none.unsupported.some(x=>x.includes('소켓 증폭'))));
check(()=>assert.ok(!none.rawText.includes('Rune: ')));
const noSocket=convert(make(['20% increased [Physical] Damage (rune)'],{}));
check(()=>assert.match(noSocket.rawText,/Implicits: 1\n\{rune\}20% increased Physical Damage/));
const ench=convert(make(['Adds 5 to 10 [Cold|Cold] Damage (enchant)'],{}));
check(()=>assert.match(ench.rawText,/Implicits: 1\n\{enchant\}Adds 5 to 10 Cold Damage/));
const unknown=convert(make(['20% increased [Physical] Damage (rune)'],{warnings:['Unparsed official modifier'],unresolvedMods:['test']}));
check(()=>assert.ok(unknown.unsupported.length>0));
const implicit=make(['[Gain] 5% of Damage as Extra Damage of all [ElementalDamage|Elements] (rune)', '200% increased [Physical] Damage'],{}).replace('Implicits: 0\n','Implicits: 1\n50% increased [Melee] [Strike] Range with this weapon\n');
check(()=>assert.match(convert(implicit).rawText,/Implicits: 2\n\{rune\}Gain 5%[^\n]*\n50% increased Melee Strike Range with this weapon\n200% increased Physical Damage/));
const empty=convert('FIXLGS-EN-V004\nRarity: NORMAL\nIron Ring\nImplicits: 0\nFIXLGS-META-V1:{"sockets":"","socketed":[],"warnings":[]}');
check(()=>assert.ok(!empty.unsupported.length));
console.log(`V211 contract PASS (${cases} assertions)`);
