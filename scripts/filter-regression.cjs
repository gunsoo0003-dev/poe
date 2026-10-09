const fs=require('fs'), path=require('path'),assert=require('assert');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const data=require('../src/app/filter/filterData.ts');const exp=require('../src/app/filter/filterExport.ts');
const groups=['EXCEPTIONAL_GROUPS','WAYSTONE_GROUPS','UNIQUE_ARMOUR_GROUPS','UNIQUE_GROUPS','OTHER_UNIQUE_GROUPS','TABLET_GROUPS','JEWEL_GROUPS','FLASK_GROUPS','CHARM_GROUPS','CURRENCY_GROUPS','ESSENCE_GROUPS','DELIRIUM_GROUPS','BREACH_GROUPS','ABYSS_GROUPS','ATZIRI_GROUPS','FRAGMENT_GROUPS','RUNE_GROUPS','RITUAL_GROUPS','SOUL_CORE_GROUPS','IDOL_GROUPS','UNCUT_GEM_GROUPS','EXPEDITION_GROUPS','LINEAGE_GEM_GROUPS','MISC_GROUPS'];
const items=groups.flatMap(x=>data[x].flatMap(g=>g.items));
const normalItems=data.NORMAL_GEAR_GROUPS.flatMap(g=>g.items.map(x=>({...x,classNames:g.classes})));
const desc={masitda:{choice:'masitda',filterPath:'FIXLGS_SOUNDS/masitda.mp3'}};
function payload(id,props={}){
 const d=require('../public/neversink/0.10.4/baseline/'+id+'.json');
 return {base:{id,version:'0.10.4',text:fs.readFileSync(path.join(__dirname,'../public/neversink/0.10.4',id+'.filter'),'utf8')},items,itemState:{},baselineEnabled:k=>d.items[k]?.enabled??false,baselineStatus:k=>d.items[k]?.status??'missing',soundState:{},soundDescriptors:desc,rareTiers:{},magicTiers:{},rareGear:{},magicGear:{},normalItems,normalGear:{},normalBaselineEnabled:k=>d.normal[k]?.enabled??false,normalBaselineStatus:k=>d.normal[k]?.status??'missing',normalBaselineImportance:k=>d.normal[k]?.importance??'default',normalImportance:{},normalLevelRules:{},...props};
}
function test(name,fn){try{fn();console.log('PASS',name)}catch(e){console.error('FAIL',name,e.message);process.exitCode=1}}
console.log('test counts',items.length,normalItems.length)
for(const id of data.NEVER_SINK_STRICTNESSES.map(x=>x.id))test('raw '+id,()=>{let p=payload(id);assert.strictEqual(exp.buildCustomizedFilter(p).text,p.base.text)});
test('gem S conditional',()=>{let p=payload('0-SOFT',{itemState:{'uncut-skill-10':{enabled:true,importance:'s'}}});let out=exp.buildCustomizedFilter(p).text;assert.match(out.slice(0,3000),/GemLevel == 10/);assert.match(out.slice(0,3000),/FIXLGS override/)});
test('gem explicit hide conditional',()=>{let p=payload('0-SOFT',{itemState:{'uncut-skill-10':{enabled:false,importance:'default',visibilityExplicit:true}}});let out=exp.buildCustomizedFilter(p).text;assert.match(out.slice(0,2000),/Hide # FIXLGS/);assert.match(out.slice(0,2000),/GemLevel == 10/)});
test('gem sound only preserves area gate',()=>{let p=payload('0-SOFT',{soundState:{'uncut-skill-19':'masitda'}});let r=exp.buildCustomizedFilter(p);let top=r.text.split('# ORIGINAL NEVERSINK FILTER CONTINUES BELOW')[0];assert.ok(!top.includes('FIXLGS override'), 'sound-only must not inject priority overrides');assert.ok(r.text.includes(desc.masitda.filterPath))});
test('normal sound only',()=>{let id=normalItems.find(x=>x.baseType==='Wooden Club')?.id;assert.ok(id);let p=payload('0-SOFT',{soundState:{['gear:normal:'+id]:'masitda'}});let r=exp.buildCustomizedFilter(p);assert.ok(r.text.includes(desc.masitda.filterPath),'Missing normal sound')});
test('strict 6 exceptional unique enabled',()=>{let id='exceptional-unique-overquality';let p=payload('6-UBER-PLUS-STRICT',{itemState:{[id]:{enabled:true,importance:'s'}}});let r=exp.buildCustomizedFilter(p);assert.ok(r.changedRules>0 && r.text!==p.base.text,'Unchanged strict exceptional')});
test('rare mode fallback covers all gear groups',()=>{let p=payload('0-SOFT',{rareTiers:{'rare-tier-5':{enabled:true,importance:'s'}},rareGear:{'rare:Wands':true}});let r=exp.buildCustomizedFilter(p);let part=r.text.slice(r.text.indexOf('Hide # FIXLGS Rare mode fallback'),r.text.indexOf('Hide # FIXLGS Rare mode fallback')+3000);assert.ok(part.includes('"One Hand Maces"'),'Missed unselected class')});
test('normal explicit OFF overrides conditional NS',()=>{
 const item=normalItems.find(x=>x.baseType==='Wooden Club');assert.ok(item);
 const p=payload('0-SOFT',{normalGear:{[item.id]:false},normalGearExplicit:{[item.id]:true}});
 const r=exp.buildCustomizedFilter(p);assert.match(r.text.slice(0,2000),/Hide # FIXLGS/);assert.match(r.text.slice(0,2000),/Wooden Club/)
});
test('gear tier ZIP sound is actually referenced',()=>{
 const p=payload('0-SOFT',{rareTiers:{'rare-tier-5':{enabled:true,importance:'s'}},soundState:{'gear:tier:rare:rare-tier-5':'masitda'}});
 const r=exp.buildCustomizedFilter(p);assert.ok(r.text.includes(desc.masitda.filterPath));assert.ok(r.usedSoundChoices.includes('masitda'))
});
test('broken custom MP3 mapping cannot silently succeed',()=>{
 const p=payload('0-SOFT',{soundState:{'uncut-skill-10':'user:missing'}});
 assert.throws(()=>exp.buildCustomizedFilter(p),/MP3 연결 정보를 찾을 수 없습니다/)
});
