# FIXLGS POE2 — 통합 홈페이지 (V258 빌드 오류 시정본)

최종 서비스 루트: `poe2.fixlgs.com`. **현재 ZIP은 로컬 통합본이며 운영 서버에는 배포하지 않았습니다.**

- 홈페이지 `/`: FIXLGS_POE2_HOME V019 확정 시안(8개 섹션·반응형·3개 영상·아이템 새소식 더미).
- FILTER `/filter`: V256 NeverSink 기반 필터 설정/저장/내보내기 엔진 원본 보존.
- POB `/pob`: V256 poe.ninja Import·공식 PoB Lua/WASM 계산·거래소 아이템 비교 원본 보존.
- 가이드: `/filter/guide`, `/guides/pob/getting-started`, `/guides/pob/dps`, `/guides`.
- 푸터 정책/문의: `/terms`, `/privacy/site`, `/contact` (현재는 V256의 사이트별 페이지이며 FIXLGS 공통 정책 URL로의 최종 전환은 후속 확정 필요).
- 뉴스의 기사 6개는 아직 실제 기사 미연결 **더미**이고, 6번 대표 아이템 이미지 8개는 외부 GitHub에 의존합니다.
- 최신 유튜브: V256 공식 채널 데이터(`src/lib/youtube.ts`, 30일 캐시)를 호출해 3개 영상 카드에 공급합니다. 실제 자동재생/갱신은 운영 환경에서 미검증입니다.

**V258 변경:** Next 16에서 `/pob` 페이지의 비허용 함수 export로 인해 실패한 타입 검사를 시정했습니다. 이전 정책에서 생성되던 `robots.txt` 및 `sitemap.xml`은 현재 사용자 결정에 따라 제거했습니다. 기존 폴더 위에 ZIP을 덮어쓸 때 두 이전 소스 파일은 직접 삭제해야 합니다. 실제 Next/OpenNext 빌드와 운영 배포는 미검증입니다.

## 주요 경로

- 최신 홈페이지: `src/app/page.tsx`, `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `src/app/V019Interactions.tsx`, `public/poe-home/`.
- 변환 전 원본 17개: `docs/design-reference/V019/` — 이전 기준, 원본 이미지, HISTORY 모두 그대로 보관.
- 엔진·원본 데이터: `src/app/{filter,pob}/`, `src/lib/`, `public/neversink/`, `public/sounds/`, `public/wasm/`, `public/data/`.
- 주 인수인계: `HANDOVER.md`, 과거 보관·감사 색인: `docs/handover/INDEX.md`.

## 확인 및 빌드 (현재 실행 환경에서 npm 설치 차단)

홈 정적 계약: `node scripts/test-v257-home-integration.cjs`

정상 인터넷이 가능한 개발/CI 환경에서만 다음 순서로 검증합니다. **배포 명령은 포함하지 않습니다.**

```bash
npm install --package-lock-only
npm ci
npm run build
npm run build:cloudflare
```

기존 `package-lock.json`의 Next 16.3.5와 package.json Next 16.4.5가 달라 `npm ci` 전에 lockfile 갱신이 필요합니다. 검증 완료 전 운영 사이트에 교체 배포하지 마세요.

V258 정적 검증: `node scripts/test-v258-build-readiness.cjs` 및 `node scripts/test-v229-weapon-skill.cjs`. 사용자 PC에서 이미 갱신된 잠금 파일은 제공되지 않아 ZIP의 `package-lock.json`은 기존본입니다. 덮어쓴 경우 패키지 잠금 파일을 재갱신한 뒤 빌드를 재실행하세요.
