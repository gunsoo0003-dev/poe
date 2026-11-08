# FIXLGS POE2 프로젝트 인수인계

## 1. 프로젝트 목적과 현재 유효한 설계 원칙
- **사용자 확정**: `poe2.fixlgs.com`에서 Path of Exile 2 아이템 필터와 PoB 도구를 통합 운영한다. 구주소 `poe.fixlgs.com`은 폐기하고 301 리디렉션은 만들지 않는다(미색인 여부는 Search Console에서 별도 확인 필요). 일상 관리 0, 유지비 0을 우선하며, 본체 `fixlgs.com`과 독립된 서브도메인 구조를 유지한다.
- **사용자 확정**: 캐릭터 장비·스킬·주스킬·원본 표시는 `poe.ninja` 원본을 따른다. DPS/STATS 및 장비 교체 변화 계산은 공식 Path of Building(PoB2)의 계산 결과를 따른다. FIXLGS가 임의 DPS·STATS를 만들어 보정하거나 PoB 계산 공식을 대체하지 않는다.
- **사용자 확정**: 기존 POE2 아이템 필터 기능과 NeverSink 원본 기준을 임의로 변경하지 않는다. 브라우저 로컬 프리셋·필터 다운로드·사운드 등의 기존 동작 보존.
- **2026-10-14 확정 작업 범위**: 등록 완료된 `FIXLGS POE2 Item Export` 확장프로그램의 Chrome 웹스토어 설치 링크를 PoB 사이트에 넣고 방문자용 사용 가이드를 웹스토어 설치 기준으로 변경한다. 기존 계산·확장프로그램 코드는 변경하지 않는다.

## 2. 보호 대상 및 기준
- `src/app/pob/pobCompare.ts`, `src/app/pob/web-engine/`, `src/app/pob/nativeIntegrity.ts`: PoB 계산과 계산 증거·안전 장치.
- `src/app/pob/ninjaImport.ts`, `src/app/api/pob/`: poe.ninja Import와 관련 데이터 접근·표시.
- `src/app/pob/ringSlots.ts`: 반지 1/2 슬롯을 혼동하지 않도록 정확히 매핑하는 규칙.
- `src/app/filter/`, `public/neversink/`, `public/sounds/`: 기존 필터 기능, NeverSink 0.10.4 0~6 베이스, 효과음 자산.
- `extension/fixlgs-poe2-item-export/`: V0.4.6 확장프로그램 코드·manifest. Chrome 웹스토어에 공개된 등록본을 별도 소스 수정 없이 사용.
- `public/data/pob-lua.json`, `public/wasm/lua.wasm`: 기존 PoB Lua 데이터·WASM 런타임.

## 3. 현재 구현·배포 상태 (2026-11-08 · 운영 V235 / 최신 V258 로컬, 빌드 재검증 대기)
### V258 · 로컬 Next 16 빌드 타입 오류 시정 · robots/sitemap 미제공 (2026-11-08 · 미배포)
- **사용자 최신 확정:** 애드센스 관련 현재 운영 선택에 따라 POE2 서브도메인의 사용자 정의 `robots.txt`·`sitemap.xml`을 만들지 않는다. 과거 V235의 생성/검사 방침은 폐기된 기준이다. 이는 검색 차단 `noindex` 요청이 아니며, 애드센스 결과와의 직접 인과관계는 미확인.
- **사용자 로그로 확인:** Windows D:\WebProjects\fix-pob, Next 16.4.5/OpenNext 1.20.16에서 컴파일은 통과했지만 `src/app/pob/page.tsx`의 비허용 이름 내보내기 `buildMainSkillUi` 때문에 TS2344 타입 단계 실패. `lua.mjs`의 URL 분석과 `headless.ts`의 자식 프로세스 트레이싱은 별도 경고이며 실제 Cloudflare 번들 결과는 미확인. `UND_ERR_HEADERS_OVERFLOW`는 다른 네트워크 요청 실패로 아직 원인 미확인.
- **수정:** `buildMainSkillUi` 함수 본체/호출/계산은 그대로 두고 `export`만 제거. V229 회귀 테스트에서만 임시 export를 주입해 원래 알고리즘을 검사한다. `src/app/robots.ts`, `src/app/sitemap.ts` 제거, V235 테스트의 과거 기대값을 최신 정책으로 교체, V258 검사 추가. FILTER/POB 엔진·WASM·NeverSink·V019 디자인·Cloudflare 설정·이전 HISTORY 원문 불변.
- **실제 검증:** 13개 Next 페이지의 추가 named export가 0개인지 TS AST로 검사, V229 원본 스킬·그룹 검사, V228 After Change, V226 반지 슬롯, V225 비교 가드, 필터 회귀 및 V232/233/234/236/257 검사 성공. **로컬 npm 의존성 미설치이므로 V258 전체 Next/OpenNext 빌드·실브라우저·Worker 배포는 미실행.** 사용자 PC에서 `npm install --package-lock-only`로 갱신했던 잠금 파일은 업로드받지 못해 ZIP은 V257 잠금 파일을 보존; 덮어쓴 뒤 재갱신 필요. 기존 폴더에 압축 덮어쓰기 시 삭제한 두 파일은 자동 삭제되지 않으므로 명시 제거 필요.




### V257 · V019 홈페이지 디자인 + V256 FILTER·POB 기능 통합 (2026-11-08 · 미배포)
- **사용자 확정:** V019의 전체 디자인(폰트·배경·8개 섹션·3개 영상 카드·모바일·버튼 외형)은 보호하고, V256 실제 FILTER·POB 기능 소스·계산 데이터·NeverSink·확장프로그램·가이드를 그대로 이용하는 홈페이지 통합. 실제 배포는 승인 전 실시하지 않는다. 프로젝트 ZIP 내부 최상위 폴더는 **기존 V256 `fix-pob/` 유지**(Git/Cloudflare 설정·경로 보호), V019 원본 명칭 `FIXLGS_POE2_HOME`은 디자인 참고본 이름으로 남긴다.
- **현재 구현 확인:** Next.js `/` 홈만 V019 마크업/범위 한정 CSS·클라이언트 상호작용으로 대체했다. 실제 `/filter`, `/pob`, `/filter/guide`, `/guides/pob/getting-started`, `/terms`, `/privacy/site`, `/contact`에 링크를 연결했다. 3번 아이템 뉴스 카드 2개+하단 4개와 전체보기는 **아직 발행 글이 없으므로 더미 앵커 유지**; 실서비스 게시글로 오인하지 말 것.
- **기존 영상 기능 계승:** `getLatestOfficialVideos(3)`를 서버에서 호출하며 V256의 30일 캐시(`revalidate:2592000`) 및 공식 채널 파싱·폴백을 유지한다. 7번은 V019의 3열/16:9/음소거 1→2→3 플레이어 및 `onError` 안내를 재사용한다. **서버 측 수집이 곧 실시간 최신성 보장은 아니고, Cloudflare ISR 동작·실영상 재생/오류 153은 실제 배포 후 미검증**이다. GitHub 예약 갱신용 V019 워크플로는 `docs/design-reference/V019/.github/`에 참고자료로만 보존하며 정식 프로젝트 루트에 활성화하지 않았다.
- **소스 보존/격리:** 원 V256 `src/app/filter/`, `src/app/pob/`, `src/lib/`, `public/neversink/`, `public/sounds/`, PoB WASM/Lua, API, 독립 가이드와 Cloudflare 설정은 변경하지 않았다. `src/app/page.tsx`(새 홈), `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `src/app/V019Interactions.tsx`, `public/poe-home/{script.js,assets/*}`, `scripts/test-v257-home-integration.cjs`가 신규/교체 대상이다. V019 완전한 원본 17개 파일과 원문 HANDOVER/HISTORY는 `docs/design-reference/V019/`로, 교체 전 V256 홈페이지 TSX 원본은 `docs/design-reference/V256_HOME_PAGE_SOURCE.tsx.txt`에 바이트 보존한다. 홈 CSS는 `.poe-v019-root` 범위로 제한하여 다른 도구 페이지에 적용하지 않는다.
- **검증:** 원본과 실제 V256 globals CSS를 포함한 Chromium `set_content` 렌더 320/390/780/781/1024/1440/1920px에서 가로 넘침·JS 예외 없음, 8개 아이템 탭·POB 2개 탭·모바일 메뉴 클릭 통과. V257 계약 검사 10개 그룹 PASS. V256 필터/PoB·Native WASM/룬/반지·Cloudflare 관련 테스트 17개 성공(세부 목록은 아래 신규 이력). 기존 V247 테스트는 **V256의 `poe-v238-home` 구형 DOM을 전제로 해 의도적으로 바뀐 메인에서 실패**, 새 홈 반응형 브라우저 검사로 보완.
- **미검증/배포 보류:** 기존 V256 `package.json` Next 16.4.5와 `package-lock.json` Next 16.3.5 등 잠금파일 불일치가 그대로 남음. 오프라인 `npm ci`는 `ENOTCACHED`, npm Registry 온라인 접근은 `EAI_AGAIN`으로 실패; 따라서 실제 Next 실앱·전체 TypeScript 타입검사·OpenNext/Cloudflare 빌드·라이브 PoB UI/필터 다운로드·YouTube iframe·사용자 PC 확인은 수행 못함. 런타임 정확성은 **정적 테스트만으로 보장하지 않는다**. 출시 전 lockfile 재생성→npm ci→빌드→브라우저 실앱 회귀→Cloudflare 시험 배포가 필수다. 6번 아이템 이미지의 외부 GitHub 의존성과 3번 뉴스 더미도 아직 해결되지 않았다.

### V256 · 한글 사용법 제목·다크 문서 미리보기 (2026-11-08 · 미배포)
- **사용자 확정**: 메인 `GUIDES`는 `MARKET` 앞. 두 영역 큰 제목은 정확히 **`필터 사용법` / `POB 사용법`**. 각 2개 가이드만 유지: FILTER `POE2 필터 적용 방법` → `NeverSink 필터 엄격도 선택`; PoB `PoB 캐릭터 불러오기` → `PoB DPS 계산 기준`. 번호·작은 영문 GUIDE·중복 도구 실행 버튼 없음.
- **현 코드**: V255에서 V254의 두꺼운 그룹 박스를 제거하고, 가이드 링크 4개를 문서 본문 미리보기가 상시 보이는 클릭형 카드로 변경, 호버·키보드 포커스 때 카드/시트를 강조. V256에서 `src/app/page.tsx` 제목만 한글화하고, `src/app/globals.css`의 밝은 베이지 종이시트를 필터에는 따뜻한 흑갈색, PoB에는 차가운 남청색 반투명 다크패널로 변경. 모바일에서도 미리보기 상시 노출; 기존 실제 원문 앵커·링크, 공식 원화, FireText, 필터/PoB 데이터·로직·네버싱크 자산 보호. 미사용 V254 그룹 스타일 제거. 별도 서버/API·추가 이미지 없음.
- **실제 검증**: TypeScript TSX 파싱, PostCSS 파싱, 기존 V251/V253/V254 검사 최신 구조로 동기화, V256 새 검사 및 히어로·불꽃·모바일/필터 회귀 PASS. Chromium 실제 CSS/이미지와 **유사 DOM 기반 정적 모의** 1728/1000/768/390/320px: 카드 4개, 두 한글 제목, 색상·호버 transform(-3px), 섹션 순서, 가로 넘침 없음. **미검증** Next 전체 빌드(`node_modules` 없음), 실제 앱·실기기, Cloudflare 배포. 구 V236 `package-lock.json` 불일치 유지.
- **재발 방지**: 과거 V254의 큰 그룹 박스/도구 CTA나 V255의 밝은 베이지 시트를 복원하지 않는다. 디자인 변경 후 실제 배경을 적용한 화면으로 PC/모바일 명도·가로 넘침을 확인한다. 실제 호버 CSS 검사와 Next 실앱 호버 검증은 구분한다.

### V253 · GUIDES 선배치 + 초보자 3단계 경로 (2026-11-08 · 미배포)
- **사용자 확정**: 실전 가이드가 단순 장식처럼 보이고 첫 방문자가 이용 순서를 알기 어렵다는 문제를 해결한다. `GUIDES → MARKET → MEDIA`로 섹션 순서를 변경하되 FILTER 2개·PoB 2개 기존 검색 주제와 각 실제 본문 앵커를 보호한다.
- **변경 전후**: GUIDES 4개 단독 카드 → `처음 이용하시나요?` 아래 FILTER/PoB 2개 그룹별 3단계 안내. FILTER: NeverSink 엄격도 선택(기존 글) → 필터 설정(기존 `/filter`) → 게임 적용(기존 글). PoB: poe.ninja 링크 불러오기(기존 글) → 거래소 장비 비교(기존 `/pob`) → DPS 계산 기준(기존 글). 여섯 단계 모두 전체 행이 실제 링크이며, ‘가이드 읽기’와 ‘도구 실행’을 구분한다. 기존 `/guides` 전체 가이드 목록, 안내 본문, 도구/시세/공식 영상/불꽃·원본 데이터는 유지한다.
- **영향**: `src/app/page.tsx`, `src/app/globals.css`의 V251 안내 카드 규칙을 V253 그룹형 규칙으로 직접 교체, 새 `scripts/test-v253-guides-onboarding.cjs`. V240/V251/V252의 현재 구현과 충돌하는 과거 레이아웃 단정만 회귀 검사에서 갱신한다. V238(옛 히어로→MARKET)·V248(옛 3열 로고) 검사는 폐기된 배치 기준이라 현행 화면 회귀로 간주하지 않는다.
- **실제 검증/한계**: 4개 딥링크/앵커와 2개 도구 링크·GUIDES 우선 DOM 순서 검사, 변경 TSX·CSS 파싱, 홈페이지/불꽃/모바일/필터 회귀. Chromium 실제 CSS+간이 HTML 정적 렌더 PC 1728/1000, 태블릿 768, 모바일 390/320px에서 2열/1열 배치와 문서 가로 넘침 없음 확인. Next.js 실제 빌드·FireText Canvas/실기기·영상 재생·Cloudflare 배포는 미검증(`node_modules` 없음, 기존 lockfile 이슈). 정적 시안을 실앱 결과로 오인하지 않는다.

### V252 · 메인 중복 바로가기 제거 및 차별화 문구 교체 (2026-11-08 · 미배포)
- **사용자 재확인/수정 사유**: V251에서는 하단 GUIDES에 네 주제를 통합했지만, 이전에 제거하기로 확정한 메인 히어로의 `아이템 시세/가이드/공식 영상` 3개 중복 바로가기와 한 줄 소개 문구를 그대로 두는 누락이 발생했다. 사용자가 실제 화면으로 지적했고, 이를 이번 버전에서 시정한다. 신규 가이드를 메인에 중복 배치하지 않는다.
- **변경 전후**: 히어로 `poe-v250-intro` 및 `heroLinks` 3개 링크 렌더링을 **삭제** → FILTER·POB 카드 아래 2열의 얇은 편집형 차별화 안내로 **교체**. FILTER: `POE2 필터 적용, 복잡한 과정 없이`(규칙 파일을 직접 편집하지 않고 항목 설정). PoB: `POE2 거래소 아이템, 구매 전에 비교`(poe.ninja 링크를 통해 캐릭터를 불러와 장비 교체 전후 DPS/능력치 비교). 설명은 실제 제공 기능 범위에 한정하며, 필터 원클릭 자동 설치를 주장하지 않는다. 추가 아이콘·링크·중복 가이드 카드나 검색어 나열은 만들지 않았다.
- **영향/보호**: `src/app/page.tsx`의 메인 히어로 텍스트/바로가기만 변경하고, `src/app/globals.css`에서 제거된 V250 스타일을 정리한 뒤 V252 전용 간결한 PC 2열/모바일 1열 서체·선 스타일을 추가. 기존 공식 POE2 로고+FIX 브랜드, 전체 FILTER/POB 클릭 및 FireText 불꽃, 메인 배경·기능 데이터, `#market/#guides/#official-video`, V251 가이드 4개 본문 딥링크, 하단/상단 내비게이션은 보존. 새 검사 `scripts/test-v252-hero-clarity.cjs`.
- **검증 기준/한계**: V252 구문·중복 제거/기능 연결 테스트, V251·V250·V249·V244·V243·V242·V241·V240·V237·V247·필터 회귀와 CSS 파서 확인. Chromium 실제 CSS/이미지+간이 DOM 기반 **정적 모의 렌더**로 PC 1728/1000, 태블릿 768, 모바일 390에서 새 영역 표시 및 문서 가로 넘침 확인. 실제 Next.js 전체 빌드, FireText Canvas 움직임, 영상 재생, 실기기 터치, Cloudflare 배포는 미검증. 과거 `scripts/test-v238-home-redesign.cjs`는 V251 원본에서도 이미 현대 홈 레이아웃과 불일치해 실패하므로 레거시로 기록하며 회귀 통과로 표기하지 않는다.
- **재발 방지**: 사용자가 합의한 '삭제 대상'은 신규 요소 구현과 별개로 DOM 존재 여부를 검사한다. 홈 변경 시 기존 3개 중복 바로가기·반복 소개문이 다시 나오지 않는지, 실제 GUIDES/시세/영상 접근은 유지되는지 함께 검증한다.

### V251 · 검색 의도 가이드 4개를 기존 GUIDES에 통합 (2026-11-08 · 미배포)
- **사용자 확정**: 기존 FILTER·POB 박스와 중복되는 SEO 설명 영역을 새로 만들지 않고, 조사한 4개 주제(`POE2 필터 적용 방법`, `NeverSink 필터 엄격도 선택`, `PoB 캐릭터 불러오기`, `PoB DPS 계산 기준`)를 기존 하단 `GUIDES`에 통합한다. 현재 메인 로고·도구·MARKET·MEDIA·기존 가이드 링크 및 내용 보호.
- **코드 확인 및 변경**: 기존 `/filter/guide`에 필터 설치·게임에서 선택하는 방법과 엄격도 선택 설명이 이미 있고, `/guides/pob/getting-started`, `/guides/pob/dps`에도 캐릭터 링크·DPS 계산 설명이 이미 존재했다. 별도 4개 중복 페이지 대신 해당 기존 글의 문단을 보강하고 직접 앵커(`#filter-install`, `#neversink-strictness`, `#character-import`, `#dps-criteria`)로 연결한다. 메인 GUIDES의 막연한 2개 대형 카드만 4개 주제형 링크로 교체하고, PC 4열·태블릿/모바일 2열(320px 1열)로 구성. `/guides`의 기존 전체 가이드 목록·필터 오류 해결 및 그 밖의 PoB 가이드는 유지하고, 핵심 2개 가이드 라벨만 구체화. `PoB` 공통 가이드 컴포넌트는 선택적 `section.id`만 허용한다.
- **실제 검증**: 4개 메인 링크와 실제 본문 앵커·라우트/슬러그 일치, 변경된 TSX/TS의 TypeScript 구문 오류 0, CSS 파서 오류 0, V249/V250 및 V232/V244 등 기존 홈페이지·불꽃·모바일·확장 회귀와 `scripts/filter-regression.cjs` 통과. Chromium **정적 모의 렌더링** 1728/1000/768/390/320px에서 4개 항목 표시, 문서 가로 넘침 0 확인. 동적 Next 실제 화면·휴대폰 터치·Cloudflare 배포 및 SEO 노출 증가는 미검증; `package-lock.json` 정합성은 변경하지 않음.
- **보호와 재발 방지**: SEO 키워드만을 위한 빈 문서/중복 카드/가짜 기능을 만들지 않는다. 가이드 제목을 바꾸거나 앵커를 수정하면 반드시 홈 진입 링크와 원문 해당 섹션의 존재를 함께 검사한다. 필터 실제 적용은 브라우저 폴더 권한·파일 저장과 게임 내 필터 선택을 구분한다.

### V250 · 홈 통합 디자인 시스템 적용 (2026-11-08 · 미배포)
- **사용자 확정 방향**: V249의 공식 POE2 이미지 + FIX POE2 브랜드 결합을 유지하면서, 타이포그래피·아이콘·패널·이미지·콘텐츠 영역을 하나의 다크 판타지 시네마틱 편집 디자인으로 통일한다. FILTER·POB 동일 비중, 기존 실제 FireText 불꽃 필수, 메인 불타는 성·불씨 유지. 흔한 깔때기/막대그래프, 미완성 사각 프레임, 평범한 CTA 표현을 개선하되 클릭 가능성을 높인다. 모바일은 개방 유지.
- **코드 변경**: `src/app/page.tsx`의 홈 도구 Card에 기능별 고유 SVG(전리품 보석/스킬 노드), 영문 초소형 정보 라벨, 한글 클릭 문구를 추가하고 기존 Next Link 및 FireText 그대로 재사용. 기존 공식 자산 `official-adura-caravan.webp`, `official-lightning-gameplay.webp`를 크롭한 `v250-filter-art.webp`, `v250-pob-art.webp`를 새 카드 배경으로 추가(실제 아이템 사진이라고 주장하지 않음). `src/app/globals.css`의 홈 전용 `poe-v250-home` 범위에서 타이포그래피·브랜드 비율·고급 패널 실루엣·기능별 재질·반응형·MARKET/GUIDES/MEDIA 공통 헤더/카드/푸터 디자인 통일. 타 콘텐츠 문구, 필터/PoB 엔진, 데이터, 영상 갤러리 컴포넌트, 경로 변경 없음. 외부 폰트/CDN/유료 API 추가 없음.
- **실제 검증**: PC 1728/1000, 태블릿 768, 모바일 390px에서 실제 CSS/이미지+유사 DOM을 Chromium 정적 렌더하여 동일 크기 도구, 이미지 표시, 문서 가로 넘침 없음 확인. 모바일 첫 확인에서 FIX 로고의 오래된 `flex-basis:380px` 규칙이 공간을 과도하게 만드는 문제를 발견하고 모바일 명시 초기화 후 재검증. 실제 Next.js+FireText Canvas 상호작용/영상 재생/모바일 터치 및 Cloudflare 배포는 미검증. V236 lockfile 정합성 이슈 유지. 이전 V249/V244/V242/필터 등 계약 검사 재실행, 신규 V250 검사 추가.
- **재발 방지**: 정적 모의 화면은 실제 앱 화면이 아니므로 동적 효과 검증으로 표시하지 않는다. JSX 속성 구문 검사(V244), 불꽃 컴포넌트 연결(V242), 공식 로고 존재(V243), 모바일 390px 빈 영역 및 overflow를 차후 변경에도 확인한다. V249의 로고 결합과 CTA 문구는 유지하며 시각 표현만 개선.

### V249 · 공식 게임 로고 + FIX POE2 브랜드 결합 / 도구 행동 유도 (2026-11-08 · 미배포)
- **사용자 확정**: 공식 POE2 로고와 FIX POE2 자체 표기를 **같은 브랜드 영역에 가로로 묶고**, 그 아래 FILTER·POB를 동일 중요도로 나란히 둔다. 모바일에서는 로고 2개와 도구 2개를 세로로 배치한다. 게임 공식 로고 원본·불타는 성 배경·FILTER/POB 원본 Canvas FireText 불꽃 유지. 무거운 금속 장식 추가 금지.
- **현재 구현**: 별도 FIX 로고 이미지가 소스에 없으므로 기존 상단 `FIX POE2` 문자열을 기반으로 타이포그래픽 워드마크를 제작했다(새 공식 로고 이미지라고 주장하지 않는다). 브랜드 영역에 `FAN-MADE TOOLS BY FIXLGS`/`UNOFFICIAL TOOL PLATFORM`을 표시해 제작 주체와 공식 게임을 구분한다. 도구 카드 전체 링크는 유지하면서 각각 `필터 만들기`/`빌드 분석하기` 행동 문구를 추가했다. 변경 파일: `src/app/page.tsx`, `src/app/globals.css`, `scripts/test-v249-dual-brand-cta.cjs`, 레거시 `scripts/test-v243-official-hero-logo.cjs`의 복수 클래스 허용, 인수인계/색인. 다른 메인 콘텐츠·필터/PoB 데이터·라우팅은 불변.
- **검증 및 한계**: V249, V244 JSX 파서, V243 로고, V242 불꽃, V247 모바일, V241/V240/V237 회귀 및 CSS 파싱 통과. Chromium 정적 DOM+실제 CSS/이미지 모의 렌더에서 1728/1000/768/390px 가로 넘침 없음, 두 카드 동일 크기, 모바일 로고·도구 세로 배치 확인. 실제 Next.js 앱·Canvas 애니메이션 동작·실기기 터치·전체 빌드/배포 미검증. V236 package-lock 불일치 잔존. V248 기존 3열 배치 검사는 현 레이아웃과 충돌하므로 신규 V249 계약으로 대체하며 원본 테스트는 보존한다.

### V248 · FILTER | POE2 로고 | POB 가로 배치 및 불타는 성 배경 (2026-11-08 · 미배포)
- **사용자 확정**: PC 첫 화면에서는 FILTER·공식 POE2 로고·POB를 나란히 놓는다. FILTER·POB의 실제 FireText 불타는 글자 연출은 그대로 유지한다. 사용자가 공유한 불타는 성 이미지의 분위기를 배경에 적용한다. 모바일은 동일한 3열을 강제하지 않고 로고 → FILTER → POB로 쌓는다.
- **자산 처리**: 사용자가 공유한 작은 이미지에는 로고가 이미 포함되어 있으므로 그대로 배경으로 쓰면 로고 중복·품질 저하가 생긴다. 신규 생성 이미지에도 버튼과 문구가 박혀 있어 실제 배경으로 채택하지 않았다. 대신 프로젝트 내 기존 `public/images/poe2/cinematic-hero.webp`(로고·문구 없는 불타는 성 원화)의 색상과 콘트라스트를 보정한 `public/images/poe2/burning-castle-hero-v248.webp`를 추가했다. 따라서 **사용자가 올린 참고 이미지와 동일한 성 그림은 아니며**, 불타는 성 구도와 분위기를 재사용한 대체 배경이다. V241 공식 마을 배경 및 기존 모든 이미지는 삭제하지 않았다.
- **소스 변경**: `src/app/page.tsx`의 기존 FILTER·POB Link 카드를 `HomeToolCard`로 추출해 마크업/SVG/FireText/링크를 그대로 재사용하고 가운데 h1 공식 로고를 놓는 3열 래퍼로 변경했다. `src/app/globals.css`는 V248 범위에서만 새 배경, 데스크톱 3열·모바일 세로·카드 축소·중앙 로고 크기/명암을 정의했다. V245 불씨·화염 밝기, V246 버튼 스타일, 필터·PoB 기능/데이터·MARKET/GUIDES/MEDIA는 보존했다.
- **실제 검사**: V248 신규 계약, V244 JSX 파싱, V242 FireText 연결, V247 모바일 접근, V243 로고, V241 공식 아트, V240 히어로, V237 메인 순서, 필터 회귀를 실행해 통과했다. CSS/이미지/간이 DOM을 Chromium `set_content`로 렌더링한 **정적 모의 화면**에서 PC 1728px의 FILTER와 POB 카드가 각각 약 472.5×175px로 동일하며 550px 공식 로고가 가운데 표시됨을 확인. 모바일 390px에서 로고 → FILTER → POB 순서, 페이지 가로 넘침 없음 확인. 이 화면은 FireText 실제 Canvas 렌더링·Next 실제 앱 실행과 동일하지 않다.
- **미실행 및 재발 방지**: Next.js 전체 빌드, 실제 휴대폰 터치, FireText 동적 영상, 배포는 미검증. 기존 V236 `package-lock.json` 불일치 유지. 배경을 다시 제작하더라도 웹 UI 텍스트/버튼이 그려진 생성 이미지를 그대로 CSS 배경에 사용하지 말고, 실제 로고와 클릭 가능한 도구 카드 및 원본 FireText를 별도 요소로 유지한다.

### V247 · 모바일 전체 진입 허용 및 FILTER 차단 화면 제거 (2026-11-08 · 미배포)
- **사용자 확정**: 메인에 MARKET, GUIDES, 공식 영상 등 콘텐츠가 존재하므로 모바일을 전체 차단하지 않는다. 메인·시세·가이드·영상은 모바일에서 일반 접근하고, FILTER와 PoB도 접속을 막지 않으며 도구의 PC 권장과 실제 모바일 동작 보장은 구분한다.
- **코드 확인**: 메인은 V238 이후 작은 화면에서 이미 보이도록 CSS 재정의되어 있었으며, MARKET·GUIDES·MEDIA도 반응형 코드가 존재했다. PoB `src/app/pob/page.tsx`에는 모바일 차단 분기가 없었다. 실제 차단은 `src/app/filter/page.tsx`의 `filter-v2-mobile` 전용 PC 권장 화면과 `globals.css` 980px 이하 `.filter-v2-shell{display:none}`이었다.
- **수정**: FILTER의 기존 PC 전용 차단 화면을 제거하고 모바일 사용 안내·가이드/오류해결/메인 링크를 노출했다. 기존 `FilterCustomizer` 컴포넌트를 `.filter-v247-scroll` 영역에 그대로 넣어 980px 이하에서 기존 3열 PC 편집기를 **가로 스크롤**로 접근하도록 했다. PC에서는 래퍼를 `display:contents`로 처리해 기본 레이아웃을 보존했다. 원본 데이터·필터 편집/저장·다운로드·사운드·PoB 계산 코드·기존 영상과 호버 연출 불변. 소요비용 없음.
- **실제 검증**: Chromium에 해당 CSS와 모바일 구조의 **정적 모의 DOM**을 넣어 390px 및 768px 너비에서 편집기 `display:grid`, 모바일 안내 노출, 편집기 내부 스크롤 폭 1180px, 문서 전체 폭 390px/768px 일치를 확인했다. `scripts/test-v247-mobile-open.cjs`, V244 JSX, V237/V238/V240/V241/V242/V243 메인 계약, 필터 회귀 통과.
- **미실행/제약**: 실제 Next.js 전체 빌드 및 실기기 터치, FILTER 개별 편집·파일저장, PoB 모바일 계산, 모바일 공식 영상 재생은 검증하지 못했다. **FILTER 편집기는 모바일용 재설계가 아닌 PC 3열 레이아웃의 가로 스크롤 접근**이며 조작성은 제한적이다. 중간 폭 981~1300px에서 기존 PC 그리드가 문서 가로폭을 넘어갈 수 있는 별도 레거시 문제가 관찰됐지만 범위 밖이라 변경하지 않았다. V236 package-lock 미동기화 문제는 여전히 존재한다. 클라우드 배포 미수행.
- **재발 방지**: 사이트 차단과 도구 조작 난도를 혼동하지 않는다. 이후 모바일 개선 시 NeverSink/PoB 엔진·편집 데이터를 변경하지 말고 실제 좁은 화면의 가로 폭·터치 입력·다운로드를 별도로 검증한다. 관련 과거 원문 `V137_SAVE_PERSISTENCE_INSTALL_COMMIT_AUDIT.txt`의 저장/설치 순서를 유지한다.

### V246 · 메인 FILTER·POB 절제된 재질감 및 배경 조명 미세 보정 (2026-11-06 · 미배포)
- **사용자 확정**: 과한 금속 조각·두꺼운 프레임·강한 발광으로 촌스럽게 만들지 않는다. FILTER는 앤티크 골드/흑갈색, POB는 은청색/네이비. 두 도구는 동일 크기·동일 강조 비중 유지. 공식 원화와 V242 원본 FireText 불꽃, V245 불씨·국소 화염 효과 보호.
- **코드 확인/수정**: 기존 `src/app/globals.css`의 V240/V241 홈 전용 프레임 스타일을 직접 수정했다. 실제 테두리 2px → 1px, 하단 발광 불투명도 .7 → .19, 얇은 내부 라인·미묘한 사선 반사·음영·상호작용 재질 보강. 배경 로고 주변 비네팅의 중앙 명암 범위만 미세 조정하며 원본 이미지는 변경하지 않는다. 홈 한정 호버/포커스 규칙 외 다른 기능·컴포넌트 코드는 불변.
- **검증**: Chromium 정적 CSS/이미지 모의 화면에서 PC 1728px의 버튼이 각각 663×195px 동일, 실제 CSS 계산 테두리 두 개 모두 1px, 가로 넘침 없음 확인. 모바일 390px 가로 넘침 없음. V245 원본과 수정본 PC/모바일 비교 캡처 생성. V244 JSX/V243 로고/V242 FireText/V241 공식 배경/V240 시네마틱/V237 메인·필터 및 V233~V236 관련 회귀 통과, `tinycss2` CSS 최상위 파싱 오류 0. **모의 DOM 검증**이며 실제 Next.js 전체 빌드, FireText Canvas 시각 결과, Cloudflare 배포 및 실제 모바일 터치는 미검증.
- **교훈/재발 방지**: V238~V240의 시안/실제 괴리를 반복하지 않도록 CSS 실사용 계산값과 렌더링을 함께 확인한다. 사용자가 이전에 지적한 JSX 구문 오류 재발을 막도록 V244 파싱 테스트를 유지한다. 새 금속 이미지나 장식을 추가하지 말고 기존 스타일 원천 직접 수정 우선.

### V244 · 메인 공식 로고 JSX 구문 오류 긴급 수정 (2026-11-06 · 로컬 소스, 미배포)
- **실제 사용자 오류**: `src/app/page.tsx:69`에서 `Expected '</', got 'numeric literal'`; 로고 Next `<Image>`의 `width=1577` / `height=1343`을 JSX 숫자 속성으로 잘못 작성하여 홈 페이지가 500 오류로 실행 불가. 이전 V243의 정적 계약 검사가 이미지 존재·문자열 포함만 검증하고 TSX 구문을 검사하지 않은 것이 누락 원인이다.
- **최소 수정**: 두 줄만 `width={1577}` / `height={1343}`으로 고쳐 React JSX 규칙 충족. 원본 로고 이미지·크기·불꽃·FILTER/POB·미디어·시세·Cloudflare 구성은 변경하지 않음.
- **실제 검사**: `scripts/test-v244-jsx-syntax.cjs`에서 TypeScript 파서를 사용해 `page.tsx`의 구문 오류 0건 확인. V243/V242/V241/V240/V237, 필터 회귀, V235 도메인 및 V236 Cloudflare 계약 검사 통과. 기존 V243 검사에서는 이 오류를 놓쳤으므로 이후 TSX 수정 시 반드시 문법 파서를 포함할 것.
- **미검증·별개 이슈**: 현재 환경에 프로젝트 `node_modules`가 없어 Next 개발 서버 전체 빌드와 실제 사용자의 Windows 환경 `Watchpack EINVAL` 재현은 미실시. 로그의 `D:\System Volume Information` 접근 경고는 JSX 구문 오류와 별개의 파일 감시 문제이며, 이번 패치로 해결했다고 주장하지 않음. 배포 미수행. 기존 V236 `package-lock.json` 정합성 이슈는 그대로 유지.

### V243 · 메인 중앙 POE2 공식 로고 교체 (로컬 소스, 미배포)
- **사용자 확정**: 메인 중앙의 텍스트 `FIX POE2`를 직접 제공한 POE2 오리지널 로고로 교체한다. 작고 옹졸해 보이지 않도록 PC 기준 로고 실제 표시 너비 약 600px로 시작하며, 상단 FIX POE2 사이트 이름은 유지한다. FILTER/POB 동등 비중·기존 불꽃 효과와 내부 도구를 보호한다.
- **실제 수정**: 업로드 `PoE2_TransparentLARGE.png`에서 투명 배경을 확인(RGBA, 2048×1427, 좌상단 알파 0). 로고 주변 투명 여백을 잘라 WebP RGBA로 저장한 `public/images/poe2/poe2-official-logo.webp`(1577×1343)를 추가했다. 소스 `src/app/page.tsx`의 중앙 h1에 Next Image로 실제 이미지를 삽입하며 시각적 제목과 별도로 스크린리더용 h1 텍스트를 남겼다. CSS는 해당 히어로에만 적용해 PC 600px, 모바일 최대 420px 및 화면 폭에 따른 축소, 위아래 여백을 조정했다. 상단 브랜딩·FILTER/POB FireText·공식 원화·시세/가이드/영상 데이터/도메인은 그대로 보존했다.
- **검증**: 신규 `scripts/test-v243-official-hero-logo.cjs`, V242·V241·V240·V237 및 필터 회귀 검사 실행. Chromium `set_content`에 CSS/이미지를 인라인 주입하는 **모의 렌더링**에서 PC 1728×960 기준 이미지 표시 폭 600px, 모바일 390×844 기준 358px, 문서 가로 넘침 0 확인. 모의 화면은 실제 Next.js/Canvas 렌더링·클릭/영상 재생을 검증하지 않는다.
- **미검증**: `node_modules` 미설치 및 V236의 `package-lock.json` 불일치 때문에 Next.js 전체 빌드 미실시. Cloudflare 배포, 실제 FireText 애니메이션/영상 재생·실서비스 브라우저 테스트 미실시. 기존 로고 원본 출처는 사용자 제공 자료이며 사용조건 추가 확인 필요.



### V242 · 메인 FILTER·POB 원본 불꽃 글자 효과 복구 (로컬 소스, 미배포)
- **사용자 확정**: V241 공식 배경과 동일 크기의 FILTER·POB 프레임은 유지하고, 과거 메인에서 사용하던 글자 위의 불타오르는 연출을 복원한다. 새로 만든 CSS 가짜 불꽃으로 대체하지 않는다.
- **코드 확인/변경**: 프로젝트에 실제 존재하던 `src/app/FireText.tsx` Canvas 불꽃·입자 엔진을 `src/app/page.tsx` 양쪽 도구 제목에 연결했다. 기존 기본 주황/마우스 올림 파랑 동작을 확장하여 FILTER는 기본 금빛, POB는 기본 푸른빛, 호버 시 상대 색상으로 변화한다. 본문 텍스트·영상·시세·내부 도구·데이터·이미지 등은 보존. `src/app/globals.css`에는 홈 한정 텍스트·캔버스 배치/색상만 추가했다. 모션 감소 설정에서는 캔버스 애니메이션을 구동하지 않는다.
- **실제 검증**: `node scripts/test-v242-restore-firetext.cjs`, V241 공식 이미지, V240 히어로, V237 순서, `scripts/filter-regression.cjs` 통과. 실제 브라우저에서 움직이는 입자의 모습, Next.js/Cloudflare 전체 빌드와 배포, 모바일 성능은 미검증. 기존 package-lock 불일치 문제 미해결.
- **재발 방지**: 새로운 연출을 제작하기 전에 남아 있는 `FireText.tsx`와 V053~V054 CSS 원본부터 확인한다. 후속 작업에서 일반 텍스트/비애니메이션으로 치환하지 말고, Canvas 동작과 사용자 모션 감소 설정을 함께 점검한다.

### V241 · 공식 프레스킷 이미지 실물 적용 (로컬 소스, 미배포)
- **사용자 확정**: V238~V240에서 생성형 배경과 시안 간의 괴리가 반복되자, POE2 공식 홍보용 이미지를 직접 제공하고 메인/섹션 배경에 사용하는 방향으로 변경. 공식 홍보 이미지 재사용 조건은 사이트 공개 시 별도 확인해야 하며, 출처와 사용 허락은 별개다.
- **이번 구현**: 사용자가 제공한 `PoE2Wallpaper_BurningVillage.jpg`(2048×1152)를 메인, `PoE2Wallpaper_AduraCaravan.png`(2048×1167)를 MARKET, `PoE2_CinematicSCreenshot_Gameplay.png`(2048×1152)를 GUIDES, `PoE2_CinematicScreenshot_Prisoner.png`(2048×1152)를 OFFICIAL MEDIA 배경으로 사용. 원본 수정 없이 WebP 품질 88로 최적화해 `public/images/poe2/official-*.webp`에 추가. 외부 네트워크/API 또는 신규 서버 의존성 없음. `src/app/page.tsx`에 홈페이지 전용 `poe-v241-home` 클래스만 추가하고 기존 V240 금속 FILTER·POB 카드, 링크, 시장 준비 중 표시, 가이드, 공식 영상 4개 컴포넌트는 그대로 유지한다. 이전 생성 배경은 삭제하지 않고 신규 화면에서만 사용하지 않는다.
- **실제 검증**: `scripts/test-v241-official-artwork.cjs` 및 V240/V238/V237/V235/V234/V236/V232, `scripts/filter-regression.cjs` 검사 통과. Chromium에 정적 HTML/CSS/이미지를 인라인 주입하는 **모의 렌더링**으로 PC 1728×960/모바일 390×844 전체 페이지를 캡처했으며, 문서 가로폭은 각각 1728/390으로 가로 스크롤이 없었다. 이는 Next.js 앱 실제 렌더링이 아니며 버튼 클릭/영상 재생/백엔드 호출 검증이 아니다.
- **미실행 및 위험**: V236의 패키지 잠금파일 불일치로 npm ci·전체 Next/OpenNext 빌드 미실행, Cloudflare 실배포와 실제 모바일 터치, 유튜브 실제 재생, SEO/광고 확인 미검증. 시안 1:1 일치 보장 불가. 이미지가 실사용 권한까지 확인되었다고 주장하지 말 것. 배포 전 권리자 제공 이용 조건 검토 필요.

### V240 · 메인 전면 시네마틱 실이미지 구현 (로컬 소스, 미배포)
- **사용자 확정**: 페이지 전체를 웅장한 판타지 분위기로, FILTER와 POB는 동등한 크기와 강조도를 유지. 원거리 성채의 불길·불씨·고급 장식형 버튼을 살리고 MARKET/GUIDES/공식 영상까지 세로 풀영역으로 연결한다. 시세는 실데이터가 들어오는 콘텐츠이며 도구와 구별한다.
- **이번 구현**: 이미지 생성 시안에서 인물·성채·달빛 등 순수 풍경 영역만 추출하고, 이미지에 이미 그려져 있는 텍스트/버튼은 포함하지 않은 새 배경 `public/images/poe2/cinematic-hero.webp` 및 하단 영상용 `cinematic-media.webp`를 실제 로컬 자산으로 생성했다. 히어로에 해당 파일을 직접 연결했고 CSS 실루엣·가짜 달 레이어는 새 버전 화면에서 숨겼다. FILTER/POB는 실제 Next Link로 유지하며 동일 크기의 금속 프레임/글로우 카드 및 직접 그린 SVG 아이콘을 사용한다. MARKET/GUIDES/영상 섹션의 배경과 폭을 넓히고 영상 4개 원본 소스·재생 컴포넌트는 유지했다.
- **검증의 정확한 범위**: 설치가 없는 환경에서 기존 `src/app/globals.css`와 HTML 구조를 추출한 **정적 모의 화면**을 브라우저 메모리에 삽입해 PC 1728×960 및 모바일 390×844 스크린샷 생성. PC에서 도구 카드 2개, 각각 동일한 크기, 성채·달빛 이미지와 섹션 배치 노출 확인. 모바일에서 가로 오버플로 없음(390=390). 이는 Next 실제 렌더링/인터랙션이 아니므로 라이브 화면 검증과 혼동하지 않는다. Chromium의 `file:` 및 localhost 직접 접속이 `ERR_BLOCKED_BY_ADMINISTRATOR`로 거부되어 `page.set_content` + 인라인 CSS/이미지 방식으로 대체했다. 영상 썸네일과 실제 링크 동작은 모의 화면에서 검증하지 않았다.
- **원본 보호/미해결**: 필터·PoB 계산·NeverSink·WASM·사운드·Cloudflare·도메인 설정은 변경하지 않았다. `package-lock.json`의 V236 버전 불일치로 npm ci/전체 빌드 미검증. 실제 브라우저 영상 재생/모바일 실데이터/Cloudflare 배포 미검증. 배경은 생성 시안의 일부 풍경을 합성한 것이며 시안 1:1 픽셀 일치를 주장하지 않는다.

### V238 메인 전면 디자인 개편 (소스만, 배포 미반영)
- **사용자 확정**: 시네마틱 세로 스크롤 구조, FILTER와 POB를 *동일한 크기·시각적 비중*으로 첫 화면 중앙에서 강조한다. 디자인은 다크 판타지 데이터 플랫폼이며 멀리 타오르는 빛과 드문 불씨만 절제해 사용한다. 시세는 도구가 아니라 별도의 콘텐츠 영역; 공식 영상 4개는 하단 미디어로 유지.
- **코드 확인**: 홈 `src/app/page.tsx`와 홈 한정 `src/app/globals.css` 스타일만 개편. 기존 `public/images/poe2/video-sky-bg.jpg`를 신규 배경으로 재사용하고, CSS 글로우·8개 불씨 애니메이션 및 `prefers-reduced-motion`을 추가. FILTER/POB 동일 그리드 크기, 서로 다른 금색/블루 톤. 메인 하단의 MARKET(실제 시세 미연동 명시) → GUIDES(기존 안내 문구·링크 보존) → 공식 영상 4개 → 푸터 구조. 가상의 시세값/신규 시세 API는 없음. 모바일에서도 메인 콘텐츠는 세로로 표시되지만 FILTER/POB *도구 내부*의 기존 PC 권장 여부는 별개.
- **보호·제약**: 필터·PoB 내부 소스/원본 데이터, 유튜브 갤러리 클라이언트 로직, 사이트/Worker 설정, 공식 도메인은 변경하지 않음. V236 `package-lock.json` 불일치가 남아 있어 npm ci/전체 빌드는 검증 불가. 브라우저 실제 디자인·영상 재생·운영 배포 미검증. 새 배경 이미지는 과거 번들에 있던 현지 파일이며 새 에셋/유료 서비스 추가 없음.

### V237 메인 디자인 배치 수정 (소스만, 배포 미반영)
- **사용자 확정**: 메인에서 FILTER 도구를 POB보다 앞세우고 공식 유튜브 영상 4개를 메인 히어로와 가이드 다음의 푸터 직전으로 이동한다. 마켓 시세는 실행 도구가 아닌 콘텐츠이며 본 작업에서는 미구현이다.
- **코드 확인**: `src/app/page.tsx`의 도구 링크, 상단 메뉴, 푸터는 FILTER → POB 순서. 홈 DOM 흐름은 메뉴 → 도구 히어로 → 기존 가이드 → 공식 영상 → 푸터. 영상 컴포넌트 및 영상 갯수 4개 유지. 기존 PoB/필터 내부 기능·Worker 배포 설정은 변경하지 않는다.
- **미검증**: 실제 브라우저 디자인/모바일/영상 재생과 클라우드 배포. V236 lockfile 불일치 문제는 별도로 해결해야 하며 프로덕션은 운영 V235 유지.


### 2026-11-05 운영 사실 (V235)
- **화면으로 확인**: GitHub `cloudflare-poe2-assetfix-v233` 브랜치의 V235 커밋 `ba106f3` 푸시 성공. Cloudflare `fixlgs-poe2` 배포 목록에서 V235 버전 `4b94b5c7`이 활성 상태(`준비되었습니다`), 전체 배포 소요 `5분 7초`로 표시됨. 사용자는 이전에 정식 주소가 열리는 것을 확인함. 그러나 V235 배포 이후 모든 필터·PoB 버튼 및 API의 재검증은 수행하지 않음.
- **사용자 확인**: 불필요하게 추가됐던 `poe.fixlgs.com` Worker 도메인 연결을 제거함. 실제 DNS 레코드 잔존 여부 및 외부 검색 색인 여부는 별도 검증 필요. `poe2.fixlgs.com`만 정식 서비스로 유지하며, Vercel 원본 프로젝트는 보존함.

### V236: Cloudflare 빌드 반복 제거 준비 (소스만, 운영 미반영)
- **실제 V235 배포 로그 확인**: `npm run build:cloudflare`로 Next.js를 한 번 빌드한 후 배포 명령 `npx wrangler deploy`가 Wrangler를 즉석 설치하고 자동 OpenNext 마이그레이션·패키지 설치·Next.js 두 번째 빌드를 진행. 경과 약 5분 7초. 초기 빌드에는 Next.js 캐시가 없고 OpenNext도 캐시 구성 실패를 경고함.
- **V236 변경**: `wrangler.jsonc`와 `open-next.config.ts`를 프로젝트에 명시적으로 추가하여 자동 설정 반복을 차단하고, `build:cloudflare`를 **원본 PoB 데이터 임시 gzip staging → OpenNext 직접 빌드(Next 빌드 한 번) → 원본 복구** 스크립트로 바꿈. `deploy:cloudflare`는 생성된 `.open-next` 번들만 배포. 기존 Cloudflare 대시보드 배포 명령 `npx wrangler deploy`도 명시적 설정 파일과 설치된 Wrangler가 있으면 마이그레이션 없이 동작하도록 설계. Worker 자기참조 `fixlgs-poe2` 일치 유지. R2/KV/유료 캐시를 새로 추가하지 않음. `build`=`next build` 및 기능·디자인 코드는 그대로.
- **버전 호환성**: V235 `next@16.3.5`는 최신 `@opennextjs/cloudflare@1.20.16` 피어 요구사항(`Next >=16.4.5`)을 만족하지 못하며 보안 수정 이전 버전. V236은 Next와 `eslint-config-next`를 `16.4.5`, OpenNext `1.20.16`, Wrangler `4.157.0`으로 **정확한 버전 고정**(package.json). 빌드·기능 회귀는 실제 설치 후 재확인 필요.
- **검증된 사실**: npm 미사용 Node 기반 Worker 설정·주소·gzip 회귀 검사는 통과했고, 빌드 래퍼를 성공/실패 모의 실행해 두 경우 모두 45,082,029바이트 PoB 원본 SHA가 보존·복원되는 것을 확인함. **미검증**: 실제 `npm ci`, 최신 Next+OpenNext 번들 생성, 프로덕션 배포, 빌드 시간 개선량, 기능.
- **접근 제약**: ChatGPT 컨테이너의 npm registry 네트워크는 `EAI_AGAIN`으로 막혔고, 연결된 GitHub 연동에서 시험 브랜치 생성은 HTTP 403으로 거부됨. **따라서 이번 V236 전달 ZIP의 `package-lock.json`은 아직 V235 상태이며 package.json과 동기화되지 않음.** 그 상태에서 `npm ci` 또는 Cloudflare 자동 배포를 시작하면 실패할 수 있음. 반드시 `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`로 lockfile을 생성하고 정합성을 확인한 후에만 push. 이를 돕는 `scripts/verify-v236-cloudflare.ps1`를 제공함. 운영 V235는 그대로 유지.
- **캐시**: Cloudflare 대시보드 `Workers 및 Pages → fixlgs-poe2 → 설정 → 빌드 → Build cache` 활성화는 별도 UI 작업. R2 없이 제공되는 빌드 캐시이며, 이 작업에서 활성화 여부는 확인하지 못함. 실제 속도 효과도 미측정.

### V235 당시에 확인된 사항 (과거 기준, 상단 최신 운영기록 우선)
### 현재 유효한 기준 및 확인 수준
- **사용자 확정**: `poe2.fixlgs.com` 하나만 정식 서비스로 운영하며 `/filter`, `/pob` 등을 함께 제공한다. 구주소 `poe.fixlgs.com`은 폐기하고 별도 Worker 복제·운영 또는 301 리디렉션을 하지 않는다. `fixlgs.com`(왓이즈)과 다른 서브도메인은 변경하지 않는다.
- **화면으로 확인**: Cloudflare `fixlgs.com` 영역 활성화, `fixlgs-poe2` Worker 버전 `fa105dca` 프로덕션 배포 성공(브랜치 `cloudflare-poe2-assetfix-v233`; 코드 V234), `poe2.fixlgs.com` 사용자 지정 도메인 등록. 사용자가 정식 도메인 접속 성공을 보고했다. 필터 다운로드·PoB 계산·모바일·실제 게임 기능은 검증하지 않았다.
- **2026-11-05 사용자 보고**: 실수로 구주소 `poe.fixlgs.com`도 동일 Worker에 잠시 연결했으나, 최종적으로 해당 도메인 연결만 제거했다. **Cloudflare DNS에서 `poe` Worker 레코드가 함께 제거됐는지는 별도 확인 필요**. 운영 Worker와 `poe2.fixlgs.com`은 유지한다. Vercel의 기존 프로젝트/배포본은 그대로 보존하며 해제·삭제하지 않았다.
- **이번 V235 소스 정리**: `src/app/layout.tsx`의 `metadataBase`, `src/app/sitemap.ts`의 사이트맵 URL, `src/app/robots.ts`의 Sitemap URL, `src/app/privacy/site/page.tsx`의 적용 도메인을 **`https://poe2.fixlgs.com` 기준으로 갱신**했다. 개인정보처리방침에 기재된 현 호스팅 사업자 설명을 Cloudflare로 정정했다. 필터·PoB 계산, NeverSink 데이터·사운드·확장프로그램, 페이지 디자인·라우팅은 변경하지 않았다.
- **배포와 검증 구분**: 이 ZIP의 V235 수정 사항은 로컬 파일에만 적용했다. GitHub 브랜치에 푸시하거나 Cloudflare에 새 배포를 하지 않았으므로 **현재 정식 운영 사이트에는 구주소 메타데이터가 남아 있을 수 있다.** 따라서 V235 재배포 후 `/robots.txt`, `/sitemap.xml`, HTML 메타데이터 및 개인정보처리방침 표시 확인이 필요하다. V234 배포 로그와 사용자 접속 보고를 이번 V235 빌드·기능 검증으로 간주하지 않는다.
- **로컬 저장 데이터 주의**: 구주소와 신주소는 브라우저 저장소가 분리된다. 기존 구주소에 있던 개인 필터 프리셋을 자동 이전하지 않기로 한 사용자 결정을 유지한다.
- **SEO 보완의 한계**: 이 작업에서 301·새로운 `noindex`를 설정하지 않았다. `poe2.fixlgs.com`은 소스상 정상 색인 가능한 상태로 유지한다. 구주소의 실제 색인 여부 및 외부 링크 잔존은 미검증이다.

### 보존된 과거 Cloudflare 이전 오류·대응 (2026-10-26 기준, 당시 기록)
- 43MiB PoB Lua 원본이 Cloudflare 단일 자산 25MiB 한도에 걸려 업로드 실패 → V233에서 Cloudflare 빌드 전용 gzip/DecompressionStream으로 분리하고 원본 JSON을 보존함.
- OpenNext `WORKER_SELF_REFERENCE`가 실제 `fixlgs-poe2`가 아닌 `fix-pob`를 참조해 오류 10143 → V234 시험 브랜치에서 package 이름을 일치시킴. **이후 2026-10-26 V234 프로덕션 배포가 성공한 것은 위의 실제 배포 화면으로 확인.** 다만 런타임 API/WASM 기능까지 입증되지는 않음.

### 이전 시점 기록
### 2026-10-26 당시 최신 구현 상태 (V234 배포 전 기록, 현재 운영 상태 아님)
### V234 최신 운영 상태 및 결정
- **실제 배포 로그 / 2026-10-26 두 번째 실패**: Cloudflare 빌드 `npm run build:cloudflare`에서 PoB 원본(45,082,029바이트)이 gzip(4,858,503바이트)으로 성공 변환. Next.js와 OpenNext Worker 빌드 완료, 정적 자산 84개 업로드 성공. Worker 최종 게시 시 `WORKER_SELF_REFERENCE`가 없는 `fix-pob` Worker를 바라봐 Cloudflare API 오류 `10143` 발생. 따라서 현재도 Cloudflare 온라인 배포는 실패 상태임.
- **원인과 재발 방지**: Cloudflare 실제 Worker 프로젝트는 `fixlgs-poe2`인데 OpenNext 자동 설정의 자기 자신 service binding은 `fix-pob`로 생성되었다. 서버 리디렉션이나 PoB 계산 로직 문제가 아님. 자동 마이그레이션이 패키지명을 기준으로 설정할 가능성이 높다고 판단하여 **시험 브랜치에서만** `package.json`과 `package-lock.json`의 루트 패키지명을 `fixlgs-poe2`로 일치시킴. 실제 자동 생성 결과/실배포 성공 여부는 재시험 필수. 공식 권장 조건은 `wrangler.jsonc`의 name과 `WORKER_SELF_REFERENCE.service`를 같게 두는 것(https://opennext.js.org/cloudflare/get-started).
- **보호 기준**: `main`은 건드리지 않고 `cloudflare-poe2-assetfix-v233` 시험 브랜치에서 V234 추가 커밋. 브라우저 WASM/PoB Lua 원본/필터/Chrome 확장/계산방어 로직 변경 없음. Cloudflare `빌드 명령 = npm run build:cloudflare`, `배포 명령 = npx wrangler deploy`, production branch는 위 시험 브랜치를 유지.
- **우선 검증**: 다음 Cloudflare 로그에서 `WORKER_SELF_REFERENCE`의 서비스가 `fixlgs-poe2`인지 확인하고 API 10143 해소 여부 판별. 실패 시 자동 마이그레이션 의존을 중단하고 명시적 Wrangler/OpenNext 설정을 버전·Next.js peer compatibility와 함께 재검증. 성공해도 `workers.dev`에서 `/pob`, `/filter`, 다운로드, 계산/WASM, ninja API, 모바일 확인 전 도메인 연결 금지.
- **이번 검증 구분**: 새 패키지명/lockfile 루트 일치와 회귀 테스트는 로컬에서 검사. GitHub 푸시·Cloudflare 재배포·브라우저 기능 확인은 이 수정본 작성 시점에 미실시.

### Cloudflare 이전의 현재 기준
- **사용자 확정**: 기존 `gunsoo0003-dev/poe`의 웹사이트를 Cloudflare Workers 시험 배포한 후 `poe2.fixlgs.com`으로 연결한다. Vercel의 별도 `fixlgs-poe2` 프로젝트/도메인은 정상 검증 전까지 건드리지 않는다. 현재 Cloudflare 배포는 **실패 상태이며 아직 성공하지 않았다**.
- **실제 실패 로그**: 2026-10-26 Cloudflare `fixlgs-poe2` 빌드에서 Next.js 및 OpenNext 변환은 성공. 배포 중 `public/data/pob-lua.json` 크기 43MiB가 정적 파일 한도 25MiB를 초과하여 `Asset too large` 발생. Next.js 16.3.5 ↔ OpenNext 1.20.13 버전 경고와 서버 측 headless 동적 파일 트레이싱 경고도 있으나, 이 실패의 직접 원인은 자산 용량이다.
- **이번 변경 범위**: `scripts/prepare-cloudflare-assets.cjs`가 Cloudflare 빌드에 한해 원본 PoB Lua JSON을 gzip(약 4.6MiB)으로 생성하고 원본을 빌드 작업 디렉터리 바깥에 임시 보관한다. `src/app/pob/web-engine/calc-worker.ts`는 gzip 파일을 우선 가져와 브라우저 Web Worker의 `DecompressionStream`으로 복원하며, 기존 호스트에는 원본 JSON 조회를 유지한다. `package.json`의 원래 `build` 명령은 변경하지 않고 별도 `build:cloudflare`만 추가했다.
- **검증 필요**: GitHub에 변경된 코드 반영, Cloudflare Workers 빌드 설정의 명령을 `npm run build:cloudflare`로 변경, 시험 배포 재시도, `workers.dev`의 PoB/필터/API/모바일 실동작 확인. 자동 OpenNext 마이그레이션은 원격 빌드 중 수행되므로 실제 배포 성공은 보장되지 않음.
- Cloudflare 문서 기준: 개별 Worker 정적 자산은 25MiB까지 허용. 브라우저 gzip DecompressionStream은 널리 지원되지만 구형 브라우저는 별도 검증 필요. 근거: https://developers.cloudflare.com/workers/platform/limits/ ; https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream
- 신규 코드 경로: `scripts/prepare-cloudflare-assets.cjs`, `scripts/test-v233-cloudflare-assets.cjs`. 기존 계산·필터·확장프로그램 규칙/원본 엔진 및 데이터 바이트는 변경하지 않았다.
- 보관 자료/과거 보고서 색인: `docs/handover/INDEX.md` (기존 보고서 145개 색인, 루트 143개 및 엔진 내부 2개). 현재 확정 보관 이력은 `docs/handover/HISTORY_V001.md`(V232~V238)이며 최신 운영 기준은 본 문서 상단을 따른다.

### 이전 V232 상태 (2026-10-14)
### 실제 파일로 확인한 사실
- 프로젝트 루트 `fix-pob/`; Next.js 16.3.5 + React 19.2.8, `npm run dev` / `npm run build` 스크립트가 존재한다.
- `/pob` 시작 화면에 `poe.ninja` Builds 링크 입력 UI와 거래소 확장프로그램 설치 버튼이 있다.
- **이번 변경**: 확장프로그램 버튼의 기존 존재하지 않는 `/downloads/FIXLGS_POE2_ITEM_EXPORT_V004_6.zip` 경로를 공개 Chrome 웹스토어 링크로 교체. 새 창으로 열며 `noopener noreferrer` 적용. ZIP `download` 속성 제거.
- **이번 변경**: `src/lib/pobGuides.ts` 첫 번째 이용안내에 웹스토어 설치, 기존 거래소 탭 새로고침, FIXLGS EXPORT 복사, SIMULATION 붙여넣기, Chrome 자동 업데이트를 설명하고 공식 링크를 연결했다.
- **이번 변경**: 기존 압축본에 누락되어 있던 `/guides/pob/[slug]` 라우트 추가. 이미 존재하던 `pobGuides` 전체 문서를 `generateStaticParams` 기반으로 표시하며 해당 설명·참고 링크·주의 문구를 렌더링한다.
- 공식 등록 페이지(웹 검색으로 2026-10-14 확인): `https://chromewebstore.google.com/detail/fixlgs-poe2-item-export/cdhhjobcolejcdiianepndmkmmkgbeea`; 등록 버전 V0.4.6. `extension/fixlgs-poe2-item-export/manifest.json`의 버전도 0.4.6.
- 초기 압축본에는 `HANDOVER.md`, `README_HANDOVER.md` 또는 별도 주 인수인계 문서가 존재하지 않았다. 이 문서를 신규 작성했다. 원래의 `V*.txt`/`V*.md` 작업 보고서는 원문 그대로 보존했다.
- 제공된 `README.md`에는 초기 목업 설명이 남아 있어 현재 전체 구현 상태를 반영하지 않는다. V225~V231의 세부 작업은 같은 루트의 `V225_POB_NATIVE_INTEGRITY_REPORT.md` 및 `V226`~`V231` 보고서를 참고한다.

### 배포 상태 구분
- Chrome 웹스토어 등록 페이지는 검색으로 확인했다. 이 프로젝트 소스의 실제 Vercel 최신 배포 여부 및 PoB 실사이트 반영 여부는 이번 작업에서 검증하지 못했다.
- 본 ZIP에는 `.git` 메타데이터가 없다. GitHub 연동·배포 수행 사실을 이 ZIP만으로 확정하지 않는다.

## 4. 검증 결과와 미검증 항목
### 실행·통과
- `node scripts/test-v232-extension-guide.cjs`: 9개 확인, 공개 링크·안전 속성·레거시 ZIP 링크 제거·가이드 설명/라우트·manifest 버전 PASS.
- V210 export contract, V211 rune contract, V225 comparison guard, V226 ring slot(29 checks), V227 condition/integrity, V228 skill display, V229/V230 main skill regression: 모두 PASS.
- V225 Native WASM parser와 V231 Breach Ring Native WASM equip/STATS/audit 테스트: PASS. 일부 PoB 런타임 자산 이미지 누락 로그가 있었지만 해당 검사들은 성공 종료했다.
- TypeScript 5.8.3의 `transpileModule`로 변경된 TS/TSX 파일 3개의 **구문** 검사 PASS(전체 타입 검사 아님).

### 실행하지 못함 / 추가 확인 필요
- `npm ci --no-audit --no-fund --prefer-offline` 중 npm registry 네트워크 DNS 실패(`EAI_AGAIN`)로 필요한 패키지를 설치하지 못함. 따라서 전체 Next.js `npm run build`, 실제 브라우저 렌더링, 설치 버튼 클릭, 프로덕션 배포는 **미검증**.
- 다른 브라우저·모바일에서 웹스토어 노출은 Chrome 정책/환경에 따라 달라질 수 있음. PC Chrome에서 확인 권장.

## 5. 다음 작업과 우선순위
**V257 통합본 후속 필수 검증(사용자 우선 기준)**
1. 정상 네트워크에서 **현재 package.json 기준** `package-lock.json`을 npm으로 재생성하고 `npm ci`, `npm run build` 및 `npm run build:cloudflare`(검증용, 외부 배포 금지)를 실행. 기존 V236 `Cloudflare` 스크립트의 Lua 데이터 백업/복원을 확인한다. lockfile을 임의 텍스트 치환하거나 구 버전 Next로 무단 다운그레이드하지 않는다.
2. 실제 Next 홈에서 FILTER/POB/사용법/푸터 링크 접근, 데이터·다운로드·프리셋 저장/복원, PoB 원본 스킬·반지 두 슬롯·거래소 장비 DPS 계산 검증. 원본 계산·NeverSink 파일 임의 변경 금지.
3. 3개 공식 영상의 음소거 자동재생·1→2→3 반복·Referer 오류·30일 목록 갱신을 **HTTPS 환경**에서 확인. 외부 GitHub 아이템 이미지 8개는 로컬 WebP로 교체 가능할 때 신뢰성 검증. 뉴스 더미 기사는 실제 게시글을 받은 뒤에만 연결.
4. V019 확정 디자인을 PC 1920/1440/1024 및 모바일 390/320 실앱 화면에서 비교한 후 시험 브랜치에만 배포한다. 운영 `poe2.fixlgs.com`은 사용자 확인 전 유지. 공통 FIXLGS 법적 페이지 최종 목적지는 별도 확정 후 연결.

**V236 작업 우선순위(2026-11-05 · 운영 미반영)**
1. ZIP 전체를 `fix-pob/`에 덮어쓰되 `.git`/로컬 `.env*`를 보존. **package.json과 package-lock.json이 달라 현재 이 ZIP 자체는 즉시 npm ci 가능한 배포 완료본이 아님.**
2. 기존 Git 작업 브랜치에서 Windows PowerShell `powershell -ExecutionPolicy Bypass -File scripts/verify-v236-cloudflare.ps1` 실행. 이 스크립트가 최신 lockfile을 생성, npm ci, 설정 테스트, 실제 OpenNext 번들 빌드, PoB 데이터 SHA 복원을 검증함. Git push/실서비스 배포는 실행하지 않음.
3. 위 검증 성공 후에만 `package-lock.json`을 포함해 브랜치에 커밋·푸시. Cloudflare 기존 Build command `npm run build:cloudflare`, Deploy command `npx wrangler deploy` 그대로 사용할 수 있어야 하나 **이후 실제 배포 성공으로 검증해야 함**. 실패 시 운영 V235를 유지하고 기존 `ba106f3` 배포 롤백 가능.
4. 배포 후 로그에서 *자동 migration / 두 번째 Next build 없음*, `poe2.fixlgs.com/robots.txt`, `/sitemap.xml`, `/filter`, `/pob` 응답을 검사. 사용자 결정대로 상세 필터·PoB 기능 테스트는 추후 홈페이지 수정 때 수행.

**현재 V235 우선순위(과거 시점 참고)**
1. 구주소 `poe.fixlgs.com`의 Cloudflare Worker 사용자 지정 도메인 제거 후 DNS `poe` 레코드 잔존 여부를 확인. 301은 추가하지 않음.
2. 이 V235 소스를 **기존 Worker가 연결된 GitHub 시험 브랜치에 반영하여 재배포**. 운영 `main`은 임의로 수정하지 않음.
3. 배포 후 `poe2.fixlgs.com/robots.txt`와 `/sitemap.xml`, 기본 페이지 메타데이터·개인정보처리방침의 구주소 제거를 확인. 필터·PoB 기능 검증은 향후 홈페이지 수정과 함께 수행하기로 사용자 확정.
4. Cloudflare 자동 배포가 기존 브랜치에 연결된 사실을 다시 확인. 브랜치 전환·Worker 삭제·Vercel 도메인 해제는 별도 검증 없이 실시하지 않음.

**2026-10-26 당시 구 우선순위(이후 V234 성공으로 상황 변경)**
0. Cloudflare Workers `fixlgs-poe2`의 **Build command를 `npm run build:cloudflare`로 설정**, 자동 OpenNext 변환 구조 유지. 배포 명령은 현재 성공적으로 자동 OpenNext를 호출한 `npx wrangler deploy`를 우선 유지. GitHub에 수정이 반영된 후 새 빌드를 실행. `poe2.fixlgs.com` 연결은 기능 검증 후.
1. 로컬/CI에서 정상 인터넷으로 `npm ci` 후 `npm run build` 실행. `/pob`와 `/guides/pob/getting-started` 및 가이드 하위 경로가 정상 렌더링되는지 확인.
2. `/pob`의 웹스토어 설치 버튼이 실제 공개 페이지로 열리는지 검증하고 Vercel 배포 후 실사이트에도 반영됐는지 확인.
3. 사용자가 별도로 요청하기 전에는 이번 작업 범위 밖의 PoB 계산 로직·NeverSink 필터·기존 확장프로그램 V0.4.6 소스를 변경하지 않음.

## 6. 실행 및 확인 방법
- **V257 코드 계약:** 프로젝트 루트 `fix-pob/`에서 `node scripts/test-v257-home-integration.cjs`. Next 전체 빌드가 아닌 파일/경로 검사.
- **정상 네트워크에서 설치·테스트할 경우:** `npm install --package-lock-only`로 현재 package.json에 맞게 잠금파일 재생성 후 `npm ci` → `npm run build` → `npm run build:cloudflare`. 이번에는 외부 접속 차단으로 미실행.
- **V019 레이아웃 보호:** `docs/design-reference/V019/index.html` 및 WebP/CSS/HANDOVER는 원문 보관. 변경 대상은 `src/app/home-v019-markup.ts`, `home-v019.css`와 관련 코드이며 `src/app/globals.css` 기존 도구 스타일은 그대로 둔다. 실제 Next 브라우저 확인 전 CSS 충돌이 없다고 보장하지 말 것.

- **V236 실제 빌드 준비(Windows PowerShell, 기존 Git 루트)**: `powershell -ExecutionPolicy Bypass -File scripts/verify-v236-cloudflare.ps1`. `package-lock.json` 자동 재생성 후 의존성 설치/테스트/빌드까지 수행하며 push/배포 없음.
- **Cloudflare 자동 배포 설정(추후)**: GitHub 브랜치 `cloudflare-poe2-assetfix-v233`에서 Build `npm run build:cloudflare`, Deploy `npx wrangler deploy` 유지 가능하도록 설계. 직접 명령은 `npm run deploy:cloudflare`(사전에 빌드 후)이며 기능 검증 전 실행하지 말 것.
- V235 도메인 변경 검사(프로젝트 루트): `node scripts/test-v235-poe2-domain.cjs`.
- V235 Cloudflare 배포 후 실제 확인 주소: `https://poe2.fixlgs.com/robots.txt`, `https://poe2.fixlgs.com/sitemap.xml`, `https://poe2.fixlgs.com/privacy/site`. 메타데이터는 실제 HTML `metadataBase` 영향 확인. 구주소에 대한 301은 설정하지 않음.
- 프로젝트 루트에서 `npm ci` → `npm run dev` → 브라우저 `http://localhost:3000/pob` 및 `http://localhost:3000/guides/pob/getting-started`.
- 빌드: `npm run build`.
- 링크·가이드 회귀 검사: `node scripts/test-v232-extension-guide.cjs`.
- 기존 계산 관련 회귀 검사: `node scripts/test-v210-contract.cjs`, `node scripts/test-v211-rune-contract.cjs`, `node scripts/test-v225-comparison-guard.cjs`, `node --experimental-strip-types scripts/test-v226-ring-slots.cjs`, `node scripts/test-v228-skill-display.cjs`, `node scripts/test-v229-weapon-skill.cjs`.
- Native WASM 테스트: `node scripts/test-v225-native-wasm.mjs`, `node scripts/test-v231-breach-ring-wasm.mjs`.

## 7. 주요 파일 및 과거 기록
- **현재 홈:** `src/app/page.tsx`, `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `src/app/V019Interactions.tsx`, `public/poe-home/`, `scripts/test-v257-home-integration.cjs`. 디자인 전용 기준 보관본: `docs/design-reference/V019/` (V001~V019 결정·실패·검증 원문 포함).
- **적용한 교훈:** V019은 디자인 회의 외 수정 금지·로컬 WebP 보호·V013 영상 빈 프레임 제거·V014 빈 ID/153 오류 사례. V256은 V238~V241 실제 디자인이 시안과 달랐던 오류, V233 정적 자산 25MiB/원본 복원, V234 Worker 이름, V226 Ring 1/2 정확히 구별, V137 필터 저장 순서 보존. 본 통합은 홈만 교체하고 엔진은 바꾸지 않는 식으로 반영.

- 설치 버튼: `src/app/pob/page.tsx`.
- 사용 가이드 데이터: `src/lib/pobGuides.ts`.
- 새 가이드 라우트: `src/app/guides/pob/[slug]/page.tsx`.
- 이번 회귀 검사: `scripts/test-v232-extension-guide.cjs`.
- 이전 구현 보고서: 루트의 `V225_POB_NATIVE_INTEGRITY_REPORT.md`, `V226_RING_SLOT_FIX_REPORT.txt` ~ `V231_PATCH_NOTES.txt`와 이전 `V*.txt` 파일.
- 새 보관본: `docs/handover/HISTORY_V003.md` — V242~V253(2026-11-05~11-08), 이전 홈페이지 FireText/공식 로고/JSX 구문/모바일 개방. 관련 화면 회귀나 오래된 테스트 오류 재발 시 원문 열람, 확정본 재정제 금지.
- 확정 보관 이력: `docs/handover/HISTORY_V001.md`(V232~V238, 2026-10-14~11-05), `docs/handover/HISTORY_V002.md`(V239~V241, 2026-11-05). 현행 HISTORY_V001~V004 실재 파일을 색인에 등록했다. 원문 재정제/변경 금지. 별도 감사 보고서는 색인에 보존.

## 8. 누적 작업 이력
### 2026-11-08 · V258 · POB Next 빌드 타입 오류 및 robots/sitemap 제거
- **근거:** 사용자 실제 OpenNext 빌드에서 `Next.js 16.4.5 Compiled successfully` 이후 `src/app/pob/page.tsx: buildMainSkillUi` TS2344로 실패. 해당 함수 export는 V229 테스트용으로 남아 있었으나 Next App Router 페이지 규약에 맞지 않음. Lua.mjs URL/Native `spawn` 트레이싱은 같은 로그의 경고이며 다른 원인으로 분리.
- **전후/영향:** 페이지 `export function buildMainSkillUi` → 내부 `function` (내용·호출·스킬 계산 그대로). `scripts/test-v229-weapon-skill.cjs`는 메모리 테스트 코드에만 export를 주입, 기존 DPS 그룹 식별 테스트를 계속 수행. 사용자 최신 결정에 따라 `robots.ts`/`sitemap.ts`는 삭제, `scripts/test-v235-poe2-domain.cjs`는 현재 도메인·메타데이터·사이트 정책을 검사하도록 수정, `scripts/test-v258-build-readiness.cjs` 추가. 과거 V235의 생성 결정은 당시 이력으로 보존, 현 정책 아님.
- **실행·검증:** TS AST 13개 페이지에서 불허 named export 0개, V258 새 검사, V229·V228·V226·V225 및 FILTER/홈/Cloudflare 정적 회귀 통과. V256 대비 V257 원본 엔진·디자인·배포 설정 변경 없음. 전체 `npm ci`/Next/OpenNext 프로덕션 빌드, 실제 Worker 재배포, live WASM·유튜브/네트워크 확인은 이 환경에서 미실행. 두 Turbopack 경고/headers overflow는 해결되지 않은 별도 항목으로 남김.
- **재발 방지:** `app/**/page.tsx`에 임의 named export를 재추가하지 않는다. 아카이브 ZIP을 기존 폴더에 덮어쓸 경우 오래된 `robots.ts`·`sitemap.ts`가 남으므로 배포 전 삭제하고 검사를 돌린다. 사용자 PC의 새 lockfile은 미제공이므로 ZIP의 이전 lockfile을 최신인 것처럼 보고하지 않는다.
