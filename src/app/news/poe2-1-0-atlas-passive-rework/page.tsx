import Link from 'next/link';
import type { Metadata } from 'next';
import styles from '../news.module.css';
import AtlasVisuals from './AtlasVisuals';

const title = 'POE2 1.0 아틀라스 패시브 개편｜노드 약 70개, 포인트 획득은 어떻게 달라지나';
const url = 'https://poe2.fixlgs.com/news/poe2-1-0-atlas-passive-rework';
export const metadata: Metadata = {
 title: `${title} | FIXLGS 새소식`,
 description: 'POE2 1.0 아틀라스 패시브 트리의 노드 축소, 요새 목표별 포인트 지급, 전부 할당 방식 유지와 출시 전 미확정 사항을 기존 0.5·0.5.5와 비교합니다.',
 alternates: { canonical: url },
 openGraph: { type: 'article', title, url, siteName: 'FIXLGS POE2', locale: 'ko_KR' },
};
const schema = {
 '@context': 'https://schema.org', '@type': 'NewsArticle', headline: title,
 dateCreated: '2026-11-18', inLanguage: 'ko-KR', mainEntityOfPage: url,
 author: { '@type': 'Organization', name: 'LGS / FIXLGS' },
 publisher: { '@type': 'Organization', name: 'LGS / FIXLGS' },
 description: 'POE2 1.0 아틀라스 패시브 개편의 발표 내용과 미확정 사항을 구분한 분석 기사',
};
export default function AtlasArticle(){return <div className={styles.root}>
<header className={styles.top}><div className={styles.topInner}><Link href="/" className={styles.brand}>FIXLGS POE2</Link><nav className={styles.nav}><Link href="/news">새소식</Link><Link href="/filter">FILTER</Link><Link href="/pob">POB</Link></nav></div></header>
<main className={styles.container}>
<nav aria-label="현재 위치" className={styles.breadcrumb}><Link href="/">홈</Link> / <Link href="/news">새소식</Link> / 002</nav>
<article className={styles.article}>
<p className={styles.kicker}>PATH OF EXILE 2 · 새소식 002</p><h1 className={styles.h1}>{title}</h1>
<div className={styles.meta}><time dateTime="2026-11-18">조사·작성일: 2026.11.18</time><span>FIXLGS 콘텐츠</span><span>1.0 출시 전 발표 기준</span></div>
<p className={styles.lead}>아틀라스 패시브 노드가 수백 개에서 약 70개로 줄어든다. 단순한 삭제가 아니다. 개발진은 기존 노드의 효과를 더 적은 노드에 압축하고, 포인트를 얻는 과정도 바꾸겠다고 설명했다. 그렇다면 엔드게임을 진행하는 플레이어에게 실제로 달라지는 것은 무엇일까?</p>
<p className={styles.quickAnswer}><strong>핵심 요약:</strong> 1.0 아틀라스는 약 70개 노드로 재설계되고, 요새의 개별 목표를 완료하며 포인트를 나눠 받는 방향이다. 여전히 모든 노드를 할당하는 구조로 설명됐다. 70개와 66개라는 서로 다른 언급이 있어 최종 개수는 패치노트 확인이 필요하다.</p>
<figure className={styles.figure}><img src="/news/atlas/atlas-tree-legacy.png" width="640" height="606" loading="lazy" alt="기존 아틀라스 패시브 트리의 활성화된 노드와 연결 경로"/><figcaption>기존 아틀라스 패시브 트리 참고 화면(사용자 제공). 1.0 최종 개편 트리 화면은 아닙니다.</figcaption></figure>
<h2>1. 먼저 구분할 것: 아틀라스와 캐릭터 패시브는 다르다</h2>
<p>아틀라스 패시브 트리는 엔드게임 지도와 관련 콘텐츠의 진행을 강화하는 시스템이다. 캐릭터 공격력과 치명타, 주얼 슬롯을 다루는 일반 패시브 트리와는 별개다. 이번 발표에서 함께 등장한 ‘주얼 슬롯 18개에서 약 60개로 재배치’는 <strong>캐릭터 패시브 트리</strong> 이야기다. 아틀라스의 노드 수 변경과 혼동하면 안 된다.</p>
<AtlasVisuals scene="systems" />
<h2>2. 왜 수백 개 노드를 줄이나?</h2>
<p>개발진이 지적한 문제는 ‘결국 전부 찍게 되는 트리인데 노드가 지나치게 많다’는 점이었다. 아틀라스는 특정 빌드처럼 소수 노드를 선택해 완성하는 트리가 아니라, 진행하면서 전체를 채워 나가는 구조다. 노드가 많을수록 성장의 선택지가 늘어나는 것처럼 보여도, 실제로는 완료까지의 반복 작업이 길어질 수 있다.</p>
<p>0.5의 대규모 트리 이후 0.5.5에서는 최종 보스 처치로 남은 포인트 획득 부담을 줄이는 보완이 소개됐다. 1.0은 획득 속도만 조정하는 대신 트리 자체를 압축하는 방향이다. 따라서 ‘기존에는 수백 개 지도를 무조건 하나씩 끝내야 했다’는 식의 설명은 0.5.5의 개선을 빠뜨릴 수 있다.</p>
<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>비교</th><th>기존 0.5 계열</th><th>1.0 발표 방향</th></tr></thead><tbody>
<tr><td>노드 규모</td><td>300개 이상으로 소개된 대형 트리</td><td>약 70개로 압축</td></tr>
<tr><td>노드의 힘</td><td>다수 노드에 효과 분산</td><td>효과를 적은 노드에 통합</td></tr>
<tr><td>포인트 획득</td><td>요새 진행과 후반부 완료 부담, 0.5.5에서 보완</td><td>요새 내부 목표별로 분산 지급</td></tr>
<tr><td>할당 방식</td><td>전체 노드 할당 가능</td><td>전체 할당 방식 유지 예정</td></tr>
<tr><td>최종 노드별 효과</td><td>기존 버전에서 확인 가능</td><td>전체 목록 미확인</td></tr>
</tbody></table></div>
<AtlasVisuals scene="scale" />
<figure className={styles.figure}><img src="/news/atlas/atlas-tree-alternative.png" width="922" height="722" loading="lazy" alt="여러 분기와 노드가 표시된 또 다른 아틀라스 패시브 트리 화면"/><figcaption>서로 다른 기존 아틀라스 패시브 트리 참고 화면(사용자 제공). 위 이미지와의 차이를 1.0 개편 전후 차이로 해석해서는 안 됩니다.</figcaption></figure>
<h2>3. 노드가 줄면 약해지는 걸까?</h2>
<p>개발진의 설명은 반대에 가깝다. 기존 트리의 힘을 작은 트리 안에 압축한다는 것이다. 질의응답에서는 노드 하나의 힘이 ‘5배’라는 취지의 표현도 나왔다. 다만 이것은 <strong>모든 노드의 수치가 정확히 5배가 된다</strong>는 패치 수치가 아니다. 효과를 통합한다는 설계 의도를 강조한 발언으로 이해해야 한다.</p>
<p>현재 공개 자료만으로 어떤 기존 노드가 어느 신규 노드에 합쳐지는지 1대1로 대응시키기는 어렵다. 신규 노드의 이름·수치·배치가 확인되기 전에는 추천 할당 순서나 최적 파밍 트리를 확정할 수 없다.</p>
<h2>4. 포인트는 어디서 얻나?</h2>
<p>발표에 따르면 요새 안의 여러 목표를 달성할 때마다 아틀라스 포인트를 얻는 방식으로 바뀐다. 아이콘이 있는 특수 지도에서는 목표 하나에 1포인트를 받고, 요새의 주요 시설이나 보스는 그보다 많은 포인트를 지급하는 구조로 설명됐다.</p>
<p>또한 모든 요새 구역을 빠짐없이 돌지 않아도 포인트를 전부 획득할 수 있도록 설계한다고 했다. 개발진은 주요 목표를 따라 최종 보스까지 진행하면 약 50포인트를 확보하고, 나머지는 비교적 짧은 마무리 과정으로 얻도록 의도했다고 설명했다.</p>
<div className={styles.analysis}><h3>FIXLGS 분석 · 50포인트의 의미</h3><p>최종 노드 수가 70개라면 50포인트는 전체의 약 71%다. 다만 이것은 발표된 목표 경로를 전제로 한 단순 계산이지, 모든 이용자가 보스에 도달하면 자동으로 50포인트를 얻는다는 보장은 아니다. 실제 보상 조건과 포인트 수는 최종 패치노트에서 확인해야 한다.</p></div>
<AtlasVisuals scene="progress" />
<figure className={styles.figure}><img src="/news/atlas/atlas-stone-citadel.png" width="795" height="565" loading="lazy" alt="아틀라스 월드 화면의 돌의 성채, Stone Citadel 위치와 주변 구조물"/><figcaption>돌의 성채(Stone Citadel) 게임 화면(사용자 제공). 1.0 신규 요새 배치나 포인트 지급 수치를 증명하는 화면은 아닙니다.</figcaption></figure>
<figure className={styles.figure}><img src="/news/atlas/atlas-boss-reference.png" width="918" height="515" loading="lazy" alt="엔드게임 보스 전투 장면"/><figcaption>엔드게임 보스 전투 참고 화면(사용자 제공). 이 장면의 보스가 1.0 아틀라스 최종 보스라는 뜻은 아니며 포인트 보상 조건을 입증하지 않습니다.</figcaption></figure>
<h2>5. 왜 ‘모든 노드를 찍는 방식’을 유지하나?</h2>
<p>개발진은 아틀라스 지도에서 얻을 수 있는 보너스를 미리 확인할 수 있다는 점을 이유로 들었다. 만약 일부 노드만 선택할 수 있다면 특정 지도를 진행할 때마다 효율에 맞춰 트리를 바꾸고 싶은 압박이 생긴다. 아틀라스가 모든 노드를 채우는 구조를 유지하면 이런 반복적인 재설정 부담을 줄일 수 있다는 설명이다.</p>
<p>일부 노드 내부에서 효과를 고르는 방식도 유지할 계획이다. 다만 선택을 되돌리기 어렵거나, 새 캐릭터로 플레이할 때 오히려 위험해지는 효과는 문제가 될 수 있다. 개발진은 후회하기 쉬운 노드를 재검토하겠다고 했지만, 실제로 어떤 노드가 변경됐는지는 최종 트리를 봐야 알 수 있다.</p>
<h2>6. 신규 유저와 기존 유저가 체감할 차이</h2>
<h3>처음 엔드게임에 진입한다면</h3>
<p>수백 개의 노드를 한눈에 보는 부담은 줄어들 가능성이 높다. 포인트도 특정 후반 목표에 몰아주는 대신 진행 중 나눠 받는다면, 목표를 하나씩 완료할 때 성장한 느낌을 받기 쉬워진다. 하지만 노드 하나의 영향력이 커지는 만큼 어떤 효과부터 활성화할지의 중요성은 남는다.</p>
<h3>이미 0.5 아틀라스를 경험했다면</h3>
<p>기존 노드 이름이나 배치를 기준으로 만든 순서표를 1.0에 그대로 적용하기는 어렵다. 특히 파밍 효율을 비교할 때는 ‘노드 개수’보다 새 노드의 실제 효과, 지도 보상, 요새 목표의 소요 시간을 확인해야 한다. 현재는 효율이 개선된다고 단정할 실측 데이터가 없다.</p>

<h2>7. 기존 게임 화면 참고</h2>
<p>추가 아틀라스 지도·성채·모놀리스 등의 화면은 <a href="https://www.poe2wiki.net/wiki/Category:Atlas_screenshots" target="_blank" rel="noopener noreferrer">POE2 Wiki 아틀라스 스크린샷 자료실</a>에서 확인할 수 있다. 본문의 게임 화면 4장은 독자가 제공한 자료를 프로젝트 내부에 저장해 사용했다. 게임 화면의 저작권은 GGG 등 원권리자에게 있으며, 독자 제공 사실만으로 재게시 허가가 확정되는 것은 아니다. <strong>1.0 최종 개편 화면으로 확인된 이미지는 아니다.</strong></p>
<h2>8. 지금 확정하지 말아야 할 세 가지</h2>
<ol><li><strong>최종 노드 수:</strong> 발표 설명에 70개와 66개가 모두 등장한다. 기사에서는 ‘약 70개’로 표기한다.</li><li><strong>노드별 정확한 효과:</strong> 효과가 압축된다는 방향은 소개됐지만 신규 전체 목록과 수치는 미확인이다.</li><li><strong>완성까지 걸리는 시간:</strong> 개발진의 의도는 확인되지만 실제 소요 시간은 출시 후 플레이 데이터가 필요하다.</li></ol>
<p>결국 이번 개편의 핵심은 아틀라스의 힘을 단순히 줄이는 것이 아니라, <strong>전부 찍는 트리를 완성하기까지의 과정을 짧고 명확하게 만들려는 것</strong>이다. 노드가 실제로 어떻게 합쳐졌는지, 어느 목표가 가장 빠른 포인트 획득 경로인지는 1.0 최종 정보가 공개된 뒤 판단할 수 있다.</p>
<section className={styles.source} aria-label="자료와 확인 범위"><h2>자료와 확인 범위</h2><p>2026년 11월 18일까지 공개된 ExileCon 2026 개발진 발표·질의응답을 다룬 자료와 기존 아틀라스 설명을 대조했다. 국내 해설 영상은 질문을 정리하는 보조 자료로 활용했으며, 공개되지 않은 신규 노드 목록을 추정해 작성하지 않았다.</p><ul>
<li><a href="https://store.steampowered.com/sale/exilecon26" target="_blank" rel="noopener noreferrer">ExileCon 2026 공식 행사·발표 안내</a></li>
<li><a href="https://poe2.vi.ki/1-0-by-the-numbers" target="_blank" rel="noopener noreferrer">ExileCon 발표 수치·발언 시점 정리(비공식)</a></li>
<li><a href="https://poe2.vi.ki/atlas-passive-tree" target="_blank" rel="noopener noreferrer">기존 아틀라스 패시브 구조 참고(비공식)</a></li>
<li><a href="https://outputlag.com/news/path-of-exile-2-1-0-cuts-the-atlas-tree-to-70-nodes-and-adds-over-25-endgame-maps/" target="_blank" rel="noopener noreferrer">1.0 아틀라스 변경 보도(2차 자료)</a></li>
</ul><p>발표 당시 계획과 최종 구현은 다를 수 있다. 전체 신규 트리 이미지, 개별 노드 효과, 실제 플레이 소요 시간은 작성 시점에 확인하지 못했다.</p></section>
<p><Link href="/news/poe2-1-0-full-release">관련 기사: POE2 1.0 정식 출시 총정리</Link></p><nav className={styles.articleReturn} aria-label="기사 하단 이동"><Link className={styles.back} href="/news">← 새소식 전체보기</Link><Link className={styles.back} href="/">⌂ 홈으로 돌아가기</Link></nav>
</article></main><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} /></div>}
