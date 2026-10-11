/** Contract test: FIXLGS audits upstream PoB parse evidence, never calculates modifiers itself. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const target=path.join(__dirname,'../src/app/pob/nativeIntegrity.ts');
const transpiled=ts.transpileModule(fs.readFileSync(target,'utf8'),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}
}).outputText;
const out={};vm.runInNewContext(transpiled,{exports:out,require:()=>({})});
const {validateNativeItemAudit}=out;
const line=(line,modifierCount=1,extra='',group='explicit')=>({line,group,modifierCount,extra});
const make=(lines,unrecognized=[],emptyModifier=[])=>({lines,unrecognized,emptyModifier,total:lines.length,nativeModifiers:lines.reduce((s,x)=>s+x.modifierCount,0)});
const expected=['+15 to Strength'];
assert.equal(validateNativeItemAudit(make([line('+15 to Strength')]),expected).verified,true);
assert.equal(validateNativeItemAudit(make([line('+15 to Strength'),line('Impossible Modifier',0,'Impossible Modifier')],[{group:'explicit',line:'Impossible Modifier',extra:'Impossible Modifier'}]),expected.concat('Impossible Modifier')).verified,false);
assert.equal(validateNativeItemAudit(make([line('+15 to Strength',0)],[],[{group:'explicit',line:'+15 to Strength'}]),expected).verified,false);
assert.equal(validateNativeItemAudit(make([line('20% increased Physical Damage')]),expected).verified,false);
assert.equal(validateNativeItemAudit(undefined,expected).verified,false);
assert.equal(validateNativeItemAudit(make([line('Gain 5% of Damage as Extra Damage of all Elements',3,'','rune')]),['{rune}Gain 5% of Damage as Extra Damage of all Elements']).verified,true);
assert.equal(validateNativeItemAudit(make([line('+15 to Strength')]),['+15 to Strength','+15 to Strength']).verified,false);
assert.equal(validateNativeItemAudit(make([line('Gain 5% of Damage as Extra Damage of all Elements',3)]),['{rune}Gain 5% of Damage as Extra Damage of all Elements']).verified,false);
console.log('V227 native PoB parse evidence guard: PASS (8 cases; class preserved)');
