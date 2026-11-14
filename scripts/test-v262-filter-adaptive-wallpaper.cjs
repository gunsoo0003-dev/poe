// V262 layout-only checks: single PC wallpaper, exact responsive shell mask; unchanged filter logic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');
const page = fs.readFileSync(path.join(root, 'src/app/filter/page.tsx'), 'utf8');
const filter = fs.readFileSync(path.join(root, 'src/app/filter/FilterCustomizer.tsx'), 'utf8');
const main = css.split('.filter-v2-page {')[1].split('\n}')[0];
const shell = css.split('.filter-v2-shell {')[1].split('\n}')[0];
const tests = [
  ['one desktop photo (no triptych)', () => { assert.match(main, /official-lightning-gameplay\.webp/);assert.equal((main.match(/url\('/g)||[]).length,1); }],
  ['source photo is local', () => assert.ok(fs.existsSync(path.join(root,'public/images/poe2/official-lightning-gameplay.webp')))],
  ['wallpaper anchored to viewport', () => assert.match(main, /background-attachment: fixed, fixed/)],
  ['side clearing follows shell instead of fixed percent masks', () => {assert.match(shell,/width: min\(1780px, calc\(100vw - 116px\)\)/);assert.match(shell,/margin: 0 auto/);assert.match(shell,/linear-gradient\(90deg, rgba\(10,8,9,\.97\)/);}],
  ['mobile prior wallpaper preserved', () => assert.match(css, /@media\(max-width:980px\)\{[\s\S]*?cinematic-hero\.webp/)],
  ['V261 27-category editor intact', () => { assert.match(page, /<FilterCustomizer \/>/);assert.match(filter,/renderTierList/); }],
  ['V264 robots sitemap present', () => {assert.ok(fs.existsSync(path.join(root,'src/app/robots.ts')));assert.ok(fs.existsSync(path.join(root,'src/app/sitemap.ts')));}],
];
for (const [label,test] of tests){ test();console.log('PASS',label) }
console.log(`PASS V262 wallpaper contract (${tests.length} checks)`);
