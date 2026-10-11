# FIXLGS POE2 V225 — PoB 원본 옵션 해석 검증

기준 버전: V224. 실제 PoB2 Lua 데이터(997개 파일)와 WASM 바이너리는 **바꾸지 않음**.

## 목적

FIXLGS에서 별도의 게임 계산식이나 임의 옵션 효과 규칙을 추가하지 않는다. 거래소 텍스트는 PoB가 받는 아이템 텍스트로 최소한만 변환한다. PoB 원본 `Item:ParseRaw` / `ModParser`가 **실제로 만든 modifier**와 해석되지 않은 문자열(`extra`)을 직접 검사한다. 일부 옵션을 무시했는데도 계산 숫자가 나오는 경우, 해당 숫자를 정확한 비교 결과로 노출하지 않는다.

## 이번에 수정한 것

1. **원본 Item 파서 감사(`pobWebNativeModAudit`)**: implicit / explicit / enchant / rune / buff / class requirement 옵션 각각의 PoB 원본 modifier 개수와 남은 `extra` 텍스트를 노출한다. 게임 공식 효과를 FIXLGS에서 다시 계산하지 않는다.
2. **원본과 변환 텍스트 1:1 검사**: 변환기가 보낸 옵션이 원본 파서에 확인되지 않으면 교체 후 수치 계산을 보류한다. `modifierCount=0`인 줄은 PoB의 구조 효과일 수 있지만, 이번 단계에서는 수치에 안전하게 반영됐는지 증명되지 않아 보수적으로 보류한다.
3. **안전한 계산 차단**: 파싱 불완전/룬 불일치 등 검증 실패 시 CURRENT 계산값은 유지, AFTER DPS·STATS·증감량은 표시하지 않고 해당 옵션을 안내한다.
4. **FIXLGS 고정 옵션 자체 합산 화면 제거**: 현재 웹 화면에 표시되는 장비 교체 DPS/Stats는 원본 PoB 계산 결과만 사용한다.
5. **버전 지문 기록**: `scripts/pob2-engine-fingerprint.json`에 Lua/WASM SHA-256와 파일 수 기록. *공식 원본 커밋은 아직 특정되지 않아 `UNVERIFIED`로 명시.* 변경 감지 테스트 추가.

## 실제 발견한 문제

VD_VD의 비교용 고유 무기 `The Unborn Lich`를 현재 PoB WASM 원본 Item 파서에 넣었을 때,
- `10% increased Spell Damage per 100 maximum Mana`, `42% chance for Spell Skills to fire 2 additional Projectiles` 등은 native modifier를 생성함.
- `79% increased Desecrated Modifier magnitudes`, `102% increased Magnitude of Unholy Might buffs you grant`, `Bonded: 12% chance ...` 등에는 원본 파서의 `extra` 문자열이 남는 현상을 재현함.
- 일부 룬 줄도 `modifierCount=0`이므로 정상 효과 반영을 검증할 수 없음.

이는 **현재 V224에서 나온 +1.59%를 완전히 검증된 결과라고 표시하면 안 된다**는 근거이며, V225는 그 숫자를 강제로 다른 값으로 보정하지 않는다. 새로운 업스트림 PoB가 이 옵션을 정식 해석하면 원본 데이터 갱신 및 테스트를 거쳐 통과시킬 수 있다.

## 자동 검증

- `npm run pob2:native-audit` — 원본 파서의 미인식/누락/중복 옵션이 실패 처리되는지 7개 계약 테스트
- `npm run pob2:native-wasm` — 실제 PoB WASM + Lua 원본에서 정상 옵션 / 가짜 옵션 / 실제 불완전 옵션 3종 검사
- `npm run pob2:comparison-guard` — 검증 실패일 때 원본 수치는 보존하고 AFTER는 차단하는 비교 흐름 테스트
- `npm run pob2:fingerprint` — 현재 동봉된 엔진 파일 지문 검사
- `node scripts/test-v210-contract.cjs`, `node scripts/test-v211-rune-contract.cjs`, `node scripts/test-skill-change.cjs` — 기존 변환 / 룬 / 스킬 회귀 검사

## 한계와 다음 작업

- **이번 단계는 계산 결과를 무조건 정확하게 만드는 패치가 아니다.** 미인식 옵션이 계산에 포함되지 않은 경우를 탐지해 잘못된 수치를 숨기는 1차 안정장치다.
- 기존 PoB2 엔진이 아직 특정 PoE2 옵션을 지원하지 않는다면, FIXLGS에서 별도 계산식을 추가하지 않는다.
- 공식 데스크톱 PoB2와 동일 커밋/계산 데이터에서 실행한 수치 비교는 **아직 완료되지 않음**. 별도 원본 헤드리스/데스크톱 A/B 테스트가 필요하다.
- 원본 PoB 파일에 기존 Lua 5.2 호환 처리 2건이 남아 있다. V225에서 새 수치 공식 또는 호환 패치는 추가하지 않았다.
- npm 의존성 일부가 오프라인 캐시에 없어 전체 Next.js 빌드는 이 환경에서 실시하지 못했다. 계산 모듈 타입 검사와 스크립트·실제 WASM 검증은 통과.

배포는 위 한계를 확인한 뒤 진행할 것. 압축 구조는 기존과 동일한 `fix-pob` 최상위 폴더 한 개다.
