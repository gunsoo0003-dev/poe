import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './news.module.css';
import OfficialArtwork from './OfficialArtwork';
export const metadata: Metadata = {
  title: 'POE2 새소식｜1.0 정식 출시·신규 리그·빌드 변화 | FIXLGS',
  description: '패스 오브 엑자일 2의 신규 리그와 업데이트를 발표 자료 및 게임 이용 관점에서 분석합니다.',
  alternates: { canonical: 'https://poe2.fixlgs.com/news' },
};
export default function NewsIndex(){return <div className={styles.root}>
  <header className={styles.top}><div className={styles.topInner}><Link className={styles.brand} href="/">FIXLGS POE2</Link><nav className={styles.nav}><Link href="/">홈</Link><Link href="/filter">FILTER</Link><Link href="/pob">POB</Link></nav></div></header>
  <main className={`${styles.container} ${styles.newsIndex}`}><p className={styles.kicker}>FIXLGS · PATH OF EXILE 2</p><h1 className={styles.h1}>새소식</h1><p className={styles.lead}>정식 출시, 신규 리그, 아이템과 빌드 환경의 변화를 공식 발표와 확인 가능한 자료를 바탕으로 정리합니다.</p>
    <div className={styles.newsSummary}><span>NEWS ARCHIVE</span><span>02 ARTICLES</span></div>
    <div className={styles.newsGrid}>
    <Link href="/news/poe2-1-0-atlas-passive-rework" className={styles.listCard}>
      <img src="/news/atlas/atlas-cover-v281.svg" width={1280} height={720} alt="FIXLGS가 제작한 아틀라스 노드 네트워크 콘셉트 그래픽" />
      <div className={styles.listBody}><p className={styles.kicker}>새소식 002 · 2026.11.18</p><h2>POE2 1.0 아틀라스 패시브 개편｜노드 약 70개, 포인트 획득은 어떻게 달라지나</h2><p>기존 대형 아틀라스와 1.0 압축 트리를 비교하고, 요새 목표별 포인트 지급과 최종 미확정 사항을 정리했습니다.</p><span className={styles.listFoot}>기사 읽기 →</span></div>
    </Link>
    <Link href="/news/poe2-1-0-full-release" className={styles.listCard}>
      <OfficialArtwork src="https://prcdn.freetls.fastly.net/release_image/188965/3/188965-3-cc747a5763161383fc42404b06738c7d-1430x804.png" width={1430} height={804} alt="GGG 공식 POE2 1.0 정식 출시 이미지" />
      <div className={styles.listBody}><p className={styles.kicker}>새소식 001 · 2026.11.14</p><h2>POE2 1.0 정식 출시 총정리｜12월 12일 신규 리그·직업·핵심 변경점</h2><p>12월 12일 한국 출시 예정. 성채·사령관, 신규 직업, 아이템 제작과 패시브 개편의 핵심을 비교표와 변경 전후 비교표로 정리했습니다.</p><span className={styles.listFoot}>기사 읽기 →</span></div>
    </Link>
    </div>
    <div className={styles.newsReturn}><Link href="/" className={styles.newsReturnLink}>← 홈으로 돌아가기</Link></div>
  </main></div>}
