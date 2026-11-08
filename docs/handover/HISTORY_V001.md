# HISTORY V001 — 과거 작업 이력 보관 (V232~V238, 2026-10-14~2026-11-05)

- 보관일: 2026-11-08. 분리 직전 HANDOVER.md 원문의 작업 이력만 아래에 그대로 보존함.
- 해당 시점의 기준·검증을 현재 완료된 사실로 다시 적용하지 말 것. 최신 상단 기준 우선.
- **재열람 조건**: 홈페이지 시안과 실제 화면 차이(V238), Cloudflare 25MiB/Worker 이름/lockfile(V233~V236), 도메인(V235), Chrome 안내(V232), FILTER/POB 및 영상 순서(V237) 재작업·오류 발생 시.

### 2026-11-05 · V238 · 홈 시네마틱 데이터 플랫폼 전면 개편 (로컬 소스만)
- **사용자 판단**: 기존 대형 캐릭터 이미지·작은 로고·우선 노출 유튜브가 통합 플랫폼 분위기와 맞지 않음. FILTER/POB는 첫 화면에서 동일한 규모로 강조하고 아이템 시세는 별도 주요 콘텐츠로, 전체는 세로로 웅장하게 이어지게 설계. 불꽃은 과하지 않게 배경의 먼 불빛·드문 불씨로 한정.
- **변경 전후/영향**: 기존 V237의 캐릭터 풀스크린 히어로·고립된 게임 로고·오래 누적된 불꽃 렌더 컴포넌트 사용 → `src/app/page.tsx` 메인 DOM만 새로 구성하고 `src/app/globals.css` 최하단에 `poe-v238-*` 네임스페이스 전용 스타일 추가. 기존 로컬 배경 `public/images/poe2/video-sky-bg.jpg`를 사용; 새 외부 서비스/에셋 없음. 도구 진입 링크·기존 이용 안내·가이드 링크·영상 갤러리 컴포넌트·원본 영상 4개·푸터 고지 보존. MENU → 두 도구 같은 크기의 HERO → 시세 준비 영역(가상 시세 없음) → 가이드 → 영상 → 푸터.
- **재발 방지**: 이전 CSS에 홈 애니메이션/레이아웃 규칙이 많아 이 버전은 메인 전용 CSS 선택자로 격리. 기존 필터/PoB 코드 내부와 배포 설정을 건드리지 않음. 공개 시 브라우저의 PC/모바일 레이아웃, iframe 배치·재생, 페이지 앵커, 성능·색 대비를 실제 검증할 것.
- **실제 검증**: `node scripts/test-v238-home-redesign.cjs`, `node scripts/test-v237-home-order.cjs`(V238 DOM 클래스 변경에 맞게 선택자 탐색 보정), V235 도메인, V236 파이프라인, V234 Worker 이름, V232 웹스토어 안내, 필터 회귀 검사 통과. 코드 정적 검사이므로 실제 렌더/버튼 클릭 검사는 아님.
- **미실행/미검증**: 기존 V236 lockfile 불일치로 `npm ci`·Next.js/Cloudflare 실빌드, 실제 PC/모바일 브라우저 렌더·영상 재생 및 원격 배포는 미수행. V235 운영 계속 유지.

### 2026-11-05 · V236 · Cloudflare 중복 빌드 제거 준비 (정식 배포 보류)
- **근거**: 사용자가 제공한 V235 실제 배포 로그에는 Wrangler 실행 시 설정 파일 없음 → 자동 마이그레이션, 약 251개 새 패키지 설치, Next.js 재빌드, OpenNext 호환 경고와 빌드 캐시 누락이 확인됨. 전체 배포 화면은 5분 7초 성공으로 확인.
- **이전/이후**: `npm run build:cloudflare`는 Next 빌드만 하고 `npx wrangler deploy`가 OpenNext를 재설치·자동 설정하며 두 번째 빌드 → 설정 파일을 Git에서 관리하고 한 번의 OpenNext 빌드만 실행, 배포는 재빌드 없이 생성 번들만 배포하도록 설계. 기존 Worker 명/경로/사용자 도메인은 유지하며 홈페이지 코드·계산/필터 데이터는 수정하지 않음.
- **수정 파일**: `package.json`, `.gitignore`, `scripts/prepare-cloudflare-assets.cjs`의 배포 설명 주석, `scripts/test-v233-cloudflare-assets.cjs`, `scripts/test-v234-worker-name.cjs`의 기존 테스트 기대값, 새 `wrangler.jsonc`, `open-next.config.ts`, `scripts/build-cloudflare.cjs`, `scripts/test-v236-cloudflare-pipeline.cjs`, `scripts/verify-v236-cloudflare.ps1`, `HANDOVER.md`, `docs/handover/INDEX.md`. 기존 HISTORY와 보고서 원문은 그대로 보존.
- **과거 교훈 적용**: V233의 정적 자산 25MiB 제한을 넘지 않도록 기존 43MiB JSON의 gzip staging을 유지하고 빌드 종료/실패 시 원본 복원을 보장. V234의 Worker 10143 이름 불일치를 막도록 `WORKER_SELF_REFERENCE.service`와 Worker 이름을 정확히 일치시킴. R2/유료 서버·기능 변경 없이 무관리 구조 우선.
- **검증**: `node scripts/test-v236-cloudflare-pipeline.cjs`, V233 gzip 회귀, V234 이름, V235 도메인, V232 웹스토어 회귀가 통과. Node 기반 모의 `build-cloudflare` 성공/실패 실행 양쪽에서 43MiB 원본 SHA 보존과 marker/gzip 잔존 없음 확인. 원본 코드 바이트 보존 및 ZIP 무결성 검사를 결과물 단계에서 확인.
- **미검증/제약**: 네트워크 차단 `EAI_AGAIN` 때문에 `package-lock.json` 갱신·npm ci·Next/OpenNext 전체 빌드 미실시. GitHub 연결은 시험 브랜치 생성 API에서 403 오류로 권한 부족; 원격 푸시/배포 미실행. 현재 V235 프로덕션은 보존됨. 다음 단계는 신뢰 가능한 npm 네트워크에서 lock 재생성·npm ci·실빌드 성공 후 git push이며, 버전 업으로 인한 기능 회귀 여부는 별도 검증 필요. 이전 V235의 5분 7초보다 빨라질 것으로 기대되지만 속도 개선율은 실측 전 추정임.

### 2026-11-05 · V235 · 정식 도메인 주소 정리와 Cloudflare 이전 상태 정정
- **배경/사용자 확정**: POE 필터는 이미 POE2 Worker의 `/filter`에 포함되므로 `poe.fixlgs.com`을 별도 유지하는 것이 불필요함을 확인했다. 잠시 두 주소를 연결한 것은 운영 의도를 잘못 해석한 결과였고, 사용자는 구주소 연결 제거 완료를 보고했다. 301 리디렉션은 만들지 않기로 결정.
- **수정 전후**: 원래 소스의 사이트맵/robots/메타데이터·개인정보처리방침에서 구주소를 광고/검색 정식 주소로 쓰던 구조 → `poe2.fixlgs.com` 하나로 통일. 개인정보처리방침의 호스팅 사업자 표기도 현 운영 Cloudflare로 정정. 과거 V234 문서의 배포 실패 기술은 당시 발생했던 오류로 보존하되, 상단에 이후 배포 성공 사실을 추가해 최신 운영 상태와 분리했다.
- **영향 파일**: `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/privacy/site/page.tsx`, `scripts/test-v235-poe2-domain.cjs`, `HANDOVER.md`, `docs/handover/INDEX.md`. 게임 계산/필터/사운드, 원본 데이터, 확장프로그램 코드·GitHub/Cloudflare 실제 배포는 변경하지 않음.
- **재발 방지**: 구주소를 신규 Worker나 정식 도메인으로 다시 추가하지 말 것. SEO URL 변경은 네 곳을 함께 수정해 회귀 테스트로 확인할 것. 사용자 화면의 DNS/도메인 접속 확인은 코드 빌드/계산/필터 기능 검증과 구별할 것.
- **실제 검증 (2026-11-05 · V235)**: `node scripts/test-v235-poe2-domain.cjs`, `node scripts/test-v234-worker-name.cjs`, `node scripts/test-v232-extension-guide.cjs`, `node scripts/test-v233-cloudflare-assets.cjs`, V210/V211/V225/V226(필요한 `--experimental-strip-types` 옵션 적용)/V228/V229/필터 `filter-regression.cjs` 검사 모두 통과. V226을 옵션 없이 실행하면 Node 22의 `.ts` 의존성 처리 오류로 실패했으며, 기존 문서에 명시된 옵션을 적용해 29개 검사 통과를 확인했다. **이는 코드와 데이터의 특정 회귀 검사이며 실제 배포 테스트가 아니다.** 원본 기존 보고서 145개 색인 파일 존재 검사와 변경 파일 외 소스 바이트 보존 검사, 최종 ZIP 무결성 검사는 결과물 생성 단계에서 별도로 검사했다.
- **미실행·미검증**: 전체 Next.js `npm ci`/프로덕션 빌드, 브라우저/모바일/게임 내부 기능, Cloudflare 재배포와 운영 URL SEO 확인은 미수행. 장시간 소요되는 일부 회귀 시험은 일괄 실행 시간 제한으로 중단하고, 위에 명시된 별도 검사를 재실행했다. 위의 V234 배포·접속 성공 기록을 이번 V235 코드의 배포 성공으로 보고하지 않는다.

### 2026-10-14 · V232 · Chrome 웹스토어 설치와 PoB 가이드 라우트
- 이유: 기존 `/pob` 설치 버튼이 제공되지 않은 ZIP 다운로드 경로로 연결되었으며, PoB 가이드 데이터는 존재했지만 상세 페이지 라우트가 빠져 있었음.
- 변경: `src/app/pob/page.tsx`에서 공개 크롬 웹스토어 주소로 전환, `src/lib/pobGuides.ts` 웹스토어 설치 안내 및 링크 정비, `src/app/guides/pob/[slug]/page.tsx` 생성, `scripts/test-v232-extension-guide.cjs` 생성.
- 기록: 이번 전달본은 원래 소스 중 위 관련 부분만 수정했으며 PoB 원본 계산/필터/확장프로그램 소스는 변경하지 않음.
- 검증: 링크 회귀 9개, 변경 코드 구문 검사, 기존 V210~V231 회귀·Native WASM 테스트 통과. 전체 Next 빌드와 브라우저/배포 확인은 npm 패키지 접근 실패로 미수행.
- 미해결: 정상 네트워크에서 빌드하고 실사이트와 설치 링크 직접 클릭 확인 필요.

### 2026-10-26 · V233 · Cloudflare 첫 배포 Asset too large 원인 제거 준비
- **실제 로그 기반 원인**: Next.js 빌드/정적 페이지 생성/OpenNext Worker 번들은 성공했지만 Cloudflare 배포 단계에서 43MiB `pob-lua.json`을 25MiB 정적 자산 한도로 거부함.
- **변경 전후**: 원본 JSON을 곧바로 공개하는 방식 → Cloudflare 빌드에 한해 gzip 자산으로 대체하고 Web Worker에서 복원. 원본 JSON 파일, 공식 PoB Lua 수치·WASM 및 기존 Vercel 빌드 명령은 보호.
- **구현/영향**: `src/app/pob/web-engine/calc-worker.ts`, `package.json`, `scripts/prepare-cloudflare-assets.cjs`, `scripts/test-v233-cloudflare-assets.cjs`; 관련 `docs/handover/INDEX.md` 생성. Cloudflare 단계에서만 임시 이동; 로컬 복구는 `npm run restore:cloudflare-assets`.
- **실제 검증**: 43MiB 원본(45,082,029 바이트)의 997개 Lua 파일, 원본 SHA-256 `a4183b98e08dacb257ab47652d76ff675790e3a287637d4e28119db1589c911e`; gzip 크기 4,858,503 바이트로 변환·복원 SHA 일치. 실제 stage/restore 파일 복구 확인. 기존 V210/V211/V225/V226/V228/V229/V230/V232 계약 테스트 실행 결과 통과. 전체 Next.js 패키지 설치/신규 Cloudflare 빌드·실서비스 동작은 미검증.
- **남은 위험**: OpenNext 버전 경고, native headless 서버 기능/동적 트레이싱, 웹 WASM 초기화 및 자산의 실제 HTTP 헤더/브라우저 지원을 Worker 환경에서 재검증. 무료 Worker 25MiB 파일 제한은 그대로 적용.

### 2026-10-26 · V234 · Cloudflare WORKER_SELF_REFERENCE 오류 10143 대응
- **실제 로그**: `npm run build:cloudflare` 및 84개 정적 파일 업로드 성공 후 Wrangler가 `WORKER_SELF_REFERENCE → fix-pob` service binding을 참조하면서 `code:10143`로 최종 Worker 등록 실패.
- **원인 가설 / 최소 수정**: 운영 Worker 명 `fixlgs-poe2`와 패키지 식별명 `fix-pob` 간 불일치가 자동 OpenNext 설정에 전달된 것으로 판단. Vercel `main` 및 프로젝트 기능에는 영향을 주지 않도록 별도 Cloudflare 시험 브랜치에서 `package.json` / `package-lock.json`의 루트 이름만 `fixlgs-poe2`로 변경. 이름 불일치 회귀 검사 추가, 나머지 계산 로직·데이터·엔진은 보존.
- **확인된 사실 / 한계**: Cloudflare 공식 OpenNext 문서는 `WORKER_SELF_REFERENCE.service`와 Worker 이름이 같아야 함을 명시. 자동 마이그레이션의 패키지명 참조는 로그 기반 가설로서 V234 재배포 결과로 검증해야 함. 로컬 구성 검증과 Git diff/ZIP 무결성 검사만 수행한 단계이며 실제 온라인 배포 결과는 미확인.
- **재발 방지**: 후속 배포 로그에서 자기 참조 대상 Worker 이름 검증. 빌드 재시도 전에 불일치 없는지 확인. 자동 생성 실패가 반복되면 명시적 `wrangler.jsonc` 및 adapter 빌드 단계를 설계하되 현 16.3.5 버전 호환 경고를 먼저 해결한다.

### 2026-11-05 · V237 · 메인 FILTER 우선 및 공식 영상 하단 재배치 (소스 수정, 배포 전)
- **사용자 확정**: FILTER가 PoB보다 핵심 도구이므로 메인 도구 진입 및 메뉴에서 FILTER를 첫 번째로 표시한다. 상단 유튜브 공식 영상 4개는 메인 히어로/기존 이용 안내 아래, 푸터 직전으로 내린다. 아이템 시세는 도구가 아닌 향후 콘텐츠로 다루며 이번 버전에서는 새 시세 기능을 만들지 않는다.
- **전후 차이**: 상단 메뉴 → 영상 4개 → PoB/FILTER 히어로 → 이용 안내 → 푸터에서, 상단 메뉴 → FILTER/POB 히어로 → 이용 안내 → 영상 4개 → 푸터로 변경. 기존 영상 4개 데이터 원천/컴포넌트/재생 로직·링크·배경·광고 자리·필터/PoB 페이지는 유지한다. 메인 메뉴와 푸터의 FILTER도 POB보다 앞에 표시한다.
- **영향 파일**: `src/app/page.tsx` (배치와 순서), `src/app/globals.css` (과거 섹션 순서를 가리키던 주석만 수정), `scripts/test-v237-home-order.cjs` (신규 위치/순서 계약 검사), `HANDOVER.md`, `docs/handover/INDEX.md`. 과거 보고서 원본 및 기존 HISTORY 파일은 수정하지 않는다.
- **과거 교훈 적용**: V235/V236의 사용자 도메인·Worker 배포 대기 상태를 보존한다. 계산/필터·NeverSink 원본을 수정하지 않으며 V233 gzip 25MiB 한도, V234 Worker 자기참조 일치, V236 lockfile 불일치 해소 필요를 유지한다.
- **실제 검증**: `node scripts/test-v237-home-order.cjs`, V235 도메인, V232 확장 안내, V234 Worker 이름, V236 파이프라인, V233 gzip 자산, V225 비교 방어, 필터 `scripts/filter-regression.cjs` 검사 통과. 원본 대비 변경 파일 범위·기존 파일 보존 및 ZIP 무결성 검사 수행.
- **미검증**: Next.js 실빌드(`node_modules` 부재, V236 `package-lock.json` 불일치), PC/모바일 브라우저 렌더링, 공식 영상 실제 재생, Cloudflare 배포는 미실행. 기존 V236 npm lock 정합성 문제는 그대로이므로 배포 전 해소해야 한다. 홈 이동에 따른 실제 영상 자동재생/스크롤 시점은 실브라우저 확인 필요.


