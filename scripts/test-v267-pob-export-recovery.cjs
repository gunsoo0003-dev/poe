'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function loadTypeScript(relative) {
  const filename = path.join(root, relative);
  const source = read(relative);
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      esModuleInterop: true,
    },
    fileName: filename,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter((entry) => entry.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${relative} TypeScript transpile errors: ${errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('; ')}`);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

for (const relative of [
  'src/app/pob/page.tsx',
  'src/app/api/pob/prepare-export/route.ts',
  'src/app/api/pob/import-ninja/route.ts',
]) {
  const kind = relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const parsed = ts.createSourceFile(relative, read(relative), ts.ScriptTarget.Latest, true, kind);
  assert.equal(parsed.parseDiagnostics.length, 0, `${relative} syntax parse`);
}

const { parseNinjaCharacterUrl } = loadTypeScript('src/app/pob/ninjaImport.ts');
const { decodePob2ExportCode, parsePob2Xml } = loadTypeScript('src/app/pob/pobExport.ts');

const userUrl = 'https://poe.ninja/ko/poe2/builds/runesofaldur/character/%EC%8D%A9%EC%9D%80%ED%86%B5%EB%8B%AD-2237/%EB%B9%85%EB%A7%A5%EC%B9%98%ED%82%A8#i=0&search=name%3D%25EB%25B9%2585%25EB%25A7%25A5';
const parsedUserUrl = parseNinjaCharacterUrl(userUrl);
assert.equal(parsedUserUrl.leagueSlug, 'runesofaldur');
assert.equal(parsedUserUrl.account, '썩은통닭-2237');
assert.equal(parsedUserUrl.character, '빅맥치킨');

const profileUrl = 'https://poe.ninja/ko/poe2/profile/%E7%8E%8B%E8%80%85/runesofaldur/character/%E5%8B%87%E8%80%85';
const parsedProfileUrl = parseNinjaCharacterUrl(profileUrl);
assert.equal(parsedProfileUrl.account, '王者');
assert.equal(parsedProfileUrl.leagueSlug, 'runesofaldur');
assert.equal(parsedProfileUrl.character, '勇者');
assert.throws(() => parseNinjaCharacterUrl('http://poe.ninja/poe2/builds/x/character/a/b'));
assert.throws(() => parseNinjaCharacterUrl('https://example.com/poe2/builds/x/character/a/b'));
assert.throws(() => parseNinjaCharacterUrl('https://poe.ninja/poe2/builds/x/character/%E0%A4%A/b'));

const fixture = read('scripts/fixtures/resurrect-forbidden.pobcode');
const exportResult = decodePob2ExportCode(fixture);
assert.equal(exportResult.parsed.level, 100);
assert.equal(exportResult.parsed.characterClass, 'Mercenary');
assert.equal(exportResult.parsed.ascendancy, 'Gemling Legionnaire');
assert.equal(exportResult.parsed.mainSkill, 'Twister', 'PoB Build.mainSocketGroup should choose the real selected main skill');
assert.equal(exportResult.parsed.metadata.itemCount, 16);
assert.equal(exportResult.parsed.metadata.jewelCount, 3);
assert.equal(exportResult.parsed.metadata.skillCount, 21);

const slotSet = new Set(exportResult.parsed.items.map((item) => item.slot));
for (const slot of ['Weapon1', 'Weapon1Swap', 'Offhand2', 'Helmet', 'Body Armour', 'Gloves', 'Boots', 'Amulet', 'Ring 1', 'Ring 2', 'Belt', 'Charm1', 'Charm2', 'Charm3', 'LifeFlask', 'ManaFlask']) {
  assert(slotSet.has(slot), `missing active equipment slot ${slot}`);
}
assert(exportResult.parsed.jewels.every((jewel) => jewel.kind === 'jewel' && /^Jewel \d+$/.test(jewel.slot || '')));
const spearThrow = exportResult.parsed.skills.find((skill) => skill.name === 'Spear Throw' && skill.supports.includes('Frost Nexus'));
assert(spearThrow, 'active support gems should stay attached to their primary skill');
assert.throws(() => decodePob2ExportCode('not-a-valid-pob-export'));
assert.throws(() => parsePob2Xml('<PathOfBuilding2><Build/></PathOfBuilding2>'));

const page = read('src/app/pob/page.tsx');
const exportRoute = read('src/app/api/pob/prepare-export/route.ts');
const ninjaRoute = read('src/app/api/pob/import-ninja/route.ts');
assert(page.includes('id="pob-export-code"'), 'manual export input is present');
assert(page.includes('detailSource: "path-of-building-export"'), 'manual export source is distinguished');
assert(page.includes('mainSkill: baseCharacter.mainSkill ?? fromExport.mainSkill'), 'PoB main skill is used when Ninja data is unavailable');
assert(exportRoute.includes('decodePob2ExportCode'), 'manual export uses the validated decoder');
assert(ninjaRoute.includes('skipInternalDetails === true') && ninjaRoute.includes('if (skipInternalDetails)'), 'manual Export must skip the undocumented/private poe.ninja detail API');
assert(page.includes('new CalcClient()') && page.includes('calculateComparison(engine, importedCharacter, payload.xml, simulationItems)'), 'existing PoB2 calculation engine remains the calculation path');

console.log('PASS V267: builds/profile URL parsing (including Korean/Chinese names), PoB2 export decode, active ItemSet equipment, 3 jewels, 21 skill groups, selected main skill, support gem association, invalid input rejection, and existing PoB2 engine handoff.');
