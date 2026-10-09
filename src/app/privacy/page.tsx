import type { Metadata } from "next";
import Link from "next/link";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 | FIXLGS POE2 Item Export",
  description:
    "FIXLGS POE2 Item Export 크롬 확장프로그램의 데이터 처리와 사용 목적, 개인정보 보호 안내입니다.",
  robots: { index: true, follow: true },
};

const supportEmail = "lgshappyhappy@gmail.com";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>FIXLGS <span>POE2</span></Link>
          <nav className={styles.nav} aria-label="사이트 메뉴">
            <Link href="/pob">PoB</Link>
            <Link href="/filter">FILTER</Link>
            <Link href="/">홈</Link>
          </nav>
        </header>

        <article className={styles.article}>
          <div className={styles.kicker}>CHROME EXTENSION · PRIVACY</div>
          <h1>개인정보처리방침</h1>
          <p className={styles.lead}>FIXLGS POE2 Item Export</p>
          <p className={styles.date}>시행일: 2026년 10월 10일 · 운영자: 주식회사 엘지에스(LGS Co., Ltd.)</p>

          <div className={styles.summary}>
            <strong>핵심 안내</strong>
            <p>거래소 아이템 정보를 영문 텍스트로 복사하기 위해서만 처리합니다. FIXLGS 서버에 아이템 데이터나 계정 정보를 업로드하거나 저장하지 않습니다.</p>
          </div>

          <section className={styles.section}>
            <h2>1. 처리하는 정보와 목적</h2>
            <p>확장프로그램은 Path of Exile 2 공식 거래소 페이지에서 검색 결과와 아이템 정보, 매물 식별자를 읽어 사용자가 선택한 아이템을 영문 EXPORT 형식으로 변환합니다. 공식 거래소 응답에는 판매자 계정 등 부가 정보가 포함될 수 있으나, 이를 별도로 수집하거나 프로필을 구축하는 목적으로 사용하지 않습니다.</p>
            <p>매물의 영어 원문을 가져오기 위해 해당 매물 ID와 검색 ID를 <strong>공식 Path of Exile 서버</strong>에 요청합니다. 요청 시 브라우저의 기존 공식 사이트 로그인 상태가 사용될 수 있으나, 확장프로그램은 비밀번호나 인증 쿠키의 값을 읽거나 별도 서버에 전송하지 않습니다.</p>
          </section>

          <section className={styles.section}>
            <h2>2. 저장과 외부 전송</h2>
            <p>아이템·매물 정보는 작동 중인 거래소 탭의 브라우저 메모리에서 임시 처리하며 FIXLGS가 운영하는 서버에 저장하지 않습니다. 사용자가 EXPORT를 누르면 변환된 텍스트가 사용자의 클립보드에 복사됩니다. 클립보드 내용은 사용자 기기 및 브라우저의 관리 대상입니다.</p>
            <p>영문 원문 조회 외에 정보를 광고업체, 데이터 판매업체 또는 FIXLGS 외부 분석 서버로 전송하지 않습니다. 공식 거래소 서버에서의 데이터 처리는 해당 서비스의 정책을 따릅니다.</p>
          </section>

          <section className={styles.section}>
            <h2>3. 접근 권한</h2>
            <p>확장프로그램은 공식 PoE2 거래소 페이지에서만 동작하도록 설정되어 있으며, <code>clipboardWrite</code> 권한은 EXPORT 텍스트 복사에 사용합니다. 공식 영문 아이템 조회를 위해 <code>www.pathofexile.com</code> 접속 권한을 사용합니다. 다른 일반 웹사이트의 방문 기록을 수집하는 기능은 제공하지 않습니다.</p>
          </section>

          <section className={styles.section}>
            <h2>4. 보유·삭제와 사용자 선택</h2>
            <p>확장프로그램은 자체 서버 보관 기록을 생성하지 않습니다. 거래소 탭을 닫거나 새로고침하면 해당 탭의 임시 데이터가 초기화됩니다. 복사된 텍스트는 클립보드에서 다른 내용을 복사하여 바꿀 수 있으며, 확장프로그램을 제거하면 접근이 중단됩니다.</p>
          </section>

          <section className={styles.section}>
            <h2>5. FIXLGS 웹사이트와의 구분</h2>
            <p>확장프로그램 자체에는 별도 방문 분석 도구를 탑재하지 않았습니다. 반면 POE 사이트 웹페이지에는 서비스 이용 현황 파악을 위한 <strong>Google Analytics</strong>가 적용되어 있어 쿠키·기기 및 방문 관련 정보가 Google에 처리될 수 있습니다. 이는 확장프로그램의 거래소 아이템 처리와 별개입니다. 자세한 사항은 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a>을 참조해 주세요.</p>
          </section>

          <section className={styles.section}>
            <h2>6. Chrome 웹 스토어 제한적 사용 정책</h2>
            <p>확장프로그램이 접근하는 정보는 명시된 아이템 EXPORT 기능 제공에만 사용합니다. 이를 개인 맞춤 광고, 재판매, 신용 평가 또는 무관한 목적으로 사용하지 않습니다. Chrome 웹 스토어 사용자 데이터 정책의 <strong>제한적 사용(Limited Use)</strong> 요건을 준수합니다.</p>
          </section>

          <section className={styles.section}>
            <h2>7. 문의와 변경</h2>
            <p>운영자: 주식회사 엘지에스 (LGS Co., Ltd.)</p>
            <p>문의: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
            <p>데이터 처리 방식이 변경되면 이 페이지의 내용과 시행일을 갱신합니다.</p>
          </section>

          <div className={styles.english} lang="en">
            <div className={styles.kicker}>ENGLISH SUMMARY</div>
            <h2>Privacy Policy — FIXLGS POE2 Item Export</h2>
            <p>Effective October 10, 2026. Operated by LGS Co., Ltd.</p>
            <p><strong>Purpose and data:</strong> The extension accesses Path of Exile 2 trade listings and item details on official trade pages to convert a selected listing to English item text. Listing responses may contain additional seller/account metadata, which is not used for profiling.</p>
            <p><strong>Sharing:</strong> The extension sends the listing and search identifiers to the official Path of Exile server to obtain the English listing. The browser&apos;s existing official-site session may be used. It does not read passwords or send authentication cookies to FIXLGS. No listing data is uploaded to FIXLGS servers or sold to third parties.</p>
            <p><strong>Storage and permissions:</strong> Trade data is held temporarily in the browser tab&apos;s memory and reset when the page is unloaded. Exported text is copied to the user&apos;s clipboard. The <code>clipboardWrite</code> permission enables copying, and official-site access is used for item lookup. Unrelated browsing activity is not collected.</p>
            <p><strong>Website analytics:</strong> The POE website separately uses Google Analytics, which may process visit, device and cookie information under <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>. The extension itself does not use analytics.</p>
            <p><strong>Limited Use:</strong> Extension data is used only to provide the disclosed export feature, not for advertising, resale, or unrelated purposes. Its use complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.</p>
            <p><strong>Contact:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. This policy will be updated if data practices change.</p>
          </div>
        </article>

        <footer className={styles.footer}>
          <span>© FIXLGS · FIX POE2</span>
          <Link href="/">홈으로 돌아가기</Link>
        </footer>
      </div>
    </main>
  );
}
