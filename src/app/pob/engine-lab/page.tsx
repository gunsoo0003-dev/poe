"use client";
import { useEffect, useRef, useState } from "react";
import { CalcClient } from "../web-engine/calc-client";
import type { SkillsData } from "../web-engine/calc-api";

type Snapshot = { stats: Record<string, number>; skills: SkillsData };
const slots = ["Weapon 1", "Weapon 1 Swap", "Weapon 2", "Weapon 2 Swap", "Helmet", "Body Armour", "Gloves", "Boots", "Ring 1", "Ring 2", "Amulet", "Belt"];
const numbersEqual = (a: Record<string,number>, b: Record<string,number>) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => !k.startsWith("_") && a[k] !== b[k]);
export default function EngineLab() {
  const client = useRef<CalcClient | null>(null);
  const baseline = useRef<Snapshot | null>(null);
  const [stage, setStage] = useState("원본 PoB2 검증 대기");
  const [logs, setLogs] = useState<string[]>([]);
  const [before, setBefore] = useState<Snapshot | null>(null);
  const [after, setAfter] = useState<Snapshot | null>(null);
  const [slot, setSlot] = useState("Weapon 1");
  const [itemText, setItemText] = useState("");
  const [busy, setBusy] = useState(false);
  const [audit, setAudit] = useState<string[]>([]);
  useEffect(() => () => { client.current?.terminate(); client.current = null; }, []);
  async function loadBaseline() {
    const exportCode = sessionStorage.getItem("fixlgs.pob2.engineLabExport");
    if (!exportCode) throw new Error("먼저 /pob에서 poe.ninja 캐릭터를 불러오세요.");
    const response = await fetch("/api/pob/prepare-export", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({exportCode})});
    const payload = await response.json();
    if (!response.ok || !payload.ok || typeof payload.xml !== "string") throw new Error(payload.error || "PoB XML 변환 실패");
    client.current?.terminate();
    client.current = new CalcClient(msg => setLogs(old => [...old.slice(-25), msg]));
    setStage("PoB2 원본 WASM 초기화");
    if (!await client.current.init()) throw new Error("PoB2 WASM 초기화 실패");
    setStage("PoB2 원본 빌드 로드");
    const loaded = await client.current.loadBuild(payload.xml);
    if (!loaded.success) throw new Error(loaded.error || "빌드 로드 실패");
    // Do NOT auto-select a new skill or weapon set. The PoB build owns both.
    const skills = await client.current.getSkills({skipAutoSelect:true});
    const stats = await client.current.getStats();
    if (!Object.keys(stats).length || !skills.groups?.length) throw new Error("PoB2 원본 캐릭터 계산/스킬 그룹 복원 실패");
    const snapshot = {stats, skills};
    baseline.current = snapshot;
    return snapshot;
  }
  async function runBaseline() {
    if (busy) return; setBusy(true); setAudit([]);setAfter(null);setLogs([]);
    try {
      const first = await loadBaseline();
      setBefore(first);
      const secondStats = await client.current!.getStats();
      const differing = numbersEqual(first.stats, secondStats);
      if (differing.length) throw new Error("동일 원본 빌드 반복 계산 불일치: " + differing.join(", "));
      setAudit([`원본 PoB2 반복 계산 일치: ${Object.keys(first.stats).filter(x=>!x.startsWith("_")).length}개 수치`, `원본 스킬 그룹: ${first.skills.groups.length}개`, `원본 메인 스킬 그룹: ${first.skills.mainSocketGroup}`, `원본 무기 세트: ${first.skills.weaponSet ?? "미확인"}`]);
      setStage("원본 빌드 검증 통과 · 장비 교체 테스트 가능");
    } catch (e) {setStage("실패: " + (e instanceof Error ? e.message : String(e)));}
    finally {setBusy(false);}
  }
  async function runEquip() {
    if (busy) return;setBusy(true);
    try {
      if (!client.current || !baseline.current) throw new Error("먼저 원본 검증을 실행하세요.");
      if (!itemText.trim()) throw new Error("PoB2 원본 아이템 텍스트를 입력하세요.");
      setStage("PoB2 원본 아이템 등록 및 장착 검증");
      const added = await client.current.addCustomItem(itemText.trim());
      if (!added.success || !added.itemId) throw new Error(added.error || "원본 아이템 파싱 실패");
      const equipped = await client.current.equipItem(added.itemId,slot);
      if (equipped.error || equipped.equippedItemId !== added.itemId || equipped.equippedSlot !== slot) throw new Error(equipped.error || "장착 슬롯 검증 실패");
      if (equipped.diagnostic) setAudit(old => [...old, "PoB 장착→계산 내부 추적: " + JSON.stringify(equipped.diagnostic)]);
      const entries = await client.current.getSlotItems(slot);
      if (!entries.some(e => e.itemId === added.itemId && e.isEquipped)) throw new Error("원본 장착 상태 재조회 실패");
      const skills = await client.current.getSkills({skipAutoSelect:true});
      const stats = await client.current.getStats();
      const differing = numbersEqual(baseline.current.stats,stats);
      setAfter({stats,skills});
      setAudit(old => [...old, `원본 아이템 ID ${added.itemId} / 슬롯 ${slot}: 장착 검증 통과`, `변경된 원본 계산 수치 ${differing.length}개: ${differing.join(", ") || "없음 (적용 효과 및 스킬 검증 필요)"}`, `스킬 그룹 수: ${baseline.current!.skills.groups.length} → ${skills.groups.length}`]);
      setStage("PoB2 엔진 장비 교체 완료 · 아래 원본 결과를 검토하세요");
    } catch (e) {setStage("교체 검증 실패: " + (e instanceof Error ? e.message : String(e)));}
    finally {setBusy(false);}
  }
  return <main style={{minHeight:"100vh",background:"#0b111c",color:"#e5edf8",padding:28,fontFamily:"Arial,sans-serif"}}>
    <div style={{maxWidth:1100,margin:"auto"}}>
      <a href="/pob" style={{color:"#8cb6ec"}}>← FIXLGS 화면</a>
      <h1 style={{fontSize:25,margin:"20px 0 8px"}}>V198 · PoB2 원본 우선 검증</h1>
      <p style={{color:"#b9cae0"}}>FIXLGS 자체 DPS 계산 없이 PoB2 WASM의 빌드 로드·아이템 등록·장착·결과 조회만 실행합니다. 원본 계산과 ninja 빌드의 일치 여부는 별도 검증이 필요합니다.</p>
      <div style={{padding:18,background:"#172434",borderRadius:8,margin:"16px 0"}}>
        <b>{stage}</b><div style={{marginTop:12}}><button disabled={busy} onClick={()=>void runBaseline()} style={{padding:10,cursor:"pointer"}}>{busy?"실행 중...":"① PoB2 원본 계산 검증 / 초기화"}</button></div>
        {audit.map((line,i)=><p key={i} style={{margin:"7px 0",color:"#96e2c0"}}>{line}</p>)}
      </div>
      <div style={{padding:18,border:"1px solid #456070",borderRadius:8}}>
        <h2>② 원본 아이템 장착 검증</h2>
        <label>PoB 슬롯 <select value={slot} onChange={e=>setSlot(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></label>
        <textarea value={itemText} onChange={e=>setItemText(e.target.value)} placeholder="PoB2가 인식할 수 있는 원본 아이템 텍스트 붙여넣기" rows={8} style={{display:"block",width:"100%",margin:"14px 0",padding:12,color:"#fff",background:"#131e2b"}}/>
        <button disabled={busy||!before} onClick={()=>void runEquip()} style={{padding:10,cursor:"pointer"}}>원본 PoB2 장착 및 재계산</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18,marginTop:22}}>
        {([before,after] as const).map((s,i)=><section key={i}><h2>{i===0?"CURRENT · PoB2 원본":"AFTER · PoB2 원본"}</h2><pre style={{maxHeight:450,overflow:"auto",whiteSpace:"pre-wrap",fontSize:12}}>{s?JSON.stringify({stats:s.stats,skills:s.skills},null,2):"검증 대기"}</pre></section>)}
      </div>
      <details><summary>원본 실행 로그</summary><pre style={{whiteSpace:"pre-wrap"}}>{logs.join("\n")}</pre></details>
    </div>
  </main>;
}
