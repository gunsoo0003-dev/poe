const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ts = require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const d=require('../src/app/filter/filterData.ts'), e=require('../src/app/filter/filterExport.ts');
const gems=d.UNCUT_GEM_GROUPS.flatMap(g=>g.items);
const stages=d.NEVER_SINK_STRICTNESSES.map(s=>s.id);
const sound='FIXLGS_SOUNDS/um-masitda.mp3';
const descriptor={masitda:{choice:'masitda',filterPath:sound}};
let tested=0;
for (const stage of stages){
 const baseText=fs.readFileSync(path.join(__dirname,`../public/neversink/0.10.4/${stage}.filter`),'utf8');
 const b=require(`../public/neversink/0.10.4/baseline/${stage}.json`);
 const param=(item,overrides={})=>({base:{id:stage,version:'0.10.4',text:baseText},items:[item],itemState:{},baselineEnabled:id=>b.items[id]?.enabled??false,baselineStatus:id=>b.items[id]?.status??'missing',soundState:{[item.id]:'masitda'},soundDescriptors:descriptor,rareTiers:{},magicTiers:{},rareGear:{},magicGear:{},normalItems:[],normalGear:{},normalBaselineEnabled:()=>false,normalBaselineStatus:()=> 'missing',normalBaselineImportance:()=> 'default',normalImportance:{},normalLevelRules:{},...overrides});
 for(const gem of gems){
  const generated=e.buildCustomizedFilter(param(gem));
  const top=generated.text.split('# ORIGINAL NEVERSINK FILTER CONTINUES BELOW')[0];
  const expected=`GemLevel == ${gem.gemLevel}`;
  const fallback=top.split('\n').findIndex(line=>line.startsWith(`Show # FIXLGS guaranteed gem sound · ${gem.id}`));
  assert(fallback>=0,`missing top-level fallback ${stage} ${gem.id}`);
  const segment=top.split('\n').slice(fallback, fallback+14).join('\n');
  assert(segment.includes(expected)&&segment.includes(`BaseType == "${gem.baseType}"`)&&segment.includes(sound),`incorrect fallback ${stage} ${gem.id}`);
  assert(generated.usedSoundChoices.includes('masitda'),`sound packaging missing ${stage} ${gem.id}`);
  assert(!segment.includes('AreaLevel'),`unexpected AreaLevel fallback ${stage} ${gem.id}`);
  for(const area of [1,60,64,65,70,78,79,80,90]){
    // The first matching priority Show for this gem and area must contain the user sound.
    // All generated gem priority rules use an exact GemLevel and BaseType selector.
    const blocks=top.split(/\n(?=Show #)/).filter(bl=>bl.startsWith('Show #'));
    let found=false;
    for(const block of blocks){
      const lines=block.split('\n').map(x=>x.trim());
      if(!lines.includes(expected)||!lines.includes(`BaseType == "${gem.baseType}"`)) continue;
      const lower=lines.find(x=>/^AreaLevel\s*<=/.test(x));
      const upper=lines.find(x=>/^AreaLevel\s*>=/.test(x));
      if(lower&&area>Number(lower.match(/\d+/)[0]))continue;
      if(upper&&area<Number(upper.match(/\d+/)[0]))continue;
      assert(block.includes(sound),`priority mismatched ${stage} ${gem.id} ${area}`);
      found=true;break;
    }
    assert(found,`no matching sound at AreaLevel ${area} ${stage} ${gem.id}`);
    tested++;
  }
  const noChange=e.buildCustomizedFilter(param(gem,{soundState:{}}));
  assert.strictEqual(noChange.text,baseText,`original mutated ${stage} ${gem.id}`);
  const hidden=e.buildCustomizedFilter(param(gem,{itemState:{[gem.id]:{enabled:false,importance:'default',visibilityExplicit:true}}}));
  assert(hidden.text.startsWith('# FIXLGS EXPORT\n# BASE')&&hidden.text.includes(`Hide # FIXLGS visibility override`) || hidden.text.includes('Hide # FIXLGS disabled'),`hide not prioritized ${stage} ${gem.id}`);
 }
}
console.log(`PASS V216 exact gem sound priority: ${gems.length} gem rows x ${stages.length} NeverSink bases x 9 area levels = ${tested} level/area cases`);
