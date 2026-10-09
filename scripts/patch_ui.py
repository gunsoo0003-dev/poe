from pathlib import Path
p=Path('/mnt/data/fix_filter_v214/src/app/filter/FilterCustomizer.tsx');s=p.read_text();
s=s.replace('type ItemState = { enabled: boolean; importance: string };','type ItemState = { enabled: boolean; importance: string; visibilityExplicit?: boolean };')
s=s.replace('const resolved = { ...(current[item.id] ?? baselineState), ...patch };','const resolved = { ...(current[item.id] ?? baselineState), ...patch, ...("enabled" in patch ? { visibilityExplicit: true } : {}) };')
s=s.replace('if (resolved.enabled === baselineState.enabled && resolved.importance === "default") delete next[item.id];','if (resolved.enabled === baselineState.enabled && resolved.importance === "default" && !resolved.visibilityExplicit) delete next[item.id];')
s=s.replace('return state.enabled !== baselineEnabled(neverSinkBaseline?.items[item.id]) || state.importance !== "default";','return state.enabled !== baselineEnabled(neverSinkBaseline?.items[item.id]) || state.importance !== "default" || state.visibilityExplicit === true;')
s=s.replace('      normalItems: NORMAL_GEAR_GROUPS.flatMap((group) => group.items),','      normalItems: NORMAL_GEAR_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, classNames: group.classes }))),')
# Indicator for explicit user preference vs NeverSink conditions
s=s.replace('''        {item.uniqueNamesKo?.length ? <small className="filter-v2-unique-names">''','''        {baseline?.status === "conditional" && state.visibilityExplicit ? (
          <small className="filter-v2-ns-baseline" title="이 항목에 대한 사용자 표시 설정이 NeverSink 조건보다 우선합니다.">
            {state.enabled ? "FIX 표시" : "FIX 숨김"}
          </small>
        ) : null}
        {item.uniqueNamesKo?.length ? <small className="filter-v2-unique-names">''',1)
# make directory popup code integrate from V177 (only use exact copied sections)
ref=Path('/mnt/data/ref_v177/fix-pob/src/app/filter/FilterCustomizer.tsx').read_text()
# V177 exact small diffs auto construct via difflib: copy from ref except original new V213 UI and ref variant linked to same code.
# function substring replacement of V213 UI choose folder / install modal
s=s.replace('type InstallDirectoryHandle = {','type InstallGuideMode = "install" | "change";\n\ntype InstallDirectoryHandle = {',1)
state_line='  const [installFolderName, setInstallFolderName] = useState'
idx=s.find(state_line)
if idx==-1:
 print('STATE search failed')
else:
 end=s.index('\n',idx)
 s=s[:end+1]+'  const [installGuideMode, setInstallGuideMode] = useState<InstallGuideMode | null>(null);\n'+s[end+1:]
s=s.replace('''showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<InstallDirectoryHandle>;''','''showDirectoryPicker?: (options?: {
      mode?: "read" | "readwrite";
      startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
      id?: string;
    }) => Promise<InstallDirectoryHandle>;''')
s=s.replace('''const directory = await picker({ mode: "readwrite" });''','''const directory = await picker({ mode: "readwrite", startIn: "documents", id: "fixlgs-poe2-filter-install" });''')
start=s.index('  const handleChangeInstallFolder = async () => {')
end=s.index('  const customCount = useMemo(',start)
refstart=ref.index('  const installToChosenDirectory = async (mode: InstallGuideMode) => {')
refend=ref.index('  const customCount = useMemo(',refstart)
s=s[:start]+ref[refstart:refend]+s[end:]
# modal from V177 with unique anchor
modal_start=ref.index('      {installGuideMode ? (')
modal_end=ref.index('      ) : null}',modal_start)+len('      ) : null}')
# append before final returned component closing, exact anchor nearby
anchor=s.rfind('    </div>\n  );')
print('popup anchor',anchor,'state found',idx)
if anchor>=0:
 s=s[:anchor]+ref[modal_start:modal_end]+'\n'+s[anchor:]
p.write_text(s)
# Append popup CSS from V177
p=Path('/mnt/data/fix_filter_v214/src/app/globals.css');s=p.read_text(); r=Path('/mnt/data/ref_v177/fix-pob/src/app/globals.css').read_text(); css=r[r.index('.filter-v2-install-guide-backdrop{'):]; s+='\n/* V214 FILTER FOLDER GUIDE */\n'+css;p.write_text(s)
print('ui patched',len(s))
