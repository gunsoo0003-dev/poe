const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'../src/app/pob');const cache={};
function mod(name){if(cache[name])return cache[name];const file=path.join(root,name+'.ts');const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const output={};vm.runInNewContext(compiled,{exports:output,require:(dep)=>{
if(dep==='./web-engine/calc-client'||dep==='./web-engine/calc-api')return {};
if(!dep.startsWith('./'))throw Error('unexpected dep '+dep);
const normalized=path.posix.normalize(path.posix.join(path.posix.dirname(name),dep.slice(2)));
return mod(normalized);
}});return cache[name]=output;}
const {calculateComparison}=mod('pobCompare');
const validLine={group:'explicit',line:'+15 to Strength',modifierCount:1,extra:''};
const badLine={group:'explicit',line:'Unknown Unhandled Modifier',modifierCount:0,extra:'Unknown Unhandled Modifier'};
const valid={lines:[validLine],total:1,nativeModifiers:1,unrecognized:[],emptyModifier:[]};
const bad={lines:[validLine,badLine],total:2,nativeModifiers:1,unrecognized:[{group:'explicit',line:badLine.line,extra:badLine.extra}],emptyModifier:[]};
const source=['FIXLGS-EN-V004','Rarity: RARE','Test Spear','Akoyan Spear','Implicits: 0','+15 to Strength'].join('\n');
const char={skills:[]};
let equips=0, audit, currentSet=1;
const engine={
async loadBuild(){return {success:true}},
async getSkills(){return {weaponSet:currentSet,mainSocketGroup:1,groups:[{index:1,activeSkillNames:['Spark'],slot:'Weapon 1'}]}},
async setWeaponSet(s){currentSet=s},
async getGroupDps(i,s){return {dps:100,index:i,groupIndex:i,weaponSet:s,restoredGroup:i,restoredWeaponSet:s}},
async getStats(){return {Life:100,TotalDPS:100}},
async addCustomItem(){return {success:true,itemId:99,nativeAudit:audit}},
async equipItem(){equips++;return {items:[],equippedItemId:99,equippedSlot:'Weapon 1',diagnostic:{hasModList:true,parsedModCount:1,runeLineCount:0,runeParsedLines:[],runeUnknownLines:[],runeNamesUnknown:[],bondedUnknownLines:[]}}},
async getSlotItems(){return [{itemId:99,isEquipped:true}]}
};
(async()=>{
 audit=bad;
 let result=await calculateComparison(engine,char,'ignored',{'weapon-set-1':{raw:source}});
 assert.equal(result.nativeParserStatus,'blocked');assert.equal(Object.keys(result.simulation).length,0);
 assert.ok(result.original[1]?.stats.Life===100);
 assert.equal(equips,0);
 audit=valid;
 result=await calculateComparison(engine,char,'ignored',{'weapon-set-1':{raw:source}});
 assert.equal(result.nativeParserStatus,'passed');assert.equal(equips,1);
 assert.ok(result.simulation[1]);
 console.log('V225 PoB native parser block/valid comparison: PASS (CURRENT preserved, invalid AFTER hidden, no fake DPS)');
})().catch(err=>{console.error(err);process.exit(1)});
