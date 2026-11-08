const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root='src/app/page.tsx', home=fs.readFileSync(root,'utf8'),css=fs.readFileSync('src/app/globals.css','utf8');
const fGuide=fs.readFileSync('src/app/filter/guide/page.tsx','utf8');
const pGuide=fs.readFileSync('src/lib/pobGuides.ts','utf8');
const gPage=fs.readFileSync('src/app/guides/pob/[slug]/page.tsx','utf8');
const order=['<div id="tools"','<section id="guides"','<section id="market"','<section id="official-video"','<footer className='].map(v=>home.indexOf(v));
assert(order.every((v,i)=>v>-1&&(i===0||v>order[i-1])),'Expected hero → GUIDES → MARKET → MEDIA → footer');
assert(home.includes('01 / START HERE · GUIDES')&&home.includes('02 / MARKET')&&home.includes('03 / MEDIA'));
assert(home.includes('처음 이용하시나요?')&&home.includes('FILTER와 POB 사용법을 각각 두 가지 핵심 가이드로 확인하세요.')); // Updated V254 display
assert(home.includes('guidePaths.map((path)')&&home.includes('path.steps.map((guide)'));
assert.equal((home.match(/key: "filter"/g)||[]).length,1);
assert.equal((home.match(/key: "pob"/g)||[]).length,1);
assert(home.includes('poe-v255-guide-sheet')&&home.includes('guide.preview.map((line)')); // V256 visible document teasers
assert(!home.includes('toolHref: "/filter"')&&!home.includes('toolHref: "/pob"')); // User removed duplicate CTAs
const deep=[
 ['POE2 필터 적용 방법','/filter/guide#filter-install','id="filter-install"',fGuide],
 ['NeverSink 필터 엄격도 선택','/filter/guide#neversink-strictness','id="neversink-strictness"',fGuide],
 ['PoB 캐릭터 불러오기','/guides/pob/getting-started#character-import','id: "character-import"',pGuide],
 ['PoB DPS 계산 기준','/guides/pob/dps#dps-criteria','id: "dps-criteria"',pGuide],
];
for(const [title,href,target,source] of deep){assert(home.includes(title),title);assert(home.includes(`href: "${href}"`),href);assert(source.includes(target),target)}
assert(gPage.includes('id={section.id}'));
assert(home.includes('href={guide.href}')&&!home.includes('href={path.toolHref}')); // Four guide links only
assert(home.includes('<HomeToolCard item={toolLinks[0]} />')&&home.includes('<HomeToolCard item={toolLinks[1]} />'));
assert(home.includes('FireText label={item.label}')&&home.includes('poe2-official-logo.webp'));
assert(home.includes('poe-v252-value-strip')&&!home.includes('heroLinks')&&!home.includes('poe-v239-link-row'));
assert(css.includes('.poe-v255-guide-columns')&&css.includes('.poe-v255-guide-card:focus-visible')&&css.includes('@media(max-width:960px)')&&css.includes('prefers-reduced-motion:reduce'));
for(const file of [root]){
 const src=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(sf.parseDiagnostics.length,0,sf.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
}
console.log('PASS V253 retained for V256: section order, two 2-guide groups, 4 links, no redundant CTAs, FireText, mobile/focus CSS');
