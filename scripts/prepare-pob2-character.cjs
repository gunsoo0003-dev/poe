#!/usr/bin/env node
// Prepare an actual poe.ninja / PoB2 export for the local official PoB2 runtime.
// Validation stage only: no fake DPS calculations.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run pob2:character -- "C:\\path\\to\\pob-export.txt"');
  process.exit(2);
}
const file = path.resolve(input);
if (!fs.existsSync(file)) {
  console.error('Export text file not found: ' + file);
  process.exit(2);
}
const raw = fs.readFileSync(file, 'utf8').trim();
const normalized = raw.replace(/^\uFEFF/, '').replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
if (normalized.length < 20 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
  console.error('Not a valid Path of Building export code (expected Base64, not a trade item).');
  process.exit(2);
}
let decoded;
try {
  const compressed = Buffer.from(normalized, 'base64');
  if (compressed.length > 8 * 1024 * 1024) throw new Error('compressed code too large');
  decoded = zlib.inflateSync(compressed, { maxOutputLength: 32 * 1024 * 1024 });
} catch (e) {
  console.error('Cannot decompress PoB export: ' + e.message);
  process.exit(2);
}
const xml = decoded.toString('utf8');
if (!/^\s*<\?xml\b|^\s*<PathOfBuilding\b/.test(xml) || !/<PathOfBuilding(?:\s|>)/.test(xml) || !/<\/PathOfBuilding\s*>/.test(xml)) {
  console.error('Export decoded, but the contents are not a complete PathOfBuilding XML document.');
  process.exit(2);
}
const enginePath = process.env.POB2_ENGINE_PATH ? path.resolve(process.env.POB2_ENGINE_PATH) : path.join(__dirname, '..', '.pob2-engine');
if (!fs.existsSync(path.join(enginePath, 'src', 'Launch.lua'))) {
  console.error('PoB2 engine not installed. Run npm run pob2:setup first.');
  process.exit(2);
}
const out = path.join(enginePath, 'FIXLGS_Character.xml');
fs.writeFileSync(out, xml, 'utf8');
const build = xml.match(/<Build\b([^>]*)>/);
const attributes = build ? build[1] : '';
const attr = key => (attributes.match(new RegExp('\\b' + key + '="([^"]*)"')) || [])[1] || 'unknown';
const items = (xml.match(/<Item\b/g) || []).length;
const skills = (xml.match(/<Skill\b/g) || []).length;
const summary = { stage:'EXPORT_DECODED', savedTo:out, level:attr('level'), className:attr('className'), ascendClassName:attr('ascendClassName'), itemEntries:items, skillEntries:skills, xmlBytes:decoded.length, calculation:'NOT RUN' };
console.log(JSON.stringify(summary, null, 2));
