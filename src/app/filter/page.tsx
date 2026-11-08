import Link from "next/link";
import FilterCustomizer from "./FilterCustomizer";

export default function FilterPage() {
  return (
    <main className="filter-v2-page">
      <header className="filter-v2-topbar">
        <Link className="filter-v2-brand" href="/">FIX POE2</Link>
        <nav aria-label="POE2 서비스 메뉴">
          <Link href="/pob">POB</Link>
          <Link className="is-current" href="/filter">FILTER</Link>
          <Link href="/filter/guide">GUIDE</Link>
          <Link href="/">HOME</Link>
        </nav>
      </header>

      <aside className="filter-v2-ad filter-v2-ad-left" aria-label="좌측 광고 영역">
        <small>ADSENSE</small>
        <strong>LEFT AD</strong>
      </aside>
      <aside className="filter-v2-ad filter-v2-ad-right" aria-label="우측 광고 영역">
        <small>ADSENSE</small>
        <strong>RIGHT AD</strong>
      </aside>

      <section className="filter-v247-mobile-intro" aria-label="모바일 필터 사용 안내">
        <strong>FILTER · 모바일 접근</strong>
        <p>필터 편집기를 모바일에서도 열 수 있습니다. 아래 편집기는 PC 기준 화면으로, 좌우로 밀어 모든 설정을 확인하세요. 세밀한 편집과 파일 설치는 PC 이용을 권장합니다.</p>
        <nav aria-label="필터 모바일 도움말">
          <Link href="/filter/guide">필터 사용 가이드</Link>
          <Link href="/guides/filter-troubleshooting">오류 해결</Link>
          <Link href="/">메인으로</Link>
        </nav>
      </section>
      <div className="filter-v247-scroll" role="region" aria-label="필터 편집기, 모바일에서는 가로 스크롤" tabIndex={0}>
        <FilterCustomizer />
      </div>
    </main>
  );
}
