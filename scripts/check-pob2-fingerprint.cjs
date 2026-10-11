/** A frozen hash documents WHAT code is embedded. It does not certify desktop parity. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.join(__dirname,'..');
const p=path.join(__dirname,'pob2-engine-fingerprint.json');
const stored=JSON.parse(fs.readFileSync(p,'utf8'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(base,f))).digest('hex');
const files={'pob-lua.json':'public/data/pob-lua.json','lua.wasm':'public/wasm/lua.wasm'};
for(const [name,file] of Object.entries(files)) {
 const actual=sha(file), expected=stored.sha256[name];
 if(actual!==expected) throw Error(`PoB engine fingerprint CHANGED (${name}). Re-verify upstream before releasing.`);
}
const count=Object.keys(JSON.parse(fs.readFileSync(path.join(base,files['pob-lua.json']),'utf8')).files).length;
if(count!==stored.luaFileCount)throw Error(`PoB source count changed: ${count}`);
console.log(`V225 PoB engine fingerprint: PASS (${count} Lua files; upstream commit NOT YET VERIFIED)`);
