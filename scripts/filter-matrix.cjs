const fs=require('fs'),path=require('path'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const d=require('../src/app/filter/filterData.ts'),e=require('../src/app/filter/filterExport.ts');
const groupNames=['EXCEPTIONAL_GROUPS','WAYSTONE_GROUPS','UNIQUE_ARMOUR_GROUPS','UNIQUE_GROUPS','OTHER_UNIQUE_GROUPS','TABLET_GROUPS','JEWEL_GROUPS','FLASK_GROUPS','CHARM_GROUPS','CURRENCY_GROUPS','ESSENCE_GROUPS','DELIRIUM_GROUPS','BREACH_GROUPS','ABYSS_GROUPS','ATZIRI_GROUPS','FRAGMENT_GROUPS','RUNE_GROUPS','RITUAL_GROUPS','SOUL_CORE_GROUPS','IDOL_GROUPS','UNCUT_GEM_GROUPS','EXPEDITION_GROUPS','LINEAGE_GEM_GROUPS','MISC_GROUPS'];
const groups=groupNames.flatMap(key=>d[key]);const items=groups.flatMap(g=>g.items);const normals=d.NORMAL_GEAR_GROUPS.flatMap(g=>g.items.map(i=>({...i,classNames:g.classes})));
const desc={masitda:{choice:'masitda',filterPath:'FIXLGS_SOUNDS/masitda.mp3'}};
function get(id,props={}){const b=require('../public/neversink/0.10.4/baseline/'+id+'.json');let text=fs.readFileSync(path.join(__dirname,'../public/neversink/0.10.4/'+id+'.filter'),'utf8');return {base:{id,version:'0.10.4',text},items,itemState:{},baselineEnabled:k=>b.items[k]?.enabled??false,baselineStatus:k=>b.items[k]?.status??'missing',soundState:{},soundDescriptors:desc,rareTiers:{},magicTiers:{},rareGear:{},magicGear:{},normalItems:normals,normalGear:{},normalBaselineEnabled:k=>b.normal[k]?.enabled??false,normalBaselineStatus:k=>b.normal[k]?.status??'missing',normalBaselineImportance:k=>b.normal[k]?.importance??'default',normalImportance:{},normalLevelRules:{},...props};}
const report={raw:0,gemShow:0,gemHide:0,gemSound:0,gemSoundUnsupported:0,normalSound:0,normalSoundUnsupported:0,mainSound:0,mainSoundUnsupported:0,errors:[]};
function check(ok,msg){if(!ok)report.errors.push(msg)}
for(const id of d.NEVER_SINK_STRICTNESSES.map(o=>o.id)){
 const p=get(id);check(e.buildCustomizedFilter(p).text===p.base.text,`raw ${id}`);report.raw++;
 for(const item of d.UNCUT_GEM_GROUPS.flatMap(g=>g.items)){
  const show=get(id,{itemState:{[item.id]:{enabled:true,importance:'s',visibilityExplicit:true}}});
  const r=e.buildCustomizedFilter(show);check(r.text.includes(`GemLevel == ${item.gemLevel}`),`${id} gem show ${item.id}`);report.gemShow++;
  const hide=get(id,{itemState:{[item.id]:{enabled:false,importance:'default',visibilityExplicit:true}}});
  const h=e.buildCustomizedFilter(hide);check(h.text.includes(`GemLevel == ${item.gemLevel}`)&&h.text.includes('Hide # FIXLGS'),`${id} gem hide ${item.id}`);report.gemHide++;
  try {let sound=e.buildCustomizedFilter(get(id,{soundState:{[item.id]:'masitda'}}));check(sound.text.includes(desc.masitda.filterPath),`${id} gem sound missing ${item.id}`);report.gemSound++}
  catch(err){if(String(err).includes('적용 불일치'))report.gemSoundUnsupported++;else report.errors.push(`${id} ${item.id} ${err}`)}
 }
}
for(const [i,item] of normals.entries()){
 if(i%17!==0)continue;
 for(const stage of ['0-SOFT','3-STRICT','6-UBER-PLUS-STRICT']){
  try {const out=e.buildCustomizedFilter(get(stage,{soundState:{['gear:normal:'+item.id]:'masitda'}}));check(out.text.includes(desc.masitda.filterPath),`${stage} normal sound missing ${item.id}`);report.normalSound++}
  catch(err){if(String(err).includes('적용 불일치'))report.normalSoundUnsupported++;else report.errors.push(`${stage} ${item.id} ${err}`)}
 }
}
for(const g of groups){
 for(const item of g.items.slice(0,2)){
  try {const out=e.buildCustomizedFilter(get('0-SOFT',{soundState:{[item.id]:'masitda'}}));check(out.text.includes(desc.masitda.filterPath),`0 main sound ${item.id}`);report.mainSound++}
  catch(err){if(String(err).includes('적용 불일치'))report.mainSoundUnsupported++;else report.errors.push(`0 main ${item.id} ${err}`)}
 }
}
console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;
