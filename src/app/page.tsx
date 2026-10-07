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
  { label: "FILTER", href: "/filter", meta: "NEXT" },
  { label: "TRADE", href: "#", meta: "PLANNED" },
  { label: "CRAFT", href: "#", meta: "PLANNED" },
];

export const revalidate = 60 * 60 * 24 * 30;

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
            <span>TRADE</span>
            <span>CRAFT</span>
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

        <footer className="poe-v11-footer">
          <Link href="/" className="poe-v11-footer-brand">FIXLGS · FIX POE2</Link>
          <nav aria-label="푸터 메뉴">
            <Link href="/pob">POB</Link>
            <Link href="/filter">FILTER</Link>
            <a href="#official-video">YOUTUBE</a>
          </nav>
          <p>Unofficial fan-made tools. Not affiliated with or endorsed by Grinding Gear Games.</p>
        </footer>
      </div>

      <section className="poe-mobile-guide" aria-label="PC 이용 안내">
        <strong>FIX POE2</strong>
        <h1>PC에서 이용해 주세요.</h1>
        <p>PoB와 필터 편집 기능은 데스크톱 화면에 맞춰 제작되고 있습니다.</p>
      </section>
    </main>
  );
}
