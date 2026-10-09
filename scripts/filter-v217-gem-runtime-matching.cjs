// Verify FIXLGS gem overrides against real level-suffixed BaseType strings.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, f);
const d = require('../src/app/filter/filterData.ts');
const exp = require('../src/app/filter/filterExport.ts');
const gems = d.UNCUT_GEM_GROUPS.flatMap(group => group.items);
const stages = d.NEVER_SINK_STRICTNESSES.map(stage => stage.id);
const soundPath = 'FIXLGS_SOUNDS/um-masitda.mp3';
const descriptors = {masitda:{choice:'masitda', filterPath:soundPath}};
function payload(stage,item,overrides={}) {
  const b = require(`../public/neversink/0.10.4/baseline/${stage}.json`);
  const baseText = fs.readFileSync(path.join(__dirname,`../public/neversink/0.10.4/${stage}.filter`),'utf8');
  return {base:{id:stage, version:'0.10.4',text:baseText}, items:[item],itemState:{},
    baselineEnabled:id=>b.items[id]?.enabled??false,
    baselineStatus:id=>b.items[id]?.status??'missing',
    soundState:{},soundDescriptors:descriptors,rareTiers:{},magicTiers:{},
    rareGear:{},magicGear:{},normalItems:[],normalGear:{},normalGearExplicit:{},
    normalBaselineEnabled:()=>false,normalBaselineStatus:()=> 'missing',
    normalBaselineImportance:()=> 'default',normalImportance:{},normalLevelRules:{}, ...overrides};
}
function parseTop(text) {
  const top = text.split('# ORIGINAL NEVERSINK FILTER CONTINUES BELOW')[0];
  return top.split(/\n(?=(?:Show|Hide)\b)/).map(b=>b.trim()).filter(b=>/^(Show|Hide)\b/.test(b));
}
function gemMatches(rule, actualName, gemLevel, area) {
  const lines = rule.split('\n').map(s=>s.split('#')[0].trim());
  const base = lines.find(s=>/^BaseType\b/.test(s));
  if (!base) return false;
  const baseValue = base.match(/"([^"]*)"/)?.[1];
  const exact = /^BaseType\s*==/.test(base);
  if (!baseValue || (exact ? actualName !== baseValue : !actualName.includes(baseValue))) return false;
  for (const l of lines) {
    const m=l.match(/^(GemLevel|AreaLevel)\s*(>=|<=|==|=|>|<)?\s*(\d+)$/);
    if (!m) continue;
    const v=m[1]==='GemLevel' ? gemLevel : area, n=Number(m[3]);
    if (!({'>=': v>=n,'<=':v<=n,'==':v===n,'=':v===n,'>':v>n,'<':v<n}[m[2]||'=='])) return false;
  }
  return true;
}
let cases=0;
let realMatching=0;
for (const stage of stages) {
  for (const item of gems) {
    // NS is unmodified byte-for-byte in all strictnesses.
    const original=payload(stage,item);
    assert.strictEqual(exp.buildCustomizedFilter(original).text,original.base.text);
    const actualName = `${item.baseType} (Level ${item.gemLevel})`;
    const adjacentName = `${item.baseType} (Level ${item.gemLevel + 1})`;
    const otherBase = item.baseType === 'Uncut Skill Gem' ? 'Uncut Spirit Gem (Level '+item.gemLevel+')' : 'Uncut Skill Gem (Level '+item.gemLevel+')';
    const soundInput=payload(stage,item,{soundState:{[item.id]:'masitda'}});
    const soundResult=exp.buildCustomizedFilter(soundInput);
    assert(soundResult.usedSoundChoices.includes('masitda'));
    const soundTop=parseTop(soundResult.text);
    for (const area of [1,60,64,65,70,78,79,80,90]) {
      const first = soundTop.find(rule=>gemMatches(rule,actualName,item.gemLevel,area));
      assert(first,`Missing first matching sound rule ${stage}:${item.id}:${area}`);
      assert(first.startsWith('Show') && first.includes(soundPath),`No sound on first matching Show ${stage}:${item.id}:${area}`);
      assert(!soundTop.some(rule=>gemMatches(rule,adjacentName,item.gemLevel+1,area)),`Bleed into adjacent gem ${stage}:${item.id}:${area}`);
      assert(!soundTop.some(rule=>gemMatches(rule,otherBase,item.gemLevel,area)),`Bleed into other family ${stage}:${item.id}:${area}`);
      realMatching++;
    }
    // Changing style and sound together must retain the gem-specific sound override.
    const combined = exp.buildCustomizedFilter(payload(stage,item,{
      itemState:{[item.id]:{enabled:true,importance:'s',visibilityExplicit:true}},
      soundState:{[item.id]:'masitda'},
    }));
    const comboFirst=parseTop(combined.text).find(rule=>gemMatches(rule,actualName,item.gemLevel,80));
    assert(comboFirst?.startsWith('Show') && comboFirst.includes(soundPath),`Combined style+sound failed ${stage}:${item.id}`);
    assert(!parseTop(combined.text).some(rule=>gemMatches(rule,adjacentName,item.gemLevel+1,80)),`Combined style+sound affected another level ${stage}:${item.id}`);
    // Explicit visibility and importance also match suffix names and only the selected gem level.
    for (const [name,state,expectedAction] of [
      ['hide',{enabled:false,importance:'default',visibilityExplicit:true},'Hide'],
      ['show',{enabled:true,importance:'default',visibilityExplicit:true},'Show'],
      ['importance',{enabled:true,importance:'s',visibilityExplicit:true},'Show'],
    ]) {
      const out=exp.buildCustomizedFilter(payload(stage,item,{itemState:{[item.id]:state}}));
      const rules=parseTop(out.text);
      for (const area of [1,80]) {
        const first=rules.find(rule=>gemMatches(rule,actualName,item.gemLevel,area));
        assert(first?.startsWith(expectedAction),`Wrong ${name} ${stage}:${item.id}:${area}`);
        assert(!rules.some(rule=>gemMatches(rule,adjacentName,item.gemLevel+1,area)),`Wrong ${name} other level ${stage}:${item.id}:${area}`);
        cases++;
      }
    }
  }
}
console.log(`PASS V217 game-name-first-match: ${realMatching} sound area cases; ${cases} hide/show/importance cases; ${gems.length} gem levels × ${stages.length} bases`);
