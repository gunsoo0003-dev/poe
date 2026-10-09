// V209: smoke tests for FIXLGS skill changes. Run after npm dependencies are installed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = path.join(__dirname, '../src/app/pob/skillChangeAudit.ts');
const compiled = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const exported = {};
vm.runInNewContext(compiled, { exports: exported });
const { auditSkillChanges, groupInventory } = exported;
const group = (index, slot, name) => ({ index, slot, activeSkillNames: Array.isArray(name) ? name : [name], enabled: true });
const before = [group(12, 'Weapon 2 Swap', 'Whirling Slash'), group(14, 'Weapon 1 Swap', 'Twister'),
  group(18, 'Weapon 1', 'Spear Throw'), group(19, 'Weapon 1 Swap', 'Spear Throw'),
  group(20, 'Weapon 1 Swap', 'Righteous Descent'), group(21, 'Weapon 2 Swap', 'Purity of Ice')];
const after = before.filter(g => g.index !== 18).map((g, i) => ({ ...g, index: i + 12 }));
let result = auditSkillChanges(before, after, new Set(['Weapon 1']));
assert.equal(JSON.stringify(result.changes), JSON.stringify([{ kind: 'removed', name: 'Spear Throw', slot: 'Weapon 1' }]));
assert.equal(result.warnings.length, 0);
assert.equal(groupInventory(after), groupInventory(before.filter(g => g.index !== 18)));
result = auditSkillChanges(before, before.toReversed().map(g => ({ ...g, index: g.index + 90 })), new Set(['Weapon 1']));
assert.equal(result.changes.length, 0);
assert.equal(result.warnings.length, 0);
result = auditSkillChanges(before, [...after, group(99, 'Weapon 1', 'Fireball')], new Set(['Weapon 1']));
assert.equal(result.changes.length, 2);
result = auditSkillChanges(before, after, new Set(['Weapon 2 Swap']));
assert.equal(result.changes.length, 0);
assert.equal(result.warnings.length, 1);
result = auditSkillChanges(before, [...after, group(99, 'Weapon 1', ['Fireball', 'Spear Throw'])], new Set(['Weapon 1']));
assert.equal(result.changes.length, 1);
assert.equal(result.warnings.length, 1);
console.log('V209 skill change checks: PASS');
