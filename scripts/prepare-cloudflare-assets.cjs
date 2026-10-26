/**
 * Cloudflare Workers static assets have a 25 MiB per-file limit.
 * Build-only staging: gzip the canonical PoB Lua bundle and move the original
 * temporarily out of the project tree. Never modify the canonical bytes.
 *
 * Intended CI order:
 *   node scripts/prepare-cloudflare-assets.cjs && npm run build
 *   npx wrangler deploy  (Cloudflare's OpenNext auto-configuration)
 *
 * The Git repository and normal `npm run build` (Vercel) remain unchanged.
 * Local cleanup if necessary: node scripts/prepare-cloudflare-assets.cjs --restore
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const raw = path.join(root, 'public', 'data', 'pob-lua.json');
const gz = path.join(root, 'public', 'data', 'pob-lua.json.gz');
const marker = path.join(root, 'node_modules', '.cache', 'fix-pob-cloudflare-raw-path.txt');
const limit = 25 * 1024 * 1024;
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

if (process.argv.includes('--restore')) {
  if (!fs.existsSync(marker)) {
    console.log('Nothing to restore.');
    process.exit(0);
  }
  const backup = fs.readFileSync(marker, 'utf8').trim();
  if (!backup.startsWith(path.join(os.tmpdir(), 'fix-pob-cloudflare-'))) {
    throw new Error('Refusing unexpected backup path');
  }
  if (fs.existsSync(raw)) throw new Error('Canonical file already present; not overwriting');
  fs.copyFileSync(backup, raw);
  fs.rmSync(backup);
  fs.rmSync(marker);
  fs.rmSync(gz, { force: true });
  console.log('Canonical PoB data restored from temporary build staging.');
  process.exit(0);
}

if (!fs.existsSync(raw)) {
  throw new Error('Canonical public/data/pob-lua.json missing; check restore instructions before retrying.');
}
if (fs.existsSync(marker)) {
  throw new Error('Existing Cloudflare staging backup detected; restore it before retrying.');
}
const original = fs.readFileSync(raw);
const zipped = zlib.gzipSync(original, { level: 9 });
if (zipped.length >= limit) {
  throw new Error(`Compressed PoB bundle still exceeds 25 MiB (${zipped.length} bytes)`);
}
if (hash(zlib.gunzipSync(zipped)) !== hash(original)) {
  throw new Error('Gzip roundtrip changed canonical PoB bytes');
}
const tmpGz = `${gz}.tmp-${process.pid}`;
fs.writeFileSync(tmpGz, zipped);
fs.renameSync(tmpGz, gz);
fs.mkdirSync(path.dirname(marker), { recursive: true });
const backup = path.join(os.tmpdir(), `fix-pob-cloudflare-${process.pid}-${crypto.randomUUID()}.json`);
try {
  fs.copyFileSync(raw, backup);
  if (hash(fs.readFileSync(backup)) !== hash(original)) {
    throw new Error('Cloudflare temporary backup checksum mismatch');
  }
  fs.writeFileSync(marker, backup, { flag: 'wx' });
  fs.unlinkSync(raw);
} catch (error) {
  // Do not remove the canonical source on any staging error.
  if (fs.existsSync(raw)) {
    fs.rmSync(marker, { force: true });
    fs.rmSync(backup, { force: true });
  }
  throw error;
}
console.log(`Cloudflare asset staged: ${original.length} bytes -> ${zipped.length} gzip bytes (${hash(original)}).`);
console.log('Canonical JSON is temporarily outside the project; original Git source remains intact.');
