# V268~V270 과거 작업 이력 · 2026-11-15

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
