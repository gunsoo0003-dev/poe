import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pobGuideBySlug, pobGuides } from "@/lib/pobGuides";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return pobGuides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = pobGuideBySlug(slug);
  if (!guide) return { title: "가이드를 찾을 수 없습니다 | FIX POE2" };
  return { title: `${guide.title} | FIX POE2`, description: guide.description };
}

export default async function PobGuideDetail({ params }: Props) {
  const { slug } = await params;
  const guide = pobGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <main className="fix-content-main">
      <p className="fix-content-eyebrow">FIXLGS POE2 · PoB GUIDE</p>
      <h1>{guide.title}</h1>
      <p className="fix-content-lead">{guide.lead}</p>
      {guide.sections.map((section) => (
        <section key={section.heading} className="fix-content-section">
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.points && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}
        </section>
      ))}
      {guide.resources && guide.resources.length > 0 && (
        <section className="fix-content-section">
          <h2>관련 링크</h2>
          <ul>{guide.resources.map((resource) => (
            <li key={resource.href}>
              <a href={resource.href} target="_blank" rel="noopener noreferrer">{resource.title} ↗</a>
            </li>
          ))}</ul>
        </section>
      )}
      <aside className="fix-content-note"><strong>이용 전 확인</strong><p>{guide.caveat}</p></aside>
      <p><Link href="/guides">← 전체 가이드 보기</Link></p>
    </main>
  );
}
