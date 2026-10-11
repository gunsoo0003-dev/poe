/** End-to-end native PoB2 Lua Item:ParseRaw smoke test, not desktop PoB parity. */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import createModule from './test-utils/lua.mjs';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=await fs.readFile(path.join(base,'src/app/pob/web-engine/calc-worker.ts'),'utf8');
const wrapper=worker.match(/const HEADLESS_WRAPPER = `([\s\S]*?)`;\n\nasync function initEngine/);
if(!wrapper)throw Error('PoB worker wrapper structure changed');
const shims=await fs.readFile(path.join(base,'src/app/pob/web-engine/lua-shims.ts'),'utf8');
const shimOut={};vm.runInNewContext(ts.transpileModule(shims,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:shimOut});
const M=await createModule({wasmBinary:new Uint8Array(await fs.readFile(path.join(base,'public/wasm/lua.wasm'))),print:()=>{},printErr:()=>{}});
const init=M.cwrap('bridge_init','number',[]),exec=M.cwrap('bridge_exec','string',['string']),call=M.cwrap('bridge_call_json','string',['string','string']);
if(init()!==0)throw Error('WASM bridge initialization failed');
const shimResult=exec(shimOut.ALL_SHIMS);if(shimResult)throw Error(shimResult);
const files=JSON.parse(await fs.readFile(path.join(base,'public/data/pob-lua.json'),'utf8')).files;
function mkdirp(dst){let x='';for(const p of dst.split('/').filter(Boolean)){x+='/'+p;try{M.FS.mkdir(x)}catch{}}}
for(const [p,original] of Object.entries(files)){
 let text=original;
 // Only existing V224 Lua 5.2 compatibility patches. No new formulas.
 if(p==='runtime/lua/dkjson.lua')text=text.replace('local concat = table.concat','local concat = table.concat\nlocal sort = table.sort').replace(/table\.sort\(/g,'sort(');
 if(p==='src/Modules/CalcDefence.lua')text=text.replace('local lifeProtected = output["FrostShieldLife"] / (output["FrostShieldDamageMitigation"] / 100) * (1 - output["FrostShieldDamageMitigation"] / 100)','local lifeProtected = (output["FrostShieldDamageMitigation"] or 0) > 0 and (output["FrostShieldLife"] / (output["FrostShieldDamageMitigation"] / 100) * (1 - output["FrostShieldDamageMitigation"] / 100)) or 0');
 const dst='/pob/'+p;mkdirp(dst.slice(0,dst.lastIndexOf('/')));M.FS.writeFile(dst,text);
}
mkdirp('/pob/user');exec('package.path = "/pob/runtime/lua/?.lua;/pob/runtime/lua/?/init.lua;" .. package.path');M.FS.chdir('/pob/src');
const loaded=exec(wrapper[1]);if(loaded)throw Error(loaded);
const fixture=(await fs.readFile(path.join(base,'scripts/fixtures/resurrect-forbidden.pobcode'),'utf8')).trim();
const xml=zlib.inflateSync(Buffer.from(fixture.replace(/-/g,'+').replace(/_/g,'/'),'base64')).toString('utf8');
const build=JSON.parse(call('pobWebLoadBuild',JSON.stringify({xml})));
if(!build.success)throw Error('Fixture PoB build failed: '+build.error);
function inspect(rawText){return JSON.parse(call('pobWebAddCustomItem',JSON.stringify({rawText})));}
const known=inspect('Rarity: RARE\nAudit Spear\nAkoyan Spear\nImplicits: 0\n+15 to Strength');
if(!known.success||known.nativeAudit?.unrecognized?.length||known.nativeAudit?.emptyModifier?.length)throw Error('Native known modifier rejected');
const invalid=inspect('Rarity: RARE\nAudit Spear\nAkoyan Spear\nImplicits: 0\n+15 to Strength\nImpossible Modifier Absent From Any PoB Parser');
if(!invalid.success||!invalid.nativeAudit?.unrecognized?.length)throw Error('Native unsupported modifier NOT detected');
const realistic=inspect('Rarity: UNIQUE\nThe Unborn Lich\nRavenous Staff\nQuality: 20\nImplicits: 0\n79% increased Desecrated Modifier magnitudes\n102% increased Magnitude of Unholy Might buffs you grant\nYou have Unholy Might');
if(!realistic.success)throw Error('Candidate unique base not available');
if(!realistic.nativeAudit?.unrecognized?.length&&!realistic.nativeAudit?.emptyModifier?.length)throw Error('Native caveat not reproduced');
const hash=crypto.createHash('sha256').update(Buffer.from(worker)).digest('hex').slice(0,12);
console.log(`V225 native WASM parser: PASS (known accepted, nonexistent rejected, real partial option flagged; worker ${hash})`);
console.log(`Native flags in actual unique item: ${realistic.nativeAudit.unrecognized.length} partial, ${realistic.nativeAudit.emptyModifier.length} empty`);
