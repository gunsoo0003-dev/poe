const fs=require('fs');const assert=require('assert');const read=f=>fs.readFileSync(f,'utf8');
const article=read('src/app/news/poe2-1-0-atlas-passive-rework/page.tsx');
const home=read('src/app/home-v019-markup.ts'), news=read('src/app/news/page.tsx'),site=read('src/app/sitemap.ts');
for(const value of ['아틀라스','0.5.5','70개','66개','요새','주얼','NewsArticle','dateCreated'])assert(article.includes(value),value);
for(const content of [home,news,site])assert(content.includes('poe2-1-0-atlas-passive-rework'));
assert(!article.includes('datePublished'));assert(article.includes('미확인'));console.log('PASS V272 atlas article, home/news/sitemap, uncertainty');
