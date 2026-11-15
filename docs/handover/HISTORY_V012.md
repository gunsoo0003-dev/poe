# HISTORY_V012 — V236·V235 Cloudflare 이전·도메인 작업 원문

분리 시점: 2026-11-15, V267. 40,000자 초과에 따른 가장 오래된 세부 작업 이력 분리. 아래 V236/V235 블록은 주 문서 원문과 문자 단위로 대조해 그대로 보존한다. 현행 Cloudflare/도메인 기준은 `HANDOVER.md` 상단과 V263~V267 기록이 우선한다. 이 보관본은 이후 재정제·덮어쓰기하지 않는다.

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
### 과거 V234 운영·배포 실패 상세 원문은 `docs/handover/HISTORY_V009.md`로 보관. 이후 V234 성공 이력 및 V263/264 현행이 우선.

### Cloudflare 이전의 현재 기준
- **사용자 확정**: 기존 `gunsoo0003-dev/poe`의 웹사이트를 Cloudflare Workers 시험 배포한 후 `poe2.fixlgs.com`으로 연결한다. Vercel의 별도 `fixlgs-poe2` 프로젝트/도메인은 정상 검증 전까지 건드리지 않는다. 현재 Cloudflare 배포는 **실패 상태이며 아직 성공하지 않았다**.
- **실제 실패 로그**: 2026-10-26 Cloudflare `fixlgs-poe2` 빌드에서 Next.js 및 OpenNext 변환은 성공. 배포 중 `public/data/pob-lua.json` 크기 43MiB가 정적 파일 한도 25MiB를 초과하여 `Asset too large` 발생. Next.js 16.3.5 ↔ OpenNext 1.20.13 버전 경고와 서버 측 headless 동적 파일 트레이싱 경고도 있으나, 이 실패의 직접 원인은 자산 용량이다.
- **이번 변경 범위**: `scripts/prepare-cloudflare-assets.cjs`가 Cloudflare 빌드에 한해 원본 PoB Lua JSON을 gzip(약 4.6MiB)으로 생성하고 원본을 빌드 작업 디렉터리 바깥에 임시 보관한다. `src/app/pob/web-engine/calc-worker.ts`는 gzip 파일을 우선 가져와 브라우저 Web Worker의 `DecompressionStream`으로 복원하며, 기존 호스트에는 원본 JSON 조회를 유지한다. `package.json`의 원래 `build` 명령은 변경하지 않고 별도 `build:cloudflare`만 추가했다.
- **검증 필요**: GitHub에 변경된 코드 반영, Cloudflare Workers 빌드 설정의 명령을 `npm run build:cloudflare`로 변경, 시험 배포 재시도, `workers.dev`의 PoB/필터/API/모바일 실동작 확인. 자동 OpenNext 마이그레이션은 원격 빌드 중 수행되므로 실제 배포 성공은 보장되지 않음.
- Cloudflare 문서 기준: 개별 Worker 정적 자산은 25MiB까지 허용. 브라우저 gzip DecompressionStream은 널리 지원되지만 구형 브라우저는 별도 검증 필요. 근거: https://developers.cloudflare.com/workers/platform/limits/ ; https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream
- 신규 코드 경로: `scripts/prepare-cloudflare-assets.cjs`, `scripts/test-v233-cloudflare-assets.cjs`. 기존 계산·필터·확장프로그램 규칙/원본 엔진 및 데이터 바이트는 변경하지 않았다.
- 보관 자료/과거 보고서 색인: `docs/handover/INDEX.md` (기존 보고서 145개 색인, 루트 143개 및 엔진 내부 2개). 현재 확정 보관 이력은 `docs/handover/HISTORY_V001.md`(V232~V238)이며 최신 운영 기준은 본 문서 상단을 따른다.

### 이전 V232(2026-10-14) 상세 원문은 `docs/handover/HISTORY_V009.md`로 보관(최신 원칙은 상단).
