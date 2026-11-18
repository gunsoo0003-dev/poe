const fs=require('fs'),assert=require('assert');
const root=require('path').resolve(__dirname,'..');
const paths=['src/app/news/poe2-1-0-full-release/page.tsx','src/app/news/poe2-1-0-atlas-passive-rework/page.tsx'];
for(const p of paths){const s=fs.readFileSync(require('path').join(root,p),'utf8');assert(s.includes('className={styles.articleReturn}'));assert(s.includes('href="/news"'));assert(s.includes('href="/"'));assert(s.includes('홈으로 돌아가기'));assert.strictEqual((s.match(/className=\{styles.articleReturn\}/g)||[]).length,1);}
const css=fs.readFileSync(require('path').join(root,'src/app/news/news.module.css'),'utf8');assert(css.includes('.articleReturn{display:flex'));assert(css.includes('@media(max-width:420px)'));
const index=fs.readFileSync(require('path').join(root,'src/app/news/page.tsx'),'utf8');assert(index.includes('newsGrid'));assert(index.includes('newsReturn'));
console.log('PASS V284: both articles have archive/home links, scoped CSS and archive preserved');
