'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname,'..');
const read = p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const markupSource=read('src/app/home-v019-markup.ts');
const markup=JSON.parse(markupSource.match(/export const v019Markup: string = ([\s\S]*);\s*$/)[1]);
const page=read('src/app/page.tsx');
const client=read('src/app/V019Interactions.tsx');
const css=read('src/app/home-v019.css');
const js=read('public/poe-home/script.js');
const tests=[];
const check=(label,fn)=>{fn();tests.push(label);};
check('V019 original HTML/CSS/JS and HISTORY preserved as archived source',()=>{
 for(const p of ['index.html','styles.css','script.js','HANDOVER.md','docs/handover/HISTORY_V001.md']) assert.ok(fs.statSync(path.join(ROOT,'docs/design-reference/V019',p)).size>0,p);
});
check('real V256 FILTER/PoB/source routes intact',()=>{
 for(const p of ['src/app/filter/page.tsx','src/app/filter/guide/page.tsx','src/app/pob/page.tsx','src/app/pob/pobCompare.ts','src/app/pob/web-engine/calc-client.ts','src/app/pob/ringSlots.ts','src/app/guides/pob/[slug]/page.tsx','src/app/terms/page.tsx','src/app/privacy/site/page.tsx','src/app/contact/page.tsx','public/wasm/lua.wasm','public/data/pob-lua.json']) assert.ok(fs.existsSync(path.join(ROOT,p)),p);
});
check('V256 server video list and 30-day refresh retained',()=>{
 assert.match(page,/getLatestOfficialVideos\(3\)/);
 assert.match(page,/revalidate = 2592000/);
 assert.match(read('src/lib/youtube.ts'),/next:\s*\{\s*revalidate: THIRTY_DAYS/);
 assert.match(client,/window\.FIXLGS_POE2_VIDEOS = videos\.slice\(0, 3\)/);
 assert.doesNotMatch(page,/LatestVideoGallery/);
 assert.doesNotMatch(page,/noindex/);
});
check('working filter/PoB entry buttons and guides are real routes',()=>{
 for (const url of ['/filter','/pob','/filter/guide','/guides/pob/getting-started']) assert.ok(markup.includes('href="'+url+'"'),url);
 for (const id of ['hero','welcome','news','overview','gameplay','classes','editions'])assert.ok(markup.includes('id="'+id+'"'),id);
});
check('footer uses existing legal and contact pages',()=>{
 for (const url of ['/terms','/privacy/site','/contact'])assert.ok(markup.includes('href="'+url+'"'),url);
});
check('real news article replaces sample and pending slots are honest',()=>{
 assert.match(markup,/href="\/news\/poe2-1-0-full-release"/);
 assert.match(markup,/href="\/news"/);
 assert.match(markup,/<h2>새소식<\/h2>/);
 assert.doesNotMatch(markup,/시세 분석 예시|더미 기사/);
 assert.equal((markup.match(/news-row-placeholder/g)||[]).length,4);
});
check('8 filter tabs and 2 PoB tabs remain',()=>{
 assert.equal((markup.match(/data-class="/g)||[]).length,8);
 assert.equal((markup.match(/data-realm="/g)||[]).length,2);
});
check('three 16:9 video cards and muted autoplay logic remain',()=>{
 assert.equal((markup.match(/class="edition video-edition/g)||[]).length,3);
 assert.match(css, /aspect-ratio:\s*16\/9/);
 assert.match(js,/onStateChange\(event\)/);
 assert.match(js,/PlayerState\.ENDED/);
 assert.match(js,/event\.target\.mute\(\)/);
});
check('home CSS is scoped and assets are local',()=>{
 assert.ok(css.includes('.poe-v019-root '));
 assert.ok(css.includes('/poe-home/assets/poe2-hero-ranger.webp'));
 for (const n of ['poe2-hero-ranger.webp','poe2-character-combat.webp','poe2-ranger-classes.webp','poe2-character-boss.webp','poe2-lightning-combat.webp']) assert.ok(fs.statSync(path.join(ROOT,'public/poe-home/assets',n)).size>1000);
 assert.ok(!css.includes("url('assets/"));
});
check('root page serves integrated content and uses opt-in interaction script',()=>{
 assert.match(page,/dangerouslySetInnerHTML=\{\{ __html: v019Markup \}\}/);
 assert.match(page,/\.\/home-v019\.css/);
 assert.match(client,/\/poe-home\/script\.js/);
});
console.log('PASS V257 home integration:',tests.length,'contract groups');
