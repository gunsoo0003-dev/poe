/** V258 offline contracts: no extra App Router page exports; preserve PoB skill semantics. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const page = read('src/app/pob/page.tsx');
assert.match(page, /function buildMainSkillUi\(/, 'PoB skill helper remains in the component module');
assert.doesNotMatch(page, /export\s+(?:async\s+)?function\s+buildMainSkillUi\b/, 'Next App Router page may not export an arbitrary helper');
assert.match(page, /export default function Home\(/, 'POB route remains exportable');
assert.match(page, /buildMainSkillUi\(beforeSnapshot/, 'Current DPS uses the same private helper');
assert.match(page, /buildMainSkillUi\(afterSnapshot/, 'After-change DPS uses the same private helper');
const test = read('scripts/test-v229-weapon-skill.cjs');
assert.ok(test.includes("page+'\\nexport { buildMainSkillUi };'"), 'Existing PoB behavior test exports helper in test VM only');
for (const name of ['src/app/robots.ts','src/app/sitemap.ts','public/robots.txt','public/sitemap.xml']) {
 assert.equal(fs.existsSync(path.join(root,name)), false, `${name} must not be shipped`);
}
console.log('PASS V258: PoB page exports and robots/sitemap policy (8 checks).');
