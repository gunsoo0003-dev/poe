const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const home = fs.readFileSync('src/app/page.tsx','utf8');
const css = fs.readFileSync('src/app/globals.css','utf8');
const filter=fs.readFileSync('src/app/filter/guide/page.tsx','utf8');
const pob=fs.readFileSync('src/lib/pobGuides.ts','utf8');
const area=home.slice(home.indexOf('const guidePaths = ['),home.indexOf('const marketCards = ['));
const f=area.slice(area.indexOf('key: "filter"'),area.indexOf('key: "pob"'));
const p=area.slice(area.indexOf('key: "pob"'));
assert(f.includes('label: "필터 사용법"') && p.includes('label: "POB 사용법"'));
assert.equal((f.match(/title: "/g)||[]).length,2);
assert.equal((p.match(/title: "/g)||[]).length,2);
assert(f.indexOf('POE2 필터 적용 방법') < f.indexOf('NeverSink 필터 엄격도 선택'));
assert(p.indexOf('PoB 캐릭터 불러오기') < p.indexOf('PoB DPS 계산 기준'));
for(const [href,target,source] of [
 ['/filter/guide#filter-install','id="filter-install"',filter],
 ['/filter/guide#neversink-strictness','id="neversink-strictness"',filter],
 ['/guides/pob/getting-started#character-import','id: "character-import"',pob],
 ['/guides/pob/dps#dps-criteria','id: "dps-criteria"',pob],
]){assert(home.includes(`href: "${href}"`),href);assert(source.includes(target),target)}
for(const v of ['href={guide.href}', 'poe-v255-guide-card', 'poe-v255-guide-sheet','guide.preview.map((line)'])assert(home.includes(v),v);
for(const v of ['poe-v253-guide-footer','poe-v253-step-number','href={path.toolHref}'])assert(!home.includes(v),v);
assert(home.indexOf('<section id="guides"') < home.indexOf('<section id="market"'));
assert(css.includes('.poe-v255-guide-card:focus-visible')&&css.includes('prefers-reduced-motion:reduce'));
const sf=ts.createSourceFile('src/app/page.tsx',home,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
assert.equal(sf.parseDiagnostics.length,0,sf.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
console.log('PASS V254 retained for V256: FILTER/POB 2+2, correct order, anchors, no duplicate CTAs, readable cards, TSX');
