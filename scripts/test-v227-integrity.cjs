const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');const vm=require('node:vm');
const base=path.join(__dirname,'../src/app/pob');
function load(name,requires={}) {
 const raw=fs.readFileSync(path.join(base,name),'utf8');
 const compiled=ts.transpileModule(raw,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const exp={};vm.runInNewContext(compiled,{exports:exp,require:x=>requires[x]??{} });return exp;
}
const {validateNativeItemAudit}=load('nativeIntegrity.ts');
const {validateReconstructedRunes}=load('runeSourceAudit.ts');
const {convertTradeToPob}=load('tradeToPob.ts');
const {getMeasuredSkill}=load('pobCompare.ts');
const group=(g,txt,n=1)=>({group:g,line:txt,modifierCount:n,extra:''});
const audit=(lines,empty=[])=>({lines,unrecognized:[],emptyModifier:empty,total:lines.length,nativeModifiers:lines.reduce((s,l)=>s+l.modifierCount,0)});
let n=0;const check=(name,fn)=>{fn();n++;console.log('PASS '+name)};
check('Rune and enchant classifications cannot substitute',()=>{
 const native=audit([group('rune','+15 to Strength')]);
 assert.equal(validateNativeItemAudit(native,['{enchant}+15 to Strength']).verified,false);
 assert.equal(validateNativeItemAudit(native,['{rune}+15 to Strength']).verified,true);
});
check('Natural implicit and explicit text still pass',()=>{
 assert.equal(validateNativeItemAudit(audit([group('implicit','+15 to Strength')]),['+15 to Strength']).verified,true);
});
check('Known structural flags accepted but unknown zero-mods blocked',()=>{
 assert.equal(validateNativeItemAudit(audit([group('explicit','Implicit Modifiers Cannot Be Changed',0)], [{group:'explicit',line:'Implicit Modifiers Cannot Be Changed'}]),['Implicit Modifiers Cannot Be Changed']).verified,true);
 assert.equal(validateNativeItemAudit(audit([group('explicit','Unknown Special Effect',0)], [{group:'explicit',line:'Unknown Special Effect'}]),['Unknown Special Effect']).verified,false);
});
check('Inactive Bonded deferred, unrecognized non-bonded kept unsafe',()=>{
 const x=audit([group('rune','Bonded: Archon recovery period expires 30% faster',0)] ,[{group:'rune',line:'Bonded: Archon recovery period expires 30% faster'}]);
 assert.equal(validateNativeItemAudit(x,['{rune}Bonded: Archon recovery period expires 90% faster'],{deferBonded:true}).verified,true);
 assert.equal(validateNativeItemAudit(x,['{rune}Bonded: Archon recovery period expires 90% faster']).verified,false);
});
check('Rune amplification matches reconstructed base without custom DPS calculation',()=>{
 const src=['105% increased Spell Damage','+270 to maximum Mana','+9 to Level of all Spell Skills','84% increased Critical Hit Chance for Spells','Gain 15% of Damage as Extra Damage of all Elements'];
 const native=['35% increased Spell Damage','+90 to maximum Mana','+3 to Level of all Spell Skills','28% increased Critical Hit Chance for Spells','Gain 5% of Damage as Extra Damage of all Elements'];
 assert.equal(validateReconstructedRunes(src,native,'200% increased effect of Socketed Runes').length,0);
 const bad=[...native];bad[1]='+70 to maximum Mana';
 assert.ok(validateReconstructedRunes(src,bad,'200% increased effect of Socketed Runes').length);
});
check('Invalid extra native rune blocked',()=>{
 assert.ok(validateReconstructedRunes(['+90 to maximum Mana'],['+30 to maximum Mana','Unknown Rune 100%'],'200% increased effect of Socketed Runes').length);
});
check('Actual Socketed Runes wording blocks incomplete rune identity',()=>{
 const source=['FIXLGS-EN-V004','Rarity: UNIQUE','Rune Test','Runic Fork','Implicits: 0','200% increased effect of Socketed [Rune|Runes]','105% increased [Spell] Damage (rune)','FIXLGS-META-V1:'+JSON.stringify({sockets:'S S',socketed:[{type:'Perfect Iron Rune',mods:['35% increased Spell Damage']}],warnings:['Socketed item effects require PoB verification']})].join('\n');
 const result=convertTradeToPob(source);
 assert.ok(result.unsupported.some(x=>x.includes('소켓 증폭')));
});
check('Duplicate names cannot silently choose first skill',()=>{
 const a={weaponSet:1,calculatedSkills:{3:{weaponSet:1,groupIndex:3,dps:18,slot:'Helmet',activeSkillNames:['Summon Skeleton']},7:{weaponSet:1,groupIndex:7,dps:360,slot:'Weapon 1',activeSkillNames:['Summon Skeleton']}}};
 assert.equal(getMeasuredSkill(a,'Summon Skeleton'),undefined);
 assert.equal(getMeasuredSkill(a,'Summon Skeleton',7)?.dps,360);
 const unmeasured={...a,skills:{groups:[{index:3,enabled:true,activeSkillNames:['Summon Skeleton']},{index:7,enabled:true,activeSkillNames:['Summon Skeleton']}]},calculatedSkills:{3:a.calculatedSkills[3]}};
 assert.equal(getMeasuredSkill(unmeasured,'Summon Skeleton'),undefined);
});
console.log('V227 integrity regression: '+n+'/'+n+' PASS');
