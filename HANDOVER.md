# FIXLGS POE2 프로젝트 인수인계

## 1. 프로젝트 목적과 현재 유효한 설계 원칙
- **사용자 확정**: `poe.fixlgs.com`에서 Path of Exile 2 도구를 독립 운영한다. 일상 관리 0, 유지비 0을 우선하며, 본체 `fixlgs.com`과 독립된 서브도메인 구조를 유지한다.
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

## 3. 최신 구현 상태 (2026-10-14, V232)
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
