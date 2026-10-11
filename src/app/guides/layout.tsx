import Link from "next/link";
import type { ReactNode } from "react";
export default function GuidesLayout({children}: {children: ReactNode}) {
  return <div className="fix-content-app">
    <header className="fix-content-header"><Link className="fix-content-brand" href="/">FIX POE2</Link><nav aria-label="가이드 메뉴"><Link href="/guides">전체 가이드</Link><Link href="/pob">PoB</Link><Link href="/filter">필터</Link><Link href="/about">소개</Link></nav></header>
    {children}
    <footer className="fix-content-footer"><Link href="/">FIX POE2 홈</Link><Link href="/privacy/site">개인정보처리방침</Link><Link href="/terms">이용안내</Link><Link href="/contact">문의</Link><small>Unofficial fan-made tools · Not affiliated with Grinding Gear Games.</small></footer>
  </div>;
}
