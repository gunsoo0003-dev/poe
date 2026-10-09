const fs=require('fs'),path=require('path'),assert=require('assert'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const d=require('../src/app/filter/filterData.ts');
const current=require('../src/app/filter/filterExport.ts');
const previous=require('/mnt/data/work_v217/fix-pob/src/app/filter/filterExport.ts');
const groups=['CURRENCY_GROUPS','ESSENCE_GROUPS','WAYSTONE_GROUPS','UNIQUE_GROUPS','JEWEL_GROUPS','FLASK_GROUPS','CHARM_GROUPS','TABLET_GROUPS','RUNE_GROUPS','FRAGMENT_GROUPS','MISC_GROUPS','EXPEDITION_GROUPS'];
const items=groups.map(name=>d[name].flatMap(x=>x.items).find(x=>x.baseType && x.gemLevel == null && x.waystoneTier == null)).filter(Boolean);
let checked=0;
for(const stage of d.NEVER_SINK_STRICTNESSES.map(s=>s.id)){
 const b=require(`../public/neversink/0.10.4/baseline/${stage}.json`);
 const base={id:stage,version:'0.10.4',text:fs.readFileSync(path.join(__dirname,`../public/neversink/0.10.4/${stage}.filter`),'utf8')};
 for (const item of items) {
  for (const [type,itemState,soundState] of [
    ['sound',{}, {[item.id]:'masitda'}],
    ['hide',{[item.id]:{enabled:false,importance:'default',visibilityExplicit:true}},{}],
    ['show',{[item.id]:{enabled:true,importance:'s',visibilityExplicit:true}},{}],
  ]) {
   const payload={base,items:[item],itemState,soundState,soundDescriptors:{masitda:{choice:'masitda',filterPath:'FIXLGS_SOUNDS/um-masitda.mp3'}},baselineEnabled:id=>b.items[id]?.enabled??false,baselineStatus:id=>b.items[id]?.status??'missing',rareTiers:{},magicTiers:{},rareGear:{},magicGear:{},normalItems:[],normalGear:{},normalBaselineEnabled:()=>false,normalBaselineStatus:()=> 'missing',normalBaselineImportance:()=> 'default',normalImportance:{},normalLevelRules:{}};
   let a,b;
   try{a=current.buildCustomizedFilter(payload)}catch(e){a={error:String(e)}}
   try{b=previous.buildCustomizedFilter(payload)}catch(e){b={error:String(e)}}
   assert.deepStrictEqual(a,b,`non-gem behavior changed ${stage} ${item.id} ${type}`);
   checked++;
  }
 }
}
console.log(`PASS V217 non-gem output preservation: ${items.length} representative groups × 7 strictnesses × 3 customization modes = ${checked} cases`);
