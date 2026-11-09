# HISTORY_V005 — V258~V259 작업 이력 (2026-11-08~2026-11-09)

- 확정 보관본. `HANDOVER.md` 40,000자 초과 시 가장 오래된 하단 작업 이력 두 건만 분리함.
- 현재의 유효한 결정/보호/검증/다음 작업은 `HANDOVER.md` 상단을 우선함.
- **재열람:** Next 16 POB 페이지 export 오류 재발, robots/sitemap 사용자 미제공 기준, PC/모바일 POB 디자인·가이드 카드 높이·장비 슬롯 CSS 회귀, 기존 V259 빌드 한계가 쟁점일 때.
- 아래 V258·V259의 중요한 오류·원인·해결·검증 기록은 원문 그대로 보존함(내용 축약/의미 변경 없음).

### 2026-11-09 · V259 · POB 전용 질감·시즌 중립 이미지 1차 개편
- 메인과 POB의 색·패널·빈 공간 질감 차이를 줄이기 위해 POB 전용 CSS를 추가하고 기존 레이아웃 파일에 import만 연결. 실제 영역 순서와 장비 좌표·계산/가져오기 코드는 보존. 기존 시즌 이미지 2곳을 보유 중인 범용 POE2 전투 원화로 교체, 표시 문구에서 시즌 언급 제거.
- 검증 중 1440px 시작 카드 높이 때문에 링크가 아래 패널과 겹치는 현상과 모바일 축소 슬롯 무표시를 발견해 POB CSS 범위에서만 보정. 기존 JSX에 CSS를 직접 import하면 V229 모의 테스트의 `require` 실패를 유발해 기존 메타데이터 유지 `layout.tsx` import로 변경, V229 재통과. 실앱의 실제 데이터·영상은 미검증.

### 2026-11-08 · V258 · POB Next 빌드 타입 오류 및 robots/sitemap 제거
- **근거:** 사용자 실제 OpenNext 빌드에서 `Next.js 16.4.5 Compiled successfully` 이후 `src/app/pob/page.tsx: buildMainSkillUi` TS2344로 실패. 해당 함수 export는 V229 테스트용으로 남아 있었으나 Next App Router 페이지 규약에 맞지 않음. Lua.mjs URL/Native `spawn` 트레이싱은 같은 로그의 경고이며 다른 원인으로 분리.
- **전후/영향:** 페이지 `export function buildMainSkillUi` → 내부 `function` (내용·호출·스킬 계산 그대로). `scripts/test-v229-weapon-skill.cjs`는 메모리 테스트 코드에만 export를 주입, 기존 DPS 그룹 식별 테스트를 계속 수행. 사용자 최신 결정에 따라 `robots.ts`/`sitemap.ts`는 삭제, `scripts/test-v235-poe2-domain.cjs`는 현재 도메인·메타데이터·사이트 정책을 검사하도록 수정, `scripts/test-v258-build-readiness.cjs` 추가. 과거 V235의 생성 결정은 당시 이력으로 보존, 현 정책 아님.
- **실행·검증:** TS AST 13개 페이지에서 불허 named export 0개, V258 새 검사, V229·V228·V226·V225 및 FILTER/홈/Cloudflare 정적 회귀 통과. V256 대비 V257 원본 엔진·디자인·배포 설정 변경 없음. 전체 `npm ci`/Next/OpenNext 프로덕션 빌드, 실제 Worker 재배포, live WASM·유튜브/네트워크 확인은 이 환경에서 미실행. 두 Turbopack 경고/headers overflow는 해결되지 않은 별도 항목으로 남김.
- **재발 방지:** `app/**/page.tsx`에 임의 named export를 재추가하지 않는다. 아카이브 ZIP을 기존 폴더에 덮어쓸 경우 오래된 `robots.ts`·`sitemap.ts`가 남으므로 배포 전 삭제하고 검사를 돌린다. 사용자 PC의 새 lockfile은 미제공이므로 ZIP의 이전 lockfile을 최신인 것처럼 보고하지 않는다.
