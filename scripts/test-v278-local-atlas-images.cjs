const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const s=fs.readFileSync('src/app/news/poe2-1-0-atlas-passive-rework/page.tsx','utf8');
const names=['atlas-passive-tree.png','atlas-world-map.png','atlas-citadel.png'];
const hashes=new Set();
for(const name of names){const file='public/news/atlas/'+name;const data=fs.readFileSync(file);assert(data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')));hashes.add(crypto.createHash('sha256').update(data).digest('hex'));assert.equal(s.split('src="/news/atlas/'+name+'"').length-1,1);}
assert.equal(hashes.size,3);
assert(!s.includes('<AtlasScreenshot')&&!s.includes('fallbackSrc='));
assert(!s.includes('https://cdn.mobalytics.gg/uploads/images/poe-2/')&&!s.includes('https://cdn.gamerch.com/contents/wiki/'));
assert(!s.includes('https://staticg.sportskeeda.com/editor/')&&!s.includes('https://www.poe2wiki.net/images/thumb/'));
for(const name of ['atlas-node-comparison.svg','atlas-points-flow.svg','atlas-tree-distinction.svg']) assert(s.includes(name));
console.log('PASS V278 3 unique local PNG, 3 SVG retained, no remote screenshot or cross-fallback');
