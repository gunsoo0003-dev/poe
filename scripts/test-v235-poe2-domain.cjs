/**
 * V258: current user decision supersedes V235 SEO files.
 * Preserve correct primary domain without publishing a robots or sitemap route.
 */
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
  for (const extension of ['ts', 'tsx', 'js', 'jsx']) {
    assert(!fs.existsSync(path.join(root, `src/app/${route}.${extension}`)),
      `Current policy disallows src/app/${route}.${extension}`);
  }
}
for (const filename of ['robots.txt', 'sitemap.xml']) {
  assert(!fs.existsSync(path.join(root, 'public', filename)), `Public ${filename} must be absent`);
}
const policy = fs.readFileSync(path.join(root, 'src/app/privacy/site/page.tsx'), 'utf8');
assert(policy.includes('Cloudflare 등의 호스팅 서비스'));
console.log('PASS V258: primary domain, no user-defined robots/sitemap, privacy hosting notice.');
