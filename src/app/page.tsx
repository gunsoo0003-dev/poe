import Link from "next/link";
import LatestVideoGallery from "./LatestVideoGallery";
import RevealSection from "./RevealSection";
import FireText from "./FireText";
import HeroAtmosphere from "./HeroAtmosphere";
import { getLatestOfficialVideos } from "@/lib/youtube";

const HERO_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/rnd/202405/2622/9456486248ee0da8213ff2a8a4fdd64ba6869eade81c1e35.jpg";
const POE2_LOGO =
  "https://pathofexile2.com/protected/image/poe2/layout/navbar/logo-2x.webp?key=kJebCnboYx6R4wt88ISxhQ";

const toolLinks = [
  { label: "POB", href: "/pob", meta: "AVAILABLE" },
  { label: "FILTER", href: "/filter", meta: "AVAILABLE" },
];

export const revalidate = 2592000;

export default async function PoeHome() {
  const latestVideos = await getLatestOfficialVideos(4);

  return (
    <main className="poe-v9-home poe-v26-home">
      <svg className="poe-v48-filter-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="poe-v48-fire-warp" x="-35%" y="-90%" width="170%" height="260%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.055" numOctaves="2" seed="17" result="noise">
              <animate attributeName="baseFrequency" dur="3.2s" values="0.012 0.055;0.018 0.085;0.010 0.050;0.012 0.055" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="13" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="poe-v9-desktop">
        <header className="poe-v11-top-nav poe-v26-top-nav poe-v34-fixed-nav">
          <Link className="poe-v11-site-name" href="/" aria-label="FIX POE2 홈">
            FIX POE2
          </Link>
          <nav className="poe-v11-nav-links" aria-label="POE2 서비스 메뉴">
            <Link href="/pob">POB</Link>
            <Link href="/filter">FILTER</Link>
            <Link href="/guides">GUIDES</Link>
            <a href="#official-video">YOUTUBE</a>
          </nav>
        </header>

        <section id="official-video" className="poe-v26-video-section poe-v41-video-section" aria-label="최신 공식 영상">
          <LatestVideoGallery videos={latestVideos} />
        </section>

        <div id="tools" className="poe-v41-tools-wrap">
          <RevealSection>
            <aside className="poe-v10-ad-rail poe-v10-ad-left poe-v31-tools-ad" aria-label="좌측 광고 영역">
              <div className="poe-v10-ad-placeholder">
                <small>ADSENSE</small>
                <strong>LEFT AD</strong>
              </div>
            </aside>

            <aside className="poe-v10-ad-rail poe-v10-ad-right poe-v31-tools-ad" aria-label="우측 광고 영역">
              <div className="poe-v10-ad-placeholder">
                <small>ADSENSE</small>
                <strong>RIGHT AD</strong>
              </div>
            </aside>

            <div className="poe-v44-knight-motion" aria-hidden="true">
              <img className="poe-v9-bg poe-v9-knight-bg poe-v44-knight-image" src={HERO_IMAGE} alt="" />
            </div>
            <img className="poe-v9-bg poe-v21-knight-echo" src={HERO_IMAGE} alt="" aria-hidden="true" />
            <div className="poe-v44-atmosphere" aria-hidden="true" />
            <div className="poe-v55-cinematic-light" aria-hidden="true" />
            <HeroAtmosphere />
            <div className="poe-v9-overlay poe-v9-knight-overlay" aria-hidden="true" />
            <div className="poe-v21-pulse" aria-hidden="true" />
            <div className="poe-v21-scan" aria-hidden="true" />
            <div className="poe-v21-impact-line" aria-hidden="true" />
            <div className="poe-v22-impact-spread" aria-hidden="true" />

            <div className="poe-v9-tools-panel poe-v26-tools-panel poe-v41-tools-panel">
              <div className="poe-v44-panel-logo">
                <img className="poe-v9-logo" src={POE2_LOGO} alt="Path of Exile 2" />
              </div>
              <span className="poe-v9-kicker">UNOFFICIAL FAN-MADE TOOL SUITE</span>
              <div className="poe-v9-links" aria-label="주요 도구">
                {toolLinks.map((item) =>
                  item.href.startsWith("/") ? (
                    <Link className="poe-v9-tool-link" href={item.href} key={item.label}>
                      <strong className="poe-v53-fire-strong"><FireText label={item.label} /></strong>
                      <span>{item.meta}</span>
                      <i aria-hidden="true">↗</i>
                    </Link>
                  ) : (
                    <div className="poe-v9-tool-link is-disabled" key={item.label}>
                      <strong>{item.label}</strong>
                      <span>{item.meta}</span>
                      <i aria-hidden="true">—</i>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="poe-v9-section-foot">
              <span>PATH OF EXILE 2 TOOLS</span>
              <span>BY FIXLGS</span>
            </div>
          </RevealSection>
        </div>

        <section className="poe-content-overview" aria-label="서비스 이용 안내">
          <h2>Path of Exile 2 필터와 캐릭터 비교 가이드</h2>
          <p>FIX POE2는 NeverSink 기반 아이템 필터를 원하는 규칙만 바꾸어 다운로드할 수 있는 필터 커스터마이저와, poe.ninja Builds 캐릭터를 불러와 장비 교체 전후의 수치 변화를 살펴보는 PoB2 비교 도구를 제공합니다. 두 도구는 PC 브라우저 사용을 권장합니다.</p>
          <p>필터가 게임에 적용되지 않을 때는 저장 경로와 사운드 폴더를 확인하고, PoB 캐릭터가 불러와지지 않을 때는 ninja의 Builds 등록 상태와 선택한 시즌을 먼저 확인해 주세요. 계산 결과는 빌드 데이터와 엔진이 지원하는 조건에 따라 달라질 수 있습니다.</p>
          <div><Link href="/guides">전체 가이드 보기 →</Link><Link href="/about">서비스 소개</Link><Link href="/contact">오류 제보</Link></div>
        </section>

        <footer className="poe-v11-footer">
          <Link href="/" className="poe-v11-footer-brand">FIXLGS · FIX POE2</Link>
          <nav aria-label="푸터 메뉴">
            <Link href="/pob">POB</Link>
            <Link href="/filter">FILTER</Link>
            <Link href="/guides">GUIDES</Link>
            <Link href="/about">ABOUT</Link>
            <Link href="/privacy/site">개인정보처리방침</Link>
            <Link href="/contact">CONTACT</Link>
            <a href="#official-video">YOUTUBE</a>
          </nav>
          <p>Unofficial fan-made tools. Not affiliated with or endorsed by Grinding Gear Games.</p>
        </footer>
      </div>

      <section className="poe-mobile-guide" aria-label="PC 이용 안내">
        <strong>FIX POE2</strong>
        <h1>PC에서 이용해 주세요.</h1>
        <p>PoB와 필터 편집 기능은 데스크톱 화면에 맞춰 제작되고 있습니다. 모바일에서는 사용 가이드와 서비스 안내를 이용할 수 있습니다.</p>
        <nav className="poe-mobile-resource-links" aria-label="모바일 안내 링크"><Link href="/guides">사용 가이드</Link><Link href="/about">서비스 소개</Link><Link href="/privacy/site">개인정보처리방침</Link><Link href="/contact">문의</Link></nav>
      </section>
    </main>
  );
}
