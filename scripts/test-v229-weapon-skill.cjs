const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const ROOT=path.resolve(__dirname,'..');
const read=(s)=>fs.readFileSync(path.join(ROOT,s),'utf8');
const source=read('src/app/pob/pobCompare.ts');
const code=ts.transpileModule(source,{fileName:'pobCompare.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const pc={exports:{},require:()=>({})};
vm.runInNewContext(code,pc,{filename:'pobCompare.js'});
const ranked=pc.exports.rankMeasuredSkillGroups;
assert.equal(typeof ranked,'function');
const groups=[
 {index:1,slot:'Weapon 1',activeSkillNames:['Spark'],enabled:true},
 {index:5,slot:'Weapon 2',activeSkillNames:['Lightning Bolt'],enabled:true},
 {index:6,slot:'Weapon 2',activeSkillNames:['Lightning Bolt'],enabled:true},
];
const make=(index, name, dps, slot)=>({groupIndex:index,weaponSet:1,activeSkillNames:[name],dps,slot});
const snapshot={weaponSet:1,skills:{groups},calculatedSkills:{
 1:make(1,'Spark',289338.81,'Weapon 1'),
 5:make(5,'Lightning Bolt',1200000,'Weapon 2'),
 6:make(6,'Lightning Bolt',400000,'Weapon 2'),
}};
assert.deepEqual(Array.from(ranked(snapshot),x=>x.groupIndex),[5,6,1], 'Measured highest Lightning Bolt group must lead');
assert.equal(pc.exports.getMeasuredSkill(snapshot,'Lightning Bolt'),undefined,'Name-only duplicate matching must remain blocked');
assert.equal(pc.exports.getMeasuredSkill(snapshot,'Lightning Bolt',5).dps,1200000);
assert.equal(ranked({...snapshot,weaponSet:2}).length,0,'Cannot borrow DPS across weapon sets');
const page=read('src/app/pob/page.tsx');
assert.match(page,/weapon-slot-set-badge/);
assert.match(page,/>\s*\{weaponSet\}\s*<\/span>/);
const compiled=ts.transpileModule(page,{fileName:'page.tsx',compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const jsx=(type,props,key)=>({type,props,key});
const mocks={
 'react/jsx-runtime':{jsx,jsxs:jsx},'react':{},'next/link':{default:'Link'},
 '@/lib/pobGuides':{pobGuides:[]},'./tradeItem':{},'./pobCompare':{
   getMeasuredSkill:pc.exports.getMeasuredSkill,rankMeasuredSkillGroups:ranked},
 './web-engine/calc-client':{},'./ninjaImport':{},'./ringSlots':{},
};
const pageCtx={exports:{},require:(id)=>{if(!(id in mocks))throw new Error(`mock needed: ${id}`);return mocks[id]}};
vm.runInNewContext(compiled,pageCtx,{filename:'page.js'});
const ninjaSkills=[{name:'Spark',supports:[],dpsValue:500000},{name:'Lightning Bolt',supports:[],dpsValue:300000}];
const main=pageCtx.exports.buildMainSkillUi({...snapshot,skills:{...snapshot.skills,mainSocketGroup:5}},ninjaSkills,'Spark');
assert.equal(main[0].name,'Spark','Ninja main skill has priority even when other PoB group has higher DPS');
assert.equal(main[0].dps,'289,338.81');
assert.equal(main[1].name,'Lightning Bolt','No extra PoB group suffix in original ninja skill name');
assert.equal(main[1].dps,'1,200,000');
const sameNameOtherMain=pageCtx.exports.buildMainSkillUi({...snapshot,skills:{...snapshot.skills,mainSocketGroup:6}},ninjaSkills,'Lightning Bolt');
assert.equal(sameNameOtherMain[0].name,'Lightning Bolt');
assert.equal(sameNameOtherMain[0].dps,'400,000','Duplicate group uses native PoB main identity, NOT highest DPS');
const ambiguous=pageCtx.exports.buildMainSkillUi({...snapshot,skills:{...snapshot.skills,mainSocketGroup:1}},ninjaSkills,'Lightning Bolt');
assert.equal(ambiguous[0].dps,'—','Unresolvable duplicate must not invent a DPS');
console.log('V230 ninja authority / PoB group identity / weapon badge: PASS');
// End-to-end mocked PoB capture confirms both Lightning Bolt groups are measured
// without selecting the first group by name.
const cache={};
function loadMod(name){
 if(cache[name])return cache[name];
 const full=path.join(ROOT,'src/app/pob',name+'.ts');
 const text=fs.readFileSync(full,'utf8');
 const compiled=ts.transpileModule(text,{fileName:full,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const output={};
 vm.runInNewContext(compiled,{exports:output,require:(dep)=>{
   if(dep==='./web-engine/calc-client'||dep==='./web-engine/calc-api')return {};
   if(!dep.startsWith('./'))throw Error('Unknown dependency: '+dep);
   return loadMod(path.posix.normalize(path.posix.join(path.posix.dirname(name),dep.slice(2))));
 }});
 return cache[name]=output;
}
const {calculateComparison}=loadMod('pobCompare');
let currentSet=1;
const observed=[];
const fakeEngine={
 async loadBuild(){return {success:true}},
 async getSkills(){return {weaponSet:currentSet,mainSocketGroup:1,groups,skills:[]}},
 async setWeaponSet(v){currentSet=v},
 async getGroupDps(index,set){
  observed.push([index,set]);
  return {groupIndex:index,weaponSet:set,restoredGroup:1,restoredWeaponSet:set,dps: index===5 ? 1200000 : index===6 ? 400000 : 289338.81};
 },
 async getStats(){return {Life:1200}},
};
(async()=>{
 const character={mainSkill:'Lightning Bolt',skills:[{name:'Spark',supports:[],dpsValue:289338.81},{name:'Lightning Bolt',supports:[],dpsValue:1200000}]};
 const result=await calculateComparison(fakeEngine,character,'xml',{});
 assert.equal(result.original[1].calculatedSkills[5].dps,1200000);
 assert.equal(result.original[1].calculatedSkills[6].dps,400000);
 assert.equal(observed.filter(x=>x[0]===5).length,1);
 assert.equal(observed.filter(x=>x[0]===6).length,1);
 assert.equal(result.original[2].calculatedSkills[5],undefined,'No borrowing group results into set II');
 assert.equal(result.warnings.some(w=>w.includes('같은 이름의 PoB 그룹')),false,'Identical skill-group info is not a calculation warning');
 assert.equal(result.equipmentTrace.some(w=>w.includes('같은 이름의 PoB 그룹')),true,'Identity info remains available in diagnostics');
 console.log('V229 duplicate-group capture integration: PASS (5 checks)');
})().catch(e=>{console.error(e);process.exitCode=1;});
