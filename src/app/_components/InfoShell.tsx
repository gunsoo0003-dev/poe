import Link from "next/link";
import type { ReactNode } from "react";
export default function InfoShell({children}: {children: ReactNode}) {return <div className="fix-content-app">
<header className="fix-content-header"><Link className="fix-content-brand" href="/">FIX POE2</Link><nav><Link href="/guides">가이드</Link><Link href="/pob">PoB</Link><Link href="/filter">필터</Link><Link href="/contact">문의</Link></nav></header>
<main className="fix-content-main">{children}</main>
<footer className="fix-content-footer"><Link href="/about">사이트 소개</Link><Link href="/privacy/site">개인정보처리방침</Link><Link href="/terms">이용안내</Link><Link href="/contact">문의</Link><small>© LGS Co., Ltd. · Unofficial fan-made tools</small></footer></div>}
