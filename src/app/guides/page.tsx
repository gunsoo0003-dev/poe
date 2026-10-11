import Link from "next/link";
import type { Metadata } from "next";
import { pobGuides } from "@/lib/pobGuides";
export const metadata: Metadata = { title: "POE2 사용 가이드 · 아이템 필터와 PoB | FIX POE2", description: "POE2 필터 설치, NeverSink 커스텀, 카카오게임즈 한국 계정 poe.ninja 연동·캐릭터 등록, PoB2 DPS 계산과 장비 비교에 관한 직접 작성 가이드." };
export default function GuidesIndex() {return <main className="fix-content-main">
  <p className="fix-content-eyebrow">FIXLGS POE2 · LEARNING CENTER</p><h1>POE2 사용 가이드</h1><p className="fix-content-lead">도구를 처음 사용할 때 필요한 절차부터, 실제 장비 비교에서 계산값을 해석하는 방법까지 정리했습니다. 각 가이드는 실제 기능과 데이터의 한계를 구분해 설명하며, 오류가 발생했을 때 확인할 항목도 안내합니다.</p>
  <section className="fix-content-section"><h2>아이템 필터</h2><div className="fix-guide-grid"><Link href="/filter/guide" className="fix-guide-card"><strong>필터 커스터마이저 처음부터 끝까지</strong><span>NeverSink 단계, NS 기본값, 숨김·중요도, 개인 MP3, 게임 폴더 설치</span></Link><Link href="/guides/filter-troubleshooting" className="fix-guide-card"><strong>필터가 안 보이거나 사운드가 안 날 때</strong><span>완전히 숨김·조건부 규칙, 파일과 사운드 경로, 저장 설정 문제 해결</span></Link></div></section>
  <section className="fix-content-section"><h2>PoB 캐릭터 비교</h2><div className="fix-guide-grid">{pobGuides.map(g => <Link className="fix-guide-card" key={g.slug} href={`/guides/pob/${g.slug}`}><strong>{g.label}</strong><span>{g.description}</span></Link>)}</div></section>
  <section className="fix-content-note"><strong>데이터 기준</strong><p>게임 버전 및 poe.ninja 수집 상태가 바뀌면 화면이나 계산값이 달라질 수 있습니다. 설명과 실제 게임 결과가 다를 경우 해당 버전의 게임 내 결과와 PoB2 계산 상태를 우선 확인하세요.</p></section>
</main>}
