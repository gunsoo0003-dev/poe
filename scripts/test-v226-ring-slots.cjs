// Regression tests for overlapping POE2 ring-slot labels in UI and importer.
// Run: node --experimental-strip-types scripts/test-v226-ring-slots.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { canonicalRingSlot, matchesRingSlot } = require('../src/app/pob/ringSlots.ts');
let count = 0;
function check(name, actual, expected) {
  assert.deepStrictEqual(actual, expected, name);
  count++;
}
for (const [raw, x, expected] of [
  ['Ring 1', undefined, 'Ring 1'],
  ['Ring1', undefined, 'Ring 1'],
  ['LeftRing', undefined, 'Ring 1'],
  ['Ring 2', undefined, 'Ring 2'],
  ['Ring2', undefined, 'Ring 2'],
  ['RightRing', undefined, 'Ring 2'],
  ['Ring', 0, 'Ring 1'],
  ['Ring', 1, 'Ring 2'],
  ['RING', 1, 'Ring 2'],
  ['Ring', undefined, undefined],
  ['Ring', 2, undefined],
  ['Ring 21', undefined, undefined],
  ['Earring', undefined, undefined],
]) check(`canonical ${raw}/${x}`, canonicalRingSlot(raw, x), expected);

check('ring-a excludes Ring 2', matchesRingSlot('ring-a', 'Ring 2'), false);
check('ring-b excludes Ring 1', matchesRingSlot('ring-b', 'Ring 1'), false);
check('ring-a exact Ring 1', matchesRingSlot('ring-a', 'Ring 1'), true);
check('ring-b exact Ring 2', matchesRingSlot('ring-b', 'Ring 2'), true);
check('ring-a excludes ambiguous Ring', matchesRingSlot('ring-a', 'Ring'), false);
check('ring-b excludes ambiguous Ring', matchesRingSlot('ring-b', 'Ring'), false);

function display(items, slot) {
  return items.find(item => matchesRingSlot(slot, item.slot))?.name;
}
for (const items of [
  [{ slot: 'Ring 2', name: 'Right unique ring' }, { slot: 'Ring 1', name: 'Left rare ring' }],
  [{ slot: 'Ring 1', name: 'Left rare ring' }, { slot: 'Ring 2', name: 'Right unique ring' }],
  [{ slot: canonicalRingSlot('Ring', 1), name: 'Right unique ring' }, { slot: canonicalRingSlot('Ring', 0), name: 'Left rare ring' }],
]) {
  check('UI left ring regardless of array order', display(items, 'ring-a'), 'Left rare ring');
  check('UI right ring regardless of array order', display(items, 'ring-b'), 'Right unique ring');
}
const page = fs.readFileSync(path.join(__dirname, '../src/app/pob/page.tsx'), 'utf8');
const importer = fs.readFileSync(path.join(__dirname, '../src/app/api/pob/import-ninja/route.ts'), 'utf8');
const compare = fs.readFileSync(path.join(__dirname, '../src/app/pob/pobCompare.ts'), 'utf8');
check('UI delegates ring matching to exact helper', page.includes('return matchesRingSlot(cls, slot);'), true);
check('importer normalizes inventory x to canonical ring', importer.includes('canonicalRingSlot(rawSlot, slotX)'), true);
check('PoB baseline maps Ring 1 exactly', compare.includes('"ring-a": "Ring 1"'), true);
check('PoB baseline maps Ring 2 exactly', compare.includes('"ring-b": "Ring 2"'), true);
console.log(`PASS V226 ring slot regression: ${count} checks`);
