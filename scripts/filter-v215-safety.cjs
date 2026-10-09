// V215: read-only end-to-end filter generation and matching assertions.
const fs=require('fs'),path=require('path'),assert=require('assert'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const d=require('../src/app/filter/filterData.ts'),e=require('../src/app/filter/filterExport.ts');
const names=['EXCEPTIONAL_GROUPS','WAYSTONE_GROUPS','UNIQUE_ARMOUR_GROUPS','UNIQUE_GROUPS','OTHER_UNIQUE_GROUPS','TABLET_GROUPS','JEWEL_GROUPS','FLASK_GROUPS','CHARM_GROUPS','CURRENCY_GROUPS','ESSENCE_GROUPS','DELIRIUM_GROUPS','BREACH_GROUPS','ABYSS_GROUPS','ATZIRI_GROUPS','FRAGMENT_GROUPS','RUNE_GROUPS','RITUAL_GROUPS','SOUL_CORE_GROUPS','IDOL_GROUPS','UNCUT_GEM_GROUPS','EXPEDITION_GROUPS','LINEAGE_GEM_GROUPS','MISC_GROUPS'];
const items=names.flatMap(key=>d[key].flatMap(g=>g.items));
const normals=d.NORMAL_GEAR_GROUPS.flatMap(g=>g.items.map(i=>({...i,classNames:g.classes})));
const desc={masitda:{choice:'masitda',filterPath:'FIXLGS_SOUNDS/um-masitda.mp3'}};
const stages=d.NEVER_SINK_STRICTNESSES.map(x=>x.id);
const cache=Object.fromEntries(stages.map(id=>[id,{b:require('../public/neversink/0.10.4/baseline/'+id+'.json'),text:fs.readFileSync(path.join(__dirname,'../public/neversink/0.10.4',id+'.filter'),'utf8')} ]));
function payload(id,props={}){const {b,text}=cache[id];return {base:{id,version:'0.10.4',text},items,itemState:{},baselineEnabled:k=>b.items[k]?.enabled??false,baselineStatus:k=>b.items[k]?.status??'missing',soundState:{},soundDescriptors:desc,rareTiers:{},magicTiers:{},rareGear:{},magicGear:{},normalItems:normals,normalGear:{},normalBaselineEnabled:k=>b.normal[k]?.enabled??false,normalBaselineStatus:k=>b.normal[k]?.status??'missing',normalBaselineImportance:k=>b.normal[k]?.importance??'default',normalImportance:{},normalLevelRules:{},...props};}
function test(ok,label){assert.ok(ok,label)}
function soundInShow(text,soundPath){
 const blocks=text.replace(/\r/g,'').split(/\n(?=(?:Show|Hide)\b)/);
 return blocks.some(b=>/^Show\b/m.test(b.split('\n')[0]) && b.includes(soundPath));
}
const stats={noChanges:0,soundOnly:0,requiresExplicitShow:0,explicitShowRecovery:0,gemShowHide:0,normalSound:0,regressions:0};
for(const stage of stages){
 const input=payload(stage);test(e.buildCustomizedFilter(input).text===input.base.text,`NS untouched ${stage}`);stats.noChanges++;
 for(const item of items){
  try {
   const r=e.buildCustomizedFilter(payload(stage,{items:[item],normalItems:[],soundState:{[item.id]:'masitda'}}));
   test(r.text.includes(desc.masitda.filterPath),`missing sound ${stage} ${item.id}`);stats.soundOnly++;
  }catch(err){
   if(!String(err).includes('적용 불일치'))throw err;
   stats.requiresExplicitShow++;
   const r=e.buildCustomizedFilter(payload(stage,{items:[item],normalItems:[],soundState:{[item.id]:'masitda'},itemState:{[item.id]:{enabled:true,importance:'default',visibilityExplicit:true}}}));
   test(r.text.includes(desc.masitda.filterPath),`explicit Show + sound failed ${stage} ${item.id}`);stats.explicitShowRecovery++;
  }
 }
}
for(const stage of stages){
 for(const item of d.UNCUT_GEM_GROUPS.flatMap(g=>g.items)){
  const show=e.buildCustomizedFilter(payload(stage,{items:[item],normalItems:[],itemState:{[item.id]:{enabled:true,importance:'s',visibilityExplicit:true}}})).text;
  const hide=e.buildCustomizedFilter(payload(stage,{items:[item],normalItems:[],itemState:{[item.id]:{enabled:false,importance:'default',visibilityExplicit:true}}})).text;
  test(show.includes(`GemLevel == ${item.gemLevel}`) && show.includes('Show # FIXLGS'),`gem-show ${stage} ${item.id}`);
  test(hide.includes(`GemLevel == ${item.gemLevel}`) && hide.includes('Hide # FIXLGS'),`gem-hide ${stage} ${item.id}`);
  stats.gemShowHide+=2;
 }
}
for (const item of normals) {
 const r=e.buildCustomizedFilter(payload('0-SOFT',{items:[],normalItems:[item],soundState:{['gear:normal:'+item.id]:'masitda'}}));
 test(r.text.includes(desc.masitda.filterPath),`normal sound ${item.id}`);stats.normalSound++;
}
// Targeted regressions: sourceSection mismatch, substring BaseType, generic Class,
// the 6-STRICT hidden-gem sound exception, plus the rarer unique fallback.
const important=['rune-perfect-desert-rune','f-life-lesser','ch-cleansing','frag-ancient-crisis-fragment','frag-zarokh-s-reliquary-key-temporalis','exp-expedition-logbook','uw-wand-runic-fork','uncut-skill-19'];
for(const id of important){const item=items.find(x=>x.id===id);test(item,'missing test sample '+id);const text=e.buildCustomizedFilter(payload('0-SOFT',{items:[item],normalItems:[],soundState:{[id]:'masitda'}})).text;test(soundInShow(text,desc.masitda.filterPath),`missing playable Show sound ${id}`);test(text.includes('scoped sound')||text.includes('class sound')||text.includes('sound override')||text.includes('FIXLGS override'),`missing marker ${id}`);stats.regressions++}
assert.equal(stats.soundOnly+stats.requiresExplicitShow,1128*7);
console.log(JSON.stringify(stats,null,2));
