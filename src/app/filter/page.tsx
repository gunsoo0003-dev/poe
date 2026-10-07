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
          <span>TRADE</span>
          <span>CRAFT</span>
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

      <FilterCustomizer />

      <section className="filter-v2-mobile">
        <strong>FIX POE2 · FILTER</strong>
        <h1>PC에서 이용해 주세요.</h1>
        <p>필터 커스터마이저는 넓은 PC 화면을 기준으로 제작하고 있습니다.</p>
        <Link href="/">메인으로 돌아가기</Link>
      </section>
    </main>
  );
}
