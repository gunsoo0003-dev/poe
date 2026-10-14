// Regression: the public install action must resolve to the published Chrome Web Store,
// while every advertised PoB guide has a real Next.js route.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const storeUrl = 'https://chromewebstore.google.com/detail/fixlgs-poe2-item-export/cdhhjobcolejcdiianepndmkmmkgbeea';
const home = read('src/app/pob/page.tsx');
const guide = read('src/lib/pobGuides.ts');
const detail = read('src/app/guides/pob/[slug]/page.tsx');
const manifest = JSON.parse(read('extension/fixlgs-poe2-item-export/manifest.json'));
assert.equal(manifest.version, '0.4.6');
assert(home.includes(`href="${storeUrl}"`), 'PoB start button must point to the public extension');
assert(home.includes('target="_blank" rel="noopener noreferrer"'), 'external install link needs safe target attributes');
assert(!home.includes('href="/downloads/FIXLGS_POE2_ITEM_EXPORT'), 'old ZIP install link must not be used');
assert(guide.includes(`href: "${storeUrl}"`), 'guide must include the same official install URL');
assert(guide.includes('Chrome이 확장프로그램을 자동 업데이트합니다.'), 'guide must describe the new install/update flow');
assert(detail.includes('generateStaticParams()') && detail.includes('pobGuides.map'), 'all guide slugs must be routable');
assert(detail.includes('pobGuideBySlug(slug)') && detail.includes('notFound()'), 'guide renderer must resolve slug');
assert(detail.includes('guide.resources.map'), 'external guide resources must render');
console.log('V232 extension store and PoB guide regression: PASS (9 assertions)');
