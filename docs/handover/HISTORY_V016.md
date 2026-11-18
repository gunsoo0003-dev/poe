# V267 작업 이력 보관 (2026-11-15)

### 2026-11-15 · V267 · PoB poe.ninja 403 대응 및 Export 입력 복구
- **문제/원인:** 사용자가 전달한 `poe.ninja/ko/poe2/builds/.../character/...`는 URL 확인이 성공했으나 상세 캐릭터 API가 HTTP 403, PoB Export는 MISSING으로 표시되고 장비·스킬·스탯이 비어 있었다. V262/V266의 관련 상세 API·화면 코드는 최근 GA4/뉴스 통합에서 변경되지 않았으며, 기존 구현이 문서화되지 않은 poe.ninja 내부 API에 의존하는 구조 자체가 취약했다.
- **사용자 기준/범위:** 기존 PoB 계산엔진과 원본 XML을 유지하고, 서버 차단 우회는 하지 않는다. 사용자가 직접 생성/복사한 PoB Export 코드를 대체 입력으로 제공해 기존 계산엔진에서 계산한다. FILTER·NeverSink·홈·Cloudflare·계산 함수 본체는 보호.
- **변경:** V219에서 확정한 Builds/Profile URL 형식과 UTF-8 한 번 디코딩 복원. PoB Export용 Base64/zlib/XML 파서 신규, 활성 ItemSet 장비/무기 세트·Tree Spec 주얼·Skills SkillSet 젬/보조 젬·Build.mainSocketGroup 주스킬 추출. `prepare-export`가 원본 XML과 표시 데이터 제공. 화면 Export 코드 입력/실패 안내/실제 데이터가 없으면 캐릭터 화면 미진입. 수동 코드를 함께 보내면 `import-ninja` 공개 페이지 확인만 수행하고 내부 상세 API는 skip. 기존 `CalcClient`·`calculateComparison`·V210 PoB2 WASM 경로 그대로 사용.
- **검증:** 신규 `test-v267-pob-export-recovery.cjs` PASS(사용자 URL/profile Unicode, Export fixture 16 장비·3 주얼·21 스킬, Twister main skill, Frost Nexus support, malformed code 거부, TS/TSX syntax 및 계산엔진 연결). V210/V229/V226/V236/V257/V259~V262/V264~V266 회귀 PASS.
- **미검증:** 실제 사용자 Export code 및 실캐릭터의 PoB2 WASM 계산, 전체 Next/Cloudflare 빌드, 프로덕션 배포 미실시. 403 API 자체를 해소하거나 우회하지 않는다.
- **재발 방지:** URL 확인/프로필 페이지 응답/상세 데이터 수신/PoB Export 해독/엔진 계산은 별도 상태로 다룬다. `HTTP 403`은 상세 데이터 성공이 아니다. XML 원본과 계산엔진 외 추정 DPS/STATS를 생성하지 않는다.
