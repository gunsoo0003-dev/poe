# FIXLGS POE2 프로젝트 인수인계

## 1. 프로젝트 목적과 현재 유효한 설계 원칙
- **사용자 확정**: `poe2.fixlgs.com`에서 Path of Exile 2 아이템 필터와 PoB 도구를 통합 운영한다. 구주소 `poe.fixlgs.com`은 폐기하고 301 리디렉션은 만들지 않는다(미색인 여부는 Search Console에서 별도 확인 필요). 일상 관리 0, 유지비 0을 우선하며, 본체 `fixlgs.com`과 독립된 서브도메인 구조를 유지한다.
- **사용자 확정**: 캐릭터 장비·스킬·주스킬·원본 표시는 poe.ninja 상세 데이터가 실제 수신되면 그 원본을 따른다. poe.ninja 상세 API가 403 등으로 제공되지 않는 경우에는 사용자가 직접 제공한 PoB Export XML을 대체 원본으로 사용한다. DPS/STATS 및 장비 교체 변화 계산은 공식 Path of Building(PoB2) 계산엔진 결과를 따른다. FIXLGS가 임의 DPS·STATS를 만들어 보정하거나 PoB 계산 공식을 대체하지 않는다.
- **사용자 확정**: 기존 POE2 아이템 필터 기능과 NeverSink 원본 기준을 임의로 변경하지 않는다. 브라우저 로컬 프리셋·필터 다운로드·사운드 등의 기존 동작 보존.
- **2026-10-14 확정 작업 범위**: 등록 완료된 `FIXLGS POE2 Item Export` 확장프로그램의 Chrome 웹스토어 설치 링크를 PoB 사이트에 넣고 방문자용 사용 가이드를 웹스토어 설치 기준으로 변경한다. 기존 계산·확장프로그램 코드는 변경하지 않는다.

## 2. 보호 대상 및 기준
- `src/app/pob/pobCompare.ts`, `src/app/pob/web-engine/`, `src/app/pob/nativeIntegrity.ts`: PoB 계산과 계산 증거·안전 장치.
- `src/app/pob/ninjaImport.ts`, `src/app/api/pob/`: poe.ninja Import와 관련 데이터 접근·표시.
- `src/app/pob/ringSlots.ts`: 반지 1/2 슬롯을 혼동하지 않도록 정확히 매핑하는 규칙.
- `src/app/filter/`, `public/neversink/`, `public/sounds/`: 기존 필터 기능, NeverSink 0.10.4 0~6 베이스, 효과음 자산.
- `extension/fixlgs-poe2-item-export/`: V0.4.6 확장프로그램 코드·manifest. Chrome 웹스토어에 공개된 등록본을 별도 소스 수정 없이 사용.
- `public/data/pob-lua.json`, `public/wasm/lua.wasm`: 기존 PoB Lua 데이터·WASM 런타임. **V268 예외:** 공식 상류 PoB2의 실제 파서 별칭 누락 및 구형 파싱 캐시만 근거에 따라 수정했고 fingerprint를 갱신했다. 그 외 Lua/WASM 임의 변경은 금지하며 변경 시 원본 파서 WASM 검사와 fingerprint 검증이 필요하다.

## 3. 구현·배포 상태 (2026-11-15 · V271 추가 스킬 그룹 계산 연속 처리 / 미배포)
### V271 · 추가 스킬 그룹 12개 고정 제한으로 인한 경고 수정
- **사용자 실제 화면:** PoB2 장비 교체 후 DPS·STATS는 계산되지만 `추가 스킬 그룹 2개는 계산 안전 한도로 인해 DPS 미검증` 표시. 실제 코드를 확인한 결과 PoB 엔진 실패가 아니라 FIXLGS `pobCompare.ts`가 후보 14개 중 앞의 12개만 선택하는 V229 고정 상한이 원인.
- **변경:** 추가 스킬 그룹을 12개 단위로 이어서 조회하고 각 묶음 이후 원래 무기 세트 복원. 전체 24개 보호 상한은 유지하며 초과 시 제외된 그룹의 index/이름을 경고. 기존 PoB native `getGroupDps`·그룹별 45초 타임아웃·결과 index/weapon set/main group 복원 검사·실패 그룹 DPS 미표시 유지. 원본 PoB 계산식·WASM·룬·필터 변경 없음.
- **실제 검증:** V271 모의 엔진 14개 보조 그룹 전부 계산·14번째 그룹 결과·무기 세트 II에 결과 혼용 금지·실패 그룹 미표시/경고·원래 무기 세트 복원 PASS. V229 중복 이름·V225 보호장치·V270 실제 WASM 룬 파서 PASS.
- **미검증:** 사용자 실제 빅맥치킨 Export 전체를 이용한 14개 그룹 WASM 실행 및 실제 브라우저/Next/OpenNext 빌드·배포. 따라서 실제 화면에서 경고 소멸은 아직 확정 불가. 24개 초과 및 개별 PoB 계산 실패 시 경고가 남는 것은 정상 보호 동작.

## 3. 구현·배포 상태 (2026-11-15 · V270 룬 복합 옵션 파서 보완 / 미배포)
### V270 · 룬의 최대 생명력 기반 Runic Ward 복합 옵션 인식 (2026-11-15 · 소스 수정, 미배포)
- **사용자 실제 화면:** Runeseeker's Call 교체 시 `Gain 15% of maximum Life as Extra maximum Runic Ward`가 `modifier 1`, `parserExtra=as Extra maximum Runic Ward`로 부분 인식되어 V225 보호장치가 AFTER DPS/STATS를 차단. 원본 파싱·장착은 통과.
- **원인·수정:** 번들 PoB2 `ModParser.lua`에 해당 복합 문구의 완전한 패턴이 없었다. PoB `Ward`/`Life`/`PercentStat`을 이용해 `Gain N% of maximum Life as Extra maximum Runic Ward`를 하나의 `Ward BASE`로 계산하도록 파서 패턴 1개 추가. FIXLGS 별도 계산식·검증 우회·임의 수치 생성 없음. `ModCache.lua`에 동일한 정확한 원문 캐시 없음 확인. `lua.wasm` 유지, fingerprint JSON 해시만 갱신.
- **실제 검증:** V270 신규 테스트에서 번들 WASM 원본 파서로 해당 15% 옵션이 modifier 1개, 잔여 extra 없음 및 무결성 검사 PASS. V268 4개 Ward 파싱·미지원 옵션 차단 PASS, V227 Runeseeker 실제 장착 룬 6개·12줄 PASS, fingerprint PASS.
- **한계:** 실제 사용자 Export 전체 AFTER 계산·브라우저·Next/OpenNext 빌드·배포 미검증. 상류 최신 커밋 확인 없이 번들 PoB2 modifier 방식에 맞춘 보완.

### V269 · PoB 원본 룬 진단 보강 (2026-11-15 · 미배포)
- **확인:** 빅맥치킨 실제 교체는 원본 옵션 13개·미해석 0개·장착 revision 28→29 후 룬 검증에서 차단. 실패 룬은 미확인.
- **수정:** PoB `Item.lua`의 룬 원본 진단을 출력하도록 `calc-worker.ts`/`calc-client.ts`/`pobCompare.ts` 변경. V227 native 재구성, CURRENT 보존/AFTER 차단 유지.
- **검증:** V227·V268 실제 WASM PASS. 실캐릭터 AFTER·전체 빌드·배포 미검증. 다음에는 실캐릭터 룬 원문을 대조.
- **상세 기록:** `V269_POB_RUNE_NATIVE_DIAGNOSTICS_REPORT.md`.

### V268 · PoB2 Runic Ward 원본 옵션 파서 인식 복구 (2026-11-15 · 소스 수정·미배포)
- **사용자 증거:** 실제 PoB 화면에 `+300 to maximum Runic Ward`와 `maximum Runic Only Runes can be Socketed in this item` 잔여 텍스트가 표시되고, `weapon-set-1` 교체 계산이 V225 원본 파서 검증에서 차단됐다. 캐릭터 장비/주얼/스킬은 표시되므로 데이터 Import와 계산 옵션 파싱 문제를 분리했다.
- **근본 원인:** `public/data/pob-lua.json`의 `files["src/Modules/ModParser.lua"]` `modNameList`에 `runic ward` 및 `maximum runic ward` → `Ward` 별칭이 누락돼 있었다. 현재 PathOfBuildingCommunity 공식 PoE2 개발 소스에는 이 두 매핑이 존재한다(`https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua`). 추가로 `files["src/Data/ModCache.lua"]`에 `+40/+50/+100 to maximum Runic Ward` 및 일부 복합 텍스트의 오래된 부분 파싱 캐시 6개가 남아 새 파서를 가리고 있었다.
- **수정:** `public/data/pob-lua.json` 내 `ModParser.lua`에 공식 상류 매핑 2개를 추가하고 `ModCache.lua`에서 해당 정확한 구형 부분 파싱 캐시 6개만 제거했다. 실제 엔진의 원본 `ModParser`가 `maximum Runic Ward`를 기존 `Ward` 능력치로 인식하도록 했다. 새 계산식·임의 DPS/STATS·옵션 무시 규칙은 추가하지 않았다.
- **보호:** `public/wasm/lua.wasm`, `src/app/pob/pobCompare.ts`, `src/app/pob/nativeIntegrity.ts`, `src/app/pob/web-engine/`, V267 Export 파서/닌자 경로, 계산 엔진 로직은 변경하지 않았다. V225 미인식 옵션 차단/CURRENT 보존/AFTER 숨김 안전장치는 유지했다. `scripts/pob2-engine-fingerprint.json`의 `pob-lua.json` SHA-256만 실제 새 해시로 갱신했으며 WASM SHA는 동일하다. upstream 특정 커밋은 고정하지 못해 fingerprint `upstreamCommit=UNVERIFIED` 유지.
- **실제 검증:** `node scripts/test-v268-runic-ward-native-parser.mjs`가 실제 번들 Lua/WASM으로 `+300`, `+40`, `+50`, `+100 Runic Ward`, `Grants Skill`, `Only Runes can be Socketed`, `200% increased effect of Socketed Runes`를 검사했다. 전부 원본 파서 `modifierCount>0`, `extra=""` 및 `validateNativeItemAudit().verified=true` 통과. 가상의 미지원 옵션은 여전히 차단. V210/V211/V225 원본·계산 차단·WASM, V226~V229 룬/반지/스킬, V267 Export, fingerprint, V236 Cloudflare, V257 홈, V259~V266 FILTER/SEO 회귀도 PASS.
- **검증 한계:** 실제 사용자 `빅맥치킨` Export 전체를 이용한 장착/교체 이후 최종 DPS·STATS 화면, Next 전체 빌드, Cloudflare OpenNext 빌드·배포는 미검증. 기존 V225 WASM 테스트의 `The Unborn Lich` 별도 미해석 효과 2건은 이 수정 대상이 아니며 기존처럼 안전하게 감지된다. poe.ninja 403 우회는 하지 않는다.
- **재발 방지:** PoB 옵션 명칭/별칭 변경 시 `ModParser.lua`뿐 아니라 `ModCache.lua`의 오래된 부분 파싱 결과도 대조한다. 원본 파서 증거를 확보하기 전에 integrity guard를 완화하거나 미지원 옵션을 허용하지 않는다. 실제 사용자 Export로 교체 전후 계산을 후속 확인한다.

### V267 · PoB poe.ninja 상세 403 대응 및 PoB Export 직접 입력 복구 (2026-11-15 · 소스 제작·미배포)
- **사용자 보고/실제 증거:** 2026-11-15 사용자 제공 poe.ninja 캐릭터 링크 `runesofaldur / 썩은통닭-2237 / 빅맥치킨`은 URL 형식과 한글 디코딩은 정상이나, 공개 캐릭터 페이지 뒤의 상세 요청이 HTTP 403으로 실패했다. PoB Export는 MISSING, 장비 슬롯과 스탯 영역은 비어 있었다. 이는 URL 인식 성공과 실제 빌드 상세 수신 실패가 분리된 상태다.
- **과거 이력 적용:** `V219_NINJA_PROFILE_UNICODE_FIX_REPORT.txt` 원문을 재열람해 `/poe2/builds/{league}/character/{account}/{character}`와 `/poe2/profile/{account}/{league}/character/{character}` 두 경로, 언어 prefix, 한글/일본어/중국어 경로를 한 번만 디코딩하는 규칙을 확인했다. V262/V266 소스 대조 결과 V266에서는 profile 형식 지원이 누락되어 있어 V219 결정대로 복원했다. strict HTTPS 및 `poe.ninja` host allowlist는 유지한다. 사용자가 전달한 실제 builds URL 파싱 결과: 리그 `runesofaldur`, 계정 `썩은통닭-2237`, 캐릭터 `빅맥치킨`.
- **근본 원인/경계:** 현재 `import-ninja` 기본 경로는 poe.ninja의 문서화되지 않은 내부 `index-state`/캐릭터 상세 API를 호출하며 HTTP 403에 의존할 수 있다. 403을 우회하기 위한 헤더 위조·차단 우회·프록시/스크래핑은 추가하지 않는다. 기존 링크 자동 확인 시도는 유지하되 실제 장비/스킬 데이터가 없으면 성공 화면으로 진입하지 않고 사용자가 Export 코드를 제공하도록 안내한다. 사용자가 PoB Export 코드를 함께 입력한 경우 `skipInternalDetails=true`로 내부 상세 API를 아예 호출하지 않는다.
- **신규 Export 파서:** `src/app/pob/pobExport.ts`에 Base64/URL-safe Base64 정리, zlib inflate(압축 8MiB·해제 XML 32MiB 상한), `PathOfBuilding`/`PathOfBuilding2` XML 검증 및 읽기 전용 파싱을 구현했다. 활성 `ItemSet`의 무기 세트 I/II·장비·반지·호신부·생명력/마나 플라스크, 활성 `Tree/Spec`의 주얼 소켓, 활성 `Skills/SkillSet`의 기본 젬과 보조 젬을 원본 XML에서 복원한다. `Build.mainSocketGroup`을 이용해 실제 선택된 주스킬을 찾는다. PoB Export의 실제 XML은 변경하지 않고 기존 엔진에 그대로 전달한다.
- **연결/화면:** `src/app/api/pob/prepare-export/route.ts`가 해독 결과의 메타데이터·표시용 장비/주얼/스킬과 원본 XML을 반환한다. `/pob` 화면에 Export 코드 입력란을 추가하고, 해독이 완료된 경우에만 캐릭터 화면으로 진입한다. 장비·주얼·스킬 표시와 계산은 기존 `CalcClient` 및 `calculateComparison()` → V210 PoB2 WASM 경로를 그대로 재사용한다. `mainSkill`은 Ninja 데이터가 없을 때 PoB XML의 실제 선택 스킬을 사용한다. 실패 시 DPS/스탯을 추정해 만들지 않는다.
- **보호/변경 범위:** `pobCompare.ts`, `web-engine/`, WASM/Lua 데이터, 교체 장비 검증·링/플라스크/호신부 매핑, FILTER·NeverSink, 홈/V019 디자인, GA4·SEO·Cloudflare 구성은 변경하지 않았다. `src/app/pob/ninjaImport.ts`, `src/app/api/pob/import-ninja/route.ts`, `src/app/api/pob/prepare-export/route.ts`, `src/app/pob/pobExport.ts`, `src/app/pob/page.tsx`, PoB 입력 CSS, 신규 검사 스크립트 및 인수인계만 변경.
- **실제 검사:** `node scripts/test-v267-pob-export-recovery.cjs` PASS. 사용자의 정확한 한글 builds URL, V219 profile URL 및 여러 언어 세그먼트, 잘못된 URL·퍼센트 인코딩 거부, 보관된 V210 PoB2 Export fixture 해독, 레벨 100/Mercenary/Gemling Legionnaire, 활성 장비 16개, 주얼 3개, 스킬 그룹 21개, 실제 mainSocketGroup의 `Twister`, `Frost Nexus` 보조 젬 연결, 잘못된 Export 거부, 수정 TS/TSX 구문 및 기존 엔진 연결을 확인. 추가로 V210 export contract, V229 스킬/무기, V226 반지(정식 `--experimental-strip-types` 명령), V236 Cloudflare 설정, V257 홈, V259~V262 회귀, V264 사이트맵, V265/V266 뉴스 검사를 통과했다.
- **검증 한계:** 테스트 fixture는 프로젝트에 보관된 V210 검증용 Export 샘플이며 사용자의 실제 계정 Export가 아니다. 사용자가 실제로 복사한 Export 코드의 해독과 화면 표시, 실제 PoB2 WASM 계산 결과, Next 전체 타입 검사/빌드, Cloudflare OpenNext 빌드·배포, poe.ninja 라이브 상세 API 성공은 미검증이다. 이 작업 환경에는 `node_modules`가 없어 Next 전체 빌드를 실행하지 못했다. 사용자 PC 로그에 표시된 반복 `UND_ERR_HEADERS_OVERFLOW`는 외부 fetch 실패로 별도 원인이 미확정이며 이번 수정이 해결했다고 주장하지 않는다.
- **재발 방지:** 링크 검사 성공을 캐릭터 데이터 수신 성공으로 취급하지 않는다. `HTTP 403`은 실제 상세 수신 실패로 명시하며, Export XML에서 데이터가 확인되지 않으면 계산 화면을 열지 않는다. PoB Export 원본 XML이 장비/스킬의 기준이며, PoB2 WASM 계산 결과 외 임의 DPS/STATS를 만들지 않는다. 사용자의 실제 Export 코드를 받아 배포 전 수신·계산을 다시 검증한다.

### V266 · 새소식 001 SEO·공식 이미지 교체 (2026-11-14, 소스 제작·배포 전)
- **사용자 최신 확정:** 첫 기사는 POE2 1.0 발표 심층 기사를 유지하고 SEO 및 이미지부터 개선한다. 신규 스타터/빌드 키워드 단독 기사는 다음 편으로 미룬다. 실제 게임을 다루는 기사에 AI 생성 판타지 이미지를 사용하지 않고 GGG 공식 이미지를 우선한다. V019 홈 레이아웃·FILTER·PoB 기능은 변경 금지.
- **구현:** `/news/poe2-1-0-full-release`의 SEO 제목을 `POE2 1.0 정식 출시 총정리｜12월 12일 신규 리그·직업·핵심 변경점`으로 통일하고 페이지 설명, canonical, Open Graph/Twitter 이미지, NewsArticle 스키마의 headline·image 및 검색 초반 핵심답변을 정리했다. `dateCreated=2026-11-14` 유지, 미공개이므로 `datePublished` 미기재. 원래 비교표 3개와 분석 본문, 자체 출처/불확실성 구분을 보존. FILTER·PoB 내부 링크 추가. 메인·목록 첫 뉴스 카드 텍스트/이미지만 연동.
- **이미지:** V265의 가상 공성전/정보 도식 5개는 **기사·목록·홈에서 참조 제거**(기존 원본 파일은 추적·보관을 위해 미삭제). GGG가 2026-08-26/11-07 직접 발표한 PR TIMES 공식 보도자료 이미지 3개(1.0 출시/리그/섀도우)와 구체적 크레딧·출처 사용. 다운로드 파일 확보는 이 환경 DNS 제약으로 미실행; 원격 `prcdn.freetls.fastly.net`에 브라우저 직접 요청하며 **외부 CDN 의존성 존재**, 추가 유료 API/상시 서버 없음. 접속 실패 때 기존 로컬 GGG 게임 원화로 자동 대체하는 `src/app/news/OfficialArtwork.tsx`를 추가함. 원본 라이선스의 광고수익 웹사이트 적용은 개별 확정하지 않았으므로 사용 조건을 가정하지 않음. 공식 자료가 정식 출시 실플레이 스크린샷이라는 표기 금지.
- **실행·검증:** `node scripts/test-v266-news-seo-official-images.cjs` 및 갱신된 V265 검사, V264/V263/V257/V236 통과. `preview/news-001/index.html`은 **더블클릭 기사 확인용 독립 HTML**, 로컬 CSS/보유 이미지 폴백; 실제 Next 앱이나 버튼 기능의 대체품 아님. Chromium에 동일 정적 본문+실 CSS+기존 공식 이미지 폴백 주입 후 PC 1440/모바일 390에서 가로 넘침·JS 오류 없음, 이미지 3개와 표 3개 확인. 외부 원격 이미지 실제 파일 수신·Next 빌드·운영 배포·GA4/색인은 미검증. 3rd party 이미지 CDN이 중단되면 새 공식 자료 대신 기존 공식 게임 이미지가 표시됨.
- **재발 방지:** 뉴스 SEO 제목을 홈/목록/기사/OG/스키마에 동시에 반영한다. 사용자 최종 확인용 `index.html`을 빼먹지 말 것. 이미지에 가상 게임 장면/무근거 수익·장비 수치를 삽입하지 않는다. 독립 V019 `docs/design-reference/V019/index.html`은 변경하지 않았다.

### V265 · 새소식 001 기사·표·이미지 발행 준비 (이전 초안, 미배포)
- **과거 버전 기록:** 아래의 생성형 이미지 5개 및 외부 이미지 불사용 조건은 V265 당시 기준이며 V266에서는 폐기·교체했다. 실제 기사 이미지는 위 V266 현재 유효 기준을 따른다.
- **사용자 최신 확정(2026-11-14)**: 홈 뉴스 섹션명은 `새소식`. 첫 기사는 POE2 1.0 정식 출시·신규 리그 소식으로 하고 공식 발표·국내 영상 해설 중 확인된 내용을 바탕으로 표와 이미지를 포함한 실제 콘텐츠로 제작한다. 기사 분량보다 실제 내용과 검증 가능성을 우선한다. 별도 외부 이미지 호출·유료 API·상시 서버 없음.
- **코드·콘텐츠**: `/news`, `/news/poe2-1-0-full-release` 신규 Next 정적 라우트. `src/app/news/page.tsx`, `src/app/news/poe2-1-0-full-release/page.tsx`, `src/app/news/news.module.css`. 실제 기사에 비교표 3개, 로컬 WebP 이미지 5개(생성형 공성전 콘셉트 1·FIXLGS 직접 그린 정보 도식 4), 본문·조사 출처·한계 고지. 신규 경로를 `src/app/sitemap.ts`에 추가(19→21 URL). `src/app/home-v019-markup.ts`의 뉴스 섹션 텍스트와 실제 첫 기사 링크, `src/app/home-v019.css`의 뉴스 카드 배경 및 대기 슬롯 스타일만 변경. 상단 메뉴 이름은 `새소식`; 나머지 2열 큰 카드/4개 목록 슬롯, 히어로·FILTER/PoB 섹션, 불꽃·영상·모바일 반응형 구조 유지. 나머지 5개 가짜 기사 텍스트는 '준비 중'으로 명확히 바꿔 허위 발행 오인 방지. `/news` 전체보기 링크 활성화.
- **편집상 구분**: 기사 작성/조사일은 2026-11-14. 실제 최초 공개일은 배포되지 않았으므로 확정하지 않음(구조화 데이터에는 `dateCreated`만, `datePublished` 미기재; 공개 확인 후 최초 실제 발행일로 갱신). 이미지에 `실제 게임 화면 아님` 고지. Q&A 영상의 치명타·상태 이상·사망 요약 세부 항목은 미검증 수치 단정 금지. 공식 출처로 2026-11-06 GGG Steam 발표, ExileCon 행사 자료, 정식 출시 안내 링크 사용. 정적 자료이며 추가 유지비 없음.
- **검증/한계**: `test-v265-news-article.cjs` TSX 구문·콘텐츠/표/이미지/링크/GA4/CSS 통과. V257/V264/V263, V262~V258, V236/V235/필터 회귀 PASS. Chromium에서 TSX 정적 변환·실제 CSS·5이미지로 PC 1440/모바일 390px 미리보기: 표 3개, 이미지 5개, 가로 넘침 0, JS 예외 0(Next 런타임과 동일하지 않음). 구형 V244/V252/V253 테스트는 이전 홈페이지 DOM을 기대해 실패하며 V257 현재 구조 테스트를 우선한다. Next/OpenNext 실제 전체 빌드·배포·실서비스 클릭 미검증(원본 ZIP에 node_modules/package-lock 없음). 생성형 그림이 게임 원화와 혼동되지 않도록 표기함. 기존 공식 자산·NeverSink·PoB·Cloudflare 설정 무변경.
- **다음 작업**: 실제 배포 후 `/news`, 기사 페이지·홈 카드 링크, 모바일 읽기, 21개 URL 사이트맵, 실시간 GA4 확인. 이때 첫 공개일 기록 검토. 신규 기사 작성 시 실제 기사 데이터와 사이트맵·뉴스 카드 연결 상태를 동시에 점검.

### V264 배포 확인 자료 (2026-11-14, 사용자 로그/응답)
- GitHub `cloudflare-poe2-assetfix-v233` 브랜치 `f0fd006` 푸시 성공과 로컬 V264·V263·V236 검사 PASS를 사용자 실행 로그로 확인. 이어 사용자가 운영 `robots.txt`의 Allow/Disallow 규칙과 운영 `sitemap.xml`의 19 URL 원문 응답을 제공했다. **사용자가 보여준 공개 URL 응답을 근거로 V264 검색 파일이 운영에 반영된 것으로 확인**한다. Google Search Console 실제 색인 및 GA4 수집 검증은 별개이며 미확인.


### V264 · POE2 robots.txt / sitemap.xml 복원 (미배포)
- **사용자 최신 확정(2026-11-14):** V258 당시 robots/sitemap 미제공 결정은 폐기하고 POE2 독립 서브도메인에 검색엔진 탐색 파일을 복원한다. 루트 WHAT IS!의 설정은 변경하지 않는다.
- **실제 코드:** Next MetadataRoute `src/app/robots.ts` → `/robots.txt`, `src/app/sitemap.ts` → `/sitemap.xml`. 기준 도메인 `https://poe2.fixlgs.com`. 홈·FILTER·PoB·안내/가이드·회사·연락·개인정보·약관 등 **실재 공개 페이지 11개 + `pobGuides` 소스의 현재 8개 가이드 = 총 19 URL**. PoB 가이드 증감은 같은 데이터 배열에서 자동 반영. **API `/api/` 및 진단 `/pob/engine-lab` 크롤링 제한·사이트맵 제외.** 업데이트 일자를 알 수 없어 `lastModified`를 임의 표시하지 않음.
- **보호/교훈:** V235 기존 도메인 오류를 피하도록 새 도메인만 사용. V258 이후의 검색파일 부재를 기대하던 과거 테스트 6개는 **검색 정책 관련 조건만** 최신 기준으로 변경하고 PoB export·필터·디자인 회귀 검사는 보존. V263 GA4 Main `G-EPCCGBTPH9` 및 기존 엔진·디자인·Worker 설정 무변경. `public/robots.txt`/`public/sitemap.xml` 중복 생성 없음.
- **실제 검증:** Node 독립 V264 계약(19 URL, 8개 실제 가이드 slug, 메타데이터 함수 평가), V235/V258/V259/V260/V261/V262/V263/V257 정적 회귀 통과. 파일 목록/원본 SHA 및 전체 ZIP 무결성 검증은 배포본 생성 단계에서 별도 확인. **미실행:** Next/OpenNext 실제 빌드(원본 ZIP lockfile·의존성 없음), Cloudflare 실제 `/robots.txt`·`/sitemap.xml` HTTP 수신, Search Console 사이트맵 제출 및 색인. 색인·순위 상승 보장 없음.


### V263 · GA4 Main 통합 (미배포)
- **현재 기준/구현:** POE2를 Main `G-EPCCGBTPH9`로 통합(`src/app/layout.tsx`의 두 곳). 도메인·기능·디자인 불변.
- **검증/한계:** ID·중복 및 기존 기능 12개 검사 PASS. V234 검사는 원본 ZIP에 `package-lock.json`이 없어 실패. 빌드·배포·실시간 수집 미검증. 구 속성 보존, 과거 통계 이전 불가.

### V262 · FILTER 단일 전투 배경·좌우 자동폭 (2026-11-09 · 미배포)
- **확정:** 임시 이미지 한 장을 전체에 깔고, 실제 콘텐츠 밖 양옆 여백만 선명하게 표시. 화면 폭 변화에 따라 경계 자동 추종. 가운데는 어두운 패널, 모바일 기존 디자인 보호. 이미지 추후 재선정.
- **코드:** `src/app/globals.css` FILTER 전용, 기존 `official-lightning-gameplay.webp` 재사용. `.filter-v2-shell`의 기존 폭/중앙정렬로 어둠 마스크 구현. 콘텐츠 폭·카테고리·엔진/메인/POB 불변.
- **검증:** Chromium 정적 9폭(320~2560px) 가로 넘침·JS 오류 없음, 1440/1920/2560px 좌우 각 50/70/390px 대칭 및 토글 클릭 통과. 여백이 좁은 화면은 이미지 노출도 적음(의도된 보존). Next/OpenNext 빌드·실기기·실데이터 미검증, 미배포. ZIP에 구 잠금 파일 미포함.

### V261 · FILTER 화면 질감·밀도·조작성 개선 (2026-11-09 · 미배포)
- **사용자 확정:** POB와 달리 FILTER 콘텐츠 폭은 유지. 메인과 같은 풀영역 시즌중립 배경, 행 밀도 강화, 중요도 버튼·토글 확대. 27개 분류·선택/저장·NeverSink·DPS/메인/POB 엔진과 모바일 가로스크롤 보존.
- **코드:** `src/app/globals.css`의 FILTER 전용 CSS만 직접 변경. 기존 `cinematic-hero.webp` 재사용; 레어·매직 행 92→70px, 공통 행 76→68px, 버튼 32→40px·7→10px, 토글 36×20→44×26px. 981~1350px 중간 폭은 줄바꿈으로 버튼 침범·수평 넘침 방지. 검사 `scripts/test-v261-filter-theme.cjs` 추가.
- **검증:** 정적 Chromium 320~1920px 8폭 가로 넘침·JS 오류 없음, 토글 표면 클릭 가능. 필터 회귀·V257/258/259/260·CSS 파싱 성공. **미검증:** Next/OpenNext 실빌드·라이브 다운로드/저장·실기기. 기존 PC 잠금파일 보존을 위해 ZIP에 `package-lock.json` 미포함.

### V260 · POB PC 풀영역 배경과 콘텐츠 확대 (2026-11-09 · 소스 수정, 미배포)
- **사용자 확정:** PC 전체 배경에 POE2 범용 이미지를 깔고 POB 본문 폭을 넓힌다. 어두운 오버레이로 가독성 확보. **보호:** 메인·FILTER·모바일, PoB/poe.ninja 원본 계산·장비 좌표·데이터·기능.
- **구현:** 기존 `official-burning-village.webp` 재사용. `src/app/pob/pob-v259-theme.css`에서 PC ≥1051px에만 `body:has(.pob-v259-root)` 배경을 고정하고 콘텐츠 최대 2100px로 확장. 캐릭터 로딩 후 영역도 PC ≥1501px에서 확대. **JSX·엔진 불변.**
- **검증:** Chromium 동일 CSS 정적 모의 320~2560px 10폭 가로 넘침·JS 예외 없음, PC 이미지 적용·모바일 배경 불변. V259/V258/V257/PoB·FILTER 회귀 PASS. **미검증:** V260 Next/OpenNext 실빌드·실데이터·배포.
- **설치 보호:** 이전 ZIP의 오래된 Next 16.3.5 `package-lock.json`은 V260 ZIP에서 제외. 기존 PC의 갱신된 잠금파일을 덮어쓰지 않는다. 새 환경에는 잠금파일 별도 생성 필요. `.git`, 비밀 설정은 기존 PC 유지.

### V259 · POB 메인 디자인 언어 1차 통일 (2026-11-09 · 소스 수정, 미배포)
- **사용자 확정:** V019 메인 디자인을 보호하며 `/pob` 시작·캐릭터/비교 화면만 검정·적갈·청동 질감으로 통일. 시즌 표현 이미지 2곳은 기존 POE2 범용 전투 자산으로 교체. 캐릭터/무기 슬롯 좌표·poe.ninja 원본·PoB 엔진·FILTER·메인·공식 영상 재생 방식은 보존하고, 화면 확인 뒤 재수정한다.
- **코드:** `src/app/pob/page.tsx`의 루트 클래스 2곳·배너 경로/대체텍스트/라벨, 기존 `src/app/pob/layout.tsx`의 기존 메타데이터를 유지한 POB CSS 로드, 새 `pob-v259-theme.css`만 변경. 기존 카드 간 겹침 방지용 최소 행 높이 및 700px 이하 장비 슬롯 축소 화면의 가로 중앙 배치 보정. 새 검사 `scripts/test-v259-pob-theme.cjs`.
- **검증:** TSX·CSS 파싱 및 V258/V257/V229/V226/V225/V232/필터 회귀 통과. Chromium 정적 모의 320~1920px 6폭 가로 넘침·JS 예외 없음. `V236 --lock`은 기존 ZIP Next 16.3.5 잠금 파일 불일치로 실패. **미검증:** V259 Next/OpenNext 전체 빌드·실데이터 계산·실기기·영상 재생.
- **배포 근거 갱신:** 사용자 제공 2026-11-08 로그에서 V258 Windows Next 16.4.5/OpenNext 1.20.16 Cloudflare 번들 빌드 성공, PoB 원본 복원 및 GitHub `cloudflare-poe2-assetfix-v233`에 `4f7aab7` 푸시 확인. Cloudflare 실제 새 버전 활성화·실기능은 **미확인**. V258 ZIP의 `package-lock.json`은 구버전이므로 사용자 PC에서 갱신한 잠금 파일은 덮어쓰지 말 것.

### V258 · 로컬 Next 16 빌드 타입 오류 시정 · 당시 robots/sitemap 미제공 (2026-11-08 · 과거 기준)
- **2026-11-08 당시 사용자 결정(현재 V264에서 변경됨):** 애드센스 운영 선택으로 robots/sitemap을 제공하지 않았으며 그때도 `noindex` 차단이 목적은 아니었다. 2026-11-14 V264에서 두 파일 재설치가 새 유효 기준으로 확정됨.
- **사용자 로그로 확인:** Windows D:\WebProjects\fix-pob, Next 16.4.5/OpenNext 1.20.16에서 컴파일은 통과했지만 `src/app/pob/page.tsx`의 비허용 이름 내보내기 `buildMainSkillUi` 때문에 TS2344 타입 단계 실패. `lua.mjs`의 URL 분석과 `headless.ts`의 자식 프로세스 트레이싱은 별도 경고이며 실제 Cloudflare 번들 결과는 미확인. `UND_ERR_HEADERS_OVERFLOW`는 다른 네트워크 요청 실패로 아직 원인 미확인.
- **수정:** `buildMainSkillUi` 함수 본체/호출/계산은 그대로 두고 `export`만 제거. V229 회귀 테스트에서만 임시 export를 주입해 원래 알고리즘을 검사한다. `src/app/robots.ts`, `src/app/sitemap.ts` 제거, V235 테스트의 과거 기대값을 최신 정책으로 교체, V258 검사 추가. FILTER/POB 엔진·WASM·NeverSink·V019 디자인·Cloudflare 설정·이전 HISTORY 원문 불변.
- **실제 검증:** 13개 Next 페이지의 추가 named export가 0개인지 TS AST로 검사, V229 원본 스킬·그룹 검사, V228 After Change, V226 반지 슬롯, V225 비교 가드, 필터 회귀 및 V232/233/234/236/257 검사 성공. **로컬 npm 의존성 미설치이므로 V258 전체 Next/OpenNext 빌드·실브라우저·Worker 배포는 미실행.** 사용자 PC에서 `npm install --package-lock-only`로 갱신했던 잠금 파일은 업로드받지 못해 ZIP은 V257 잠금 파일을 보존; 덮어쓴 뒤 재갱신 필요. 기존 폴더에 압축 덮어쓰기 시 삭제한 두 파일은 자동 삭제되지 않으므로 명시 제거 필요.




### V257 · V019 홈페이지 디자인 + V256 FILTER·POB 기능 통합 (2026-11-08 · 미배포)
- **사용자 확정:** V019의 전체 디자인(폰트·배경·8개 섹션·3개 영상 카드·모바일·버튼 외형)은 보호하고, V256 실제 FILTER·POB 기능 소스·계산 데이터·NeverSink·확장프로그램·가이드를 그대로 이용하는 홈페이지 통합. 실제 배포는 승인 전 실시하지 않는다. 프로젝트 ZIP 내부 최상위 폴더는 **기존 V256 `fix-pob/` 유지**(Git/Cloudflare 설정·경로 보호), V019 원본 명칭 `FIXLGS_POE2_HOME`은 디자인 참고본 이름으로 남긴다.
- **현재 구현 확인:** Next.js `/` 홈만 V019 마크업/범위 한정 CSS·클라이언트 상호작용으로 대체했다. 실제 `/filter`, `/pob`, `/filter/guide`, `/guides/pob/getting-started`, `/terms`, `/privacy/site`, `/contact`에 링크를 연결했다. 3번 아이템 뉴스 카드 2개+하단 4개와 전체보기는 **아직 발행 글이 없으므로 더미 앵커 유지**; 실서비스 게시글로 오인하지 말 것.
- **기존 영상 기능 계승:** `getLatestOfficialVideos(3)`를 서버에서 호출하며 V256의 30일 캐시(`revalidate:2592000`) 및 공식 채널 파싱·폴백을 유지한다. 7번은 V019의 3열/16:9/음소거 1→2→3 플레이어 및 `onError` 안내를 재사용한다. **서버 측 수집이 곧 실시간 최신성 보장은 아니고, Cloudflare ISR 동작·실영상 재생/오류 153은 실제 배포 후 미검증**이다. GitHub 예약 갱신용 V019 워크플로는 `docs/design-reference/V019/.github/`에 참고자료로만 보존하며 정식 프로젝트 루트에 활성화하지 않았다.
- **소스 보존/격리:** 원 V256 `src/app/filter/`, `src/app/pob/`, `src/lib/`, `public/neversink/`, `public/sounds/`, PoB WASM/Lua, API, 독립 가이드와 Cloudflare 설정은 변경하지 않았다. `src/app/page.tsx`(새 홈), `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `src/app/V019Interactions.tsx`, `public/poe-home/{script.js,assets/*}`, `scripts/test-v257-home-integration.cjs`가 신규/교체 대상이다. V019 완전한 원본 17개 파일과 원문 HANDOVER/HISTORY는 `docs/design-reference/V019/`로, 교체 전 V256 홈페이지 TSX 원본은 `docs/design-reference/V256_HOME_PAGE_SOURCE.tsx.txt`에 바이트 보존한다. 홈 CSS는 `.poe-v019-root` 범위로 제한하여 다른 도구 페이지에 적용하지 않는다.
- **검증:** 원본과 실제 V256 globals CSS를 포함한 Chromium `set_content` 렌더 320/390/780/781/1024/1440/1920px에서 가로 넘침·JS 예외 없음, 8개 아이템 탭·POB 2개 탭·모바일 메뉴 클릭 통과. V257 계약 검사 10개 그룹 PASS. V256 필터/PoB·Native WASM/룬/반지·Cloudflare 관련 테스트 17개 성공(세부 목록은 아래 신규 이력). 기존 V247 테스트는 **V256의 `poe-v238-home` 구형 DOM을 전제로 해 의도적으로 바뀐 메인에서 실패**, 새 홈 반응형 브라우저 검사로 보완.
- **미검증/배포 보류:** 기존 V256 `package.json` Next 16.4.5와 `package-lock.json` Next 16.3.5 등 잠금파일 불일치가 그대로 남음. 오프라인 `npm ci`는 `ENOTCACHED`, npm Registry 온라인 접근은 `EAI_AGAIN`으로 실패; 따라서 실제 Next 실앱·전체 TypeScript 타입검사·OpenNext/Cloudflare 빌드·라이브 PoB UI/필터 다운로드·YouTube iframe·사용자 PC 확인은 수행 못함. 런타임 정확성은 **정적 테스트만으로 보장하지 않는다**. 출시 전 lockfile 재생성→npm ci→빌드→브라우저 실앱 회귀→Cloudflare 시험 배포가 필수다. 6번 아이템 이미지의 외부 GitHub 의존성과 3번 뉴스 더미도 아직 해결되지 않았다.

### V256 · 한글 사용법 제목·다크 문서 미리보기 (2026-11-08 · 미배포)
- **사용자 확정**: 메인 `GUIDES`는 `MARKET` 앞. 두 영역 큰 제목은 정확히 **`필터 사용법` / `POB 사용법`**. 각 2개 가이드만 유지: FILTER `POE2 필터 적용 방법` → `NeverSink 필터 엄격도 선택`; PoB `PoB 캐릭터 불러오기` → `PoB DPS 계산 기준`. 번호·작은 영문 GUIDE·중복 도구 실행 버튼 없음.
- **현 코드**: V255에서 V254의 두꺼운 그룹 박스를 제거하고, 가이드 링크 4개를 문서 본문 미리보기가 상시 보이는 클릭형 카드로 변경, 호버·키보드 포커스 때 카드/시트를 강조. V256에서 `src/app/page.tsx` 제목만 한글화하고, `src/app/globals.css`의 밝은 베이지 종이시트를 필터에는 따뜻한 흑갈색, PoB에는 차가운 남청색 반투명 다크패널로 변경. 모바일에서도 미리보기 상시 노출; 기존 실제 원문 앵커·링크, 공식 원화, FireText, 필터/PoB 데이터·로직·네버싱크 자산 보호. 미사용 V254 그룹 스타일 제거. 별도 서버/API·추가 이미지 없음.
- **실제 검증**: TypeScript TSX 파싱, PostCSS 파싱, 기존 V251/V253/V254 검사 최신 구조로 동기화, V256 새 검사 및 히어로·불꽃·모바일/필터 회귀 PASS. Chromium 실제 CSS/이미지와 **유사 DOM 기반 정적 모의** 1728/1000/768/390/320px: 카드 4개, 두 한글 제목, 색상·호버 transform(-3px), 섹션 순서, 가로 넘침 없음. **미검증** Next 전체 빌드(`node_modules` 없음), 실제 앱·실기기, Cloudflare 배포. 구 V236 `package-lock.json` 불일치 유지.
- **재발 방지**: 과거 V254의 큰 그룹 박스/도구 CTA나 V255의 밝은 베이지 시트를 복원하지 않는다. 디자인 변경 후 실제 배경을 적용한 화면으로 PC/모바일 명도·가로 넘침을 확인한다. 실제 호버 CSS 검사와 Next 실앱 호버 검증은 구분한다.

### V253 · GUIDES 선배치 + 초보자 3단계 경로 (2026-11-08 · 미배포)
- **사용자 확정**: 실전 가이드가 단순 장식처럼 보이고 첫 방문자가 이용 순서를 알기 어렵다는 문제를 해결한다. `GUIDES → MARKET → MEDIA`로 섹션 순서를 변경하되 FILTER 2개·PoB 2개 기존 검색 주제와 각 실제 본문 앵커를 보호한다.
- **변경 전후**: GUIDES 4개 단독 카드 → `처음 이용하시나요?` 아래 FILTER/PoB 2개 그룹별 3단계 안내. FILTER: NeverSink 엄격도 선택(기존 글) → 필터 설정(기존 `/filter`) → 게임 적용(기존 글). PoB: poe.ninja 링크 불러오기(기존 글) → 거래소 장비 비교(기존 `/pob`) → DPS 계산 기준(기존 글). 여섯 단계 모두 전체 행이 실제 링크이며, ‘가이드 읽기’와 ‘도구 실행’을 구분한다. 기존 `/guides` 전체 가이드 목록, 안내 본문, 도구/시세/공식 영상/불꽃·원본 데이터는 유지한다.
- **영향**: `src/app/page.tsx`, `src/app/globals.css`의 V251 안내 카드 규칙을 V253 그룹형 규칙으로 직접 교체, 새 `scripts/test-v253-guides-onboarding.cjs`. V240/V251/V252의 현재 구현과 충돌하는 과거 레이아웃 단정만 회귀 검사에서 갱신한다. V238(옛 히어로→MARKET)·V248(옛 3열 로고) 검사는 폐기된 배치 기준이라 현행 화면 회귀로 간주하지 않는다.
- **실제 검증/한계**: 4개 딥링크/앵커와 2개 도구 링크·GUIDES 우선 DOM 순서 검사, 변경 TSX·CSS 파싱, 홈페이지/불꽃/모바일/필터 회귀. Chromium 실제 CSS+간이 HTML 정적 렌더 PC 1728/1000, 태블릿 768, 모바일 390/320px에서 2열/1열 배치와 문서 가로 넘침 없음 확인. Next.js 실제 빌드·FireText Canvas/실기기·영상 재생·Cloudflare 배포는 미검증(`node_modules` 없음, 기존 lockfile 이슈). 정적 시안을 실앱 결과로 오인하지 않는다.

### V252 · 메인 중복 바로가기 제거 및 차별화 문구 교체 (2026-11-08 · 미배포)
- **사용자 재확인/수정 사유**: V251에서는 하단 GUIDES에 네 주제를 통합했지만, 이전에 제거하기로 확정한 메인 히어로의 `아이템 시세/가이드/공식 영상` 3개 중복 바로가기와 한 줄 소개 문구를 그대로 두는 누락이 발생했다. 사용자가 실제 화면으로 지적했고, 이를 이번 버전에서 시정한다. 신규 가이드를 메인에 중복 배치하지 않는다.
- **변경 전후**: 히어로 `poe-v250-intro` 및 `heroLinks` 3개 링크 렌더링을 **삭제** → FILTER·POB 카드 아래 2열의 얇은 편집형 차별화 안내로 **교체**. FILTER: `POE2 필터 적용, 복잡한 과정 없이`(규칙 파일을 직접 편집하지 않고 항목 설정). PoB: `POE2 거래소 아이템, 구매 전에 비교`(poe.ninja 링크를 통해 캐릭터를 불러와 장비 교체 전후 DPS/능력치 비교). 설명은 실제 제공 기능 범위에 한정하며, 필터 원클릭 자동 설치를 주장하지 않는다. 추가 아이콘·링크·중복 가이드 카드나 검색어 나열은 만들지 않았다.
- **영향/보호**: `src/app/page.tsx`의 메인 히어로 텍스트/바로가기만 변경하고, `src/app/globals.css`에서 제거된 V250 스타일을 정리한 뒤 V252 전용 간결한 PC 2열/모바일 1열 서체·선 스타일을 추가. 기존 공식 POE2 로고+FIX 브랜드, 전체 FILTER/POB 클릭 및 FireText 불꽃, 메인 배경·기능 데이터, `#market/#guides/#official-video`, V251 가이드 4개 본문 딥링크, 하단/상단 내비게이션은 보존. 새 검사 `scripts/test-v252-hero-clarity.cjs`.
- **검증 기준/한계**: V252 구문·중복 제거/기능 연결 테스트, V251·V250·V249·V244·V243·V242·V241·V240·V237·V247·필터 회귀와 CSS 파서 확인. Chromium 실제 CSS/이미지+간이 DOM 기반 **정적 모의 렌더**로 PC 1728/1000, 태블릿 768, 모바일 390에서 새 영역 표시 및 문서 가로 넘침 확인. 실제 Next.js 전체 빌드, FireText Canvas 움직임, 영상 재생, 실기기 터치, Cloudflare 배포는 미검증. 과거 `scripts/test-v238-home-redesign.cjs`는 V251 원본에서도 이미 현대 홈 레이아웃과 불일치해 실패하므로 레거시로 기록하며 회귀 통과로 표기하지 않는다.
- **재발 방지**: 사용자가 합의한 '삭제 대상'은 신규 요소 구현과 별개로 DOM 존재 여부를 검사한다. 홈 변경 시 기존 3개 중복 바로가기·반복 소개문이 다시 나오지 않는지, 실제 GUIDES/시세/영상 접근은 유지되는지 함께 검증한다.

### V251 · 검색 의도 가이드 4개를 기존 GUIDES에 통합 (2026-11-08 · 미배포)
- **사용자 확정**: 기존 FILTER·POB 박스와 중복되는 SEO 설명 영역을 새로 만들지 않고, 조사한 4개 주제(`POE2 필터 적용 방법`, `NeverSink 필터 엄격도 선택`, `PoB 캐릭터 불러오기`, `PoB DPS 계산 기준`)를 기존 하단 `GUIDES`에 통합한다. 현재 메인 로고·도구·MARKET·MEDIA·기존 가이드 링크 및 내용 보호.
- **코드 확인 및 변경**: 기존 `/filter/guide`에 필터 설치·게임에서 선택하는 방법과 엄격도 선택 설명이 이미 있고, `/guides/pob/getting-started`, `/guides/pob/dps`에도 캐릭터 링크·DPS 계산 설명이 이미 존재했다. 별도 4개 중복 페이지 대신 해당 기존 글의 문단을 보강하고 직접 앵커(`#filter-install`, `#neversink-strictness`, `#character-import`, `#dps-criteria`)로 연결한다. 메인 GUIDES의 막연한 2개 대형 카드만 4개 주제형 링크로 교체하고, PC 4열·태블릿/모바일 2열(320px 1열)로 구성. `/guides`의 기존 전체 가이드 목록·필터 오류 해결 및 그 밖의 PoB 가이드는 유지하고, 핵심 2개 가이드 라벨만 구체화. `PoB` 공통 가이드 컴포넌트는 선택적 `section.id`만 허용한다.
- **실제 검증**: 4개 메인 링크와 실제 본문 앵커·라우트/슬러그 일치, 변경된 TSX/TS의 TypeScript 구문 오류 0, CSS 파서 오류 0, V249/V250 및 V232/V244 등 기존 홈페이지·불꽃·모바일·확장 회귀와 `scripts/filter-regression.cjs` 통과. Chromium **정적 모의 렌더링** 1728/1000/768/390/320px에서 4개 항목 표시, 문서 가로 넘침 0 확인. 동적 Next 실제 화면·휴대폰 터치·Cloudflare 배포 및 SEO 노출 증가는 미검증; `package-lock.json` 정합성은 변경하지 않음.
- **보호와 재발 방지**: SEO 키워드만을 위한 빈 문서/중복 카드/가짜 기능을 만들지 않는다. 가이드 제목을 바꾸거나 앵커를 수정하면 반드시 홈 진입 링크와 원문 해당 섹션의 존재를 함께 검사한다. 필터 실제 적용은 브라우저 폴더 권한·파일 저장과 게임 내 필터 선택을 구분한다.

### V250 · 홈 통합 디자인 시스템 적용 (2026-11-08 · 미배포)
- **사용자 확정 방향**: V249의 공식 POE2 이미지 + FIX POE2 브랜드 결합을 유지하면서, 타이포그래피·아이콘·패널·이미지·콘텐츠 영역을 하나의 다크 판타지 시네마틱 편집 디자인으로 통일한다. FILTER·POB 동일 비중, 기존 실제 FireText 불꽃 필수, 메인 불타는 성·불씨 유지. 흔한 깔때기/막대그래프, 미완성 사각 프레임, 평범한 CTA 표현을 개선하되 클릭 가능성을 높인다. 모바일은 개방 유지.
- **코드 변경**: `src/app/page.tsx`의 홈 도구 Card에 기능별 고유 SVG(전리품 보석/스킬 노드), 영문 초소형 정보 라벨, 한글 클릭 문구를 추가하고 기존 Next Link 및 FireText 그대로 재사용. 기존 공식 자산 `official-adura-caravan.webp`, `official-lightning-gameplay.webp`를 크롭한 `v250-filter-art.webp`, `v250-pob-art.webp`를 새 카드 배경으로 추가(실제 아이템 사진이라고 주장하지 않음). `src/app/globals.css`의 홈 전용 `poe-v250-home` 범위에서 타이포그래피·브랜드 비율·고급 패널 실루엣·기능별 재질·반응형·MARKET/GUIDES/MEDIA 공통 헤더/카드/푸터 디자인 통일. 타 콘텐츠 문구, 필터/PoB 엔진, 데이터, 영상 갤러리 컴포넌트, 경로 변경 없음. 외부 폰트/CDN/유료 API 추가 없음.
- **실제 검증**: PC 1728/1000, 태블릿 768, 모바일 390px에서 실제 CSS/이미지+유사 DOM을 Chromium 정적 렌더하여 동일 크기 도구, 이미지 표시, 문서 가로 넘침 없음 확인. 모바일 첫 확인에서 FIX 로고의 오래된 `flex-basis:380px` 규칙이 공간을 과도하게 만드는 문제를 발견하고 모바일 명시 초기화 후 재검증. 실제 Next.js+FireText Canvas 상호작용/영상 재생/모바일 터치 및 Cloudflare 배포는 미검증. V236 lockfile 정합성 이슈 유지. 이전 V249/V244/V242/필터 등 계약 검사 재실행, 신규 V250 검사 추가.
- **재발 방지**: 정적 모의 화면은 실제 앱 화면이 아니므로 동적 효과 검증으로 표시하지 않는다. JSX 속성 구문 검사(V244), 불꽃 컴포넌트 연결(V242), 공식 로고 존재(V243), 모바일 390px 빈 영역 및 overflow를 차후 변경에도 확인한다. V249의 로고 결합과 CTA 문구는 유지하며 시각 표현만 개선.

### V249 · 공식 게임 로고 + FIX POE2 브랜드 결합 / 도구 행동 유도 (2026-11-08 · 미배포)
- **사용자 확정**: 공식 POE2 로고와 FIX POE2 자체 표기를 **같은 브랜드 영역에 가로로 묶고**, 그 아래 FILTER·POB를 동일 중요도로 나란히 둔다. 모바일에서는 로고 2개와 도구 2개를 세로로 배치한다. 게임 공식 로고 원본·불타는 성 배경·FILTER/POB 원본 Canvas FireText 불꽃 유지. 무거운 금속 장식 추가 금지.
- **현재 구현**: 별도 FIX 로고 이미지가 소스에 없으므로 기존 상단 `FIX POE2` 문자열을 기반으로 타이포그래픽 워드마크를 제작했다(새 공식 로고 이미지라고 주장하지 않는다). 브랜드 영역에 `FAN-MADE TOOLS BY FIXLGS`/`UNOFFICIAL TOOL PLATFORM`을 표시해 제작 주체와 공식 게임을 구분한다. 도구 카드 전체 링크는 유지하면서 각각 `필터 만들기`/`빌드 분석하기` 행동 문구를 추가했다. 변경 파일: `src/app/page.tsx`, `src/app/globals.css`, `scripts/test-v249-dual-brand-cta.cjs`, 레거시 `scripts/test-v243-official-hero-logo.cjs`의 복수 클래스 허용, 인수인계/색인. 다른 메인 콘텐츠·필터/PoB 데이터·라우팅은 불변.
- **검증 및 한계**: V249, V244 JSX 파서, V243 로고, V242 불꽃, V247 모바일, V241/V240/V237 회귀 및 CSS 파싱 통과. Chromium 정적 DOM+실제 CSS/이미지 모의 렌더에서 1728/1000/768/390px 가로 넘침 없음, 두 카드 동일 크기, 모바일 로고·도구 세로 배치 확인. 실제 Next.js 앱·Canvas 애니메이션 동작·실기기 터치·전체 빌드/배포 미검증. V236 package-lock 불일치 잔존. V248 기존 3열 배치 검사는 현 레이아웃과 충돌하므로 신규 V249 계약으로 대체하며 원본 테스트는 보존한다.

### V248 · FILTER | POE2 로고 | POB 가로 배치 및 불타는 성 배경 (2026-11-08 · 미배포)
- **사용자 확정**: PC 첫 화면에서는 FILTER·공식 POE2 로고·POB를 나란히 놓는다. FILTER·POB의 실제 FireText 불타는 글자 연출은 그대로 유지한다. 사용자가 공유한 불타는 성 이미지의 분위기를 배경에 적용한다. 모바일은 동일한 3열을 강제하지 않고 로고 → FILTER → POB로 쌓는다.
- **자산 처리**: 사용자가 공유한 작은 이미지에는 로고가 이미 포함되어 있으므로 그대로 배경으로 쓰면 로고 중복·품질 저하가 생긴다. 신규 생성 이미지에도 버튼과 문구가 박혀 있어 실제 배경으로 채택하지 않았다. 대신 프로젝트 내 기존 `public/images/poe2/cinematic-hero.webp`(로고·문구 없는 불타는 성 원화)의 색상과 콘트라스트를 보정한 `public/images/poe2/burning-castle-hero-v248.webp`를 추가했다. 따라서 **사용자가 올린 참고 이미지와 동일한 성 그림은 아니며**, 불타는 성 구도와 분위기를 재사용한 대체 배경이다. V241 공식 마을 배경 및 기존 모든 이미지는 삭제하지 않았다.
- **소스 변경**: `src/app/page.tsx`의 기존 FILTER·POB Link 카드를 `HomeToolCard`로 추출해 마크업/SVG/FireText/링크를 그대로 재사용하고 가운데 h1 공식 로고를 놓는 3열 래퍼로 변경했다. `src/app/globals.css`는 V248 범위에서만 새 배경, 데스크톱 3열·모바일 세로·카드 축소·중앙 로고 크기/명암을 정의했다. V245 불씨·화염 밝기, V246 버튼 스타일, 필터·PoB 기능/데이터·MARKET/GUIDES/MEDIA는 보존했다.
- **실제 검사**: V248 신규 계약, V244 JSX 파싱, V242 FireText 연결, V247 모바일 접근, V243 로고, V241 공식 아트, V240 히어로, V237 메인 순서, 필터 회귀를 실행해 통과했다. CSS/이미지/간이 DOM을 Chromium `set_content`로 렌더링한 **정적 모의 화면**에서 PC 1728px의 FILTER와 POB 카드가 각각 약 472.5×175px로 동일하며 550px 공식 로고가 가운데 표시됨을 확인. 모바일 390px에서 로고 → FILTER → POB 순서, 페이지 가로 넘침 없음 확인. 이 화면은 FireText 실제 Canvas 렌더링·Next 실제 앱 실행과 동일하지 않다.
- **미실행 및 재발 방지**: Next.js 전체 빌드, 실제 휴대폰 터치, FireText 동적 영상, 배포는 미검증. 기존 V236 `package-lock.json` 불일치 유지. 배경을 다시 제작하더라도 웹 UI 텍스트/버튼이 그려진 생성 이미지를 그대로 CSS 배경에 사용하지 말고, 실제 로고와 클릭 가능한 도구 카드 및 원본 FireText를 별도 요소로 유지한다.

### V247 · 모바일 전체 진입 허용 및 FILTER 차단 화면 제거 (2026-11-08 · 미배포)
- **사용자 확정**: 메인에 MARKET, GUIDES, 공식 영상 등 콘텐츠가 존재하므로 모바일을 전체 차단하지 않는다. 메인·시세·가이드·영상은 모바일에서 일반 접근하고, FILTER와 PoB도 접속을 막지 않으며 도구의 PC 권장과 실제 모바일 동작 보장은 구분한다.
- **코드 확인**: 메인은 V238 이후 작은 화면에서 이미 보이도록 CSS 재정의되어 있었으며, MARKET·GUIDES·MEDIA도 반응형 코드가 존재했다. PoB `src/app/pob/page.tsx`에는 모바일 차단 분기가 없었다. 실제 차단은 `src/app/filter/page.tsx`의 `filter-v2-mobile` 전용 PC 권장 화면과 `globals.css` 980px 이하 `.filter-v2-shell{display:none}`이었다.
- **수정**: FILTER의 기존 PC 전용 차단 화면을 제거하고 모바일 사용 안내·가이드/오류해결/메인 링크를 노출했다. 기존 `FilterCustomizer` 컴포넌트를 `.filter-v247-scroll` 영역에 그대로 넣어 980px 이하에서 기존 3열 PC 편집기를 **가로 스크롤**로 접근하도록 했다. PC에서는 래퍼를 `display:contents`로 처리해 기본 레이아웃을 보존했다. 원본 데이터·필터 편집/저장·다운로드·사운드·PoB 계산 코드·기존 영상과 호버 연출 불변. 소요비용 없음.
- **실제 검증**: Chromium에 해당 CSS와 모바일 구조의 **정적 모의 DOM**을 넣어 390px 및 768px 너비에서 편집기 `display:grid`, 모바일 안내 노출, 편집기 내부 스크롤 폭 1180px, 문서 전체 폭 390px/768px 일치를 확인했다. `scripts/test-v247-mobile-open.cjs`, V244 JSX, V237/V238/V240/V241/V242/V243 메인 계약, 필터 회귀 통과.
- **미실행/제약**: 실제 Next.js 전체 빌드 및 실기기 터치, FILTER 개별 편집·파일저장, PoB 모바일 계산, 모바일 공식 영상 재생은 검증하지 못했다. **FILTER 편집기는 모바일용 재설계가 아닌 PC 3열 레이아웃의 가로 스크롤 접근**이며 조작성은 제한적이다. 중간 폭 981~1300px에서 기존 PC 그리드가 문서 가로폭을 넘어갈 수 있는 별도 레거시 문제가 관찰됐지만 범위 밖이라 변경하지 않았다. V236 package-lock 미동기화 문제는 여전히 존재한다. 클라우드 배포 미수행.
- **재발 방지**: 사이트 차단과 도구 조작 난도를 혼동하지 않는다. 이후 모바일 개선 시 NeverSink/PoB 엔진·편집 데이터를 변경하지 말고 실제 좁은 화면의 가로 폭·터치 입력·다운로드를 별도로 검증한다. 관련 과거 원문 `V137_SAVE_PERSISTENCE_INSTALL_COMMIT_AUDIT.txt`의 저장/설치 순서를 유지한다.

### V246 · 메인 FILTER·POB 절제된 재질감 및 배경 조명 미세 보정 (2026-11-06 · 미배포)
- **사용자 확정**: 과한 금속 조각·두꺼운 프레임·강한 발광으로 촌스럽게 만들지 않는다. FILTER는 앤티크 골드/흑갈색, POB는 은청색/네이비. 두 도구는 동일 크기·동일 강조 비중 유지. 공식 원화와 V242 원본 FireText 불꽃, V245 불씨·국소 화염 효과 보호.
- **코드 확인/수정**: 기존 `src/app/globals.css`의 V240/V241 홈 전용 프레임 스타일을 직접 수정했다. 실제 테두리 2px → 1px, 하단 발광 불투명도 .7 → .19, 얇은 내부 라인·미묘한 사선 반사·음영·상호작용 재질 보강. 배경 로고 주변 비네팅의 중앙 명암 범위만 미세 조정하며 원본 이미지는 변경하지 않는다. 홈 한정 호버/포커스 규칙 외 다른 기능·컴포넌트 코드는 불변.
- **검증**: Chromium 정적 CSS/이미지 모의 화면에서 PC 1728px의 버튼이 각각 663×195px 동일, 실제 CSS 계산 테두리 두 개 모두 1px, 가로 넘침 없음 확인. 모바일 390px 가로 넘침 없음. V245 원본과 수정본 PC/모바일 비교 캡처 생성. V244 JSX/V243 로고/V242 FireText/V241 공식 배경/V240 시네마틱/V237 메인·필터 및 V233~V236 관련 회귀 통과, `tinycss2` CSS 최상위 파싱 오류 0. **모의 DOM 검증**이며 실제 Next.js 전체 빌드, FireText Canvas 시각 결과, Cloudflare 배포 및 실제 모바일 터치는 미검증.
- **교훈/재발 방지**: V238~V240의 시안/실제 괴리를 반복하지 않도록 CSS 실사용 계산값과 렌더링을 함께 확인한다. 사용자가 이전에 지적한 JSX 구문 오류 재발을 막도록 V244 파싱 테스트를 유지한다. 새 금속 이미지나 장식을 추가하지 말고 기존 스타일 원천 직접 수정 우선.

### V244 · 메인 공식 로고 JSX 구문 오류 긴급 수정 (2026-11-06 · 로컬 소스, 미배포)
- **실제 사용자 오류**: `src/app/page.tsx:69`에서 `Expected '</', got 'numeric literal'`; 로고 Next `<Image>`의 `width=1577` / `height=1343`을 JSX 숫자 속성으로 잘못 작성하여 홈 페이지가 500 오류로 실행 불가. 이전 V243의 정적 계약 검사가 이미지 존재·문자열 포함만 검증하고 TSX 구문을 검사하지 않은 것이 누락 원인이다.
- **최소 수정**: 두 줄만 `width={1577}` / `height={1343}`으로 고쳐 React JSX 규칙 충족. 원본 로고 이미지·크기·불꽃·FILTER/POB·미디어·시세·Cloudflare 구성은 변경하지 않음.
- **실제 검사**: `scripts/test-v244-jsx-syntax.cjs`에서 TypeScript 파서를 사용해 `page.tsx`의 구문 오류 0건 확인. V243/V242/V241/V240/V237, 필터 회귀, V235 도메인 및 V236 Cloudflare 계약 검사 통과. 기존 V243 검사에서는 이 오류를 놓쳤으므로 이후 TSX 수정 시 반드시 문법 파서를 포함할 것.
- **미검증·별개 이슈**: 현재 환경에 프로젝트 `node_modules`가 없어 Next 개발 서버 전체 빌드와 실제 사용자의 Windows 환경 `Watchpack EINVAL` 재현은 미실시. 로그의 `D:\System Volume Information` 접근 경고는 JSX 구문 오류와 별개의 파일 감시 문제이며, 이번 패치로 해결했다고 주장하지 않음. 배포 미수행. 기존 V236 `package-lock.json` 정합성 이슈는 그대로 유지.


## 4. 검증 결과와 미검증 항목
### V268 실행·통과
- `node scripts/test-v268-runic-ward-native-parser.mjs`: 실제 번들 PoB2 WASM에서 Runic Ward +40/+50/+100/+300 인식, Grants Skill/Only Runes/Socketed Runes 옵션, nativeIntegrity 검증 PASS. 미지원 임의 옵션 차단 유지. 세부 내용은 `V268_RUNIC_WARD_NATIVE_PARSER_REPORT.md`.
- `node scripts/check-pob2-fingerprint.cjs`: Lua 997개 파일 및 변경된 `pob-lua.json` SHA-256 일치, WASM SHA-256 불변 확인. upstreamCommit은 UNVERIFIED.

### 실행·통과 (V267 작업 환경)
- `node scripts/test-v267-pob-export-recovery.cjs`: 실제 제공 URL builds/profile 파싱·UTF-8 경로·PoB Export Base64/zlib/XML·활성 장비 16개·주얼 3개·스킬 그룹 21개·주스킬 선택·보조 젬 연결·잘못된 코드 거부·TS/TSX 구문/PoB2 엔진 연결 검사 PASS.
- `node scripts/test-v210-contract.cjs`: 기존 V210 Export 어댑터 계약 PASS.
- `node scripts/test-v229-weapon-skill.cjs`: V229/V230 스킬 그룹 및 무기 세트 회귀 PASS.
- `node --experimental-strip-types scripts/test-v226-ring-slots.cjs`: 29개 반지 슬롯 회귀 PASS. (이 프로젝트는 이 테스트에 TypeScript strip 플래그가 필요하다.)
- `node scripts/test-v236-cloudflare-pipeline.cjs`: Worker/OpenNext 설정 및 원본 자산 보호 검사 PASS.
- `node scripts/test-v257-home-integration.cjs`, V259~V262, V264, V265, V266 검사 PASS. PoB UI 변경으로 홈·FILTER·뉴스·검색 파일 계약이 깨지지 않았음을 확인했다.

### 실행하지 못함 / 추가 확인 필요
- 전체 Next.js 타입 검사·`npm run build`·`npm run build:cloudflare`는 이 작업 환경에 `node_modules`가 없어 미실행. 정적 transpile/구문 검사 PASS를 전체 빌드 PASS로 간주하지 않는다.
- 실제 사용자의 PoB Export 코드로 가져오기·장비 슬롯 화면·스킬 표시·Set I/II·기존 PoB2 WASM 계산 결과를 아직 검증하지 않았다. 테스트 fixture 성공은 실제 사용자 캐릭터 성공의 증거가 아니다.
- poe.ninja 내부 상세 API는 사용자의 화면에서 HTTP 403이 확인됐다. 일반 링크만 입력할 경우 계속 실패할 수 있다. Export 코드를 함께 입력하면 해당 비공개 API를 호출하지 않는 대체 경로를 사용한다.
- Cloudflare 실제 배포와 프로덕션 PoB 동작은 미실행. GitHub 브랜치의 마지막으로 직접 확인된 커밋은 V264 `f0fd006`이며 V266/V267은 아직 푸시 성공 로그가 없다.
- 사용자가 제공한 2026-11-15 로컬 Next 개발 로그에서 `/`, `/news`, `/filter`, `/pob`, 관련 가이드 경로가 HTTP 200으로 응답했으나 외부 fetch에서 `UND_ERR_HEADERS_OVERFLOW`가 반복됐다. 원인과 이 현상에 대한 이번 PoB 수정의 영향은 미확인.

## 5. 다음 작업과 우선순위
1. 사용자 PC의 기존 `D:\WebProjects\fix-pob`와 V267 전체 ZIP을 대조해 적용한다. `.git`, 사용자 `node_modules`, 갱신된 `package-lock.json`, `.env*`, `.dev.vars`는 보존하며 `git reset --hard` 등 초기화 명령을 사용하지 않는다.
2. 사용자 실제 poe.ninja 캐릭터 링크와 Path of Building 앱의 `Import/Export Build → Export to Code`에서 복사한 코드를 넣어 `/pob`에서 가져오기 실행. 장비·주얼·활성 스킬·주스킬 이름을 실제 캐릭터와 대조한다.
3. 기존 PoB2 브라우저 엔진이 Export XML을 로드하고 Set I/II의 생명력·저항·DPS를 계산하는지 확인한다. 계산값이 없거나 엔진이 지원하지 않는 항목은 경고/미검증으로 표시하고 임의 수치로 보정하지 않는다.
4. 실제 Export 검사 후 Next 16.4.5 환경에서 `npm run build`와 `npm run build:cloudflare`를 실행한다. 기존 사용자 lockfile이 package.json과 맞는지 확인하고 임의 갱신/다운그레이드하지 않는다.
5. 빌드 및 브라우저 확인 후 사용자 승인에 따라 GitHub 브랜치 `cloudflare-poe2-assetfix-v233`에 푸시하고 Cloudflare `fixlgs-poe2` 배포 성공 및 실제 PoB 동작을 확인한다.

## 6. 실행 및 확인 방법
- **V267 import 회귀 검사(프로젝트 루트):** `node scripts/test-v267-pob-export-recovery.cjs`
- **기존 Export 계약:** `node scripts/test-v210-contract.cjs`
- **무기/스킬 회귀:** `node scripts/test-v229-weapon-skill.cjs`
- **반지 슬롯 회귀:** `node --experimental-strip-types scripts/test-v226-ring-slots.cjs`
- **로컬 실행:** `npm run dev` 후 `http://localhost:3000/pob`. URL만 넣으면 링크/공개페이지 확인을 시도하고, 상세 데이터 API가 실패하면 화면에 Export 코드 입력을 안내한다. URL과 Export 코드를 동시에 입력하면 비공개 상세 API를 건너뛰고 Export를 검증한다.
- **Export 코드 발급:** Path of Building 앱에서 `Import/Export Build` → `Export to Code`로 생성한 코드 전체를 복사한다. 코드가 준비되면 poe.ninja 캐릭터 링크와 함께 FIXLGS 입력란에 붙여넣는다.
- **기존 PoB 계산 검증:** `node scripts/test-v210-contract.cjs`, `node scripts/test-v225-comparison-guard.cjs`, `node --experimental-strip-types scripts/test-v226-ring-slots.cjs`, `node scripts/test-v229-weapon-skill.cjs`; 실제 WASM 계산은 브라우저에서 별도로 확인한다.
- **Cloudflare 설정 계약:** `node scripts/test-v236-cloudflare-pipeline.cjs`. 실제 빌드/배포 성공과 구분한다.

## 7. 주요 파일 및 과거 기록
- **V267 PoB 가져오기:** `src/app/pob/ninjaImport.ts`, `src/app/pob/pobExport.ts`, `src/app/api/pob/import-ninja/route.ts`, `src/app/api/pob/prepare-export/route.ts`, `src/app/pob/page.tsx`, `scripts/test-v267-pob-export-recovery.cjs`, `V267_POB_NINJA_EXPORT_RECOVERY_AUDIT.md`. poe.ninja builds/profile URL 및 UTF-8 파싱, 사용자 제공 PoB Export 원본 XML 복원, 내부 상세 API 생략 옵션, 기존 PoB2 계산엔진 인계. 해당 기능 변경 전 V219·V210 원문과 V154/V156/V158/V170 감사 파일을 다시 읽는다.
- Cloudflare V236/V235 과거 세부 이력은 `docs/handover/HISTORY_V012.md`로 분리했다. 현재 배포/도메인 기준은 이 문서 상단 V263~V267 및 사용자 최신 배포 로그가 우선한다.
- V266 기사: `src/app/news/OfficialArtwork.tsx`, `preview/news-001/index.html`(로컬 확인용), `scripts/test-v266-news-seo-official-images.cjs`; V265 기사: `src/app/news/page.tsx`, `src/app/news/poe2-1-0-full-release/page.tsx`, `src/app/news/news.module.css`, `public/news/poe2-1-0/`(WebP 5개), `scripts/test-v265-news-article.cjs`. V019 참고 원본은 `docs/design-reference/V019/` 그대로 유지.
- 보관 이력 `docs/handover/HISTORY_V001.md`~`HISTORY_V012.md`; 별도 설명·재열람 조건 `docs/handover/INDEX.md`. V011은 V243 공식 로고·V242 기존 불꽃 재현 이력, V010은 V237/238/240/241 구형 홈 구성 이력, V012는 V236/V235 Cloudflare 이전 이력이다. 구형 홈 구성은 최신 V019 디자인으로 재적용하면 안 된다. 확정 HISTORY 원본은 재정제·덮어쓰기하지 않는다.

- **현재 홈:** `src/app/page.tsx`, `src/app/home-v019-markup.ts`, `src/app/home-v019.css`, `src/app/V019Interactions.tsx`, `public/poe-home/`, `scripts/test-v257-home-integration.cjs`. 디자인 전용 기준 보관본: `docs/design-reference/V019/` (V001~V019 결정·실패·검증 원문 포함).
- **적용한 교훈:** V019은 디자인 회의 외 수정 금지·로컬 WebP 보호·V013 영상 빈 프레임 제거·V014 빈 ID/153 오류 사례. V256은 V238~V241 실제 디자인이 시안과 달랐던 오류, V233 정적 자산 25MiB/원본 복원, V234 Worker 이름, V226 Ring 1/2 정확히 구별, V137 필터 저장 순서 보존. 본 통합은 홈만 교체하고 엔진은 바꾸지 않는 식으로 반영.

- 설치 버튼: `src/app/pob/page.tsx`.
- 사용 가이드 데이터: `src/lib/pobGuides.ts`.
- 새 가이드 라우트: `src/app/guides/pob/[slug]/page.tsx`.

## 8. 누적 작업 이력
- V265 뉴스 제작 당시 원문은 `docs/handover/HISTORY_V013.md`에 보관. 뉴스 UI·SEO·발행일·미검증을 재검토할 때 읽는다.

### 2026-11-15 · V267 · PoB poe.ninja 403 대응 및 Export 입력 복구
- **문제/원인:** 사용자가 전달한 `poe.ninja/ko/poe2/builds/.../character/...`는 URL 확인이 성공했으나 상세 캐릭터 API가 HTTP 403, PoB Export는 MISSING으로 표시되고 장비·스킬·스탯이 비어 있었다. V262/V266의 관련 상세 API·화면 코드는 최근 GA4/뉴스 통합에서 변경되지 않았으며, 기존 구현이 문서화되지 않은 poe.ninja 내부 API에 의존하는 구조 자체가 취약했다.
- **사용자 기준/범위:** 기존 PoB 계산엔진과 원본 XML을 유지하고, 서버 차단 우회는 하지 않는다. 사용자가 직접 생성/복사한 PoB Export 코드를 대체 입력으로 제공해 기존 계산엔진에서 계산한다. FILTER·NeverSink·홈·Cloudflare·계산 함수 본체는 보호.
- **변경:** V219에서 확정한 Builds/Profile URL 형식과 UTF-8 한 번 디코딩 복원. PoB Export용 Base64/zlib/XML 파서 신규, 활성 ItemSet 장비/무기 세트·Tree Spec 주얼·Skills SkillSet 젬/보조 젬·Build.mainSocketGroup 주스킬 추출. `prepare-export`가 원본 XML과 표시 데이터 제공. 화면 Export 코드 입력/실패 안내/실제 데이터가 없으면 캐릭터 화면 미진입. 수동 코드를 함께 보내면 `import-ninja` 공개 페이지 확인만 수행하고 내부 상세 API는 skip. 기존 `CalcClient`·`calculateComparison`·V210 PoB2 WASM 경로 그대로 사용.
- **검증:** 신규 `test-v267-pob-export-recovery.cjs` PASS(사용자 URL/profile Unicode, Export fixture 16 장비·3 주얼·21 스킬, Twister main skill, Frost Nexus support, malformed code 거부, TS/TSX syntax 및 계산엔진 연결). V210/V229/V226/V236/V257/V259~V262/V264~V266 회귀 PASS.
- **미검증:** 실제 사용자 Export code 및 실캐릭터의 PoB2 WASM 계산, 전체 Next/Cloudflare 빌드, 프로덕션 배포 미실시. 403 API 자체를 해소하거나 우회하지 않는다.
- **재발 방지:** URL 확인/프로필 페이지 응답/상세 데이터 수신/PoB Export 해독/엔진 계산은 별도 상태로 다룬다. `HTTP 403`은 상세 데이터 성공이 아니다. XML 원본과 계산엔진 외 추정 DPS/STATS를 생성하지 않는다.

### 2026-11-15 · V270 작업
- 위 V270 원인·수정·검증·미검증 기준을 최신 상태로 반영. V265 과거 작업 이력은 HISTORY_V013으로 원문 보관, 기존 확정 HISTORY 불변.

### 2026-11-15 · V271 · 보조 스킬 계산 제한 복구
- V229에서 추가 스킬 최대 12개로 제한했던 이유는 Lua 그룹 전환 비용·무한 실행 방지였으나, 실제 14개 후보에서 2개가 누락되었다. 단순히 경고를 지우지 않고 12개씩 순차 조회·무기 세트 복원·24개 상한 및 미검증 명시를 유지했다. `src/app/pob/pobCompare.ts`, `scripts/test-v271-secondary-group-continuation.cjs` 변경. V225/V229/V270 회귀와 모의 14그룹 검증 통과, 실캐릭터 전체 WASM·실브라우저 미검증.
