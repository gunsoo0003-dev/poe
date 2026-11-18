const fs=require('fs'),assert=require('assert');
const s=fs.readFileSync('src/app/news/poe2-1-0-atlas-passive-rework/page.tsx','utf8');
const c=fs.readFileSync('src/app/news/poe2-1-0-atlas-passive-rework/AtlasScreenshot.tsx','utf8');
assert.equal((s.match(/<AtlasScreenshot /g)||[]).length,4);
assert(!s.includes('/images/poe2/official-'));
assert(!c.includes('/images/poe2/official-'));
assert(s.includes('Stone_Citadel')&&s.includes('cdn.gamerch.com')&&s.includes('cdn.mobalytics.gg'));
console.log('PASS V275 atlas-only image sources and explicit failure state');
