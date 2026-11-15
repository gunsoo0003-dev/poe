const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const worker = fs.readFileSync(path.join(root,'src/app/pob/web-engine/calc-worker.ts'),'utf8');
const compare = fs.readFileSync(path.join(root,'src/app/pob/pobCompare.ts'),'utf8');
const client = fs.readFileSync(path.join(root,'src/app/pob/web-engine/calc-client.ts'),'utf8');
for(const [name,src] of [['worker',worker],['compare',compare],['client',client]]){
 const sf=ts.createSourceFile(name+'.ts',src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 assert.equal(sf.parseDiagnostics.length,0,name+' syntax diagnostics');
}
for(const token of ['runeLineDetails','modifierCount = modLine.modList','parserExtra = tostring(modLine.extra','runeUnknownLines = runeUnparsed','runeNamesUnknown = runeNamesUnknown']) assert.ok(worker.includes(token),'native PoB trace missing: '+token);
for(const token of ['PoB 룬 이름 미등록:', 'PoB 룬 효과 미해석:', 'trace.runeLineDetails', 'return blocked(slot, issues)']) assert.ok(compare.includes(token),'comparison trace missing: '+token);
assert.ok(!compare.includes('return blocked(slot, ["PoB가 룬 효과 또는 장착 룬 이름을 완전히 해석하지 못함"])'));
assert.ok(client.includes('runeLineDetails?:'));
console.log('PASS V269: native rune source details preserved, exact failure names/lines surfaced, blocked guard retained');
