/* Offline test fixture supplied by user; validates actual PoB Export structure. */
const fs=require('node:fs');const zlib=require('node:zlib');const assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'fixtures','resurrect-forbidden.pobcode'),'utf8').trim();
const xml=zlib.inflateSync(Buffer.from(source.replace(/-/g,'+').replace(/_/g,'/'),'base64')).toString('utf8');
assert.match(xml,/^<\?xml|^<PathOfBuilding2/);
assert.match(xml,/<PathOfBuilding2(?:\s|>)/);assert.match(xml,/<Build\b[^>]*level="100"/);
assert.match(xml,/ascendClassName="Gemling Legionnaire"/);
const items=(xml.match(/<Item\b/g)||[]).length;const skills=(xml.match(/<Skill\b/g)||[]).length;
assert.ok(items>=15);assert.ok(skills>=15);
console.log(JSON.stringify({status:'EXPORT_STRUCTURE_PASS',xmlBytes:Buffer.byteLength(xml),items,skills,engineCalculation:'NOT_TESTED'},null,2));
