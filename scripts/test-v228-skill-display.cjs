/** In-memory TSX rendering smoke test for the PoB V228 After Change skills panel. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const page = fs.readFileSync(path.resolve(__dirname, '../src/app/pob/page.tsx'), 'utf8') + '\nexport { SkillsPanel };';
const compiled = ts.transpileModule(page, {fileName:'page.tsx', compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const jsx=(type,props,key)=>({type,props,key});
const getMeasuredSkill=(snapshot,name)=>{
 const normalize=(v)=>v.trim().toLowerCase();
 const matches=snapshot.skills.groups.filter(g=>g.enabled!==false && g.activeSkillNames.some(s=>normalize(s)===normalize(name)));
 if(matches.length!==1)return undefined;
 return snapshot.calculatedSkills[matches[0].index];
};
const mocks={
'react/jsx-runtime':{jsx,jsxs:jsx},
'react':{},
'next/link':{default:'Link'},
'@/lib/pobGuides':{pobGuides:[]},
'./tradeItem':{},
'./pobCompare':{getMeasuredSkill,rankMeasuredSkillGroups:(snapshot)=>Object.values(snapshot.calculatedSkills || {}).filter(x=>x.weaponSet===snapshot.weaponSet && Number.isFinite(x.dps))},
'./web-engine/calc-client':{},
'./ninjaImport':{},
'./ringSlots':{},
};
const context={exports:{},require:(id)=>{if(!(id in mocks))throw new Error(`Unknown import ${id}`);return mocks[id]},console};
vm.runInNewContext(compiled,context,{filename:'page.js'});
const SkillsPanel=context.exports.SkillsPanel;
const character={skills:[
 {name:'Spellslinger',supports:[]},
 {name:'Spark',supports:['Arcane Tempo']},
 {name:'Lightning Bolt',supports:[]},
]};
const groups=[
 {index:2,enabled:true,slot:'Weapon 1',activeSkillNames:['Spark']},
 {index:5,enabled:true,slot:'Weapon 2',activeSkillNames:['Lightning Bolt']},
 {index:6,enabled:true,slot:'Weapon 2',activeSkillNames:['Lightning Bolt']},
 {index:9,enabled:true,slot:'Weapon 1',activeSkillNames:['The Stars Answer']},
];
const snapshot={weaponSet:1,skills:{groups},calculatedSkills:{2:{groupIndex:2,weaponSet:1,dps:289338.81,activeSkillNames:['Spark'],slot:'Weapon 1'}}};
const changes=[{kind:'removed',name:'Spellslinger',slot:'Weapon 1'},{kind:'added',name:'The Stars Answer',slot:'Weapon 1'}];
const rows=(node,acc=[])=>{
 if(!node||typeof node!=='object')return acc;
 if(Array.isArray(node)) { node.forEach(item=>rows(item,acc)); return acc; }
 if(node.props?.className==='skill-row'){
   const child=node.props.children;
   const content=Array.isArray(child)?child:[];
   const block=content.find(x=>x?.props?.className==='skill-copy');
   acc.push({name:block?.props?.children?.[0]?.props?.children,dps:content.find(x=>x?.type==='b')?.props?.children});
 }
 for(const v of Object.values(node.props||{})) (Array.isArray(v)?v:[v]).forEach(x=>rows(x,acc));
 return acc;
};
const after=SkillsPanel({character,simulation:true,engineSnapshot:snapshot,skillChanges:changes});
const out=rows(after);
assert.equal(out.find(x=>x.name==='Spark')?.dps,'289,338.81','The same measured Spark DPS must appear in both panels');
assert.equal(out.some(x=>x.name==='Spellslinger'),false,'Confirmed removed skill must not remain in AFTER');
assert.equal(out.find(x=>x.name==='The Stars Answer')?.dps,'—','New skill without measured DPS must not be assigned invented damage');
assert.equal(out.filter(x=>x.name.startsWith('Lightning Bolt · 그룹')).length,2,'Duplicate groups should remain separately identified');
assert.equal(out.filter(x=>x.name.startsWith('Lightning Bolt · 그룹')).every(x=>x.dps==='—'),true,'Unmeasured duplicate groups must not inherit another DPS');
const safe=SkillsPanel({character,simulation:true,engineSnapshot:undefined,skillChanges:changes});
assert.equal(rows(safe).length,0,'After Change cannot show pre-change skills when native calculation blocked');
// A removed skill with the same name still present in another active PoB group must remain.
const restored={...snapshot,skills:{groups:[...groups,{index:12,enabled:true,slot:'Chest',activeSkillNames:['Spellslinger']}]}};
assert.equal(rows(SkillsPanel({character,simulation:true,engineSnapshot:restored,skillChanges:changes})).some(x=>x.name==='Spellslinger'),true);
console.log('V228 after-change skill display integration: PASS (6 checks)');
