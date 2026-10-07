const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const STRICT = ['0-SOFT','1-REGULAR','2-SEMI-STRICT','3-STRICT','4-VERY-STRICT','5-UBER-STRICT','6-UBER-PLUS-STRICT'];
const GROUPS = ['EXCEPTIONAL_GROUPS','WAYSTONE_GROUPS','UNIQUE_ARMOUR_GROUPS','UNIQUE_GROUPS','OTHER_UNIQUE_GROUPS','TABLET_GROUPS','JEWEL_GROUPS','FLASK_GROUPS','CHARM_GROUPS','CURRENCY_GROUPS','ESSENCE_GROUPS','DELIRIUM_GROUPS','BREACH_GROUPS','ABYSS_GROUPS','ATZIRI_GROUPS','FRAGMENT_GROUPS','RUNE_GROUPS','RITUAL_GROUPS','SOUL_CORE_GROUPS','IDOL_GROUPS','UNCUT_GEM_GROUPS','EXPEDITION_GROUPS','LINEAGE_GEM_GROUPS','MISC_GROUPS'];

function transpileLoad(file, requireMap={}) {
  const src = fs.readFileSync(file,'utf8');
  const out = ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX},fileName:file}).outputText;
  const module = {exports:{}};
  const sandbox = {
    module, exports: module.exports, console,
    require: (id) => requireMap[id] ?? require(id),
    process, Buffer, setTimeout, clearTimeout,
  };
  vm.runInNewContext(out,sandbox,{filename:file});
  return module.exports;
}

const data = transpileLoad(path.join(ROOT,'src/app/filter/filterData.ts'));
const filterExport = transpileLoad(path.join(ROOT,'src/app/filter/filterExport.ts'), {'./filterData': data});
const allItems = GROUPS.flatMap(name => (data[name]||[]).flatMap(g => (g.items||[]).map(i => ({...i,_group:name}))));
const normalItems = (data.NORMAL_GEAR_GROUPS||[]).flatMap(g => g.items.map(i => ({...i,classNames:g.classes||[]})));
const errors = [];
const lines = [];
function ok(cond,msg){ if(!cond) errors.push(msg); }
function countEnabled(obj){return Object.values(obj).reduce((a,e)=>(a[e.enabled?'on':'off']++,a),{on:0,off:0});}
function groupCounts(baseline){
  const out={};
  for(const name of GROUPS){
    const ids=(data[name]||[]).flatMap(g=>g.items.map(i=>i.id));
    out[name]=ids.reduce((a,id)=>{const e=baseline.items[id]; if(e) a[e.enabled?'on':'off']++; return a;},{on:0,off:0});
  }
  return out;
}

// 1) Raw NeverSink -> baseline checkbox coverage
lines.push('TASK1 ORIGINAL -> BASELINE');
for(const strict of STRICT){
  const baseline=JSON.parse(fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4/baseline',strict+'.json'),'utf8'));
  for(const item of allItems){
    const e=baseline.items[item.id];
    ok(!!e,`${strict}: missing baseline item ${item.id}`);
    if(e){ ok(typeof e.enabled==='boolean',`${strict}: enabled not boolean ${item.id}`); ok(e.status!=='missing',`${strict}: missing status ${item.id}`); }
  }
  for(const item of normalItems){
    const e=baseline.normal[item.id];
    ok(!!e,`${strict}: missing normal baseline ${item.id}`);
    if(e) ok(typeof e.enabled==='boolean',`${strict}: normal enabled not boolean ${item.id}`);
  }
  const c=countEnabled(baseline.items), n=countEnabled(baseline.normal);
  lines.push(`${strict}: items ${c.on} ON / ${c.off} OFF | normal ${n.on} ON / ${n.off} OFF`);
  const gc=groupCounts(baseline);
  lines.push('  '+Object.entries(gc).map(([k,v])=>`${k.replace('_GROUPS','')}:${v.on}/${v.off}`).join(' | '));
}
const b6=JSON.parse(fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4/baseline/6-UBER-PLUS-STRICT.json'),'utf8'));
const critical = [
  ['c-greater-orb-of-transmutation',true,'Greater Orb of Transmutation'],
  ['j-magic-ruby',false,'Magic Ruby Jewel'],
  ['d-simulacrum-splinter',true,'Simulacrum Splinter'],
  ['d-simulacrum',true,'Simulacrum'],
  ['d-raven-s-reflection',true,"Raven's Reflection"],
  ['d-raven-touched-shard',true,'Raven-Touched Shard'],
];
for(const [id,expected,label] of critical){ ok(b6.items[id]?.enabled===expected,`6: critical ${label} expected ${expected}`); }
const currencyIds=(data.CURRENCY_GROUPS||[]).flatMap(g=>g.items.map(i=>i.id));
const c6=currencyIds.reduce((a,id)=>(a[b6.items[id].enabled?'on':'off']++,a),{on:0,off:0});
ok(c6.on===24 && c6.off===13,`6: currency expected 24/13 got ${c6.on}/${c6.off}`);
const spirit=(data.UNCUT_GEM_GROUPS||[]).flatMap(g=>g.items).filter(i=>/spirit/i.test(i.id));
for(const i of spirit){ if(i.gemLevel>=4&&i.gemLevel<=18) ok(b6.items[i.id]?.enabled===false,`6: spirit ${i.gemLevel} should OFF`); if(i.gemLevel>=19) ok(b6.items[i.id]?.enabled===true,`6: spirit ${i.gemLevel} should ON`); }

// 2) Baseline -> web checkbox source path static assertions
lines.push('\nTASK2 BASELINE -> WEB');
const customizer = fs.readFileSync(path.join(ROOT,'src/app/filter/FilterCustomizer.tsx'),'utf8');
ok(/checked=\{state\.enabled\}/.test(customizer),'Item checkbox does not render state.enabled');
ok(/itemState\[item\.id\] \?\? \{ enabled: baselineEnabled\(baselineItems\?\.\[item\.id\]\)/.test(customizer),'Item row does not fallback directly to baselineEnabled');
ok(/normalGear\[item\.id\] \?\? baselineEnabled\(neverSinkBaseline\?\.normal\[item\.id\]\)/.test(customizer),'Normal row does not fallback directly to baselineEnabled');
ok(/typeof entry\.enabled === "boolean"/.test(customizer),'baselineEnabled does not prioritize entry.enabled');
lines.push('item rows: baselineEnabled -> checked; normal rows: baselineEnabled -> checked; conditional is metadata only');

function compileBlocks(text){
  const raw=text.replace(/\r/g,'').split('\n'); const blocks=[]; let cur=null;
  for(const line of raw){ const t=line.trim(); if(/^(Show|Hide)\b/i.test(t)){ if(cur) blocks.push(cur); cur={action:t.match(/^(Show|Hide)/i)[1],head:t,lines:[t]}; continue;} if(cur){ if(!t){blocks.push(cur);cur=null;} else cur.lines.push(t);} }
  if(cur) blocks.push(cur); return blocks;
}
function expectedSelector(item){
  const a=[]; if(item.baseType)a.push(`BaseType == "${item.baseType}"`); if(item.classNames?.length)a.push(`Class == ${item.classNames.map(x=>`"${x}"`).join(' ')}`);
  if(item.rarity)a.push(`Rarity ${item.rarity}`);
  else if(item.id.startsWith('j-magic-'))a.push('Rarity Normal Magic');
  else if(item.id.startsWith('j-time-lost-'))a.push('Rarity <= Rare');
  else if(item.family==='flask'||item.family==='charm')a.push('Rarity Normal Magic');
  else if(item.id.startsWith('t-')&&item.baseType?.endsWith('Tablet'))a.push('Rarity <= Rare');
  if(item.gemLevel!=null)a.push(`GemLevel == ${item.gemLevel}`); if(item.waystoneTier!=null)a.push(`WaystoneTier == ${item.waystoneTier}`); return a;
}
function hasBlock(blocks, action, selectors){ return blocks.some(b=>b.action.toLowerCase()===action.toLowerCase() && /FIXLGS/.test(b.head) && selectors.every(s=>b.lines.includes(s))); }

const selectorKeys = new Map();
for (const item of allItems.filter(i=>i.family!=='exceptional')) {
  const key = expectedSelector(item).join(' | ');
  if (!selectorKeys.has(key)) selectorKeys.set(key, []);
  selectorKeys.get(key).push(item.id);
}
for (const [key, ids] of selectorKeys) ok(ids.length===1, `selector collision ${key}: ${ids.join(',')}`);
function offTierMap(tiers){return Object.fromEntries(tiers.map(t=>[t.id,{enabled:false,importance:t.defaultImportance}]));}
function offGear(prefix){const o={}; for(const g of data.GEAR_CATEGORIES) for(const c of g.classes)o[`${prefix}:${c}`]=false; return o;}
function offNormalLevels(){return Object.fromEntries(data.NORMAL_ITEM_LEVEL_RULES.map(r=>[r.id,{enabled:false,importance:'default'}]));}

// Unmodified export must remain byte-identical to NeverSink for every strictness.
for (const strict of STRICT) {
  const baseText=fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4',strict+'.filter'),'utf8');
  const baseline=JSON.parse(fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4/baseline',strict+'.json'),'utf8'));
  const result=filterExport.buildCustomizedFilter({base:{id:strict,version:data.NEVER_SINK.version,text:baseText},items:allItems,itemState:{},baselineEnabled:id=>baseline.items[id].enabled,baselineStatus:id=>baseline.items[id].status,soundState:{},soundDescriptors:{},rareTiers:offTierMap(data.RARE_TIERS),magicTiers:offTierMap(data.MAGIC_TIERS),rareGear:offGear('rare'),magicGear:offGear('magic'),normalItems,normalGear:{},normalBaselineEnabled:id=>baseline.normal[id].enabled,normalBaselineStatus:id=>baseline.normal[id].status,normalBaselineImportance:id=>baseline.normal[id].importance||'default',normalImportance:{},normalLevelRules:offNormalLevels()});
  ok(result.text===baseText, `${strict}: unmodified export is not byte-identical`);
}

// 3) Web checkbox -> generated filter exact Show/Hide
lines.push('\nTASK3 WEB -> FILTER');
for(const strict of STRICT){
  const baseText=fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4',strict+'.filter'),'utf8');
  const baseline=JSON.parse(fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4/baseline',strict+'.json'),'utf8'));
  const itemState={};
  for(const item of allItems.filter(i=>i.family!=='exceptional')) itemState[item.id]={enabled:!baseline.items[item.id].enabled,importance:'default'};
  const normalGear={}; for(const item of normalItems) normalGear[item.id]=!baseline.normal[item.id].enabled;
  const result=filterExport.buildCustomizedFilter({
    base:{id:strict,version:data.NEVER_SINK.version,text:baseText}, items:allItems, itemState,
    baselineEnabled:id=>baseline.items[id].enabled, baselineStatus:id=>baseline.items[id].status,
    soundState:{}, soundDescriptors:{}, rareTiers:offTierMap(data.RARE_TIERS), magicTiers:offTierMap(data.MAGIC_TIERS),
    rareGear:offGear('rare'), magicGear:offGear('magic'), normalItems, normalGear,
    normalBaselineEnabled:id=>baseline.normal[id].enabled, normalBaselineStatus:id=>baseline.normal[id].status,
    normalBaselineImportance:id=>baseline.normal[id].importance||'default', normalImportance:{}, normalLevelRules:offNormalLevels(),
  });
  const blocks=compileBlocks(result.text);
  for(const item of allItems.filter(i=>i.family!=='exceptional')){
    const expected=!baseline.items[item.id].enabled?'Show':'Hide';
    const sel=expectedSelector(item); ok(sel.length>0,`${strict}: no selector ${item.id}`); ok(hasBlock(blocks,expected,sel),`${strict}: export ${expected} missing for ${item.id} selectors=${sel.join('|')}`);
  }
  for(const item of normalItems){
    const expected=!baseline.normal[item.id].enabled?'Show':'Hide';
    const sel=[`BaseType == "${item.baseType}"`,'Rarity Normal'];
    ok(hasBlock(blocks,expected,sel),`${strict}: normal export ${expected} missing ${item.id}`);
  }
  lines.push(`${strict}: flipped ${allItems.filter(i=>i.family!=='exceptional').length} item rows + ${normalItems.length} normal rows`);
}

// Sound + exceptional export regression checks
{
  const strict='6-UBER-PLUS-STRICT'; const baseText=fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4',strict+'.filter'),'utf8'); const baseline=b6;
  const exceptional=data.EXCEPTIONAL_GROUPS.flatMap(g=>g.items)[2];
  const result=filterExport.buildCustomizedFilter({base:{id:strict,version:data.NEVER_SINK.version,text:baseText},items:allItems,itemState:{[exceptional.id]:{enabled:true,importance:'default'}},baselineEnabled:id=>baseline.items[id].enabled,baselineStatus:id=>baseline.items[id].status,soundState:{[exceptional.id]:'divine-power'},soundDescriptors:{'divine-power':{choice:'divine-power',filterPath:'FIXLGS_SOUNDS/divine-power.mp3'}},rareTiers:offTierMap(data.RARE_TIERS),magicTiers:offTierMap(data.MAGIC_TIERS),rareGear:offGear('rare'),magicGear:offGear('magic'),normalItems,normalGear:{},normalBaselineEnabled:id=>baseline.normal[id].enabled,normalBaselineStatus:id=>baseline.normal[id].status,normalBaselineImportance:id=>baseline.normal[id].importance||'default',normalImportance:{},normalLevelRules:offNormalLevels()});
  ok(result.text.includes('FIXLGS exceptional override'), 'exceptional sound override block missing');
  ok(result.text.includes('FIXLGS_SOUNDS/divine-power.mp3'), 'exceptional divine sound path missing');
}

// 4) Preset persistence code path assertions
lines.push('\nTASK4 CUSTOM PRESET SAVE/LOAD');
ok(/const itemOverrides = \{ \.\.\.itemState \};/.test(customizer),'preset does not save itemState exactly');
ok(/const normalVisibilityOverrides = \{ \.\.\.normalGear \};/.test(customizer),'preset does not save normalGear exactly');
ok(/soundState: serializableSoundState/.test(customizer),'preset soundState missing');
ok(/setSoundState\(Object\.fromEntries\(Object\.entries\(payload\.soundState \?\? \{\}\)/.test(customizer),'preset load soundState missing');
ok(/setRareTiers\(payload\.rareTiers/.test(customizer) && /setMagicTiers\(payload\.magicTiers/.test(customizer),'preset load rare/magic tiers missing');
ok(/setItemState\(presetItemOverrides\)/.test(customizer),'preset load itemState missing');
lines.push('item/normal/rare/magic/sound payload paths present; save uses editor state directly, load restores same maps');

// Install flow checks bundled with persistence regression
ok(/const directory = await chooseAndRememberInstallDirectory\(\);\s*const payload = await prepareExportPayload\(\);\s*const \{ result, safeBaseName, soundAssets \} = await writeInstallPayload\(directory, payload\);/s.test(customizer),'change-folder does not immediately install current filter');
ok(/let directory = await loadInstallDirectory\(\);\s*if \(!directory \|\| !\(await requestInstallPermission\(directory\)\)\)[\s\S]*const payload = await prepareExportPayload\(\);/s.test(customizer),'install does not resolve folder permission before export');
lines.push('install folder: remembered handle reused; change-folder immediately writes current filter');

// 5) Rare/Magic design regression
lines.push('\nTASK5 RARE/MAGIC');
for(const rarity of ['rare','magic']){
  const tiers=offTierMap(rarity==='rare'?data.RARE_TIERS:data.MAGIC_TIERS); const t5=Object.keys(tiers).find(k=>/5$/.test(k)); tiers[t5]={enabled:true,importance:'default'};
  const soundKey=`gear:tier:${rarity}:${t5}`;
  const result=filterExport.buildCustomizedFilter({base:{id:'6-UBER-PLUS-STRICT',version:data.NEVER_SINK.version,text:fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4/6-UBER-PLUS-STRICT.filter'),'utf8')},items:allItems,itemState:{},baselineEnabled:id=>b6.items[id].enabled,baselineStatus:id=>b6.items[id].status,soundState:{[soundKey]:'masitda'},soundDescriptors:{masitda:{choice:'masitda',filterPath:'FIXLGS_SOUNDS/um-masitda.mp3'}},rareTiers:rarity==='rare'?tiers:offTierMap(data.RARE_TIERS),magicTiers:rarity==='magic'?tiers:offTierMap(data.MAGIC_TIERS),rareGear:offGear('rare'),magicGear:offGear('magic'),normalItems,normalGear:{},normalBaselineEnabled:id=>b6.normal[id].enabled,normalBaselineStatus:id=>b6.normal[id].status,normalBaselineImportance:id=>b6.normal[id].importance||'default',normalImportance:{},normalLevelRules:offNormalLevels()});
  const name=rarity==='rare'?'Rare':'Magic';
  ok(result.text.includes(`Show # FIXLGS ${name} tier 5`),`${name}: tier5 Show missing`);
  ok(result.text.includes('\tUnidentifiedItemTier >= 5')&&result.text.includes('\tUnidentifiedItemTier <= 5'),`${name}: exact tier bounds missing`);
  ok(result.text.includes(`Hide # FIXLGS ${name} mode fallback`),`${name}: fallback Hide missing`);
  ok(result.text.includes('FIXLGS_SOUNDS/um-masitda.mp3'),`${name}: tier sound missing`);
  const posExceptional=result.text.lastIndexOf('# [[0300]] Exceptional Items'); const posGear=result.text.indexOf(`# ===== FIXLGS ${name.toUpperCase()} MODE =====`, posExceptional); const pos0400=result.text.indexOf('# [[0400]] IDENTIFIED MODS', posExceptional);
  ok(posExceptional>=0 && posGear>posExceptional && pos0400>posGear,`${name}: override priority is not Exceptional -> FIXLGS -> ordinary gear`);
  lines.push(`${name}: tier5 Show + fallback Hide + sound + priority verified`);
}
// One selected gear class must narrow both Show and fallback Hide to that class.
{
  const tiers=offTierMap(data.RARE_TIERS); const t5=Object.keys(tiers).find(k=>/5$/.test(k)); tiers[t5]={enabled:true,importance:'default'};
  const gear=offGear('rare'); gear['rare:Body Armours']=true;
  const baseText=fs.readFileSync(path.join(ROOT,'public/neversink/0.10.4/6-UBER-PLUS-STRICT.filter'),'utf8');
  const result=filterExport.buildCustomizedFilter({base:{id:'6-UBER-PLUS-STRICT',version:data.NEVER_SINK.version,text:baseText},items:allItems,itemState:{},baselineEnabled:id=>b6.items[id].enabled,baselineStatus:id=>b6.items[id].status,soundState:{},soundDescriptors:{},rareTiers:tiers,magicTiers:offTierMap(data.MAGIC_TIERS),rareGear:gear,magicGear:offGear('magic'),normalItems,normalGear:{},normalBaselineEnabled:id=>b6.normal[id].enabled,normalBaselineStatus:id=>b6.normal[id].status,normalBaselineImportance:id=>b6.normal[id].importance||'default',normalImportance:{},normalLevelRules:offNormalLevels()});
  const mode=result.text.slice(result.text.indexOf('# ===== FIXLGS RARE MODE ====='), result.text.indexOf('# [[0400]] IDENTIFIED MODS', result.text.lastIndexOf('# [[0300]] Exceptional Items')));
  ok(mode.includes('Class == "Body Armours"'),'Rare class narrowing missing Body Armours');
  ok(!mode.includes('"Bows"'),'Rare class narrowing leaked unselected Bows');
}

if(errors.length){
  console.error(lines.join('\n')); console.error('\nFAILURES',errors.length); for(const e of errors.slice(0,200)) console.error('- '+e); process.exit(1);
}
console.log(lines.join('\n')); console.log('\nALL CHECKS PASSED');
