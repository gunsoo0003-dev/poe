# V268 PoB2 Runic Ward 원본 파서 인식 복구 보고서

- 기준일: 2026-11-15
- 기준 프로젝트: V267 `FIXLGS_POE2_V267_POB_NINJA_EXPORT_RECOVERY_20261115.zip`
- 상태: 소스 수정 및 실제 번들 WASM 파서 검증 완료 / 사용자 실제 캐릭터 교체 계산·Next 전체 빌드·Cloudflare 배포 전

## 1. 사용자 증거와 실패 원인

사용자 제공 PoB 화면에서 캐릭터 장비·주얼·스킬은 표시되지만, 무기 세트 I의 교체 계산이 다음 이유로 차단됐다.

- `교체 계산 보류 - weapon-set-1: 원본 PoB 옵션 인식 검증 실패`
- 문제 옵션: `+300 to maximum Runic Ward`
- 원본 파서의 잔여 미해석 텍스트: `maximum Runic Only Runes can be Socketed in this item`
- 교체 후 DPS/STATS는 숨기고 기존 CURRENT 계산값을 유지하는 V225 안전장치가 작동했다.

V267은 poe.ninja의 캐릭터 데이터 가져오기/PoB Export 입력 경로를 복구한 버전이다. 이번 화면에서는 장비·주얼·스킬이 이미 표시되므로 이번 작업은 데이터 입력 문제가 아니라 PoB2 내장 원본 Item/Mod 파서 사전의 누락으로 분리했다.

## 2. 원인 확인

현재 번들 `public/data/pob-lua.json`에는 997개 공식 PoB Lua 파일이 들어 있다. 그중 `files["src/Modules/ModParser.lua"]`의 `modNameList`에는 일반 `ward` 매핑은 있었지만 아래 두 별칭이 빠져 있었다.

```lua
["runic ward"] = "Ward",
["maximum runic ward"] = "Ward",
```

PathOfBuildingCommunity의 공식 PoE2 개발 소스 `src/Modules/ModParser.lua`에는 위 두 매핑이 존재한다.

참고: https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua

또한 내장 `src/Data/ModCache.lua`에는 `+40`, `+50`, `+100 to maximum Runic Ward` 및 일부 복합 문자열의 예전 부분 파싱 캐시 6개가 남아 있었다. 이 정확한 캐시 키가 있으면 새 `ModParser.lua` 매핑을 추가해도 과거의 `Ward` 부분 인식과 `maximum Runic` 잔여 문자열을 재사용할 수 있다.

따라서 원인은 **Runic Ward 명칭 별칭 누락 + 그 누락 결과를 고정한 구형 부분 파싱 캐시**의 조합이다.

## 3. 수정 내용

대상 파일은 `public/data/pob-lua.json` 하나다. JSON 안의 공식 Lua 소스 두 항목만 변경했다.

1. `src/Modules/ModParser.lua`: `ward` 항목에 공식 상류 소스와 같은 `runic ward`, `maximum runic ward` → `Ward` 매핑 두 줄을 추가.
2. `src/Data/ModCache.lua`: 아래 정확히 일치하는 오래된 부분 파싱 캐시 6개만 제거.
   - `+40 to maximum Runic Ward`
   - `+40 to maximum Runic Ward 50% increased Critical Hit Chance`
   - `+50 to maximum Runic Ward`
   - `+50 to maximum Runic Ward 300% increased Physical Damage`
   - `+100 to maximum Runic Ward`
   - `+100 to maximum Runic Ward 150% increased Armour`

이후 PoB2의 원래 `ModParser`가 해당 줄을 새 매핑으로 직접 파싱하도록 했다. 임의 수식·DPS/STATS 계산·보정값은 추가하지 않았다.

다음 핵심 보호 파일과 실행엔진은 변경하지 않았다.

- `public/wasm/lua.wasm`
- `src/app/pob/pobCompare.ts`
- `src/app/pob/nativeIntegrity.ts`
- `src/app/pob/web-engine/`

V225의 “원본 PoB 파서가 인식하지 못한 교체 옵션은 비교 계산 차단, CURRENT 유지, AFTER DPS/STATS 미표시” 규칙은 그대로 유지된다. `scripts/pob2-engine-fingerprint.json`에서 `pob-lua.json`의 SHA-256을 변경된 파일 해시로 갱신했고, WASM 해시는 기존 값 그대로다. 공식 upstream 저장소의 최신 브랜치 소스와 비교했으나 upstream의 특정 커밋 SHA로 고정/검증한 것은 아니므로 fingerprint의 `upstreamCommit`은 `UNVERIFIED`로 유지했다.

## 4. 실제 검증

`node scripts/test-v268-runic-ward-native-parser.mjs`는 프로젝트의 실제 `public/wasm/lua.wasm`과 번들 `pob-lua.json`을 로드하고, 보관된 V210 PoB Export 샘플로 PoB 빌드를 초기화한 뒤 PoB 고유 `Item` 생성 및 원본 파서 감사(audit)를 실행한다.

실제 WASM 원본 파서 검사 결과:

- `+300 to maximum Runic Ward`: `modifierCount > 0`, `extra === ""`
- `Grants Skill: Level 19 The Stars Answer`: 인식, 잔여 문자열 없음
- `Only Runes can be Socketed in this item`: 구조 플래그로 인식, 잔여 문자열 없음
- `200% increased effect of Socketed Runes`: 인식, 잔여 문자열 없음
- `+40`, `+50`, `+100 to maximum Runic Ward`: 각각 인식, 잔여 문자열 없음
- `validateNativeItemAudit()` 실제 호출: 정상 Runic Ward 아이템은 `verified=true`
- 임의의 존재하지 않는 옵션: 계속 `verified=false`로 차단

즉 Runic Ward 수정 때문에 V225의 fail-closed 안전장치가 느슨해지지 않았음을 확인했다.

추가 PASS 검사:

- `node scripts/test-v210-contract.cjs`
- `node scripts/test-v211-rune-contract.cjs`
- `node scripts/test-v225-native-integrity.cjs`
- `node scripts/test-v225-native-wasm.mjs` (기존 Unborn Lich의 별도 미해석 효과 2건은 기존처럼 안전하게 감지)
- `node scripts/test-v225-comparison-guard.cjs`
- `node --experimental-strip-types scripts/test-v226-ring-slots.cjs` (29 checks)
- `node scripts/test-v227-integrity.cjs`
- `node scripts/test-v227-runeseeker-wasm.mjs`
- `node scripts/test-v228-skill-display.cjs`
- `node scripts/test-v229-weapon-skill.cjs`
- `node scripts/test-v267-pob-export-recovery.cjs`
- `node scripts/check-pob2-fingerprint.cjs` (997 Lua files, upstream commit remains unverified)
- `node scripts/test-v236-cloudflare-pipeline.cjs`
- `node scripts/test-v257-home-integration.cjs`
- `node scripts/test-v259-pob-theme.cjs`
- `node scripts/test-v260-pob-wide-backdrop.cjs`
- `node scripts/test-v261-filter-theme.cjs`
- `node scripts/test-v262-filter-adaptive-wallpaper.cjs`
- `node scripts/test-v263-ga4-main-integration.cjs`
- `node scripts/test-v264-search-discovery.cjs`
- `node scripts/test-v265-news-article.cjs`
- `node scripts/test-v266-news-seo-official-images.cjs`

## 5. 미검증 / 후속 확인

- 사용자의 실제 `썩은통닭-2237 / 빅맥치킨` PoB Export 원문을 받아 실제 교체 장비와 연결한 UI 전 과정은 아직 미검증이다. 이번 검증은 오류 옵션과 동등한 속성 문구를 포함하는 실제 PoB2 WASM 아이템 파싱 및 V210 보관 Export 샘플 기반 검사다.
- 교체 장비를 실제 캐릭터에 장착해 PoB2가 계산한 AFTER DPS/STATS 전체 결과까지 화면에서 검증한 것은 아니다. 다만 이번 화면에서 계산을 차단하던 `nativeIntegrity` 사유는 정상 Runic Ward 테스트에서 해소됐고, 미지원 옵션 차단은 유지됐다.
- Next 전체 타입 검사/프로덕션 빌드와 Cloudflare OpenNext 빌드·배포는 미실행. 작업 환경에 `node_modules`가 없어 수행하지 못했다.
- poe.ninja 내부 API HTTP 403 우회는 수행하지 않았고 관련 경계는 V267 원칙을 유지한다.

## 6. 재발 방지

- 공식 PoB Lua 파서가 인식해야 하는 새 게임 옵션/명칭을 추가할 때는 `ModParser.lua`와 `ModCache.lua`를 함께 확인한다. 기존 부분 파싱 캐시가 새 파서 매핑을 가리는지 확인한다.
- `pob-lua.json` 변경 시 fingerprint를 갱신하되, 변경 경로·원본 공식 출처·WASM 불변 여부를 별도 보고서와 HANDOVER에 기록한다.
- `nativeIntegrity.ts`를 약화하거나 알 수 없는 옵션을 허용 목록에 임의 추가하지 않는다. CURRENT 보존/AFTER 차단 안전장치를 계속 유지한다.
- 사용자 실제 캐릭터 Export와 실제 교체 계산은 배포 전 확인 대상으로 남긴다.
