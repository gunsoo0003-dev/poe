V201 사용자 웹 테스트 후보본 (2026-10-09)
목표: 원본 PoB2 캐릭터 -> 거래소 EXPORT 장착 -> WASM Stats/스킬 DPS -> 초기화
1. 기존 fix-pob 폴더에 덮어쓰기. 확장프로그램은 기존 V004.2 유지.
2. 기존 방식으로 npm run dev 실행 후 /pob 진입.
3. ResurrectForbidden poe.ninja 캐릭터 URL 불러오기.
4. 교체 전 Stats, 스킬젬 목록 확인.
5. FIXLGS-EN-V004 거래소 아이템을 장비 슬롯에 적용.
6. 'PoB2 실제 장착·재계산 확인 기록'에서 ID, modifier 개수, revision 검사.
7. STATS 및 DPS 전후 차이와 초기화 시 복원 확인.
주의: 원본 캐릭터 WASM 실행·전체 Next.js build는 개발 환경에서 미검증. 정확한 계산 버전으로 취급하지 말 것.
