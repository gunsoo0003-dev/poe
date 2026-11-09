# FIXLGS POE2 — 통합 홈페이지 / FILTER 반응형 배경 V262

최종 서비스 루트: `poe2.fixlgs.com`. **V262 ZIP은 FILTER 디자인 로컬 수정본이며, 본 변경의 배포는 진행하지 않았습니다.** V258은 사용자 PC에서 OpenNext 빌드 성공 및 GitHub 푸시 `4f7aab7` 확인. Cloudflare 라이브 적용 여부는 미확인.

- 홈페이지 `/`: FIXLGS_POE2_HOME V019 확정 시안(8개 섹션·반응형·3개 영상·아이템 새소식 더미).
- FILTER `/filter`: V256 NeverSink 기반 필터 설정/저장/내보내기 엔진 원본 보존. **V262: 한 장의 범용 전투 사진을 전체 배경으로 사용하고, 콘텐츠 외부 좌우 여백만 선명하게 표시. 기존 밀집 행·큰 버튼·토글·폭·27개 카테고리는 유지.**
- POB `/pob`: 기존 poe.ninja Import·공식 PoB Lua/WASM 계산·거래소 아이템 비교 보존. **V259의 검정·적갈·청동 질감을 유지하고 V260에서 PC 전체 배경에 보유 POE2 아트를 적용하고 콘텐츠 폭을 확장**.
- 가이드: `/filter/guide`, `/guides/pob/getting-started`, `/guides/pob/dps`, `/guides`.
- 푸터 정책/문의: `/terms`, `/privacy/site`, `/contact` (현재는 V256의 사이트별 페이지이며 FIXLGS 공통 정책 URL로의 최종 전환은 후속 확정 필요).
- 뉴스의 기사 6개는 아직 실제 기사 미연결 **더미**이고, 6번 대표 아이템 이미지 8개는 외부 GitHub에 의존합니다.
- 최신 유튜브: V256 공식 채널 데이터(`src/lib/youtube.ts`, 30일 캐시)를 호출해 3개 영상 카드에 공급합니다. 실제 자동재생/갱신은 운영 환경에서 미검증입니다.

**V258 변경:** Next 16에서 `/pob` 페이지의 비허용 함수 export로 인해 실패한 타입 검사를 시정했습니다. 이전 정책에서 생성되던 `robots.txt` 및 `sitemap.xml`은 현재 사용자 결정에 따라 제거했습니다. 기존 폴더 위에 ZIP을 덮어쓸 때 두 이전 소스 파일은 직접 삭제해야 합니다. 이전 V258은 사용자 PC에서 Next/OpenNext 빌드 성공했지만 V260 추가 디자인 소스는 전체 빌드 미검증입니다.

**V260 POB PC 전용:** `src/app/pob/pob-v259-theme.css`에서 페이지 전체 배경 이미지와 최대 2100px 영역, 도구 로딩 후 화면 폭을 확장. 모바일(1050px 이하)과 엔진은 변경 없음. 로컬 확인 `npm run dev` → `http://localhost:3000/pob`. **이번 전체 ZIP은 오래된 `package-lock.json`을 의도적으로 제외**했으므로 기존 `D:\WebProjects\fix-pob`에 덮어쓰면 사용자 PC에서 빌드에 성공한 잠금 파일이 유지됨. 새 폴더에서 설치할 경우에는 `npm install --package-lock-only`로 잠금 파일을 먼저 생성해야 함.

**V261 FILTER 화면 전용:** `src/app/globals.css`의 FILTER 선택자만 수정해 92→70px 등급 행, 32→40px 중요도 버튼, 36×20→44×26px 토글과 무대형 이미지 배경을 적용했습니다. PC 1440px 이상 한 줄이며, 981~1350px에서는 버튼을 두 줄로 안전하게 배치합니다. V247 모바일 좌우 스크롤과 기존 데이터 동작은 유지했습니다. `package-lock.json`은 V260과 마찬가지로 ZIP에서 제외하므로 사용자가 별도로 삭제할 파일은 없습니다.

**V262 FILTER 좌우 여백:** 한 장의 임시 전투 이미지 `public/images/poe2/official-lightning-gameplay.webp`를 PC 풀 배경에 사용. 기존 중앙 `filter-v2-shell`이 반응형 어둠 마스크로 작동하므로 좌우 선명한 영역은 실제 남는 공간과 자동 일치함. 모바일(980px 이하) V261 배경/셸 유지. 1440px 50px/쪽, 1920px 70px/쪽, 2560px 390px/쪽으로 여백은 원래 콘텐츠 폭에 따라 좁게 보일 수 있음. 이미지 추후 재선택 가능, 다른 파일·데이터 무변경.

## 주요 경로

- 최신 홈페이지: `src/app/page.tsx`, `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `src/app/V019Interactions.tsx`, `public/poe-home/`.
- 변환 전 원본 17개: `docs/design-reference/V019/` — 이전 기준, 원본 이미지, HISTORY 모두 그대로 보관.
- 엔진·원본 데이터: `src/app/{filter,pob}/`, `src/lib/`, `public/neversink/`, `public/sounds/`, `public/wasm/`, `public/data/`.
- 주 인수인계: `HANDOVER.md`, 과거 보관·감사 색인: `docs/handover/INDEX.md`.

## 확인 및 빌드 (현재 실행 환경에서 npm 설치 차단)

홈 정적 계약: `node scripts/test-v257-home-integration.cjs`
POB 디자인 정적 계약: `node scripts/test-v259-pob-theme.cjs`
V260 PC 배경·폭 계약: `node scripts/test-v260-pob-wide-backdrop.cjs`
V261 FILTER 외형 계약: `node scripts/test-v261-filter-theme.cjs`
V262 좌우 여백·배경 계약: `node scripts/test-v262-filter-adaptive-wallpaper.cjs`

정상 인터넷이 가능한 개발/CI 환경에서만 다음 순서로 검증합니다. **배포 명령은 포함하지 않습니다.**

```bash
npm install --package-lock-only
npm ci
npm run build
npm run build:cloudflare
```

이 ZIP에는 오래된 `package-lock.json`을 포함하지 않았습니다. 기존 PC의 갱신된 파일을 그대로 쓰며, 프로젝트를 새로 설치할 때는 아래 `npm install --package-lock-only`로 새 파일을 먼저 생성합니다. 실제 V262 전체 Next/OpenNext 빌드와 배포는 미검증입니다.

V258 정적 검증: `node scripts/test-v258-build-readiness.cjs` 및 `node scripts/test-v229-weapon-skill.cjs`. 기존 PC의 정상 잠금 파일은 별도 백업·삭제가 불필요하며, 이번 ZIP을 덮어씌워도 해당 파일을 변경하지 않습니다.
