import type { Metadata } from "next";
import Link from "next/link";
import InfoShell from "@/app/_components/InfoShell";
export const metadata:Metadata={title:"이용안내 및 책임 고지 | FIX POE2",description:"FIX POE2 비공식 팬 제작 도구의 이용 범위, 외부 데이터 제한, 계산 결과와 필터 사용 주의사항을 안내합니다."};
export default function Terms(){return <InfoShell><p className="fix-content-eyebrow">SERVICE TERMS · NOTICE</p><h1>이용안내 및 책임 고지</h1><p className="fix-content-lead">FIX POE2는 무료로 접근 가능한 비공식 게임 보조 도구입니다. 게임 상태와 무관하게 모든 계산·드롭 결과를 보증하는 서비스는 아닙니다.</p>
<section className="fix-content-section"><h2>1. 서비스 범위</h2><p>필터 커스터마이저, PoB 캐릭터 비교, 사용법 가이드 등 사이트에 실제로 공개된 기능을 제공합니다. 기능은 유지보수·외부 서비스 변경·게임 시즌에 따라 수정 또는 중단될 수 있습니다.</p></section>
<section className="fix-content-section"><h2>2. 필터·계산 결과의 한계</h2><p>필터는 실제 게임 환경에서 사용하는 파일이므로 다운로드 뒤 게임에서 반드시 직접 확인해야 합니다. 특정 아이템 표시를 숨기는 설정은 중요한 드롭 확인에 영향을 줄 수 있습니다.</p><p>PoB 결과는 이용자가 가져온 빌드 데이터와 계산엔진의 지원 범위에서 나온 시뮬레이션입니다. 거래소 시세, 게임 내 피해, 빌드 성능을 보증하지 않으며 지원되지 않는 옵션은 차이가 발생할 수 있습니다.</p></section>
<section className="fix-content-section"><h2>3. 외부 서비스와 권리</h2><p>Path of Exile 2와 관련된 게임 정보·상표·아이템 등은 원 권리자에게 귀속됩니다. FIX POE2는 Grinding Gear Games 및 외부 데이터 제공자와 공식적인 제휴 관계가 없습니다.</p><p>외부 링크, 거래소 및 캐릭터 정보는 각 해당 서비스의 공개 상태·약관·기술적 제공 방식에 따라 이용이 제한될 수 있습니다.</p></section>
<section className="fix-content-section"><h2>4. 오류 문의</h2><p>기능 오류는 <Link href="/contact">문의 페이지</Link>에 공개 URL, 오류 메시지, 재현 순서를 적어 제보할 수 있습니다. 개인정보와 인증정보는 제공하지 마세요.</p></section>
<div className="fix-content-actions"><Link href="/guides">사용 가이드</Link><Link href="/privacy/site">개인정보처리방침</Link></div></InfoShell>}
