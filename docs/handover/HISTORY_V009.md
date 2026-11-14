# HISTORY_V009 — 2026-10-14~10-26 과거 이력 보관 (V232/V234 관련)

- **2026-11-14 · V264에서 분리:** 주 인수인계 40,000자 관리 기준을 초과하여 가장 오래된 기록부터 분리. 아래 각 구간은 분리 전 문자 그대로 보존하고 원문과 일치 검증됨. 이후 이 HISTORY는 재정제·수정 금지.
- **다시 읽을 조건:** Chrome 웹스토어 설치·가이드 원형(V232), 과거 Worker 배포/도메인·자기참조 오류 10143(V234), 또는 현재 운영 기준과의 불일치 검사. 현재 유효 정책은 HANDOVER.md 상단을 우선함.

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

### V234 최신 운영 상태 및 결정
- **실제 배포 로그 / 2026-10-26 두 번째 실패**: Cloudflare 빌드 `npm run build:cloudflare`에서 PoB 원본(45,082,029바이트)이 gzip(4,858,503바이트)으로 성공 변환. Next.js와 OpenNext Worker 빌드 완료, 정적 자산 84개 업로드 성공. Worker 최종 게시 시 `WORKER_SELF_REFERENCE`가 없는 `fix-pob` Worker를 바라봐 Cloudflare API 오류 `10143` 발생. 따라서 현재도 Cloudflare 온라인 배포는 실패 상태임.
- **원인과 재발 방지**: Cloudflare 실제 Worker 프로젝트는 `fixlgs-poe2`인데 OpenNext 자동 설정의 자기 자신 service binding은 `fix-pob`로 생성되었다. 서버 리디렉션이나 PoB 계산 로직 문제가 아님. 자동 마이그레이션이 패키지명을 기준으로 설정할 가능성이 높다고 판단하여 **시험 브랜치에서만** `package.json`과 `package-lock.json`의 루트 패키지명을 `fixlgs-poe2`로 일치시킴. 실제 자동 생성 결과/실배포 성공 여부는 재시험 필수. 공식 권장 조건은 `wrangler.jsonc`의 name과 `WORKER_SELF_REFERENCE.service`를 같게 두는 것(https://opennext.js.org/cloudflare/get-started).
- **보호 기준**: `main`은 건드리지 않고 `cloudflare-poe2-assetfix-v233` 시험 브랜치에서 V234 추가 커밋. 브라우저 WASM/PoB Lua 원본/필터/Chrome 확장/계산방어 로직 변경 없음. Cloudflare `빌드 명령 = npm run build:cloudflare`, `배포 명령 = npx wrangler deploy`, production branch는 위 시험 브랜치를 유지.
- **우선 검증**: 다음 Cloudflare 로그에서 `WORKER_SELF_REFERENCE`의 서비스가 `fixlgs-poe2`인지 확인하고 API 10143 해소 여부 판별. 실패 시 자동 마이그레이션 의존을 중단하고 명시적 Wrangler/OpenNext 설정을 버전·Next.js peer compatibility와 함께 재검증. 성공해도 `workers.dev`에서 `/pob`, `/filter`, 다운로드, 계산/WASM, ninja API, 모바일 확인 전 도메인 연결 금지.
- **이번 검증 구분**: 새 패키지명/lockfile 루트 일치와 회귀 테스트는 로컬에서 검사. GitHub 푸시·Cloudflare 재배포·브라우저 기능 확인은 이 수정본 작성 시점에 미실시.

