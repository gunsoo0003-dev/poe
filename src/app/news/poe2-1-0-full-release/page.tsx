import Link from 'next/link';
import type { Metadata } from 'next';
import styles from '../news.module.css';
import OfficialArtwork from '../OfficialArtwork';

const url = 'https://poe2.fixlgs.com/news/poe2-1-0-full-release';
const title = 'POE2 1.0 정식 출시 총정리｜12월 12일 신규 리그·직업·핵심 변경점';
export const metadata: Metadata = {
  title: `${title} | FIXLGS 새소식`,
  description: 'POE2 1.0 정식 출시일은 한국시간 12월 12일. 신규 리그 레이클라스트의 정복자들, 섀도우·듀얼리스트, 성채 공성전, 제작 화폐, 패시브 개편을 공식 발표와 비교표로 정리했습니다.',
  alternates: { canonical: url },
  openGraph: { type: 'article', title, description: 'POE2 1.0 한국시간 12월 12일 출시. 신규 리그·직업·아이템·패시브 주요 변경점', url, siteName: 'FIXLGS POE2', locale: 'ko_KR', images: [{url: 'https://prcdn.freetls.fastly.net/release_image/188965/3/188965-3-cc747a5763161383fc42404b06738c7d-1430x804.png', width: 1430, height: 804, alt: 'GGG 패스 오브 엑자일 2 1.0 정식 출시 공식 발표 이미지'}], },
  twitter: { card: 'summary_large_image', title, images: ['https://prcdn.freetls.fastly.net/release_image/188965/3/188965-3-cc747a5763161383fc42404b06738c7d-1430x804.png'] },
};
const schema = {
  '@context': 'https://schema.org', '@type': 'NewsArticle',
  headline: title, dateCreated: '2026-11-14', inLanguage: 'ko-KR',
  mainEntityOfPage: url, image: ['https://prcdn.freetls.fastly.net/release_image/188965/3/188965-3-cc747a5763161383fc42404b06738c7d-1430x804.png'],
  author: { '@type': 'Organization', name: 'LGS / FIXLGS' },
  publisher: { '@type': 'Organization', name: 'LGS / FIXLGS' },
  description: 'POE2 1.0 신규 리그, 직업, 파밍, 장비 제작의 변경 사항과 발표 전후 구분을 정리한 분석 기사',
};
function Figure({src,alt,caption}:{src:string;alt:string;caption:string}){return <figure className={styles.figure}><OfficialArtwork src={src} alt={alt} width={1600} height={760} loading="lazy" /><figcaption>{caption}</figcaption></figure>}
function Analysis({children}:{children:React.ReactNode}){return <aside className={styles.analysis}><h3>FIXLGS 분석</h3><p>{children}</p></aside>}
export default function ReleaseArticle(){return <div className={styles.root}>
  <header className={styles.top}><div className={styles.topInner}><Link href="/" className={styles.brand}>FIXLGS POE2</Link><nav className={styles.nav}><Link href="/news">새소식</Link><Link href="/filter">FILTER</Link><Link href="/pob">POB</Link></nav></div></header>
  <main className={styles.container}>
  <nav aria-label="현재 위치" className={styles.breadcrumb}><Link href="/">홈</Link> / <Link href="/news">새소식</Link> / 001</nav>
  <article className={styles.article}>
    <p className={styles.kicker}>PATH OF EXILE 2 · 새소식 001</p>
    <h1 className={styles.h1}>{title}</h1>
    <div className={styles.meta}><time dateTime="2026-11-14">조사·작성일: 2026.11.14</time><span>FIXLGS 콘텐츠</span><span>공식 발표 및 개발자 발표 기준</span></div>
    <OfficialArtwork className={styles.hero} loading="eager" src="https://prcdn.freetls.fastly.net/release_image/188965/3/188965-3-cc747a5763161383fc42404b06738c7d-1430x804.png" alt="Grinding Gear Games의 POE2 1.0 정식 출시 홍보 이미지, 검을 든 듀얼리스트와 12월 11일 발표 문구" width={1430} height={804} />
    <p className={styles.heroCaption}>이미지: © Grinding Gear Games. <a href="https://prtimes.jp/main/html/rd/p/000000003.000188965.html" target="_blank" rel="noopener noreferrer">GGG 공식 보도자료(2026.08.26)</a>. 1.0 출시 홍보 이미지로, 실제 신규 리그 플레이 화면은 아닙니다.</p>
    <p className={styles.lead}>패스 오브 엑자일 2가 1.0 정식 출시를 앞뒀다. 이번 업데이트는 새로운 리그 하나를 추가하는 수준이 아니다. 캠페인 완결, 신규 직업 2종, 병력과 성채를 다루는 콘텐츠에 더해 아이템 제작·패시브·스킬 환경까지 바뀐다. <strong>어떤 내용이 공식 발표됐고, 무엇은 출시 후 검증해야 할까?</strong></p>
    <p>이번 글은 2026년 11월 14일까지 공개된 GGG의 정식 출시 발표와 엑자일콘 자료를 중심으로 작성했다. 국내 해설 영상의 Q&amp;A 정리도 추가 확인할 주제로 활용했지만, 해설자의 예측을 공식 확정 정보처럼 옮기지 않았다.</p>
    <p className={styles.quickAnswer}><strong>먼저 확인할 핵심:</strong> 한국시간 2026년 12월 12일 정식 출시 예정 · 무료 플레이 전환 · 신규 리그 ‘레이클라스트의 정복자들’ · 신규 직업 섀도우/듀얼리스트 · 캠페인 5~6장 추가. 정확한 서버 개시 시각과 최종 밸런스 수치는 추가 공지를 확인해야 한다.</p>

    <h2>1. 1.0 정식 출시 일정과 주요 변경점</h2>
    <p>개발사 그라인딩 기어 게임즈(GGG)가 안내한 정식 출시일은 <strong>미국 태평양시간 2026년 12월 11일</strong>이다. 한국어 공식 공지에는 <strong>한국시간 12월 12일</strong>로 안내돼 있다. 정확한 서버 개시 시각은 최신 운영 공지를 다시 확인해야 한다.</p>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">구분</th><th scope="col">1.0 발표 내용</th><th scope="col">확인할 점</th></tr></thead><tbody>
      <tr><td>정식 출시</td><td>12월 11일 PST / 12월 12일 한국시간</td><td>정확한 개시 시각 추후 공지</td></tr>
      <tr><td>서비스</td><td>무료 플레이 전환</td><td>기존 얼리 액세스 이용자도 참여 가능</td></tr>
      <tr><td>캠페인</td><td>5·6장 추가, 전체 6장 완성</td><td>신규 지역 24곳 · 보스 18종</td></tr>
      <tr><td>신규 직업</td><td>섀도우 / 듀얼리스트</td><td>신규 무기·스킬 활용 방식</td></tr>
      <tr><td>신규 리그</td><td>레이클라스트의 정복자들</td><td>병력·성채·진영·사령관</td></tr>
      <tr><td>아이템</td><td>신규 고유 40종 이상 / 기존 고유 70종 이상 개편</td><td>최종 옵션과 수치</td></tr>
    </tbody></table></div>
    <p>여기서 가장 중요한 것은 <strong>출시 날짜와 실제 시작 시각이 다른 정보</strong>라는 점이다. 한국어 공식 공지는 날짜를 안내하고 있지만, 패치 적용과 대기열 개방 같은 세부 시간은 별도로 확인해야 한다. POE1의 리그 일정과 POE2의 정식 출시일도 혼동하지 말자.</p>

    <h2>2. 신규 리그 ‘레이클라스트의 정복자들’은 무엇이 다른가?</h2>
    <p>이번 리그에서 플레이어는 바렉(Varek)과 용병들과 함께 병력을 모으고 적의 거점을 공격한다. 단순히 몬스터를 처치하는 것에서 나아가 <strong>병력을 모집하고, 전투에 배치하고, 거점을 공략하는 흐름</strong>이 생긴다.</p>
    <p>공식 발표에는 캠페인에서 70곳 이상의 관심 지점을 발견할 수 있다는 내용이 포함됐다. 이 지점은 병력 확보와 임무 수행에 연결되며, 엔드게임으로 넘어가면 자신이 소속될 진영과 성채 운영이 중요한 역할을 한다.</p>
    <Figure src="https://prcdn.freetls.fastly.net/release_image/188965/4/188965-4-d2a6d445110574776428a30a5701e825-1698x1564.png" alt="GGG 2026년 11월 7일 POE2 1.0 신규 리그 발표 공식 홍보 자료" caption="© Grinding Gear Games · 2026.11.07 공식 보도자료. 공식 홍보 이미지이며 본문에 설명한 모든 기능의 실제 플레이 장면을 뜻하지는 않습니다." />
    <p>엔드게임에서는 에조마이트, 마라케스, 카루이 계열의 세 진영 가운데 하나를 선택하고 성채를 성장시키는 구조가 소개됐다. 또한 진영에 속한 다른 이용자들과 함께 거점 쟁탈에 참여할 수 있다. 다만 공개된 성채 쟁탈은 <strong>이용자끼리 직접 싸우는 PvP</strong>와 같은 개념으로 단정해서는 안 된다.</p>
    <Analysis>리그 콘텐츠가 새로운 파밍 선택지로 자리 잡으려면 병력 유지 비용과 성채 보상이 중요하다. 게임 안에서 획득하는 재화의 가치와 실제 시간당 보상은 출시 후 거래와 플레이 데이터가 있어야 비교할 수 있다.</Analysis>

    <h2>3. 사령관에게 아틀라스 공략을 맡긴다면?</h2>
    <p>GGG는 병력과 경로석을 사령관에게 맡겨 지도 공략을 수행하는 실시간 엔드게임 시스템을 소개했다. 성채가 성장하면 최대 3명의 사령관을 운용할 수 있다는 설명도 공개됐다. 사령관은 직접 전투와 별도로 지도를 공략하고 보상을 가져오는 방식이다.</p>
    <p>이 점은 기존의 직접 지도 공략과 구분된다. 예를 들어 같은 경로석을 사용하더라도 사령관에게 맡겼을 때의 소요 시간, 병력 소모, 회수 가능한 아이템과 골드 처리 방식이 중요해진다. <strong>맡기기만 하면 자동으로 이득</strong>이라는 결론은 아직 이르다.</p>
    <p>게임을 종료한 상태에서 어디까지 진행되는지처럼 공개 자료만으로 확정하기 어려운 조건도 있다. 현재는 사령관이 새로운 선택지를 제공한다는 점까지만 확실하게 이해하는 것이 좋다.</p>

    <h2>4. 섀도우와 듀얼리스트, 두 직업의 차이는?</h2>
    <p>새로 추가되는 섀도우(Shadow)는 단검·함정과 은신(Stealth)을 활용하는 직업이다. 반면 듀얼리스트(Duelist)는 검과 태세(Stance)를 핵심으로 삼는 근접 전투 계열이다. 둘 모두 단순한 무기 교체가 아니라 전투 방식 자체가 다르게 설계됐다.</p>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">비교</th><th scope="col">섀도우</th><th scope="col">듀얼리스트</th></tr></thead><tbody>
      <tr><td>주요 무기</td><td>단검·함정 계열</td><td>검 계열</td></tr>
      <tr><td>대표 메커니즘</td><td>은신과 접근·연계</td><td>태세 전환과 근접 기술</td></tr>
      <tr><td>관찰 지점</td><td>은신 유지·상태 이상 연계</td><td>태세 활용과 공격 흐름</td></tr>
      <tr><td>출시 전 한계</td><td>스킬·보조 젬 최종 수치 미확인</td><td>실제 공방 균형 미확인</td></tr>
    </tbody></table></div>
    <Figure src="https://prcdn.freetls.fastly.net/release_image/188965/4/188965-4-e7f7d776eeed80cfbf45b57f6281afc0-2048x1232.png" alt="GGG가 공개한 POE2 1.0 신규 직업 섀도우 공식 홍보 원화" caption="© Grinding Gear Games · 2026.11.07 공식 보도자료의 섀도우 관련 홍보 이미지. 실제 전투 화면은 아닙니다." />
    <p>이번 Q&amp;A 해설에는 섀도우의 괴사 중독과 듀얼리스트의 출혈 관련 설명도 등장한다. 그러나 '중독 빌드가 무조건 강해진다', '듀얼리스트가 최상위 직업이 된다' 같은 표현은 아직 근거가 부족하다. 세부 스킬 수치가 나온 뒤 직접 조합해 확인해야 할 문제다.</p>

    <h2>5. 신규 제작 화폐와 고유 아이템 개편</h2>
    <p>성채를 점령하면 새로운 제작 재료를 얻을 수 있다는 것이 공식 발표의 핵심 중 하나다. 발표 영상에서는 기존 장비의 원하지 않는 속성을 다루는 새로운 재련 방식이 시연됐다. 이미 좋은 옵션을 가진 장비의 일부 속성을 바꾸는 선택지가 생길 수 있다는 의미다.</p>
    
    <p>여기서 <strong>제작 가능</strong>과 <strong>수익성 보장</strong>은 완전히 다른 이야기다. 새 화폐가 어떤 아이템 레벨과 장비 종류에 적용되는지, 결과가 무작위인지, 어떤 옵션이 고정되는지 알아야 정확한 제작 비용을 계산할 수 있다.</p>
    <p>고유 아이템도 새로운 40종 이상이 추가되고 기존 70종 이상이 개편될 예정이다. 기존 유명 고유 아이템을 기준으로 초기 빌드를 짜는 사람이라면 이전 수치를 그대로 믿기보다 최종 패치노트를 확인하는 것이 안전하다.</p>
    <Analysis>FIXLGS가 우선 관찰할 분야는 신규 제작 재료뿐 아니라 미완성 장비의 거래 가격이다. 좋은 옵션을 가진 중간 단계 장비에 대한 수요가 늘 가능성은 있지만, 실제 가격 상승은 리그가 시작된 뒤 검증해야 한다.</Analysis>

    <h2>6. 스킬·패시브 변화가 장비 선택에 미치는 영향</h2>
    <p>공식 발표에서 확인되는 주요 개편은 보조 젬의 광범위한 조정과 패시브 트리의 구조 변화다. 특히 <strong>주얼 소켓이 패시브 군집 내부로 이동</strong>해 주얼만을 위해 멀리 이동하던 경로 선택이 달라질 수 있다.</p>
    <p>해설 영상에서는 치명타 확률의 획득 방식과 여러 상태 이상 개편, 머서너리 재장전 및 워리어의 공격 동작 변경을 중요하게 다뤘다. 이 가운데 머서너리 재장전 방식 변경과 여러 전직 개편은 GGG의 공식 발표에서도 확인된다. 반면 상세 치명타 수치나 지속 피해의 최종 효율은 패치노트와 실제 빌드 데이터를 별도로 대조해야 한다.</p>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">변경 영역</th><th scope="col">확인된 방향</th><th scope="col">사용자가 할 일</th></tr></thead><tbody>
      <tr><td>패시브 트리</td><td>군집 내부 주얼 소켓과 신규 능력치</td><td>이전 경로 그대로 사용하지 않기</td></tr>
      <tr><td>보조 젬</td><td>대규모 밸런스 조정</td><td>주력 스킬의 실제 연결 검토</td></tr>
      <tr><td>머서너리</td><td>재장전 시스템 개편</td><td>여러 탄약·기술 연계 시험</td></tr>
      <tr><td>아이템</td><td>신규 고유와 기존 고유 개편</td><td>최종 옵션 확인 후 구매 결정</td></tr>
      <tr><td>상태 이상·치명타</td><td>개발자 해설에서 주요 조정 언급</td><td>수치 확정 전 빌드 강약 단정 금지</td></tr>
    </tbody></table></div>
    <p>패시브 개편만으로도 기존 스킬 트리 공유 링크나 오래된 PoB 데이터가 실제 게임과 일치하지 않을 수 있다. 특히 아이템 필터는 신규 베이스와 화폐를 인식해야 하고, PoB는 스킬·패시브 데이터를 정확히 반영해야 한다. **새 버전이 나오기 전까지 기존 도구가 1.0을 완전히 지원한다고 말할 수는 없다. 현재 제공 중인 도구는 <Link href="/filter">FIX FILTER</Link>와 <Link href="/pob">FIX POB</Link>에서 확인할 수 있다.**</p>

    <h2>7. 사망 요약과 플레이 편의 변화는 어떻게 볼까?</h2>
    <p>개발자 Q&amp;A를 정리한 국내 영상에서는 사망 직전 받은 피해를 보여주는 사망 요약 기능도 소개됐다. 이 내용이 구현된다면 '왜 죽었는지 모르겠다'는 초보자의 문제를 줄이는 데 실질적인 도움이 될 수 있다.</p>
    <p>다만 어떤 기간의 피해를 기록하는지, 지속 피해 원인을 얼마나 자세히 분류하는지 등은 최종 게임 화면과 설명을 확인해야 한다. 영상에 등장한 숫자만으로 확정 동작을 단정하지 않았다.</p>

    <h2>8. 1.0 출시 전, 이 네 가지만 확인하자</h2>
    
    <ol>
      <li><strong>선택한 직업의 최종 스킬·보조 젬:</strong> 영상에서 강해 보이는 기술과 실제 1.0 수치는 다를 수 있다.</li>
      <li><strong>패시브·주얼 경로:</strong> 예전 빌드에서 사용하던 동선을 그대로 복사하지 않는다.</li>
      <li><strong>장비와 제작 재료:</strong> 거래소에서 실제 구매할 수 있는 가격과 제작 조건을 비교한다.</li>
      <li><strong>FILTER·PoB 호환:</strong> 새 리그 아이템과 스킬을 지원하는지 확인하고, 지원 전에는 계산값을 확정값처럼 해석하지 않는다.</li>
    </ol>
    <p>새 리그 초반에는 가격 데이터가 충분히 쌓이지 않는다. 특히 희귀 아이템 한두 개의 높은 호가만 보고 그 아이템의 시장 가치를 판단하지 말자. 거래 가능한 물량, 옵션 차이, 제작 재료 가격을 함께 봐야 한다.</p>

    <h2>9. 확인된 것과 아직 모르는 것을 구분해야 한다</h2>
    
    <p>지금 명확한 것은 1.0 출시 일정, 신규 직업, 여섯 장의 캠페인, 성채와 병력을 활용하는 리그, 고유 아이템 및 패시브 개편이다. 반면 <strong>최고 효율 파밍법, 특정 장비의 가격 상승, 압도적인 1티어 빌드</strong>는 아직 확정할 수 없다.</p>
    <p>이번 업데이트는 신규 콘텐츠의 양만큼 기존 시스템도 크게 달라진다는 점에서 관심을 끈다. 따라서 1.0에서 가장 먼저 해야 할 일은 유행하는 빌드를 복사하는 것이 아니라 <strong>변경된 규칙을 확인하고 실제 게임 결과와 대조하는 것</strong>이다.</p>
    <Analysis>POE2 1.0은 장비의 가치와 파밍 선택지가 재편될 수 있는 시점이다. FIXLGS는 출시 후 아이템과 제작 재료의 실제 가격, 필터 지원 상태, PoB 계산 호환을 각각 검증해 후속 기사로 다룰 계획이다. 이는 아직 수행한 조사가 아니라 향후 분석 방향이다.</Analysis>

    <section className={styles.source} aria-label="출처 및 자료 한계"><h2>자료 출처 및 조사 범위</h2><ul>
      <li>공식: <a target="_blank" rel="noopener noreferrer" href="https://steamcommunity.com/app/2694490/allnews/?l=koreana">GGG의 한국어 Steam 공식 발표(2026.11.06)</a> — 출시, 직업, 리그, 캠페인, 고유 아이템, 패시브</li>
      <li>공식: <a target="_blank" rel="noopener noreferrer" href="https://store.steampowered.com/sale/exilecon26">ExileCon 2026 공식 발표 페이지</a> — 성채·사령관·리그 시스템</li>
      <li>공식: <a target="_blank" rel="noopener noreferrer" href="https://pathofexile2.com/register">POE2 정식 출시 안내</a> — 무료 플레이 전환</li>
      <li>이미지: <a target="_blank" rel="noopener noreferrer" href="https://prtimes.jp/main/html/rd/p/000000003.000188965.html">GGG 1.0 출시 공식 보도자료(2026.08.26)</a>, <a target="_blank" rel="noopener noreferrer" href="https://prtimes.jp/main/html/rd/p/000000004.000188965.html">GGG 1.0 신규 리그·직업 보도자료(2026.11.07)</a>. 이미지 권리자 © Grinding Gear Games.</li>
      <li>보조 취재: 사용자가 제공한 국내 해설 영상의 발화 대본. 상세 수치 중 공식 문서로 개별 대조하지 못한 내용은 확정하지 않음</li>
    </ul><p>기준일: 2026년 11월 14일. 기사 이미지는 GGG가 배포한 공식 보도자료 이미지이며, 자체 제작 AI 콘셉트 그림이나 가상의 게임 장면을 사용하지 않았습니다. 서버 개시 시각, 최종 패치 수치, 제작 성공률 및 파밍 수익은 미검증 사항입니다.</p></section>
  </article>
  <Link href="/news" className={styles.back}>← 새소식 전체보기</Link>
  </main><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g,'\\u003c')}} />
 </div>}
