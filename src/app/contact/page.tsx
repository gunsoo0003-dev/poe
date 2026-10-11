import type { Metadata } from "next";
import Link from "next/link";
import InfoShell from "@/app/_components/InfoShell";
export const metadata:Metadata={title:"문의 및 오류 제보 | FIX POE2",description:"FIXLGS POE2 필터 커스터마이저와 PoB 도구 사용 중 오류 제보, 개선 의견 및 개인정보 관련 문의를 보내는 방법입니다."};
export default function Contact(){return <InfoShell><p className="fix-content-eyebrow">CONTACT · SUPPORT</p><h1>문의 및 오류 제보</h1><p className="fix-content-lead">문제가 발생한 기능, 재현 순서와 화면에 표시된 오류를 알려주시면 확인에 도움이 됩니다. 별도의 실시간 상담이나 즉시 답변은 제공하지 않습니다.</p>
<section className="fix-content-section"><h2>서비스·기능 문의</h2><p>필터 설정, 설치, 개인 사운드, PoB 캐릭터 연동과 장비 비교 관련 개선 요청은 아래 이메일로 보내 주세요.</p><p><a className="fix-content-email" href="mailto:lgs9211@naver.com">lgs9211@naver.com</a></p><p>예: 사용 브라우저, 불러온 캐릭터의 공개 Builds 링크, 에러 메시지, 어떤 버튼을 눌렀는지 등을 적어 주세요. 계정 비밀번호, 로그인 쿠키, 개인 인증정보는 보내지 마세요.</p></section>
<section className="fix-content-section"><h2>개인정보 및 정책 문의</h2><p>운영자: 주식회사 엘지에스 (LGS Co., Ltd.)</p><p><a className="fix-content-email" href="mailto:lgshappyhappy@gmail.com">lgshappyhappy@gmail.com</a></p><p>웹사이트 방문 분석과 브라우저 내 데이터 처리 안내는 <Link href="/privacy/site">웹사이트 개인정보처리방침</Link>에 기재했습니다. 크롬 확장프로그램의 별도 데이터 정책은 <Link href="/privacy">확장프로그램 개인정보처리방침</Link>을 확인하세요.</p></section>
<section className="fix-content-note"><strong>응답 및 처리 안내</strong><p>문의 내용과 운영 상황에 따라 개별 답변이 어려울 수 있습니다. 데이터 제공처나 게임 자체의 오류는 해당 서비스에서 확인해야 할 수 있습니다. 거래 분쟁이나 계정 복구를 대신 처리하지 않습니다.</p></section>
</InfoShell>}
