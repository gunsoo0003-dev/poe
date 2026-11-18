const fs=require('fs');const assert=require('assert');
const page=fs.readFileSync('src/app/news/page.tsx','utf8');const css=fs.readFileSync('src/app/news/news.module.css','utf8');
for(const cls of ['newsIndex','newsGrid','newsReturn','newsReturnLink','newsSummary']){assert(page.includes('styles.'+cls),cls+' missing page');assert(css.includes('.'+cls),cls+' missing css')}
assert(page.includes('href="/" className={styles.newsReturnLink}'));assert(page.includes('← 홈으로 돌아가기'));
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
assert(css.includes('@media(max-width:700px)')&&css.includes('grid-template-columns:1fr'));
assert(page.indexOf('poe2-1-0-atlas-passive-rework')<page.indexOf('poe2-1-0-full-release'));
assert(page.includes('/news/atlas/atlas-cover-v281.svg'));
assert(page.includes('OfficialArtwork'));
assert(!css.includes('.listCard{display:grid'));
console.log('PASS V283: 2-column desktop, 1-column mobile, home return, preserved news cards');
