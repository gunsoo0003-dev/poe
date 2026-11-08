const fs=require('node:fs');
const assert=require('node:assert/strict');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const read=x=>fs.readFileSync(x,'utf8');
const home=read('src/app/page.tsx');
const guideIndex=read('src/app/guides/page.tsx');
const filter=read('src/app/filter/guide/page.tsx');
const pobData=read('src/lib/pobGuides.ts');
const pobPage=read('src/app/guides/pob/[slug]/page.tsx');
const css=read('src/app/globals.css');
const target=[
 ['POE2 필터 적용 방법','/filter/guide#filter-install','id="filter-install"'],
 ['NeverSink 필터 엄격도 선택','/filter/guide#neversink-strictness','id="neversink-strictness"'],
 ['PoB 캐릭터 불러오기','/guides/pob/getting-started#character-import','id: "character-import"'],
 ['PoB DPS 계산 기준','/guides/pob/dps#dps-criteria','id: "dps-criteria"'],
];
for(const [title,link,targetId] of target){
 assert(home.includes(title),`Missing home title ${title}`);
 assert(home.includes(`href: "${link}"`),`Missing exact deep link: ${link}`);
 assert((link.startsWith('/filter')?filter:pobData).includes(targetId),`Missing anchor target ${targetId}`);
}
assert(home.includes('guidePaths.map((path)')&&home.includes('path.steps.map((guide)')&&home.includes('href={guide.href}')); // V256 preview-style presentation; original 4 deep links must remain
assert(home.includes('href="/guides"')&&home.includes('<LatestVideoGallery videos={latestVideos} />'));
assert(home.includes('<HomeToolCard item={toolLinks[0]} />')&&home.includes('<HomeToolCard item={toolLinks[1]} />'));
assert(home.includes('id="market"')&&home.includes('id="guides"')&&home.includes('id="official-video"'));
assert(pobPage.includes('id={section.id}')&&pobPage.includes('notFound()')&&pobPage.includes('generateStaticParams'));
assert(pobData.includes('slug: "getting-started"')&&pobData.includes('slug: "dps"'));
assert(guideIndex.includes('href="/guides/filter-troubleshooting"')&&guideIndex.includes('pobGuides.map'));
assert(filter.includes('현재 필터 저장')&&filter.includes('다운로드')&&filter.includes('아이템 필터 목록'));
assert(css.includes('.poe-v255-guide-columns')&&css.includes('max-width:760px')&&css.includes('prefers-reduced-motion:reduce')); // V256 replaces V251/V253 layouts
for(const file of ['src/app/page.tsx','src/app/guides/page.tsx','src/app/filter/guide/page.tsx','src/app/guides/pob/[slug]/page.tsx','src/lib/pobGuides.ts']){
 const data=read(file), sf=ts.createSourceFile(file,data,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 assert.equal(sf.parseDiagnostics.length,0,`${file}: ${sf.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
}
console.log('PASS V251 retained: 4 guide links/anchors, existing guide index, V256 preview render, TSX/TS parsing');
