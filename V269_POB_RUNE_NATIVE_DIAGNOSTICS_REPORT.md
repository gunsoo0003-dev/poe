# V269 PoB 원본 룬 진단 작업 기록

### V269 · PoB 원본 룬 실패 증거 분리 (2026-11-15 · 소스 수정, 미배포)
- **사용자 증거:** 실제 빅맥치킨 캐릭터의 Runeseeker's Call 교체에서 PoB native 원본 옵션 13개/미해석 0개, 장착 item 27/modifier 17/revision 28→29가 성공한 뒤 `runeUnknownLines` 또는 `runeNamesUnknown` 보호검사에서 차단. 어느 이름/효과인지는 기존 화면에 출력되지 않아 특정 불가.
- **과거 교훈 적용:** V211 `{rune}` 원문·PoB `Item.lua` 분류 유지, V227 Runeseeker 6소켓/6룬/12효과 실제 WASM 테스트를 재실행하여 통과. 샘플 성공을 실캐릭터 성공으로 오인하지 않음. PoB 원본 `runeModLines`와 `item.runes`가 기준이며 FIXLGS 임의 룬 사전/계산식은 추가하지 않음.
- **수정:** `calc-worker.ts`는 PoB가 생성한 룬 효과별 `line/modifierCount/parserExtra/bonded` 진단만 추가. `pobCompare.ts`는 합쳐진 오류 대신 실제 `runeNamesUnknown`/`runeUnknownLines` 항목을 원문으로 표시하고 진단 로그에 원본 엔진의 효과별 정보를 남김. `calc-client.ts` 반환 타입 갱신. 미인식 판정 및 CURRENT 유지/AFTER 차단은 불변.
- **검증:** V227 최종 결속 조건 검사 PASS, V227 실제 Runeseeker PoB2 WASM(6소켓/6룬/12효과) PASS, V268 실제 Runic Ward WASM 파서 PASS. V269 진단 소스 계약 검사 PASS. **미검증:** 실제 빅맥치킨 Export·교체 아이템 원본을 확보하지 못해 실패한 룬의 정체, 실캐릭터 AFTER DPS/STATS 성공, Next 전체 빌드/Cloudflare 배포는 확인 불가. 따라서 계산 오류 해결 완료라고 보고하지 않음.
- **다음 단계:** 실제 캐릭터에서 재실행 후 화면의 `PoB 룬 이름 미등록:`/`PoB 룬 효과 미해석:` 원문을 확보하고, PoB `Item.lua`가 제공한 결과와 변환 원본을 비교하여 정확한 원인만 수정. 현재 코드에 기존 guard를 우회하는 예외를 추가하지 말 것.

