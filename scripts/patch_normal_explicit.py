from pathlib import Path
p=Path('/mnt/data/fix_filter_v214/src/app/filter/filterExport.ts');s=p.read_text();s=s.replace('''  normalGear: Record<string, boolean>;
  normalBaselineEnabled:''','''  normalGear: Record<string, boolean>;
  normalGearExplicit?: Record<string, boolean>;
  normalBaselineEnabled:''',1)
s=s.replace('''    if (enabled !== baseline) {
      if (!enabled) {''','''    if (enabled !== baseline || input.normalGearExplicit?.[item.id] === true) {
      if (!enabled) {''',1)
p.write_text(s)
p=Path('/mnt/data/fix_filter_v214/src/app/filter/FilterCustomizer.tsx');s=p.read_text()
s=s.replace('''  normalGear: Record<string, boolean>;
  magicGear:''','''  normalGear: Record<string, boolean>;
  normalGearExplicit?: Record<string, boolean>;
  magicGear:''',1)
s=s.replace('''  const [normalGear, setNormalGear] = useState<Record<string, boolean>>({});''','''  const [normalGear, setNormalGear] = useState<Record<string, boolean>>({});
  const [normalGearExplicit, setNormalGearExplicit] = useState<Record<string, boolean>>({});''',1)
s=s.replace('''            setNormalGear(presetNormalOverrides);''','''            setNormalGear(presetNormalOverrides);
            setNormalGearExplicit(payload.normalGearExplicit ?? {});''',1)
s=s.replace('''      setNormalGear(presetNormalOverrides);''','''      setNormalGear(presetNormalOverrides);
      setNormalGearExplicit(payload.normalGearExplicit ?? {});''',1) if False else s
# Above first replacement introduced a coincident substring; replace remaining explicit in loadLocalPreset using a unique anchor
needle='''      setNormalGear(presetNormalOverrides);
      setMagicGear('''
assert needle in s;s=s.replace(needle,'''      setNormalGear(presetNormalOverrides);
      setNormalGearExplicit(payload.normalGearExplicit ?? {});
      setMagicGear(''',1)
s=s.replace('''      normalGear: { ...normalGear },''','''      normalGear: { ...normalGear },
      normalGearExplicit: { ...normalGearExplicit },''',1)
s=s.replace('''      normalGear,
      normalBaselineEnabled:''','''      normalGear,
      normalGearExplicit,
      normalBaselineEnabled:''',1)
s=s.replace('''      setNormalGear((current) => ({ ...current, [gearPreview.id]: enabled }));''','''      setNormalGear((current) => ({ ...current, [gearPreview.id]: enabled }));
      setNormalGearExplicit((current) => { const next = { ...current }; delete next[gearPreview.id]; return next; });''',1)
s=s.replace('''    setNormalGear(Object.fromEntries(''','''    setNormalGearExplicit({});
    setNormalGear(Object.fromEntries(''',1)
# two reset functions target empty
s=s.replace('''    setNormalGear({});''','''    setNormalGear({});
    setNormalGearExplicit({});''')
s=s.replace('''      (item) => (normalGear[item.id] ?? baselineEnabled(neverSinkBaseline?.normal[item.id])) !== baselineEnabled(neverSinkBaseline?.normal[item.id]),''','''      (item) => normalGearExplicit[item.id] === true || (normalGear[item.id] ?? baselineEnabled(neverSinkBaseline?.normal[item.id])) !== baselineEnabled(neverSinkBaseline?.normal[item.id]),''')
s=s.replace('''  }, [itemState, soundState, skillGems, spiritGems, normalGear, magicGear, rareGear,''','''  }, [itemState, soundState, skillGems, spiritGems, normalGear, normalGearExplicit, magicGear, rareGear,''')
s=s.replace('''      group.items.forEach((item) => { next[item.id] = enabled; });''','''      group.items.forEach((item) => { next[item.id] = enabled; });
      setNormalGearExplicit((currentExplicit) => ({ ...currentExplicit, ...Object.fromEntries(group.items.map((item) => [item.id, true])) }));''',1)
s=s.replace('''                          setNormalGear((current) => ({ ...current, [item.id]: nextEnabled }));''','''                          setNormalGear((current) => ({ ...current, [item.id]: nextEnabled }));
                          setNormalGearExplicit((current) => ({ ...current, [item.id]: true }));''',1)
p.write_text(s)
print('normal explicit patched',s.count('setNormalGearExplicit('))
