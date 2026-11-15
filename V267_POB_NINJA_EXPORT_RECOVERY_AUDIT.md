# V267 PoB poe.ninja 상세 403 대응 및 PoB Export 복구 감사

- 작업일: 2026-11-15
- 기준 소스: V266 전체 프로젝트
- 상태: 소스 수정 및 정적/계약 회귀 검사 완료, 실제 사용자 Export 및 운영 배포 미검증

## 1. 사용자 증상

사용자가 제공한 `poe.ninja/ko/poe2/builds/{league}/character/{account}/{character}` 링크는 페이지 확인 단계까지 진행했으나 상세 데이터 요청에서 HTTP 403을 받았다. 화면은 URL 확인 완료를 표시했지만 `PoB 빌드 데이터 - MISSING`, 장비 빈 슬롯, PoB 계산 캐릭터 없음이 함께 나타났다. 이는 링크 식별 성공과 상세 데이터/PoB 계산 성공이 하나의 상태처럼 보이지 않도록 분리해야 하는 사례다.

## 2. 원인과 관련 기존 기록

- V262와 V266의 `src/app/pob/ninjaImport.ts`, `src/app/api/pob/import-ninja/route.ts`, `src/app/pob/page.tsx`는 해시 비교상 동일했다. 최근 GA4·사이트맵·뉴스 작업에서 이 흐름이 직접 변경된 것이 원인은 아니다.
- 현재 V266 파서는 V219에서 이미 확정한 `/poe2/profile/{account}/{league}/character/{character}` 형식을 놓치고 Builds 형식만 지원했다. V267에서 복구했다.
- 상세 데이터 흐름은 poe.ninja 내부 빌드 인덱스/캐릭터 JSON 요청에 의존한다. 사용자의 운영 화면에서는 상세 요청 HTTP 403이 관찰됐다. 이 내부 요청의 접근 제어를 우회하거나 숨겨진 API 차단을 회피하는 변경은 하지 않았다.
- V219 테스트는 URL/유니코드 파싱 검증이었고, 실시간 외부 API의 실제 장비·스킬·PoB Export 회수 성공을 증명하지 않았다. V149/V170 기록도 라이브 실제 캐릭터 데이터의 종단 간 성공을 입증하지 않는다.
- V210은 PoB Export Base64/zlib/XML 및 엔진 계약 관련 보호 기록이다. V154/V156/V158은 플라스크·호신부·젬/스킬·동적 스탯 데이터 매핑 참고 자료다.

## 3. 변경 내용

### `src/app/pob/ninjaImport.ts`

- Builds URL과 Profile URL을 모두 지원한다.
- `/ko/`, `/zh/` 등 locale prefix를 허용하고 account/character의 UTF-8 percent encoding을 한 번만 해제한다.
- `https`와 허용 호스트 제한은 유지한다.
- Import detail source에 `path-of-building-export` 구분을 추가하고 캐릭터 클래스 정보를 전달한다.

### 신규 `src/app/pob/pobExport.ts`

- Path of Building Export Code의 Base64/URL-safe Base64와 zlib payload를 해독한다.
- 압축 입력 8MiB, 해제 XML 32MiB 크기 상한과 `PathOfBuilding`/`PathOfBuilding2` 루트 검증을 적용한다.
- 활성 ItemSet의 무기 세트 I/II, 장비, 반지, 호신부, 생명력·마나 플라스크를 추출한다.
- 활성 Tree Spec의 주얼 소켓과 활성 Skills SkillSet의 젬/보조 젬을 읽는다.
- `Build.mainSocketGroup`를 기준으로 선택된 실제 주스킬을 식별한다.
- 입력 XML을 다시 작성하거나 임의 수치로 보정하지 않고 원본 XML을 기존 계산엔진에 전달한다.

### `src/app/api/pob/prepare-export/route.ts`

- 입력 Export 코드를 검증/해독하고 원본 XML과 표시용 추출 데이터를 반환한다.

### `src/app/api/pob/import-ninja/route.ts`

- 이용자가 PoB Export 코드를 함께 제공한 경우 `skipInternalDetails` 옵션을 통해 공개 페이지 확인만 수행한다.
- 이 경로에서는 poe.ninja 내부 상세 인덱스/캐릭터 API를 호출하지 않는다.
- Export 코드 없이 기존 Ninja 상세 API를 요청한 경우 실제 HTTP 오류를 상세 상태에 전달한다. HTTP 403을 정상 상세 수신처럼 처리하지 않는다.

### `src/app/pob/page.tsx` 및 CSS

- Ninja 상세 요청이 막히거나 PoB Export가 없는 경우 수동 Export 코드 입력을 안내한다.
- Export 코드 해독 후 장비·주얼·스킬·주스킬을 화면 데이터로 채우고 기존 계산 경로를 재사용한다.
- 실제 XML을 기존 `CalcClient`/`calculateComparison` 경로로 전달하며, 자체 DPS/STATS 추정치를 만들지 않는다.
- 기존 계산엔진, FILTER, 홈, 검색, Cloudflare 설정은 수정하지 않았다.

## 4. 검증

### V267 신규 시험

`node scripts/test-v267-pob-export-recovery.cjs` PASS.

- 사용자 제공 builds URL에서 league/account/character 추출
- V219 profile URL 및 다국어/UTF-8 경로 파싱
- HTTP·호스트·잘못된 percent encoding 거부
- 저장된 V210 PoB2 Export fixture Base64/zlib/XML 해독
- 실제 fixture에서 Level 100, Mercenary, Gemling Legionnaire, 활성 장비 16개, 주얼 3개, 스킬 그룹 21개 추출
- Build.mainSocketGroup의 Twister 주스킬 선택 및 Frost Nexus 보조 젬 연결
- 잘못된 Export 코드 거부
- 변경 TS/TSX 구문 및 기존 PoB2 계산엔진 연결 확인
- 수동 Export 입력 시 비공개 Ninja 상세 API 호출을 생략하는 코드 경로 확인

### 회귀 시험 PASS

- `node scripts/test-v210-contract.cjs`
- `node scripts/test-v229-weapon-skill.cjs`
- `node --experimental-strip-types scripts/test-v226-ring-slots.cjs` (29 checks)
- `node scripts/test-v236-cloudflare-pipeline.cjs`
- `node scripts/test-v257-home-integration.cjs`
- `node scripts/test-v259-pob-theme.cjs`
- `node scripts/test-v260-pob-wide-backdrop.cjs`
- `node scripts/test-v261-filter-theme.cjs`
- `node scripts/test-v262-filter-adaptive-wallpaper.cjs`
- `node scripts/test-v264-search-discovery.cjs`
- `node scripts/test-v265-news-article.cjs`
- `node scripts/test-v266-news-seo-official-images.cjs`

## 5. 미검증 및 다음 확인

- 보관된 V210 fixture는 실제 사용자 계정의 Export가 아니다. 사용자가 실제로 생성한 Export Code를 입력한 실제 UI 테스트는 미실행이다.
- 새 파서의 화면 표시 후 실제 브라우저 PoB2 WASM 계산 결과·Set I/II 변경·장비 교체 비교는 미실행이다.
- `node_modules`가 제공되지 않아 Next 전체 타입 검사/build 및 Cloudflare OpenNext 빌드/배포는 미실행이다.
- poe.ninja 내부 상세 API의 HTTP 403 자체를 해결하거나 우회하지 않는다. URL만 제출하면 상세 정보가 계속 비어 있을 수 있고, 사용자가 PoB 앱에서 Export Code를 만들어 링크와 함께 제공하는 대체 경로가 필요하다.
- 사용자가 이전에 제공한 로컬 Next 개발 로그의 `UND_ERR_HEADERS_OVERFLOW` 외부 fetch 문제는 별도 원인 미확정이며 이번 변경으로 해결했다고 보지 않는다.

## 6. 재발 방지

상태 표시와 검증 단계를 분리한다.

1. URL 형식 검증 완료
2. 공개 페이지 확인 완료
3. 상세 Ninja 데이터 수신 완료/실패 (HTTP 상태 표시)
4. PoB Export 유무 및 해독 성공/실패
5. 실제 PoB2 엔진 계산 완료/실패

각 단계의 앞선 성공을 다음 단계 성공으로 표시하지 않는다. 데이터가 없으면 성공 화면이나 가짜 DPS/STATS를 만들지 않는다. 차단된 내부 API는 우회하지 않는다.
