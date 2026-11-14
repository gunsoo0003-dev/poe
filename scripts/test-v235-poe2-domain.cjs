/** V264: current user decision supersedes the V258 SEO-file removal. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [
  'src/app/layout.tsx',
  'src/app/privacy/site/page.tsx',
];
for (const relative of files) {
  const content = fs.readFileSync(path.join(root, relative), 'utf8');
  assert(content.includes('poe2.fixlgs.com'), `${relative}: new domain missing`);
  assert(!content.includes('poe.fixlgs.com'), `${relative}: legacy domain remains`);
}
for (const route of ['robots', 'sitemap']) {
  assert(fs.existsSync(path.join(root, `src/app/${route}.ts`)), `${route}.ts must exist`);
}
for (const filename of ['robots.txt', 'sitemap.xml']) {
  assert(!fs.existsSync(path.join(root, 'public', filename)), `Avoid duplicate static ${filename}`);
}
const robots = fs.readFileSync(path.join(root, 'src/app/robots.ts'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'src/app/sitemap.ts'), 'utf8');
assert(robots.includes('https://poe2.fixlgs.com/sitemap.xml'));
assert(sitemap.includes('https://poe2.fixlgs.com'));
const policy = fs.readFileSync(path.join(root, 'src/app/privacy/site/page.tsx'), 'utf8');
assert(policy.includes('Cloudflare 등의 호스팅 서비스'));
console.log('PASS V264: primary domain, robots/sitemap restored, privacy hosting notice.');
