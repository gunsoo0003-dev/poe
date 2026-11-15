const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const cache={};
function loadMod(name){
 if(cache[name])return cache[name];
 const file=path.join(root,'src/app/pob',name+'.ts');
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 vm.runInNewContext(js,{exports,require:dep=>{
  if(dep==='./web-engine/calc-client'||dep==='./web-engine/calc-api')return {};
  if(!dep.startsWith('./'))throw Error('Unexpected import '+dep);
  return loadMod(path.posix.normalize(path.posix.join(path.posix.dirname(name),dep.slice(2))));
 }});
 return cache[name]=exports;
}
const {calculateComparison}=loadMod('pobCompare');
const groups=Array.from({length:15},(_,i)=>({index:i+1,enabled:true,activeSkillNames:[i===0?'Main':`Skill${i}`],slot:`slot${i}`}));
let set=1;let seen=[];let failIndex=-1;
const engine={
 async loadBuild(){return {success:true}},
 async getSkills(){return {weaponSet:set,mainSocketGroup:1,groups}},
 async setWeaponSet(next){set=next},
 async getGroupDps(index,weaponSet){seen.push([index,weaponSet]);if(index===failIndex)throw Error('native PoB failed');return {groupIndex:index,weaponSet,restoredGroup:1,restoredWeaponSet:weaponSet,dps:index*100}},
 async getStats(){return {Life:1000}}
};
const character={mainSkill:'Main',skills:groups.slice(1).map(g=>({name:g.activeSkillNames[0],dpsValue:1}))};
(async()=>{
 let result=await calculateComparison(engine,character,'xml',{});
 assert.equal(Object.keys(result.original[1].calculatedSkills).length,15,'all 14 secondary groups and main are measured');
 assert.equal(result.original[1].calculatedSkills[15].dps,1500,'14th secondary is native-measured');
 assert(!result.warnings.some(w=>w.includes('안전 한도')||w.includes('미검증')),'no cap warning at 14');
 assert.equal(result.original[2].calculatedSkills[15],undefined,'secondary never borrowed into set II');
 assert.equal(set,1,'original weapon set restored');
 failIndex=15;seen=[];
 result=await calculateComparison(engine,character,'xml',{});
 assert.equal(result.original[1].calculatedSkills[15],undefined,'failed group is never invented');
 assert(result.warnings.some(w=>w.includes('스킬 그룹 15 독립 계산 실패')),'native failure stays visible');
 assert.equal(result.original[1].calculatedSkills[14].dps,1400,'successful groups preserved');
 console.log('PASS V271: 14 secondary groups measured in batches, native failure guarded, weapon set restored');
})().catch(e=>{console.error(e);process.exitCode=1});
