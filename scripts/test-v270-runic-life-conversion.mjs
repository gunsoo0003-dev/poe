import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Module from 'node:module';
import createModule from './test-utils/lua.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFile(path.join(root, p), 'utf8');
function loadTypeScript(relative) {
  const filename = path.join(root, relative);
  const source = fsSync.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10 },
    fileName: filename,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw new Error(`${relative} TypeScript errors: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; ')}`);
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}
const { validateNativeItemAudit } = loadTypeScript('src/app/pob/nativeIntegrity.ts');
const worker = await read('src/app/pob/web-engine/calc-worker.ts');
const wrapper = worker.match(/const HEADLESS_WRAPPER = `([\s\S]*?)`;\n\nasync function initEngine/);
if (!wrapper) throw new Error('PoB worker wrapper structure changed');
const shims = await read('src/app/pob/web-engine/lua-shims.ts');
const shimOut = {};
vm.runInNewContext(ts.transpileModule(shims, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: shimOut });
const wasmBinary = new Uint8Array(await fs.readFile(path.join(root, 'public/wasm/lua.wasm')));
const M = await createModule({ wasmBinary, print: () => {}, printErr: () => {} });
const init = M.cwrap('bridge_init', 'number', []);
const exec = M.cwrap('bridge_exec', 'string', ['string']);
const call = M.cwrap('bridge_call_json', 'string', ['string', 'string']);
if (init() !== 0) throw new Error('WASM bridge initialization failed');
const shimResult = exec(shimOut.ALL_SHIMS);
if (shimResult) throw new Error(shimResult);
const bundle = JSON.parse(await read('public/data/pob-lua.json'));
function mkdirp(dst) {
  let current = '';
  for (const part of dst.split('/').filter(Boolean)) {
    current += '/' + part;
    try { M.FS.mkdir(current); } catch {}
  }
}
for (const [file, original] of Object.entries(bundle.files)) {
  let text = original;
  // Keep only the project's pre-existing PoB Lua 5.2 compatibility patches.
  if (file === 'runtime/lua/dkjson.lua') text = text.replace('local concat = table.concat', 'local concat = table.concat\nlocal sort = table.sort').replace(/table\.sort\(/g, 'sort(');
  if (file === 'src/Modules/CalcDefence.lua') text = text.replace(
    'local lifeProtected = output["FrostShieldLife"] / (output["FrostShieldDamageMitigation"] / 100) * (1 - output["FrostShieldDamageMitigation"] / 100)',
    'local lifeProtected = (output["FrostShieldDamageMitigation"] or 0) > 0 and (output["FrostShieldLife"] / (output["FrostShieldDamageMitigation"] / 100) * (1 - output["FrostShieldDamageMitigation"] / 100)) or 0'
  );
  const dest = '/pob/' + file;
  mkdirp(dest.slice(0, dest.lastIndexOf('/')));
  M.FS.writeFile(dest, text);
}
mkdirp('/pob/user');
exec('package.path = "/pob/runtime/lua/?.lua;/pob/runtime/lua/?/init.lua;" .. package.path');
M.FS.chdir('/pob/src');
const boot = exec(wrapper[1]);
if (boot) throw new Error(boot);
const fixture = (await read('scripts/fixtures/resurrect-forbidden.pobcode')).trim();
const xml = (await import('node:zlib')).inflateSync(Buffer.from(fixture.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8');
const loaded = JSON.parse(call('pobWebLoadBuild', JSON.stringify({ xml })));
if (!loaded.success) throw new Error('Fixture PoB build failed: ' + loaded.error);

const baseItem = (modLines) => [
  'Rarity: UNIQUE',
  "Runeseeker's Call",
  'Runemastered Runic Fork',
  'Quality: 20',
  'Item Level: 86',
  'Sockets: S S S',
  'Implicits: ' + String(modLines.length),
  ...modLines,
].join('\n');
const cases = [
  {
    name: '15 percent maximum Life as extra maximum Runic Ward',
    rawText: baseItem(['Gain 15% of maximum Life as Extra maximum Runic Ward']),
    required: ['Gain 15% of maximum Life as Extra maximum Runic Ward'],
  },
  {
    name: '+300 Runic Ward plus socket-only skill item',
    rawText: baseItem([
      '+300 to maximum Runic Ward',
      'Grants Skill: Level 19 The Stars Answer',
      'Only Runes can be Socketed in this item',
      '200% increased effect of Socketed Runes',
    ]),
    required: ['+300 to maximum Runic Ward', 'Grants Skill: Level 19 The Stars Answer', 'Only Runes can be Socketed in this item', '200% increased effect of Socketed Runes'],
  },
  {
    name: '+40 Runic Ward',
    rawText: baseItem(['+40 to maximum Runic Ward']),
    required: ['+40 to maximum Runic Ward'],
  },
  {
    name: '+50 Runic Ward',
    rawText: baseItem(['+50 to maximum Runic Ward']),
    required: ['+50 to maximum Runic Ward'],
  },
  {
    name: '+100 Runic Ward',
    rawText: baseItem(['+100 to maximum Runic Ward']),
    required: ['+100 to maximum Runic Ward'],
  },
];
for (const test of cases) {
  const result = JSON.parse(call('pobWebAddCustomItem', JSON.stringify({ rawText: test.rawText })));
  if (!result.success) throw new Error(`${test.name}: PoB rejected the item: ${result.error}`);
  const bad = (result.nativeAudit?.unrecognized || []).filter((x) => test.required.some((line) => x.line.includes(line) || line.includes(x.line)));
  if (bad.length) throw new Error(`${test.name}: unrecognized modifiers: ${JSON.stringify(bad)}`);
  for (const line of test.required) {
    const found = (result.nativeAudit?.lines || []).some((entry) => entry.line === line && entry.extra === '' && entry.modifierCount > 0);
    if (!found) throw new Error(`${test.name}: exact modifier line not natively parsed: ${line}; got ${JSON.stringify(result.nativeAudit?.lines)}`);
  }
  const integrity = validateNativeItemAudit(result.nativeAudit, test.required);
  if (!integrity.verified) throw new Error(`${test.name}: strict native integrity validation failed: ${integrity.issues.join(' | ')}`);
  console.log(`PASS: ${test.name} (native parser + strict integrity guard)`);
}

// Confirm the strict fail-closed integrity rule is not weakened by this fix.
const invalid = JSON.parse(call('pobWebAddCustomItem', JSON.stringify({
  rawText: baseItem(['+300 to maximum Runic Ward', 'Impossible Modifier Absent From Any PoB Parser']),
})));
if (!invalid.success || !(invalid.nativeAudit?.unrecognized || []).some((x) => x.line.includes('Impossible Modifier'))) {
  throw new Error('Strict native parser integrity guard no longer rejects an unknown modifier');
}
const invalidIntegrity = validateNativeItemAudit(invalid.nativeAudit, ['+300 to maximum Runic Ward', 'Impossible Modifier Absent From Any PoB Parser']);
if (invalidIntegrity.verified) throw new Error('Strict native integrity guard accepted an unsupported modifier');
console.log('PASS: unsupported modifier remains rejected by native integrity audit');

const modParser = bundle.files['src/Modules/ModParser.lua'];
const modCache = bundle.files['src/Data/ModCache.lua'];
if (!modParser.includes('["runic ward"] = "Ward"') || !modParser.includes('["maximum runic ward"] = "Ward"')) throw new Error('Official Runic Ward aliases missing');
if (/c\["\+(?:40|50|100) to maximum Runic Ward/.test(modCache)) throw new Error('Stale partial Runic Ward cache entries remain');
const digest = crypto.createHash('sha256').update(wasmBinary).digest('hex').slice(0, 12);
console.log(`PASS V268: actual bundled PoB2 WASM native parser handles Runic Ward aliases without leftovers; WASM ${digest}`);
