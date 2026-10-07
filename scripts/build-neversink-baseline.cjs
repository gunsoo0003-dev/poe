const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const DATA_TS = path.join(ROOT, 'src/app/filter/filterData.ts');
const NS_ROOT = path.join(ROOT, 'public/neversink/0.10.4');
const STRICTNESSES = ['0-SOFT','1-REGULAR','2-SEMI-STRICT','3-STRICT','4-VERY-STRICT','5-UBER-STRICT','6-UBER-PLUS-STRICT'];

function loadFilterData() {
  const source = fs.readFileSync(DATA_TS, 'utf8');
  const out = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: DATA_TS,
  }).outputText;
  const sandbox = { exports: {}, module: { exports: {} }, require, console };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(out, sandbox, { filename: 'filterData.cjs' });
  return sandbox.module.exports;
}

function stripInlineComment(s) {
  const idx = s.indexOf('#');
  return (idx >= 0 ? s.slice(0, idx) : s).trim();
}

function parseRules(text) {
  const lines = text.replace(/\r/g,'').split('\n');
  const rules = [];
  let current = null;
  let majorSection = '';
  let currentSection = '';
  for (let i=0;i<lines.length;i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    const major = trimmed.match(/^#\s*\[\[(\d{4})\]\]/);
    if (major) { majorSection = major[1]; currentSection = majorSection; }
    const sub = trimmed.match(/^#\s*\[(\d{4})\]/);
    if (sub) currentSection = sub[1];
    // A rule line is active only when Show/Hide is the first non-whitespace token.
    const m = trimmed.match(/^(Show|Hide)\b(?:\s*#\s*(.*))?$/i);
    if (m) {
      if (current) rules.push(current);
      const meta = m[2] || '';
      const tier = (meta.match(/\$tier->([^\s!]+)/) || [])[1] || '';
      const tag = (meta.match(/!([^\s]+)/) || [])[1] || '';
      current = { action: m[1].toLowerCase(), line: i+1, meta, tier, tag, section: currentSection || majorSection, conditions: [], continue: false, sounds: [] };
      continue;
    }
    if (!current) continue;
    if (!trimmed) { rules.push(current); current = null; continue; }
    if (trimmed.startsWith('#')) continue;
    const clean = stripInlineComment(trimmed);
    if (!clean) continue;
    if (/^Continue\b/i.test(clean)) { current.continue = true; continue; }
    if (/^PlayAlertSound\b/i.test(clean) || /^CustomAlertSound\b/i.test(clean)) { current.sounds.push(clean); continue; }
    // Styling/action commands are not match conditions.
    if (/^(SetFontSize|SetTextColor|SetBorderColor|SetBackgroundColor|PlayEffect|MinimapIcon|DisableDropSound|EnableDropSound|CustomAlertSoundOptional|PlayAlertSoundPositional)\b/i.test(clean)) continue;
    current.conditions.push(clean);
  }
  if (current) rules.push(current);
  return rules;
}

function quotedValues(s) {
  return [...s.matchAll(/"([^"]*)"/g)].map(m => m[1]);
}

function parseNumericCond(line, field) {
  const re = new RegExp('^'+field+'\\s*(>=|<=|==|>|<|=)?\\s*(-?\\d+)', 'i');
  const m = line.match(re);
  if (!m) return null;
  return { op: m[1] || '==', value: Number(m[2]) };
}
function evalNumeric(v, c) {
  switch(c.op){ case '>=': return v>=c.value; case '<=': return v<=c.value; case '>': return v>c.value; case '<': return v<c.value; default: return v===c.value; }
}

function inferClassNames(item, normal=false) {
  if (Array.isArray(item.classNames) && item.classNames.length) return item.classNames;
  const base = String(item.baseType || item.label || '');
  if (normal) return [];
  if (item.family === 'jewel' || /(?:Time-Lost )?(?:Emerald|Ruby|Sapphire|Diamond|Timeless Jewel)$/.test(base)) return ['Jewels'];
  if (/Life Flask$/.test(base)) return ['Life Flasks'];
  if (/Mana Flask$/.test(base)) return ['Mana Flasks'];
  if (item.family === 'flask') return ['Life Flasks', 'Mana Flasks'];
  if (item.family === 'charm' || /Charm$/.test(base)) return ['Charms'];
  if (item.waystoneTier != null) return ['Waystones'];
  return [];
}

function itemContext(item, normal=false) {
  const inferredRarity = item.rarity
    || (normal ? 'Normal'
      : item.family === 'jewel' ? 'Magic'
      : item.family === 'flask' || item.family === 'charm' ? 'Magic'
      : item.waystoneTier != null ? 'Normal'
      : undefined);
  return {
    baseType: item.baseType || item.label || '',
    gemLevel: item.gemLevel,
    waystoneTier: item.waystoneTier,
    rarity: inferredRarity,
    classNames: inferClassNames(item, normal),
    // Plain/default item used only to decide the web checkbox. Runtime-specific
    // NeverSink branches remain metadata (NS conditional), not a third checkbox state.
    quality: 0,
    sockets: 0,
    stackSize: 1,
    corrupted: false,
    mirrored: false,
    identified: false,
    fractured: false,
  };
}

// true = condition definitely matches; false = definitely does not; null = depends on runtime data we do not model.
function evalCondition(line, ctx) {
  let c;
  if ((c=parseNumericCond(line,'GemLevel'))) return ctx.gemLevel == null ? null : evalNumeric(ctx.gemLevel,c);
  if ((c=parseNumericCond(line,'WaystoneTier'))) return ctx.waystoneTier == null ? null : evalNumeric(ctx.waystoneTier,c);
  if ((c=parseNumericCond(line,'Quality'))) return evalNumeric(ctx.quality,c);
  if ((c=parseNumericCond(line,'Sockets'))) return evalNumeric(ctx.sockets,c);
  if ((c=parseNumericCond(line,'StackSize'))) return evalNumeric(ctx.stackSize,c);
  if ((c=parseNumericCond(line,'ItemLevel'))) return null;
  if ((c=parseNumericCond(line,'AreaLevel'))) return null;
  if ((c=parseNumericCond(line,'DropLevel'))) return null;

  const bool = line.match(/^(Corrupted|Mirrored|Identified|FracturedItem)\s+(True|False)$/i);
  if (bool) {
    const key = bool[1].toLowerCase();
    const actual = key === 'corrupted' ? ctx.corrupted
      : key === 'mirrored' ? ctx.mirrored
      : key === 'identified' ? ctx.identified
      : ctx.fractured;
    return actual === (bool[2].toLowerCase() === 'true');
  }
  if (/^(AnyEnchantment|HasExplicitMod|HasImplicitMod)\b/i.test(line)) return false;

  if (/^BaseType\b/i.test(line)) {
    if (!ctx.baseType) return null;
    const vals = quotedValues(line);
    if (!vals.length) return null;
    const neg = /BaseType\s*!=/i.test(line);
    const exact = /BaseType\s*(==|=)/i.test(line);
    const hit = exact ? vals.includes(ctx.baseType) : vals.some(v => ctx.baseType.includes(v));
    return neg ? !hit : hit;
  }
  if (/^Class\b/i.test(line)) {
    // For an exact BaseType rule the BaseType itself identifies the item class.
    // Unknown catalogue class metadata must not turn a deterministic NS rule into conditional.
    if (!ctx.classNames.length) return false;
    const vals = quotedValues(line);
    if (!vals.length) return null;
    return ctx.classNames.some(v => vals.includes(v));
  }
  if (/^Rarity\b/i.test(line)) {
    if (!ctx.rarity) return false;
    const rank = { Normal: 0, Magic: 1, Rare: 2, Unique: 3 };
    const ranged = line.match(/^Rarity\s*(<=|>=|<|>)\s*(Normal|Magic|Rare|Unique)$/i);
    if (ranged) {
      const actual = rank[ctx.rarity];
      const targetName = ranged[2][0].toUpperCase() + ranged[2].slice(1).toLowerCase();
      const target = rank[targetName];
      if (actual == null || target == null) return null;
      if (ranged[1] === '<=') return actual <= target;
      if (ranged[1] === '>=') return actual >= target;
      if (ranged[1] === '<') return actual < target;
      return actual > target;
    }
    const tail = line.replace(/^Rarity\s*(==|=)?\s*/i,'').trim();
    const vals = quotedValues(tail).length ? quotedValues(tail) : tail.split(/\s+/).filter(Boolean);
    return vals.includes(ctx.rarity);
  }
  // Every other filter predicate (Corrupted, AnyEnchantment, HasExplicitMod, etc.) is runtime-dependent.
  return null;
}

function sourceSections(item) {
  return [...new Set(String(item.sourceSection || '').match(/\b\d{4}\b/g) || [])];
}

function classify(item, rules, normal=false) {
  const ctx = itemContext(item, normal);
  const sections = sourceSections(item);
  // Visibility is global and order-sensitive. sourceSection is documentation only;
  // NeverSink can intentionally Show in one section and Hide/fallback in another.
  // The web checkbox must therefore evaluate the complete active filter in order.
  const scopedRules = rules;
  const outcomes = new Set();
  const matched = [];
  let defaultAction = '';
  let sawRuntimeConditional = false;

  for (const rule of scopedRules) {
    let unknown = false;
    let impossible = false;
    const hasExactBase = !!ctx.baseType && ruleHasExactBase(rule, ctx.baseType);
    for (const cond of rule.conditions) {
      // When a rule names this exact BaseType, an absent catalogue Class hint must not
      // make the rule conditional. NeverSink's BaseType match already identifies the class.
      if (hasExactBase && /^Class\b/i.test(cond) && !ctx.classNames.length) continue;
      // Runtime-only branches remain NS conditional metadata. The condition evaluator
      // gives a deterministic answer for plain booleans/quality/sockets/stack-size;
      // only genuinely unknown values (AreaLevel/ItemLevel/etc.) stay conditional.
      const r = evalCondition(cond, ctx);
      if (r === false) { impossible = true; break; }
      if (r === null) unknown = true;
    }
    if (impossible) continue;

    matched.push(rule);
    if (rule.continue) continue;
    outcomes.add(rule.action);

    if (unknown) {
      // This is an NS runtime exception/condition. It remains part of the NS
      // behaviour, but it must NOT decide the web checkbox by itself.
      sawRuntimeConditional = true;
      continue;
    }

    // First fully-resolved rule is the plain/default Show/Hide state that the
    // web checkbox mirrors. NeverSink stops here when earlier conditions fail.
    defaultAction = rule.action;
    break;
  }

  let status = 'missing';
  let enabled = false;
  if (defaultAction) {
    enabled = defaultAction === 'show';
    status = sawRuntimeConditional ? 'conditional' : defaultAction;
  } else if (outcomes.size === 1) {
    // No unconditional fallback, but every possible runtime branch has the same
    // result. The checkbox can still mirror that result while NS keeps conditions.
    const only = [...outcomes][0];
    enabled = only === 'show';
    status = sawRuntimeConditional ? 'conditional' : only;
  } else if (outcomes.size > 1) {
    // Truly runtime-dependent with no plain fallback. Keep NS conditional and
    // choose the conservative hidden baseline until a deterministic rule exists.
    status = 'conditional';
    enabled = false;
  }

  const decisive = matched.filter(r => !r.continue);
  const tiers = [...new Set(decisive.map(r=>r.tier).filter(Boolean))].slice(0,6);
  const tags = [...new Set(decisive.map(r=>r.tag).filter(Boolean))].slice(0,6);
  const sounds = [...new Set(decisive.flatMap(r=>r.sounds))].slice(0,4);

  return { status, enabled, matches: decisive.length, tiers, tags, sounds };
}


function ruleHasRarity(rule, rarity) {
  const line = rule.conditions.find(c => /^Rarity\b/i.test(c));
  if (!line) return true;
  if (/Rarity\s*(<=|>=|<|>)/i.test(line)) return true;
  const tail = line.replace(/^Rarity\s*(==|=)?\s*/i,'').trim();
  const vals = quotedValues(tail).length ? quotedValues(tail) : tail.split(/\s+/).filter(Boolean);
  return vals.includes(rarity);
}

function ruleHasExactBase(rule, baseType) {
  return rule.conditions.some(c => /^BaseType\b/i.test(c) && !/BaseType\s*!=/i.test(c) && quotedValues(c).includes(baseType));
}


function ruleHasClass(rule, classNames) {
  if (!Array.isArray(classNames) || !classNames.length) return true;
  const line = rule.conditions.find(c => /^Class\b/i.test(c));
  if (!line) return true;
  const vals = quotedValues(line);
  if (!vals.length) return true;
  return classNames.some(v => vals.includes(v));
}

function normalBaselineInfo(item, rules) {
  if (!item.baseType) return null;

  // NORMAL BaseType 체크박스는 '평범한 일반 아이템이 현재 선택 필터에서
  // 실제 표시 대상인가'만 2상태로 표현한다. 품질/소켓/타락/AlwaysShow 같은
  // EXCEPTIONAL/특수 조건은 여기서 제외하고 NeverSink 내부 조건(NS)에 남긴다.
  //
  // 1) 1102~1106의 활성 BaseType 전용 규칙이 있으면 해당 베이스는 원본에서
  //    조건부로라도 표시 대상이므로 체크한다. (정확한 ItemLevel/AreaLevel 조건은 NS 유지)
  // 2) 전용 규칙이 없으면 1200 Hide Layer의 첫 활성 Show/Hide를 따른다.
  //    예: 0-SOFT는 low-strictness Show가 먼저라 체크, 6-UBER-PLUS는 Hide라 비체크.
  const specific = rules.find(rule => {
    const sec = Number(rule.section || 0);
    if (sec < 1102 || sec > 1106) return false;
    if (rule.continue) return false;
    if (!ruleHasRarity(rule, 'Normal')) return false;
    if (!ruleHasExactBase(rule, item.baseType)) return false;
    return true;
  });

  if (specific) {
    const runtimeConditional = specific.conditions.some(c =>
      /^(ItemLevel|AreaLevel|DropLevel|Quality|Sockets|Corrupted|Mirrored|AlwaysShow|UnidentifiedItemTier)\b/i.test(c)
    );
    return {
      enabled: specific.action === 'show',
      status: runtimeConditional ? 'conditional' : specific.action,
      matches: 1,
      tiers: specific.tier ? [specific.tier] : [],
      tags: specific.tag ? [specific.tag] : [],
      sounds: specific.sounds.slice(0, 4),
    };
  }

  const fallback = rules.find(rule => {
    if (String(rule.section || '') !== '1200') return false;
    if (rule.continue) return false;
    if (!ruleHasRarity(rule, 'Normal')) return false;
    if (!ruleHasClass(rule, item.classNames || [])) return false;
    // 1200의 일반/매직 장비 Hide Layer만 사용한다.
    return rule.tier === 'normalmagicendgameany' || rule.tier === 'normalmagicendgame';
  });

  if (!fallback) return null;
  return {
    enabled: fallback.action === 'show',
    status: fallback.action,
    matches: 1,
    tiers: fallback.tier ? [fallback.tier] : [],
    tags: fallback.tag ? [fallback.tag] : [],
    sounds: fallback.sounds.slice(0, 4),
  };
}


function currencyBaselineInfo(item, rules) {
  if (item.family !== 'currency' || !item.baseType) return null;
  // Uncut gems reuse family="currency" only for UI option compatibility, but
  // their NeverSink visibility depends on GemLevel/AreaLevel. The old currency
  // shortcut ignored GemLevel and incorrectly matched the first BaseType rule
  // (e.g. spirit20) for every level. Route them through the common ordered
  // evaluator instead.
  if (item._catalog === 'UNCUT_GEM_GROUPS') return null;
  const sections = sourceSections(item);
  const scoped = sections.length ? rules.filter(rule => sections.includes(String(rule.section || ''))) : rules;

  // Currency rows are two-state in the web UI. Resolve the FIRST active exact
  // BaseType rule in NeverSink order. Later exhide/utility fallback rules must
  // not turn an earlier Show into a fake "conditional" state.
  for (const rule of scoped) {
    if (rule.continue) continue;
    if (!ruleHasExactBase(rule, item.baseType)) continue;
    if (!ruleHasRarity(rule, item.rarity || 'Normal')) continue;
    const importance = ['s','a','b','c','d','e','supplymagic','supplieslow'].includes(rule.tier)
      ? rule.tier
      : '';
    return {
      tiers: rule.tier ? [rule.tier] : [],
      tags: rule.tag ? [rule.tag] : [],
      sounds: rule.sounds.slice(0, 4),
      importance,
    };
  }
  return null;
}

function uniqueBaselineInfo(item, rules) {
  if (!item.baseType || item.rarity !== 'Unique') return null;
  const tierMap = {
    t1: 't1', t2: 't2', multispecialhigh: 'x', multispecial: 'x',
    t3boss: 't3', t3: 't3', hideable: 't4'
  };
  for (const rule of rules) {
    if (!/^29\d\d$/.test(String(rule.section || ''))) continue;
    if (!tierMap[rule.tier]) continue;
    if (!ruleHasRarity(rule, 'Unique')) continue;
    if (!ruleHasExactBase(rule, item.baseType)) continue;
    return { importance: tierMap[rule.tier], status: rule.action, tier: rule.tier, tag: rule.tag, sound: rule.sounds[0] || '' };
  }
  return null;
}

function normalImportance(item, rules) {
  if (!item.baseType) return '';
  const tierMap = {
    wands: 'a', t1ideallevel: 'a', t1: 'a', jt1ideallevel: 'a', jt1: 'a',
    t2ideallevel: 'b', t2onlevel: 'b', jt2ideallevel: 'b', jt2: 'b',
    t3ideallevel: 'c', t3onlevel: 'c', jt3ideallevel: 'c', jt3: 'c', jt4ideallevel: 'c', jt4: 'c'
  };
  for (const rule of rules) {
    if (!tierMap[rule.tier]) continue;
    if (!ruleHasRarity(rule, 'Normal')) continue;
    if (!ruleHasExactBase(rule, item.baseType)) continue;
    return tierMap[rule.tier];
  }
  // A normal base with no dedicated active tier still follows NeverSink's regular
  // normal/base presentation. Keep that deterministic base style visible as C;
  // runtime item-level/quality/socket decorators remain internal NS conditions.
  return 'c';
}

function resolveBaselineEntry(item, rules, normal=false) {
  // One baseline entry point. Visibility starts from the common ordered
  // evaluator. Proven category mappings may refine that result, but routing is
  // explicit by catalogue so one UI family cannot accidentally override another.
  const generic = classify(item, rules, normal);

  if (normal) {
    return { ...generic, importance: normalImportance(item, rules) };
  }

  const unique = uniqueBaselineInfo(item, rules);
  const currency = currencyBaselineInfo(item, rules);
  // Category helpers may refine only presentation/importance. Checkbox visibility
  // always comes from the one ordered evaluator above.
  let entry = currency ? { ...generic, ...currency, status: generic.status, enabled: generic.enabled, matches: generic.matches } : generic;
  if (unique) {
    entry = {
      ...entry,
      importance: unique.importance,
      tiers: unique.tier ? [unique.tier] : entry.tiers,
      tags: unique.tag ? [unique.tag] : entry.tags,
      sounds: unique.sound ? [unique.sound] : entry.sounds,
    };
  }
  return entry;
}

function allItems(data) {
  const groupNames = [
    'EXCEPTIONAL_GROUPS','WAYSTONE_GROUPS','UNIQUE_ARMOUR_GROUPS','UNIQUE_GROUPS','OTHER_UNIQUE_GROUPS','TABLET_GROUPS','JEWEL_GROUPS','FLASK_GROUPS','CHARM_GROUPS','CURRENCY_GROUPS','ESSENCE_GROUPS','DELIRIUM_GROUPS','BREACH_GROUPS','ABYSS_GROUPS','ATZIRI_GROUPS','FRAGMENT_GROUPS','RUNE_GROUPS','RITUAL_GROUPS','SOUL_CORE_GROUPS','IDOL_GROUPS','UNCUT_GEM_GROUPS','EXPEDITION_GROUPS','LINEAGE_GEM_GROUPS','MISC_GROUPS'
  ];
  return groupNames.flatMap(name => (data[name]||[]).flatMap(g => (g.items||[]).map(item => ({ ...item, _catalog: name }))));
}

const data = loadFilterData();
const items = allItems(data);
const normalItems = (data.NORMAL_GEAR_GROUPS||[]).flatMap(g => (g.items||[]).map(i => ({...i, classNames:g.classes||[], rarity:'Normal'})));
const outDir = path.join(NS_ROOT,'baseline'); fs.mkdirSync(outDir,{recursive:true});
for (const strict of STRICTNESSES) {
  const filterPath = path.join(NS_ROOT, strict+'.filter');
  const text = fs.readFileSync(filterPath,'utf8');
  const rules = parseRules(text);
  const bundle = { items:{}, normal:{}, ruleCount: rules.length };
  for (const item of items) {
    bundle.items[item.id] = resolveBaselineEntry(item, rules, false);
  }
  for (const item of normalItems) {
    bundle.normal[item.id] = resolveBaselineEntry(item, rules, true);
  }
  fs.writeFileSync(path.join(outDir, strict+'.json'), JSON.stringify(bundle,null,2)+'\n');
  const counts = obj => Object.values(obj).reduce((a,e)=>(a[e.status]=(a[e.status]||0)+1,a),{});
  console.log(strict, 'rules', rules.length, 'items', counts(bundle.items), 'normal', counts(bundle.normal));
}
