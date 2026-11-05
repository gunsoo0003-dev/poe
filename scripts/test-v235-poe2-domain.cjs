/** V235: prevent legacy poe.fixlgs.com from leaking into canonical URLs or user-facing policy. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [
  'src/app/layout.tsx',
  'src/app/sitemap.ts',
  'src/app/robots.ts',
  'src/app/privacy/site/page.tsx',
];
for (const relative of files) {
  const content = fs.readFileSync(path.join(root, relative), 'utf8');
  assert(content.includes('poe2.fixlgs.com'), `${relative}: new domain missing`);
  assert(!content.includes('poe.fixlgs.com'), `${relative}: legacy domain remains`);
}
assert(fs.readFileSync(path.join(root, 'src/app/sitemap.ts'), 'utf8').includes('const origin="https://poe2.fixlgs.com"'));
assert(fs.readFileSync(path.join(root, 'src/app/robots.ts'), 'utf8').includes('https://poe2.fixlgs.com/sitemap.xml'));
const policy = fs.readFileSync(path.join(root, 'src/app/privacy/site/page.tsx'), 'utf8');
assert(policy.includes('Cloudflare 등의 호스팅 서비스'));
console.log('PASS V235: canonical domain, sitemap, robots, privacy URLs and hosting notice.');
