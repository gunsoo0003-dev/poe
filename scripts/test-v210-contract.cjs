/* Self-contained clipboard contract smoke tests; does NOT require Next.js. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const dir = path.join(__dirname,'../src/app/pob');
const exportsCache = {};
function load(name) {
  if (exportsCache[name]) return exportsCache[name];
  const source = fs.readFileSync(path.join(dir,name+'.ts'),'utf8');
  const code = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const out={};
  const context={exports:out,require(module){if(module==='./tradeItem')return load('tradeItem');throw Error('unknown '+module)}};
  vm.runInNewContext(code,context,{filename:name+'.cjs'});
  exportsCache[name]=out;
  return out;
}
const {convertTradeToPob}=load('tradeToPob');
const {parseTradeItem}=load('tradeItem');
const fixtures=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/v0043-cases.json'),'utf8'));
for(const [rarity,clipboard] of Object.entries(fixtures)){
  const converted=convertTradeToPob(clipboard);
  const parsed=parseTradeItem(clipboard);
  assert.equal(converted.baseName,parsed.baseType);
  assert.match(converted.rawText,new RegExp('^Rarity: '+rarity.toUpperCase()));
  assert.ok(!converted.rawText.includes('FIXLGS-META-'), 'audit must NEVER reach PoB engine');
  assert.equal(parsed.rarity.toLowerCase(),rarity);
  assert.match(converted.rawText,/Implicits: \d+/);
  if(rarity==='rare'){
    assert.match(converted.rawText,/Grants Skill: Spear Throw/);
    assert.match(converted.rawText,/\+5% to all Elemental Resistances/);
    assert.match(converted.rawText,/Adds 2 to 3 Cold Damage/);
    assert.ok(!converted.unsupported.some(x=>/소켓 효과/.test(x)), 'socket presence alone must not warn');
    assert.match(converted.rawText,/\{rune\}\+5% to all Elemental Resistances/);
    assert.ok(converted.unsupported.some(x=>/신규 옵션 그룹/.test(x)));
  }
  if(rarity==='normal')assert.ok(!converted.rawText.includes('undefined'));
}
// Prior V004.2 export remains accepted, no metadata needed.
const old=`FIXLGS-EN-V004\nRarity: RARE\nSpirit Edge\nGrand Spear\nQuality: 25\nItem Level: 82\nImplicits: 1\n25% increased [Melee] [Strike] Range with this weapon\n71% increased [Physical] Damage`;
assert.match(convertTradeToPob(old).rawText,/71% increased Physical Damage/);
// Unknown future metadata gets a warning but never becomes a damage modifier.
const bad=fixtures.magic.replace(/^FIXLGS-META-V1:.*$/m,'FIXLGS-META-V1:{broken json}');
assert.ok(convertTradeToPob(bad).unsupported.some(x=>/메타데이터/.test(x)));
console.log('V210 web adapter contract tests: PASS (V004.2 compat, V004.3 all rarities, skill/rune/unknown, metadata excluded)');
