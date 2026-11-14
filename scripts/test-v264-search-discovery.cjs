/** V264 offline route and metadata checks; no live HTTP/build claims. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const pages = [
  '/', '/filter', '/pob', '/filter/guide', '/guides',
  '/guides/filter-troubleshooting', '/about', '/contact',
  '/privacy', '/privacy/site', '/terms',
  '/news', '/news/poe2-1-0-full-release'
];
const site = 'https://poe2.fixlgs.com';
const guideCode = read('src/lib/pobGuides.ts');
const slugs = Array.from(guideCode.matchAll(/^\s+slug:\s*"([a-z0-9-]+)"/gm), m => m[1]);
assert(slugs.length >= 2, 'PoB guide data must contain published slugs');
assert.equal(new Set(slugs).size, slugs.length, 'duplicate PoB guide slug');
for (const page of pages) {
  const pathname = page === '/' ? 'src/app/page.tsx' : `src/app${page}/page.tsx`;
  assert(fs.existsSync(path.join(root, pathname)), `missing published page: ${pathname}`);
}
assert(fs.existsSync(path.join(root,'src/app/guides/pob/[slug]/page.tsx')));
const robotsSrc = read('src/app/robots.ts');
const sitemapSrc = read('src/app/sitemap.ts');
function evalMetadata(src, name, bindings = {}) {
  // These two simple TS files have a return type only; run the true function bodies.
  const js = src
    .replace(/^import\s+(?:type\s+)?[^\n]+\n/gm, '')
    .replace(/:\s*MetadataRoute\.(?:Robots|Sitemap)/g, '')
    .replace(/export default function /g, 'function ')
    + `\n${name}();`;
  return vm.runInNewContext(js, Object.assign({ URL }, bindings));
}
const robots = evalMetadata(robotsSrc, 'robots');
assert.equal(robots.rules.userAgent, '*');
assert.equal(robots.rules.allow, '/');
assert.equal(robots.sitemap, `${site}/sitemap.xml`);
assert(robots.rules.disallow.includes('/api/'));
assert(robots.rules.disallow.includes('/pob/engine-lab'));
const entries = evalMetadata(sitemapSrc, 'sitemap', {
  pobGuides: slugs.map(slug => ({slug}))
});
const urls = Array.from(entries, p => p.url);
const expected = [
  ...pages.map(page => site + (page === '/' ? '' : page)),
  ...slugs.map(slug => `${site}/guides/pob/${slug}`),
];
assert.deepEqual(urls, expected, 'sitemap must match actual public pages and guides');
assert.equal(urls.length, new Set(urls).size, 'duplicate URLs');
assert(urls.every(url => url.startsWith(site) && !url.includes('/api/') && !url.includes('/engine-lab')));
assert(!sitemapSrc.includes('new Date()'), 'do not fabricate lastModified dates');
for (const file of ['public/robots.txt', 'public/sitemap.xml']) {
  assert(!fs.existsSync(path.join(root, file)), `${file} would duplicate metadata route`);
}
console.log(`PASS V264: robots rules, ${pages.length} public paths, ${slugs.length} dynamic guides, ${urls.length} unique sitemap URLs, no internal/API exposure.`);
