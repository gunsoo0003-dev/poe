const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'src/app/page.tsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');
assert.match(page, /poe-v241-home/);
for (const [file, section] of [
  ['official-burning-village.webp', '.poe-v239-hero'],
  ['official-adura-caravan.webp', '.poe-v238-market'],
  ['official-lightning-gameplay.webp', '.poe-v238-guides'],
  ['official-prisoner.webp', '.poe-v238-video-section'],
]) {
  assert(fs.statSync(path.join(root, 'public/images/poe2', file)).size > 30000, `${file} missing/empty`);
  assert(css.includes(file), `CSS does not reference ${file}`);
  assert(css.includes(`.poe-v241-home ${section}`), `missing scoped rule for ${section}`);
}
assert.match(page, /href: "\/filter"/);
assert.match(page, /href: "\/pob"/);
assert.match(page, /getLatestOfficialVideos\(4\)/);
assert.match(css, /@media\(max-width:760px\).*poe-v241-home/s);
console.log('PASS V241 official image assets, independent home styles, original functional links, media and responsive selectors');
