const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.join(__dirname,'../src/app/pob');const cache={};
function mod(name){if(cache[name])return cache[name];const file=path.join(root,name+'.ts');const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const output={};vm.runInNewContext(compiled,{exports:output,require:(dep)=>{if(dep==='./web-engine/calc-client'||dep==='./web-engine/calc-api')return {};if(!dep.startsWith('./'))throw Error('unexpected '+dep);return mod(path.posix.normalize(path.posix.join(path.posix.dirname(name),dep.slice(2))));}});return cache[name]=output;}
const {calculateComparison}=mod('pobCompare');
const source=['FIXLGS-EN-V004','Rarity: RARE','Test Ring','Gold Ring','Implicits: 0','+15 to Strength'].join('\n');
const audit={lines:[{line:'+15 to Strength',group:'explicit',modifierCount:1,extra:''}],unrecognized:[],emptyModifier:[],total:1,nativeModifiers:1};
async function run(activateBonded){let id=0,now=1,steps=0;const equipped=new Map();const engine={
 async loadBuild(){return {success:true}},
 async getSkills(){return {weaponSet:now,mainSocketGroup:1,groups:[{index:1,slot:'Helmet',enabled:true,activeSkillNames:['Spark']}],skills:[]}},
 async setWeaponSet(n){now=n},async getGroupDps(i,s){return {dps:100,groupIndex:i,weaponSet:s,restoredGroup:i,restoredWeaponSet:s}},
 async getStats(){return {Life:123}},async addCustomItem(){return {success:true,itemId:++id,nativeAudit:audit}},
 async equipItem(itemId,target){steps++;equipped.set(target,itemId);return {equippedSlot:target,equippedItemId:itemId,diagnostic:{hasModList:true,parsedModCount:1,runeLineCount:0,runeParsedLines:[],runeUnknownLines:[],runeNamesUnknown:[],bondedEnabled:activateBonded&&equipped.size===2,bondedUnknownLines:['Bonded: Unsupported Conditional Effect']}}},
 async getSlotItems(target){return [{itemId:equipped.get(target),isEquipped:true}]} };
 const result=await calculateComparison(engine,{skills:[]},'xml',{'ring-a':{raw:source},'ring-b':{raw:source}});
 return {result,steps};
}
(async()=>{
 const off=await run(false);assert.equal(off.result.nativeParserStatus,'passed');assert.equal(off.steps,4);
 const on=await run(true);assert.equal(on.result.nativeParserStatus,'blocked');assert.equal(Object.keys(on.result.simulation).length,0);
 console.log('V227 final multi-equipment condition regression: PASS (inactive allowed, final active blocked, after DPS hidden)');
})().catch(err=>{console.error(err);process.exit(1)});
