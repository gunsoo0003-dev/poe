- **2026-11-15 HISTORY_V015 확정 보관**: `docs/handover/HISTORY_V015.md`, V266(2026-11-14) 공식 이미지·SEO/독립 HTML 미리보기·외부 CDN 의존 및 실제 배포 미검증 작업 이력 원문. **재열람:** POE2 새소식 기사 SEO/공식 이미지/미리보기·외부 이미지 접근 실패 시. 원문 재정제·수정 금지.
- **2026-11-15 V271 추가 스킬 그룹 12개 고정 제한 복구 (현재)**: `src/app/pob/pobCompare.ts`, `scripts/test-v271-secondary-group-continuation.cjs`, `HANDOVER.md`. 14개 후보 중 2개가 빠지는 FIXLGS 자체 상한 원인, 12개 묶음 연속 계산·무기 세트 복원·24개 보호 상한, 모의 엔진 PASS/실캐릭터 미검증. **재열람:** 추가 스킬 미검증 경고, 그룹 중복·세트 혼용·계산 시간 초과 시.
- **2026-11-15 HISTORY_V014 확정 보관**: `docs/handover/HISTORY_V014.md`, V263~V264(2026-11-14) GA4 메인 통합·robots/sitemap 복원 작업 이력 원문. **재열람:** GA4 측정 ID 교체, SEO 크롤링/사이트맵, 과거 검색 파일 삭제 재발 시. 확정 원문 재정제·수정 금지.
- **2026-11-15 V270:** `public/data/pob-lua.json`, `scripts/pob2-engine-fingerprint.json`, `scripts/test-v270-runic-life-conversion.mjs`. Runic Ward 복합 옵션 파서 수정·WASM 검사 PASS; 실제 사용자 AFTER 미검증. **재열람:** 룬 계산 오류 시.
- **2026-11-15 HISTORY_V013:** `docs/handover/HISTORY_V013.md` (2026-11-14 V265 새소식 제작·검증·미검증 원문). **재열람:** 뉴스·SEO·이미지 오류 시. 확정 원문 보존.
- **2026-11-15 V269 PoB 원본 룬 진단 보강 (최신)**: `src/app/pob/web-engine/calc-worker.ts`, `calc-client.ts`, `src/app/pob/pobCompare.ts`, `scripts/test-v269-rune-native-diagnostics.cjs`, `V269_POB_RUNE_NATIVE_DIAGNOSTICS_REPORT.md`. V227 PoB native 룬 원칙 재검토, 실패한 룬 이름·효과와 PoB 원본 modifier/extra/bonded 출력. 계산 안전장치 불변. **재열람:** 실제 Runeseeker 캐릭터 룬 재구성 실패/오인식·미지원 옵션 차단 시. 실제 사용자 AFTER 계산은 미검증.
- **2026-11-15 V268 PoB2 Runic Ward 원본 파서 수정 (최신)**: `public/data/pob-lua.json` 안의 공식 PoB2 `ModParser.lua` Runic Ward 별칭 2개 및 `ModCache.lua` 구형 부분 파싱 캐시 6개 수정, `scripts/pob2-engine-fingerprint.json` 갱신, `scripts/test-v268-runic-ward-native-parser.mjs`, `V268_RUNIC_WARD_NATIVE_PARSER_REPORT.md`. **재열람:** `maximum Runic Ward`/Runic Ward 관련 옵션에서 PoB 원본 인식 실패, 교체 계산 차단 또는 Lua 파서/fingerprint 변경 시. 실제 WASM 파서 + strict integrity guard PASS, 실제 캐릭터 최종 DPS·Next/Cloudflare 빌드/배포 미검증; V225 안전장치 유지.
- **2026-11-15 V267 PoB poe.ninja 상세 403 대응 및 Export 입력 복구 (최신)**: `src/app/pob/ninjaImport.ts`, 신규 `src/app/pob/pobExport.ts`, `src/app/api/pob/import-ninja/route.ts`, `src/app/api/pob/prepare-export/route.ts`, `src/app/pob/page.tsx`, `src/app/pob/pob-v259-theme.css`, `scripts/test-v267-pob-export-recovery.cjs`, `V267_POB_NINJA_EXPORT_RECOVERY_AUDIT.md`. Builds/Profile URL·UTF-8 파싱 복원, 403을 성공처럼 표시하지 않도록 분리, 사용자 직접 PoB Export(Base64/zlib/XML) 입력으로 활성 ItemSet 장비/주얼/스킬/주스킬을 복원하고 기존 PoB2 엔진에 원본 XML 전달; 수동 입력 경로에서는 poe.ninja 내부 상세 API 생략. **재열람:** Ninja HTTP 403, URL/profile 경로, 실제 Export 데이터 수신/해독, 장비·스킬·주얼·주스킬 누락, PoB2 계산 연동 오류 시. fixture 및 코드/회귀 검사는 PASS, 실제 사용자 Export·실제 WASM·Next/Cloudflare 빌드/배포는 미검증; 403 우회 금지.
- **2026-11-15 HISTORY_V012 신규 확정 보관**: `docs/handover/HISTORY_V012.md`에 구형 V236/V235 Cloudflare 이전·도메인 작업 상세 원문을 그대로 분리하고 V266 기준 원문과 문자 단위 대조 완료. **재열람:** Cloudflare/OpenNext 빌드·도메인·Worker 구성 및 V235 lockfile 정합성 문제 재발 시. 원본 재정제·덮어쓰기 금지.
- **2026-11-14 V266 새소식 001 SEO/공식 이미지 (최신)**: `src/app/news/poe2-1-0-full-release/page.tsx`, `src/app/news/OfficialArtwork.tsx`, `src/app/news/page.tsx`, `src/app/news/news.module.css`, `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `scripts/test-v265-news-article.cjs`, `scripts/test-v266-news-seo-official-images.cjs`, `preview/news-001/index.html`, `preview/news-001/styles.css`, `HANDOVER.md`. 제목·메타/캐노니컬/OG/NewsArticle/3표·내부 링크 개선, GGG 1.0/신규 리그 공식 보도자료 원격 이미지 3개+로컬 공식 이미지 폴백, 생성 이미지 기사 참조 해제, 독립 로컬 기사 HTML 확인용. 원격 CDN 실제 수신·전체 빌드/배포 미검증. **재열람:** 공식 이미지 로딩/이용 조건·공개일 구조화 데이터·SEO/OG 카드·홈 뉴스 카드·로컬 미리보기와 운영 Next 차이·검색 색인 문제.
- **2026-11-14 HISTORY_V011 신규 확정 보관**: `docs/handover/HISTORY_V011.md`에 2026-11-06 V243(홈 공식 로고)·V242(홈 FireText 불꽃 재현) 과거 작업 원문을 보존했다. 구형 시안/현재 V019 디자인 구별, 불꽃 구현·화면 오류 재발 검토 시 재열람. 이후 수정/재정제 금지.
# 기존 작업 보고서 색인 — 원문 보존
- **2026-11-14 V265 (이전 뉴스 초안)**: `src/app/news/poe2-1-0-full-release/page.tsx`, `src/app/news/page.tsx`, `src/app/news/news.module.css`, `public/news/poe2-1-0/`(원본 제작 이미지 5개), `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `src/app/sitemap.ts`, `scripts/test-v265-news-article.cjs`, `scripts/test-v257-home-integration.cjs`, `scripts/test-v264-search-discovery.cjs`, `HANDOVER.md`. 공식 발표 기반 출시 기사·표 3개·이미지 5개·2개 뉴스 URL. V019 2+4 레이아웃 유지, 더미 오인 제거. 작성일 2026-11-14, 최초 공개일 미확정. **재열람:** 뉴스 발행/편집, 사이트맵 21개 URL 증감, 홈 뉴스 카드 오류, 이미지 저작권·실게임 오인·검색 메타 및 애드센스 품질 검토.
- **2026-11-14 HISTORY_V010 신규 보관**: `docs/handover/HISTORY_V010.md`(2026-11-06~08 구형 V237·V238·V240·V241 전면 홈 구성·디자인 시도 원문). **재열람:** 최초 홈페이지 디자인 결정/실패/모의 브라우저 검증 경험을 검토할 때. V019 현재 디자인으로 무단 재적용 금지. 확정 원문 재정리 금지.
- **2026-11-14 V264 운영 확인 갱신**: 사용자 로컬 테스트 PASS, GitHub `f0fd006` 푸시, 운영 robots.txt/사이트맵 19개 URL 원문 제공으로 공개 검색 파일 응답 확인. Search Console 색인/GA4 운영 수집까지 검증된 것은 아님. **재열람:** 배포 오류, SEO 발견/색인, Main GA4 통합 운영 확인 전.

- **2026-11-14 V264 (현재 SEO 원칙)**: `src/app/robots.ts`, `src/app/sitemap.ts`(Next MetadataRoute); `scripts/test-v264-search-discovery.cjs`, `scripts/test-v235-poe2-domain.cjs`, `scripts/test-v258-build-readiness.cjs`, `scripts/test-v259-pob-theme.cjs`~`test-v262-filter-adaptive-wallpaper.cjs`, `HANDOVER.md`. 2026-11-08 V258의 검색파일 *미제공* 결정을 철회하고 `https://poe2.fixlgs.com/robots.txt`, `/sitemap.xml` 복원. 실재 11개 공개 페이지+`pobGuides` 8개=19 URL. API/내부 진단 제외; GA4/디자인/계산 무변경. Node 계약·V257~V263 회귀 PASS, 전체 빌드/배포 미검증. **재열람:** 구 사이트맵 재발, URL 404·가이드 추가, Next 메타데이터/배포/검색 색인 문제.
- **2026-11-14 HISTORY_V009 신규 확정 보관**: `docs/handover/HISTORY_V009.md`(2026-10-14 V232 및 2026-10-26 V234 과거 본문 원문), 40,000자 초과로 주 문서에서 분리 후 문자 일치 검증. **재열람:** Chrome 확장·웹스토어 가이드, 이전 Cloudflare 이슈·Worker 10143 자기참조 오류 재발 시. 확정 보관본 재수정 금지.

- **2026-11-14 V263 GA4 통합 (현재 소스)**: `HANDOVER.md` 상단/하단 V263, `src/app/layout.tsx`, `scripts/test-v263-ga4-main-integration.cjs`. 기존 POE2 속성 `G-SSC964HMHS`의 태그 두 곳을 FIXLGS Main `G-EPCCGBTPH9`로 교체; `poe2.fixlgs.com`·홈·FILTER·PoB 보호. **재열람:** GA4 통합·중복 방문·도메인 이전·실시간 수집 문제, 구 POE2 속성 삭제 전. 정적 코드 검사 및 V235/V257/V262 회귀만 PASS, 실배포/수집 미검증.
- **2026-11-14 HISTORY_V008 신규 보관**: `docs/handover/HISTORY_V008.md`, 2026-11-09 V262 FILTER 단일 이미지 반응형 배경의 원문. 40,000자 초과로 주 문서 하단에서 이동했고 기존 확정 HISTORY_V001~V007은 불변. **재열람:** FILTER 배경/980~981px 경계/좌우 여백/모바일/이전 V262 실빌드 한계 확인 시. 원문 1:1 대조 완료, 재정제 금지.

- **2026-11-09 V262 FILTER 반응형 선명 배경 (현재)**: `HANDOVER.md` V262·`docs/handover/HISTORY_V008.md` 원문, `src/app/globals.css` FILTER 배경/셸, 기존 `public/images/poe2/official-lightning-gameplay.webp`, `scripts/test-v262-filter-adaptive-wallpaper.cjs`. 단일 전투 이미지, 실제 중앙 셸 너비에 연동된 선명한 좌우 빈 공간, 모바일 V261 보존, 필터 원본 변경 없음. **재열람:** FILTER 배경 교체, 980/981px 경계·1440/1920/2560px 여백·스크롤/가독성 이상, 엔진/홈 회귀 시. 정적 Chromium 9폭 검증, Next 실빌드 미검증.
- **2026-11-09 HISTORY_V007 확정 보관**: `docs/handover/HISTORY_V007.md`, V261 FILTER 행 밀도·버튼/토글 확대와 중간폭 오버플로 해결·검증 원문 보존. **재열람:** 레어/매직 단계, 선택/중요도 토글, 981~1350px 가로 넘침·조작 회귀 시. 분리 당시 원문 바이트 대조 후 보존. 향후 수정·재정제 금지.
- **2026-11-09 V261 FILTER 밀도·풀영역 배경 (현재)**: `HANDOVER.md` 상단·하단 V261, `src/app/globals.css`(FILTER 선택자), 기존 `public/images/poe2/cinematic-hero.webp`, `scripts/test-v261-filter-theme.cjs`. 콘텐츠 폭·27개 항목·NeverSink 변경 없이 레어/매직/일반 중요도 조작 행 압축, 버튼·토글 가독성/크기 확장. **재열람:** FILTER 목록 밀도·버튼 오버플로·981~1350px 반응형·V247 모바일·필터 조작 회귀 시. 8폭 Chromium 정적/계약 확인, Next 실빌드 미검증.
- **2026-11-09 HISTORY_V006 확정 보관**: `docs/handover/HISTORY_V006.md`, V260 POB PC 시네마틱 배경·폭 개선 원문 보존. **재열람:** POB 1051/1501px 경계, 원본 이미지 배경, 모바일/엔진 영향, V260 잠금파일 제외·실검증 한계 검토 시. 원문 바이트 대조 검증; 덮어쓰기·재정제 금지.


- **2026-11-09 V260 POB PC 전체 배경·폭 확장 (현재)**: `HANDOVER.md` 상단 및 신규 V260 이력, `src/app/pob/pob-v259-theme.css`, 기존 시즌중립 자산 `public/images/poe2/official-burning-village.webp`, `scripts/test-v260-pob-wide-backdrop.cjs`. PC 전체 배경 고정, 본문 최대 2100px, 게임 분석 화면 폭 확대, 모바일/홈/엔진 보호. **재열람:** POB 데스크톱 배경·폭·오버레이, 모바일 경계, 디자인/실앱 차이, stale lockfile 덮어쓰기 문제 재발 시. 정적 Chromium 10폭 테스트만 완료, V260 Next/Cloudflare 미검증.
- **2026-11-09 HISTORY_V005 확정 보관**: `docs/handover/HISTORY_V005.md`, 2026-11-08~09 V258~V259, Next 16 임의 page export/robots·sitemap 미제공 기준, 시즌중립 POB 질감·이미지 교체, 카드 겹침·CSS import/테스트 재발과 정적 검증 한계. **재열람:** Next 빌드 타입 오류·검색파일 재생성·POB 배너/가이드 카드/모바일 슬롯 CSS 오류 재발 시. 본문 두 건 원문 대조 보존; 재정제/수정 금지.
- **2026-11-09 V259 POB 외형 1차 통일 (현재)**: `HANDOVER.md` V259, `src/app/pob/page.tsx`, 기존 `src/app/pob/layout.tsx`(메타데이터 보존), `src/app/pob/pob-v259-theme.css`, `scripts/test-v259-pob-theme.cjs`. 메인 V019의 어두운 적갈·청동 질감 이식, 시즌 이미지 2곳을 기존 범용 POE2 전투 아트로 교체, PC 카드 높이/모바일 슬롯 화면 보정. POB 시작 화면·실제 캐릭터 비교 화면/모바일 UI를 다시 손볼 때 읽는다. 계산·장비 슬롯 고정 좌표·FILTER·홈·기존 HISTORY 원본 보호, 실제 Next 앱·영상 미검증. 사용자 PC V258 빌드와 GitHub 푸시 성공(`4f7aab7`)은 확인, Cloudflare 프로덕션 반영은 미확인.

- **2026-11-08 V258 타입 오류·당시 검색 파일 제거 (V264에서 SEO 기준 변경)**: `HANDOVER.md` V258 현재 기준·신규 이력, `src/app/pob/page.tsx`, `scripts/test-v229-weapon-skill.cjs`, `scripts/test-v258-build-readiness.cjs`, `scripts/test-v235-poe2-domain.cjs`. Next 16 page 임의 named export 문제·Cloudflare 빌드 실패 재발, robots/sitemap 당시 정책(2026-11-14 V264 재설치로 변경), 사용자 로컬 ZIP 덮어쓰기 누락 검토 시 다시 읽는다. `src/app/robots.ts`, `src/app/sitemap.ts`는 이번 작업에서 제거되었으며, 당시 V235의 사이트맵 포함 원칙을 폐기했지만 2026-11-14 V264 복원 결정이 현재 유효하다. PoB 계산 함수 본체는 보존. 전체 프로덕션 빌드는 미검증.
- **2026-11-08 HISTORY_V004 확정 보관**: `docs/handover/HISTORY_V004.md`, 2026-11-08 V254~V257, 가이드 2개씩 표시/종이 시트/사용법 제목·다크 프리뷰와 V019 홈페이지 통합, 과거 정적 검증 한계. 가이드 UI·V019 통합·브라우저 렌더 및 배포 회귀 시 다시 읽는다. 분리 시 원문 보존 대조 완료; 이후 정제·덮어쓰기 금지.

- **2026-11-08 V257 통합 홈페이지**: `HANDOVER.md` 현재 기준·하단 V257, `src/app/page.tsx` + `home-v019-markup.ts` + `home-v019.css` + `V019Interactions.tsx` + `public/poe-home/` + `scripts/test-v257-home-integration.cjs`. V019 정확한 원본·이전 실패/보호 이력은 `docs/design-reference/V019/`에 모두 보관. 교체 전 V256의 홈 TSX 원문은 `docs/design-reference/V256_HOME_PAGE_SOURCE.tsx.txt`에 보관해 레이아웃/링크 회귀 분석 시 읽는다. 다시 읽기: 홈 디자인·SEO/가이드/탭/영상·FILTER/PoB 링크 수정, 정적→Next 재발 문제, Cloudflare 빌드/초기화 오류. 홈페이지 이전 V250/V256의 레이아웃 검사 기대값은 **현재 V019에 적용하지 않는다**.
- **2026-11-08 HISTORY_V003 확정 보관**: `docs/handover/HISTORY_V003.md` V242~V253(2026-11-05~11-08), FireText 재사용/로고/JSX 문법·모바일 개방의 결정·실패·검증 원문을 보존. 관련 구형 UI/모바일 회귀 오류 및 옛 DOM 검사 실패 시 읽는다. 확정본 덮어쓰기·재정제 금지.
- **2026-11-08 V019 디자인 기록**: `docs/design-reference/V019/HANDOVER.md`(V001~V019 유효 원칙/변경 이력), `docs/design-reference/V019/docs/handover/HISTORY_V001.md`(초기 V001/V003/V004 확정 보관), `docs/design-reference/V019/index.html`/`styles.css`/`script.js`/`assets/`(원본 시각 자산). 원본과 현재 통합 구현의 화면·버튼·영상 차이를 확인할 때 읽기.

- 프로젝트 루트 기준 상대경로. 이 목록은 `HISTORY_V*.md`로 분리된 확정 이력이 아니라 기존에 존재하던 V버전/감사 보고서의 탐색용 색인이다. 보고서 원문은 변경·삭제하지 않는다.
- 파일명에서 확인 가능한 버전·주제만 기록한다. 정확한 작성 날짜/코드 반영 여부/테스트 결과는 해당 원문과 실제 코드를 다시 열어 확인한다. 모든 보고서가 유효한 최신 기준은 아니며 `HANDOVER.md` 상단이 우선한다.
- **다시 읽을 조건**: 관련 기능을 변경하거나 이전 오류가 재발할 때 해당 파일을 열고, 특히 원본 엔진/계산·WASM·필터·룬·반지·확장프로그램 변경 시 보호·재발 방지·검증 기록을 확인한다.
- **2026-11-08 V256 한글 사용법 제목·다크 가이드 문서 프리뷰**: `HANDOVER.md` V255/V256, `src/app/page.tsx`의 `guidePaths` 2+2 및 `poe-v255-guide-card` 실존 링크, `src/app/globals.css` V255~V256 카드·호버·시트 색상, `scripts/test-v256-guide-theme.cjs`와 최신 V251/V253/V254 회귀. 다시 읽을 조건: 타이틀/미리보기/호버·모바일 명도·딥링크 변경 시. V255는 베이지색 종이 시트 최초 구현, V256에서 제목 한글화·흑갈/남청 다크패널로 교체. V254의 큰 그룹 박스·추가 CTA는 폐기, `HISTORY_V001.md`/`HISTORY_V002.md`는 불변.
- **2026-11-08 V254 FILTER/POB 2개 가이드 및 가독성 개선**: `HANDOVER.md` V254, `src/app/page.tsx`의 `guidePaths` 2+2와 독립 CTA, `src/app/globals.css`의 V254 현행 안내 스타일, `scripts/test-v254-guide-clarity.cjs`, 최신 기대값으로 수정된 `scripts/test-v253-guides-onboarding.cjs`. 가이드 추가·순서 변경·링크 404·모바일 글씨/키보드 초점 문제 시 재열람. V253의 3단계 혼합 구성은 더 이상 사용하지 않는다.
- **2026-11-08 V253 처음 이용하는 사람을 위한 GUIDES 선배치**: `HANDOVER.md` V253 현행 기준/하단 이력, `src/app/page.tsx`, `src/app/globals.css` V253 가이드 경로 스타일, `scripts/test-v253-guides-onboarding.cjs`; 앞선 V251 테스트의 4개 앵커와 V252 중복 메뉴 삭제 조건 유지. 메인 순서 변경·가이드 링크·모바일 초보자 안내·FILTER/PoB 도구 진입 변경 시 다시 읽음. 기존 `HISTORY_V001.md`의 V237/V238 옛 순서는 현재 기준으로 재적용하지 않음.
- **2026-11-08 V252 메인 중복 바로가기 정리**: `HANDOVER.md` 현재 V252 기준·하단 변경 이력, `src/app/page.tsx`의 `poe-v252-value-strip`, `src/app/globals.css`의 V252 스타일, `scripts/test-v252-hero-clarity.cjs`. 메인 텍스트, 카드별 SEO 문구, MARKET/GUIDES/MEDIA 중복 링크, 모바일 배치 변경 시 다시 읽음. V251에서 삭제 대상 잔존을 놓친 원인(구형 `heroLinks` DOM)이 재발하지 않도록 실제 부재 검사, V251 본문 앵커/로고/FireText/메인 섹션 보존. 관련 옛 기록 V239 3개 바로가기 추가 이력은 과거 의사결정일 뿐 현재는 폐기.
- **2026-11-08 V251 기존 가이드 4개 주제 통합**: `HANDOVER.md` 상단·V251 이력, `src/app/page.tsx`의 `featuredGuides`, `src/app/globals.css`의 `poe-v251-guides-grid`, `src/app/filter/guide/page.tsx`, `src/app/guides/page.tsx`, `src/lib/pobGuides.ts`, `src/app/guides/pob/[slug]/page.tsx`, `scripts/test-v251-guides-integration.cjs`. 메인 가이드 진입 링크·필터 설치/엄격도·PoB 캐릭터 Import/DPS 설명·반응형/SEO 문구 변경 또는 앵커 404 재발 시 반드시 읽고 링크와 실제 글 문단 일치를 검사. 이전 V143 가이드 전용 페이지와 V142 저장/설치 동작 구분 교훈 적용, 사용자 데이터·편집 엔진 보호.
- **2026-11-08 HISTORY_V002 확정 보관**: `docs/handover/HISTORY_V002.md` V239~V241(2026-11-05), 메인 시안과 실제 차이·공식 원화·홈 섹션 디자인 오류·검증의 원문 보존. 로고·배경·GUIDES/MARKET 디자인 변경 시 다시 읽음. 이후 정제/덮어쓰기 금지.
- **2026-11-08 V250 통합 디자인 / HISTORY 최초 분리**: `HANDOVER.md` V250, `src/app/page.tsx`, `src/app/globals.css`, `public/images/poe2/v250-filter-art.webp`, `public/images/poe2/v250-pob-art.webp`, `scripts/test-v250-home-design.cjs`. 홈/아이콘/CTA/모바일 레이아웃/불꽃 변경 시 다시 읽을 것. `docs/handover/HISTORY_V001.md`는 V232~V238(2026-10-14~2026-11-05) 원문 이력으로, 시안/실제 괴리·Cloudflare 25MiB/Worker 이름/lockfile·도메인·웹스토어·메인 순서의 재발 오류 시 선택 열람. 보관본은 다시 정제·변경하지 않는다.
- **2026-11-08 V247 모바일 접근 개방**: `HANDOVER.md` V247, `src/app/filter/page.tsx`, `src/app/globals.css` V247, `scripts/test-v247-mobile-open.cjs`; 모바일 차단/가로 스크롤/필터 저장·설치·PoB 모바일 표시 재발 시 다시 읽음. 관련 보고서 `V137_SAVE_PERSISTENCE_INSTALL_COMMIT_AUDIT.txt`의 저장·설치 순서를 보존.
- **2026-11-06 V246 절제된 도구 버튼 재질감**: `HANDOVER.md` V246, `src/app/globals.css` V240/V241 버튼 원본 규칙과 V246 호버 규칙. 디자인·불꽃 변경 시 버튼 균형/모션 감소/배경 보호, V244 JSX/V242 FireText 회귀와 PC·모바일 화면 재확인.
- **2026-11-06 V245 배경 불씨/화염 시네마틱 보강**: `HANDOVER.md` V245, `src/app/page.tsx`, `src/app/globals.css` V245 애니메이션. 불꽃 중복·성능 및 배경 밝기 영향 재검토 시 재확인.
- **2026-11-06 V244 긴급 JSX 파싱 복구**: `HANDOVER.md` V244, `src/app/page.tsx`, `scripts/test-v244-jsx-syntax.cjs`. 이전 V243에서 누락된 구문 검사 재발 방지: 새 TSX 수정 시 TypeScript parser 진단을 먼저 수행. 로컬 Watchpack 경고는 별개.
- **2026-11-05 V243 메인 중앙 공식 로고 적용**: `HANDOVER.md` 현재 기준·V243 이력, `src/app/page.tsx`, `src/app/globals.css`, `public/images/poe2/poe2-official-logo.webp`, `scripts/test-v243-official-hero-logo.cjs`. 로고 크기·투명/잘림·접근성·반응형 이슈 재발 시 다시 확인.
- **2026-11-05 V242 기존 FireText 불꽃 복원**: `HANDOVER.md` 최신 기준과 신규 이력, `src/app/FireText.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `scripts/test-v242-restore-firetext.cjs`. 도구 이름의 불꽃·색상·Canvas/반응형 문제나 효과 유실 재발 시 다시 읽음.
- **2026-11-05 V241 공식 원화 배경 적용**: `HANDOVER.md` V241 상단 및 하단, `src/app/globals.css` V241 홈 스코프, `src/app/page.tsx`, `scripts/test-v241-official-artwork.cjs`. 메인/시세/가이드/미디어 배경 변경 및 시안 재현 오류 재발 시 확인. 원본 이미지 파일은 사용자가 제공했으며 이력 원문은 보호.
- **2026-11-05 V240 실제 이미지 기반 시네마틱 홈**: `HANDOVER.md` 최신 기준 및 V240 작업 이력. 배경 이미지·FILTER/POB·가이드·영상 4개 배치를 변경할 때 `src/app/page.tsx`, `src/app/globals.css`, `scripts/test-v240-cinematic-home.cjs` 재검토. V238~V239에서 시안과 웹 결과가 달랐던 재발 오류 확인이 필요.
- **2026-11-05 V238 메인 재설계**: `HANDOVER.md` 상단 현 유효 기준 및 하단 V238 기록을 참조. `src/app/page.tsx`와 홈 전용 CSS 변경, 기존 시세 데이터 미구현·영상 4개 보존. 메인 디자인·앵커/영상/반응형 오류 재발 시 `scripts/test-v238-home-redesign.cjs`와 V237 검사를 실행하고 실제 브라우저로 확인할 것.
- **2026-11-05 V237 메인 배치 변경**: `HANDOVER.md` 상단 V237 현재 기준과 하단 신규 이력 참고. `src/app/page.tsx`에서 FILTER를 POB보다 우선하고 공식 유튜브 영상을 기존 가이드 뒤로 이동. 필터/PoB 코드 및 145개 기존 보고서 원본은 보호. 메인 순서 변경·영상 회귀 시 `scripts/test-v237-home-order.cjs`를 다시 실행하고 실브라우저 검증을 수행할 것.
- **2026-11-05 V236 빌드 개선 준비**: `HANDOVER.md` 상단 V236 현재 기준과 하단 신규 이력 참고. V233 gzip 자산 제한, V234 Worker 자기참조 오류, V235 도메인 정리 교훈을 보존. Node 모의 테스트 완료, npm lock 재생성·전체 빌드·배포는 미실행. 기존 보관 보고서 145개는 변경/재정제하지 않음.
- **2026-11-05 V235 최신 도메인 운영/SEO 정리**: `HANDOVER.md` 상단 현 운영 상태 및 하단 V235 이력 참고. 구주소 폐기/301 생략, `poe2.fixlgs.com`만 정식 운영하는 결정은 기존 V233/V234 시험 로그보다 우선한다.
- Cloudflare 관련 핵심 이력: `HANDOVER.md` V233/V234 (정적 파일 25MiB 제한 해결과 `WORKER_SELF_REFERENCE` 10143 이름 불일치), `V225_POB_NATIVE_INTEGRITY_REPORT.md`, `V231_PATCH_NOTES.txt`; Cloudflare 재배포/동적 headless 진단·PoB 계산·원본/확장프로그램을 독립 검증할 때 다시 읽는다.

- **2026-11-08 V248 메인 3열·불타는 성 배경**: `HANDOVER.md` V248, `src/app/page.tsx`, `src/app/globals.css`, `public/images/poe2/burning-castle-hero-v248.webp`, `scripts/test-v248-triad-castle.cjs`. 메인 배치/배경·불꽃 재작업 시 필독; V242/V243/V245/V246 보호 원칙과 함께 확인.

- **2026-11-08 V249 공식+FIX 브랜드 결합 및 CTA**: `HANDOVER.md` 상단 V249 및 하단 이력, `src/app/page.tsx`, `src/app/globals.css`, `scripts/test-v249-dual-brand-cta.cjs`; 로고·FILTER/POB 버튼 레이아웃 재변경, 클릭 유도, 불꽃 효과 회귀 시 필독. V248 3열은 과거 배치이고 현 유효 기준은 V249.

## 현재 작업 보고서·검사
- `V268_RUNIC_WARD_NATIVE_PARSER_REPORT.md`: 공식 PoB2 ModParser 별칭 누락과 구형 ModCache 6개 부분 파싱 캐시 제거, 실제 WASM/strict integrity 검사 및 미검증 범위. **Runic Ward 계산 오류 재발 시 필독.**
- `scripts/test-v268-runic-ward-native-parser.mjs`: 실제 번들 PoB2 WASM에서 +40/+50/+100/+300 Runic Ward와 associated rune/skill options 검사, 미지원 modifier 차단 유지. PoB Lua parser 변경 시 실행.

## 실재하는 기존 보고서 목록

| 루트 상대경로 | 원문 주제(파일명 기준) | 날짜 | 다시 읽을 조건 |
|---|---|---|---|
| `ABYSS_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `ABYSS_V002_AUDIT.txt` | V002_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `ATZIRI_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `BREACH_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `CURRENCY_V008_AUDIT.txt` | V008_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `DELIRIUM_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `DELIRIUM_V002_AUDIT.txt` | V002_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `DELIRIUM_V003_AUDIT.txt` | V003_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `DELIRIUM_V004_AUDIT.txt` | V004_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `DELIRIUM_V005_AUDIT.txt` | V005_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `ESSENCE_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `EXPEDITION_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `FRAGMENTS_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `IDOLS_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `LINEAGE_GEMS_V001_AUDIT.txt` | GEMS_V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `NORMAL_BASETYPE_DATA_AUDIT_V100.txt` | BASETYPE_DATA_AUDIT_V100 | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `NORMAL_BASETYPE_DROPPABLE_AUDIT_V101.txt` | BASETYPE_DROPPABLE_AUDIT_V101 | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `NORMAL_BASETYPE_KO_AUDIT_V102.txt` | BASETYPE_KO_AUDIT_V102 | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `RITUAL_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `RUNES_V001_AUDIT.txt` | V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `SOUL_CORE_V001_AUDIT.txt` | CORE_V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `UNCUT_GEMS_V001_AUDIT.txt` | GEMS_V001_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V011_VERIFY.txt` | VERIFY | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V067_TIER_AUDIT.txt` | TIER_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V073_LINEAGE_TIER_AUDIT.txt` | LINEAGE_TIER_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V074_INGAME_AUDIT_FIX_REPORT.txt` | INGAME_AUDIT_FIX_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V075_WAYSTONES_V001_REPORT.txt` | WAYSTONES_V001_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V076_TABLETS_V001_REPORT.txt` | TABLETS_V001_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V077_TABLET_PREVIEW_FIX_REPORT.txt` | TABLET_PREVIEW_FIX_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V078_TABLET_UNIQUE_FIX_AUDIT.txt` | TABLET_UNIQUE_FIX_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V079_TABLET_UNIQUE_BASETYPE_FIX_AUDIT.txt` | TABLET_UNIQUE_BASETYPE_FIX_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V080_JEWELS_BASETYPE_AUDIT.txt` | JEWELS_BASETYPE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V082_CHARMS_BASETYPE_AUDIT.txt` | CHARMS_BASETYPE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V083_MISC_GOLD_KEYS_AUDIT.txt` | MISC_GOLD_KEYS_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V084_PERSONAL_CUSTOM_SOUND_AUDIT.txt` | PERSONAL_CUSTOM_SOUND_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V085_UNIQUE_WEAPONS_BASETYPE_AUDIT.txt` | UNIQUE_WEAPONS_BASETYPE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V086_UNIQUE_NS_LEGEND_AUDIT.txt` | UNIQUE_NS_LEGEND_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V087_UNIQUE_WEAPON_TIER_AUDIT.txt` | UNIQUE_WEAPON_TIER_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V092_OTHER_UNIQUES_AUDIT.txt` | OTHER_UNIQUES_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V094_EXCEPTIONAL_8_AUDIT.txt` | EXCEPTIONAL_8_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V095_GEAR_EDITOR_AUDIT.txt` | GEAR_EDITOR_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V098_NORMAL_BASETYPE_HIERARCHY_AUDIT.txt` | NORMAL_BASETYPE_HIERARCHY_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V099_NORMAL_ITEMLEVEL_PRIORITY_AUDIT.txt` | NORMAL_ITEMLEVEL_PRIORITY_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V103_RESET_PREVIEW_SOUND_AUDIT.txt` | RESET_PREVIEW_SOUND_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V104_NEVERSINK_STRICTNESS_SELECTOR_AUDIT.txt` | NEVERSINK_STRICTNESS_SELECTOR_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V105_NEVERSINK_SELECTOR_VISIBLE_AUDIT.txt` | NEVERSINK_SELECTOR_VISIBLE_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V106_NEVERSINK_BASELINE_RULES_AUDIT.txt` | NEVERSINK_BASELINE_RULES_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V107_NEVERSINK_BASELINE_INDEX_AUDIT.txt` | NEVERSINK_BASELINE_INDEX_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V107_NEVERSINK_ORIGINALS_AND_BASELINE_AUDIT.txt` | NEVERSINK_ORIGINALS_AND_BASELINE_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V108_NEVERSINK_UI_LINK_AUDIT.txt` | NEVERSINK_UI_LINK_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V109_NEVERSINK_DIRECT_MAPPING_AUDIT.txt` | NEVERSINK_DIRECT_MAPPING_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V110_NEVERSINK_CHECKBOX_RULE_AUDIT.txt` | NEVERSINK_CHECKBOX_RULE_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V111_RARE_MAGIC_EXCEPTIONAL_RULE_AUDIT.txt` | RARE_MAGIC_EXCEPTIONAL_RULE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V112_FILTER_EXPORT_ENGINE_AUDIT.txt` | FILTER_EXPORT_ENGINE_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V113_GEAR_IMPORTANCE_LOCAL_PRESET_AUDIT.txt` | GEAR_IMPORTANCE_LOCAL_PRESET_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V114_EXPORT_BUTTON_VISIBLE_AUDIT.txt` | EXPORT_BUTTON_VISIBLE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V115_EDIT_TARGET_SELECTOR_AUDIT.txt` | EDIT_TARGET_SELECTOR_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V116_BASE_LINK_RESTORE_AUDIT.txt` | BASE_LINK_RESTORE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V117_BASE_UI_LINK_AUDIT.txt` | BASE_UI_LINK_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V118_CURRENT_FILTER_SINGLE_SOURCE_AUDIT.txt` | CURRENT_FILTER_SINGLE_SOURCE_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V119_CURRENT_STATE_SINGLE_SOURCE_AUDIT.txt` | CURRENT_STATE_SINGLE_SOURCE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V120_SELECTED_FILTER_LIST_LINK_AUDIT.txt` | SELECTED_FILTER_LIST_LINK_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V121_SELECTED_FILTER_ACTUAL_STATUS_LINK_AUDIT.txt` | SELECTED_FILTER_ACTUAL_STATUS_LINK_AUDIT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V122_CONDITIONAL_TOGGLE_AUDIT.txt` | CONDITIONAL_TOGGLE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V123_NS_CONDITIONAL_ONLY_NO_MIDDLE_AUDIT.txt` | NS_CONDITIONAL_ONLY_NO_MIDDLE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V124_UNIQUE_NORMAL_IMPORTANCE_SOUND_AUDIT.txt` | UNIQUE_NORMAL_IMPORTANCE_SOUND_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V125_NORMAL_VISIBILITY_RESOLVER_AUDIT.txt` | NORMAL_VISIBILITY_RESOLVER_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V126_LINK_ENGINE_PRESET_CURRENCY_AUDIT.txt` | LINK_ENGINE_PRESET_CURRENCY_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V127_ZIP_INSTALL_GUIDE_FIX_AUDIT.txt` | ZIP_INSTALL_GUIDE_FIX_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V128_DIVINE_SOUND_EXPORT_FIX_AUDIT.txt` | DIVINE_SOUND_EXPORT_FIX_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V129_COMMON_LINK_ROUTING_UNCUT_FIX_AUDIT.txt` | COMMON_LINK_ROUTING_UNCUT_FIX_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V131_RARE_MAGIC_INSTALL_AUDIT.txt` | RARE_MAGIC_INSTALL_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V132_RARE_MAGIC_EXPORT_VISIBILITY_AUDIT.txt` | RARE_MAGIC_EXPORT_VISIBILITY_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V133_CHECKBOX_EXPORT_STICKY_AUDIT.txt` | CHECKBOX_EXPORT_STICKY_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V134_ORIGINAL_WEB_EXPORT_1TO1_AUDIT.txt` | ORIGINAL_WEB_EXPORT_1TO1_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V135_ORIGINAL_CHECKBOX_SOURCE_OF_TRUTH_AUDIT.txt` | ORIGINAL_CHECKBOX_SOURCE_OF_TRUTH_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V136_1TO1_FULL_VERIFICATION_AUDIT.txt` | 1TO1_FULL_VERIFICATION_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V137_SAVE_PERSISTENCE_INSTALL_COMMIT_AUDIT.txt` | SAVE_PERSISTENCE_INSTALL_COMMIT_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V138_NORMAL_SEARCH_AUDIT.txt` | NORMAL_SEARCH_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V139_VERCEL_TYPESCRIPT_BUILD_FIX_AUDIT.txt` | VERCEL_TYPESCRIPT_BUILD_FIX_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V140_VERCEL_SEGMENT_CONFIG_FIX_AUDIT.txt` | VERCEL_SEGMENT_CONFIG_FIX_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V141_SIDEBAR_KO_PRIMARY_AUDIT.txt` | SIDEBAR_KO_PRIMARY_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V142_EXPORT_SAVE_GUIDE_UI_AUDIT.txt` | EXPORT_SAVE_GUIDE_UI_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V143_GUIDE_PAGE_AUDIT.txt` | GUIDE_PAGE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V144_FEEDBACK_EMAIL_AUDIT.txt` | FEEDBACK_EMAIL_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V145_RISENNE_SOUND_PACK_AUDIT.txt` | RISENNE_SOUND_PACK_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V146_RISENNE_ONAKA_SOUND_AUDIT.txt` | RISENNE_ONAKA_SOUND_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V147_HIDE_NS_RULE_PATH_AUDIT.txt` | HIDE_NS_RULE_PATH_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V149_NINJA_CHARACTER_DATA_LOCAL_TEST_AUDIT.txt` | NINJA_CHARACTER_DATA_LOCAL_TEST_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V150_POB_ITEM_IMAGE_HOVER_DYNAMIC_JEWELS_AUDIT.txt` | POB_ITEM_IMAGE_HOVER_DYNAMIC_JEWELS_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V151_POB_FLASK_CHARM_SLOT_FIX_AUDIT.txt` | POB_FLASK_CHARM_SLOT_FIX_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V152_POB_EQUIPMENT_ARRAY_FLASK_CHARM_FIX_AUDIT.txt` | POB_EQUIPMENT_ARRAY_FLASK_CHARM_FIX_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V153_NINJA_RAW_INVENTORY_DEBUG_AUDIT.txt` | NINJA_RAW_INVENTORY_DEBUG_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V154_POB_ROOT_FLASKS_IMPORT_AUDIT.txt` | POB_ROOT_FLASKS_IMPORT_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V156_POB_NINJA_SKILL_DPS_IMPORT_AUDIT.txt` | POB_NINJA_SKILL_DPS_IMPORT_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V157_POB_WEAPON_SET_TOGGLE_NATIVE_IMAGE_AUDIT.txt` | POB_WEAPON_SET_TOGGLE_NATIVE_IMAGE_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V158_NINJA_DYNAMIC_CHARACTER_STATS_AUDIT.txt` | NINJA_DYNAMIC_CHARACTER_STATS_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V159_SIMULATION_SPLIT_TRADE_SLOT_UI_AUDIT.txt` | SIMULATION_SPLIT_TRADE_SLOT_UI_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V162_CHARACTER_PORTRAIT_EXACT_MAPPING_AUDIT.txt` | CHARACTER_PORTRAIT_EXACT_MAPPING_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V163_NINJA_DIRECT_PORTRAIT_SOURCE_AUDIT.txt` | NINJA_DIRECT_PORTRAIT_SOURCE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V164_CHARACTER_HEADER_PORTRAIT_ANCHOR_AUDIT.txt` | CHARACTER_HEADER_PORTRAIT_ANCHOR_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V165_CHARACTER_PORTRAIT_VISIBLE_HEADING_ANCHOR_AUDIT.txt` | CHARACTER_PORTRAIT_VISIBLE_HEADING_ANCHOR_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V166_NINJA_ASCENDANCY_PORTRAIT_URL_AUDIT.txt` | NINJA_ASCENDANCY_PORTRAIT_URL_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V167_GA4_POE_STREAM_AUDIT.txt` | GA4_POE_STREAM_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V168_GA4_POE2_PROPERTY_AUDIT.txt` | GA4_POE2_PROPERTY_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V169_GA4_TAG_RESTORE_AUDIT.txt` | GA4_TAG_RESTORE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V170_ENABLE_NINJA_DETAIL_PRODUCTION_AUDIT.txt` | ENABLE_NINJA_DETAIL_PRODUCTION_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V171_START_GUIDE_EXTENSION_AUDIT.txt` | START_GUIDE_EXTENSION_AUDIT | 미확인 | Chrome 확장프로그램·연동 변경 시 |
| `V172_TRADE_EXTENSION_V001_AUDIT.txt` | TRADE_EXTENSION_V001_AUDIT | 미확인 | Chrome 확장프로그램·연동 변경 시 |
| `V173_TRADE_EXTENSION_V002_MOD_OBJECT_AUDIT.txt` | TRADE_EXTENSION_V002_MOD_OBJECT_AUDIT | 미확인 | Chrome 확장프로그램·연동 변경 시 |
| `V174_TRADE_EXTENSION_V003_AUDIT.txt` | TRADE_EXTENSION_V003_AUDIT | 미확인 | Chrome 확장프로그램·연동 변경 시 |
| `V175_POB2_HEADLESS_ENGINE_PHASE0_AUDIT.txt` | POB2_HEADLESS_ENGINE_PHASE0_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V176_POB2_AUTO_LUAJIT_AUDIT.txt` | POB2_AUTO_LUAJIT_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V180_RUNTIME_FILENAME_FIX.txt` | RUNTIME_FILENAME_FIX | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V182_POB2_FRAME_CALC_AUDIT.txt` | POB2_FRAME_CALC_AUDIT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V187_WEB_GEAR_DELTA_SCOPE.txt` | WEB_GEAR_DELTA_SCOPE | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V188_WEB_ENGINE_LAB_SCOPE.txt` | WEB_ENGINE_LAB_SCOPE | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V193_TEST_SCOPE.txt` | TEST_SCOPE | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V194_TEST_SCOPE.txt` | TEST_SCOPE | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V197_ENGINE_WORK_NOTES.txt` | ENGINE_WORK_NOTES | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V198_CALC_TRACE_AUDIT.txt` | CALC_TRACE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V198_ORIGINAL_FIRST_AUDIT.txt` | ORIGINAL_FIRST_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V199_ENGINE_GATE_STATUS.txt` | ENGINE_GATE_STATUS | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V201_TEST_README.txt` | TEST_README | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V207_ARCHITECTURE_AND_TESTS.txt` | ARCHITECTURE_AND_TESTS | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V208_SKILL_WEAPON_SOURCE_AUDIT.txt` | SKILL_WEAPON_SOURCE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V209_SKILL_CHANGE_AUDIT.txt` | SKILL_CHANGE_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V210_EXPORT_VALIDATION.txt` | EXPORT_VALIDATION | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V211_RUNE_BONDED_AUDIT.txt` | RUNE_BONDED_AUDIT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V214_FILTER_SAFETY_TEST_REPORT.txt` | FILTER_SAFETY_TEST_REPORT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V215_FILTER_FIX_TEST_REPORT.txt` | FILTER_FIX_TEST_REPORT | 미확인 | 필터 데이터·기본값·다운로드 변경 시 |
| `V216_GEM_SOUND_FIX_REPORT.txt` | GEM_SOUND_FIX_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V217_UNCUT_GEM_BASETYPE_FIX_REPORT.txt` | UNCUT_GEM_BASETYPE_FIX_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V219_NINJA_PROFILE_UNICODE_FIX_REPORT.txt` | NINJA_PROFILE_UNICODE_FIX_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V221_POB2_FRAME_SETTLE_REPORT.txt` | POB2_FRAME_SETTLE_REPORT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V222_GUIDES_CONTENT_REPORT.txt` | GUIDES_CONTENT_REPORT | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V225_POB_NATIVE_INTEGRITY_REPORT.md` | POB_NATIVE_INTEGRITY_REPORT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V226_RING_SLOT_FIX_REPORT.txt` | RING_SLOT_FIX_REPORT | 미확인 | PoB 원본 계산·WASM·반지 회귀 시 |
| `V227_PATCH_NOTES.txt` | PATCH_NOTES | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V228_PATCH_NOTES.txt` | PATCH_NOTES | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V229_PATCH_NOTES.txt` | PATCH_NOTES | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V230_PATCH_NOTES.txt` | PATCH_NOTES | 미확인 | 해당 기능 변경·검증·오류 재발 시 |
| `V231_PATCH_NOTES.txt` | PATCH_NOTES | 미확인 | 해당 기능 변경·검증·오류 재발 시 |

실제 파일 목록 대조: 143개 (2026-10-26). 기타 참고 문서/스크립트는 원본 프로젝트 내 보존.

| `engine/pob2/V184_README.txt` | V184 · poe.ninja PoB 내보내기 Base64/XML 디코드 준비 단계, 실제 캐릭터 계산 불가 기록 | 원문 날짜 미확인 | ninja Import/원본 XML 준비·엔진 연결 변경 시 |
| `engine/pob2/V185_README.txt` | V185 · Windows 로컬 캐릭터 계산 시험 절차, 웹 연결 미완료 한계 | 원문 날짜 미확인 | native headless/Cloudflare 호환성·캐릭터 가져오기 변경 시 |

- 2026-11-05 · V239 · 메인 히어로 재구성 2차 (시안 비율 재반영, 배경/폭/균형 재조정)
