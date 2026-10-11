import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pobGuides, pobGuideBySlug } from "@/lib/pobGuides";
export function generateStaticParams() {return pobGuides.map(({slug}) => ({slug}));}
export async function generateMetadata({params}: {params: Promise<{slug:string}>}): Promise<Metadata> {
  const {slug}=await params; const g=pobGuideBySlug(slug);
  return g?{title: `${g.title} | FIX POE2`,description:g.description,alternates:{canonical:`/guides/pob/${slug}`}}:{title:"가이드를 찾을 수 없습니다"};
}
export default async function GuideDetail({params}: {params:Promise<{slug:string}>}) {
  const {slug}=await params;const g=pobGuideBySlug(slug);if(!g) notFound();
  return <main className="fix-content-main"><nav aria-label="현재 위치" className="fix-breadcrumb"><Link href="/guides">전체 가이드</Link> / <span>PoB</span> / <span>{g.label}</span></nav>
   <p className="fix-content-eyebrow">POB GUIDE · FIX POE2</p><h1>{g.title}</h1><p className="fix-content-lead">{g.lead}</p>
   {g.sections.map((section,i) => <section className="fix-content-section" key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((p,j)=><p key={j}>{p}</p>)}{section.points && <ul>{section.points.map(p=><li key={p}>{p}</li>)}</ul>}</section>)}
   <aside className="fix-content-note"><strong>계산 결과 이용 시 주의</strong><p>{g.caveat}</p></aside>
   <nav className="fix-content-next" aria-label="다른 가이드">{pobGuides.filter(item=>item.slug!==g.slug).slice(0,3).map(item=><Link key={item.slug} href={`/guides/pob/${item.slug}`}>→ {item.label}</Link>)}</nav>
   <div className="fix-content-actions"><Link href="/pob">PoB 캐릭터 비교 열기 →</Link><Link href="/guides">전체 가이드 보기</Link></div>
  </main>
}
