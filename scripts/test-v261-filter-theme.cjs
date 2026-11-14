// V261 visual-only contract: do not replace the NeverSink/filter state engine.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const css = read('src/app/globals.css');
const filter = read('src/app/filter/FilterCustomizer.tsx');
const page = read('src/app/filter/page.tsx');
const data = read('src/app/filter/filterData.ts');
const checks = [
  ['previous mobile backdrop still present', () => assert.match(css, /@media\(max-width:980px\)\{[\s\S]*?cinematic-hero\.webp/)],
  ['asset exists locally', () => assert.ok(fs.existsSync(path.join(root, 'public/images/poe2/cinematic-hero.webp')))],
  ['fixed viewport backdrop', () => assert.match(css, /background-attachment: fixed, fixed;/)],
  ['content width unchanged', () => assert.match(css, /\.filter-v2-shell \{\s*width: min\(1780px, calc\(100vw - 116px\)\)/)],
  ['tier density 70px', () => assert.match(css, /\.filter-v2-tier-list article,\s*\.filter-v2-normal-list article \{\s*min-height: 70px/)],
  ['item density 68px', () => assert.match(css, /\.filter-v2-item-row \{\s*min-height: 68px/)],
  ['importance click 40px', () => assert.match(css, /\.filter-v2-importance button \{\s*min-height: 40px/)],
  ['toggle 44x26', () => assert.match(css, /\.filter-v2-switch \{\s*width: 44px;\s*height: 26px/)],
  ['narrow desktop protection', () => assert.match(css, /@media \(min-width: 981px\) and \(max-width: 1100px\)/)],
  ['mobile scroll preserved', () => assert.match(css, /\.filter-v247-scroll\{display:block;max-width:100vw;overflow-x:auto;/)],
  ['filter tier interaction preserved', () => assert.match(filter, /renderTierList[\s\S]*?onChange=\{\(event\) =>/)],
  ['NeverSink item original toggle preserved', () => assert.match(filter, /onImportance\(option\.value\)/)],
  ['rare options untouched', () => assert.match(data, /RARE_GEAR_IMPORTANCE_OPTIONS:[\s\S]*?label: "NS"[\s\S]*?label: "S"/)],
  ['filters and guides route preserved', () => assert.match(page, /<FilterCustomizer \/>/)],
  ['V264 robots and sitemap present', () => {assert.ok(fs.existsSync(path.join(root,'src/app/robots.ts')));assert.ok(fs.existsSync(path.join(root,'src/app/sitemap.ts')))}],
];
for (const [name, fn] of checks) { fn(); console.log('PASS', name); }
console.log(`PASS V261 FILTER visual-only contract (${checks.length} groups)`);
