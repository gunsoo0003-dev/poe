/** V233 Cloudflare asset-size fix regression, Node-only (no npm dependencies). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/data/pob-lua.json'));
const worker = fs.readFileSync(path.join(root, 'src/app/pob/web-engine/calc-worker.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const compressed = zlib.gzipSync(source, { level: 9 });
assert(compressed.length < 25 * 1024 * 1024, 'Static asset must fit Cloudflare 25 MiB limit');
assert.equal(digest(zlib.gunzipSync(compressed)), digest(source), 'PoB Lua data must not change');
assert.equal(Object.keys(JSON.parse(source).files).length, 997, 'All native files retained');
assert(worker.includes('fetch("/data/pob-lua.json.gz")'), 'New Cloudflare gzip path');
assert(worker.includes('new DecompressionStream("gzip")'), 'Browser worker gzip decode');
assert(worker.includes('fetch("/data/pob-lua.json")'), 'Legacy/Vercel original path kept');
assert(pkg.scripts.build === 'next build', 'Vercel build script unchanged');
assert(pkg.scripts['build:cloudflare'].includes('prepare-cloudflare-assets.cjs'), 'Cloudflare separate build');
// Test the exact browser-side streaming decode that is used inside the calc Web Worker.
(async () => {
  const decoded = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  assert.equal(digest(Buffer.from(decoded)), digest(source), 'Worker stream decode is byte-identical');
  console.log(`PASS V233: 997 files preserved, ${source.length} -> ${compressed.length} bytes, streaming gzip roundtrip, Vercel fallback`);
})().catch(error => {console.error(error); process.exitCode=1});
