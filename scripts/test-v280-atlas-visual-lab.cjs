const fs=require('node:fs');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const base='src/app/news/poe2-1-0-atlas-passive-rework/';const article=fs.readFileSync(base+'page.tsx','utf8');const comp=fs.readFileSync(base+'AtlasVisuals.tsx','utf8');const css=fs.readFileSync(base+'atlas-visuals.module.css','utf8');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
for(const file of [base+'page.tsx',base+'AtlasVisuals.tsx']){const src=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);assert.equal(src.parseDiagnostics.length,0,`${file} JSX syntax`);}
for(const scene of ['systems','scale','progress']) assert(article.includes(`<AtlasVisuals scene="${scene}" />`));
for(const svg of ['atlas-tree-distinction.svg','atlas-node-comparison.svg','atlas-points-flow.svg'])assert(!article.includes(`src="/news/atlas/${svg}"`));
assert(comp.includes('prefers-reduced-motion')||css.includes('prefers-reduced-motion'));assert(comp.includes('IntersectionObserver'));assert(css.includes('@media(max-width:620px)'));assert(comp.includes('CONCEPT VISUALIZATION'));
const imgs=['atlas-tree-legacy.png','atlas-tree-alternative.png','atlas-stone-citadel.png','atlas-boss-reference.png'];const hashes=new Set();for(const f of imgs){const bytes=fs.readFileSync('public/news/atlas/'+f);assert.equal(article.split(`src="/news/atlas/${f}"`).length-1,1);hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));}assert.equal(hashes.size,4);assert(article.includes('1.0 최종 개편 트리 화면은 아닙니다'));
assert(!article.includes('https://cdn.mobalytics.gg/uploads/images/poe-2/'));assert(!comp.includes('fetch('));
console.log('PASS V280: TSX syntax, 3 graphics, 4 local unique screenshots, reduced motion, mobile, no network dependency');
