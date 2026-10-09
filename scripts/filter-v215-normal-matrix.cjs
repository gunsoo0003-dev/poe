const fs=require('fs'),path=require('path'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const d=require('../src/app/filter/filterData.ts'),e=require('../src/app/filter/filterExport.ts');
const items=d.NORMAL_GEAR_GROUPS.flatMap(g=>g.items.map(i=>({...i,classNames:g.classes})));
const desc={masitda:{choice:'masitda',filterPath:'FIXLGS_SOUNDS/um-masitda.mp3'}};
for (const id of d.NEVER_SINK_STRICTNESSES.map(x=>x.id)) {
 const b=require('../public/neversink/0.10.4/baseline/'+id+'.json');let text=fs.readFileSync(path.join(__dirname,'../public/neversink/0.10.4/'+id+'.filter'),'utf8');
 let success=0,blocked=[];
 for(const item of items){const p={base:{id,version:'0.10.4',text},items:[],itemState:{},baselineEnabled:()=>false,baselineStatus:()=>"missing",soundState:{['gear:normal:'+item.id]:'masitda'},soundDescriptors:desc,rareTiers:{},magicTiers:{},rareGear:{},magicGear:{},normalItems:[item],normalGear:{},normalBaselineEnabled:k=>b.normal[k]?.enabled??false,normalBaselineStatus:k=>b.normal[k]?.status??'missing',normalBaselineImportance:k=>b.normal[k]?.importance??'default',normalImportance:{},normalLevelRules:{}};
 try{let r=e.buildCustomizedFilter(p);if(r.text.includes(desc.masitda.filterPath))success++;else blocked.push(item.id)}catch(err){if(String(err).includes('적용 불일치'))blocked.push(item.id);else throw err}
 }
 console.log(id,'sound',success,'unsupported',blocked.length,blocked.slice(0,15).join(','));
}
