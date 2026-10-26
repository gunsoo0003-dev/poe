/** V234: Assert Cloudflare trial branch Worker/package identity without touching any runtime code. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const name = 'fixlgs-poe2';
if (pkg.name !== name || lock.name !== name || lock.packages[''].name !== name) {
 throw new Error(`Cloudflare Worker name mismatch: expected ${name}, got ${[pkg.name,lock.name,lock.packages[''].name].join(',')}`);
}
if (pkg.scripts.build !== 'next build' || !pkg.scripts['build:cloudflare']?.includes('prepare-cloudflare-assets.cjs')) {
 throw new Error('Vercel/Cloudflare build separation changed unexpectedly.');
}
console.log('PASS V234: package.json / package-lock.json identify fixlgs-poe2; Vercel build preserved.');
