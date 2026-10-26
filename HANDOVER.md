# FIXLGS POE2 프로젝트 인수인계

## 1. 프로젝트 목적과 현재 유효한 설계 원칙
- **사용자 확정**: `poe2.fixlgs.com`으로 Path of Exile 2 도구를 이전해 독립 운영한다(이전 주소 `poe.fixlgs.com`의 리디렉션은 실제 전환 시 별도 검증). 일상 관리 0, 유지비 0을 우선하며, 본체 `fixlgs.com`과 독립된 서브도메인 구조를 유지한다.
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

## 3. 최신 구현 상태 (2026-10-26, V234, Cloudflare 두 번째 시험 배포 원인 수정)
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
- 보관 자료/과거 보고서 색인: `docs/handover/INDEX.md` (기존 보고서 145개 색인, 루트 143개 및 엔진 내부 2개). `docs/handover/HISTORY_V*.md` 분리본은 현재 없음.

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
0. Cloudflare Workers `fixlgs-poe2`의 **Build command를 `npm run build:cloudflare`로 설정**, 자동 OpenNext 변환 구조 유지. 배포 명령은 현재 성공적으로 자동 OpenNext를 호출한 `npx wrangler deploy`를 우선 유지. GitHub에 수정이 반영된 후 새 빌드를 실행. `poe2.fixlgs.com` 연결은 기능 검증 후.
1. 로컬/CI에서 정상 인터넷으로 `npm ci` 후 `npm run build` 실행. `/pob`와 `/guides/pob/getting-started` 및 가이드 하위 경로가 정상 렌더링되는지 확인.
2. `/pob`의 웹스토어 설치 버튼이 실제 공개 페이지로 열리는지 검증하고 Vercel 배포 후 실사이트에도 반영됐는지 확인.
3. 사용자가 별도로 요청하기 전에는 이번 작업 범위 밖의 PoB 계산 로직·NeverSink 필터·기존 확장프로그램 V0.4.6 소스를 변경하지 않음.

## 6. 실행 및 확인 방법
- 프로젝트 루트에서 `npm ci` → `npm run dev` → 브라우저 `http://localhost:3000/pob` 및 `http://localhost:3000/guides/pob/getting-started`.
- 빌드: `npm run build`.
- 링크·가이드 회귀 검사: `node scripts/test-v232-extension-guide.cjs`.
- 기존 계산 관련 회귀 검사: `node scripts/test-v210-contract.cjs`, `node scripts/test-v211-rune-contract.cjs`, `node scripts/test-v225-comparison-guard.cjs`, `node --experimental-strip-types scripts/test-v226-ring-slots.cjs`, `node scripts/test-v228-skill-display.cjs`, `node scripts/test-v229-weapon-skill.cjs`.
- Native WASM 테스트: `node scripts/test-v225-native-wasm.mjs`, `node scripts/test-v231-breach-ring-wasm.mjs`.

## 7. 주요 파일 및 과거 기록
- 설치 버튼: `src/app/pob/page.tsx`.
- 사용 가이드 데이터: `src/lib/pobGuides.ts`.
- 새 가이드 라우트: `src/app/guides/pob/[slug]/page.tsx`.
- 이번 회귀 검사: `scripts/test-v232-extension-guide.cjs`.
- 이전 구현 보고서: 루트의 `V225_POB_NATIVE_INTEGRITY_REPORT.md`, `V226_RING_SLOT_FIX_REPORT.txt` ~ `V231_PATCH_NOTES.txt`와 이전 `V*.txt` 파일.
- 별도 `docs/handover/HISTORY_V*.md` 파일 없음. 이력 분리 조건 미충족. 실제 이전 보고서를 보관 이력으로 가장하거나 삭제하지 말 것.

## 8. 누적 작업 이력
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
