import type { Metadata } from "next";
import Link from "next/link";
import InfoShell from "@/app/_components/InfoShell";
export const metadata:Metadata={title:"FIXLGS POE2 소개 | 비공식 Path of Exile 2 도구",description:"FIXLGS POE2가 제공하는 필터 커스터마이저와 캐릭터 비교 도구, 운영 원칙, 게임 공식 서비스와의 관계를 안내합니다."};
export default function About(){return <InfoShell><p className="fix-content-eyebrow">ABOUT FIX POE2</p><h1>게임을 더 쉽게 분석하고 설정할 수 있도록</h1>
<p className="fix-content-lead">FIX POE2는 Path of Exile 2 이용자가 필터를 직접 조정하고 캐릭터의 장비 교체 전후를 비교할 수 있도록 만든 독립적인 팬 제작 웹사이트입니다. 운영자는 주식회사 엘지에스(LGS Co., Ltd.)입니다.</p>
<section className="fix-content-section"><h2>현재 제공하는 서비스</h2><p><strong>필터 커스터마이저</strong>는 NeverSink 단계별 기본 필터에서 사용자가 변경한 규칙만 덮어쓰는 방식으로 작동합니다. 아이템 표시·숨김, 중요도, 커스텀 사운드와 필터 파일 저장 기능을 제공합니다.</p><p><strong>PoB 캐릭터 비교</strong>는 poe.ninja의 POE2 Builds에 등록된 캐릭터의 공개 빌드 데이터를 불러와 장비·주얼·스킬을 보여주고, PoB2 계산에 기반한 변경 전후 비교를 시도합니다. 외부 데이터 및 계산엔진 지원 범위에 따라 결과가 제한될 수 있습니다.</p><p>제작법(크래프팅) 가이드와 추가 기능은 검증이 끝난 콘텐츠부터 공개할 예정이며, 아직 제공하지 않는 기능을 사용 가능한 서비스로 표시하지 않습니다.</p></section>
<section className="fix-content-section"><h2>운영 원칙</h2><p>반복적인 회원가입, 별도 계정 생성, 불필요한 서버 저장 없이 웹브라우저에서 가능한 작업을 우선합니다. 이용자가 자신의 설정과 결과를 확인할 수 있도록 오류 및 데이터 한계도 함께 표시합니다.</p><p>게임 업데이트, 시즌 및 외부 제공 데이터 변경에 따라 결과가 달라질 수 있습니다. 정확성이 확인되지 않은 수치를 실제 계산값처럼 만들어 제공하지 않습니다.</p></section>
<section className="fix-content-section"><h2>공식 게임·외부 서비스와의 관계</h2><p>FIX POE2는 비공식 팬 제작 도구이며 Grinding Gear Games, Path of Exile, poe.ninja, NeverSink 또는 PoB2 개발진에서 운영·후원·보증하는 사이트가 아닙니다. 게임명, 아이템명, 영상 및 로고 등의 권리는 각 권리자에게 있습니다.</p><p>서비스 기능을 이용하기 전에는 관련 게임 및 외부 서비스의 약관과 사용 조건을 확인해 주세요.</p></section>
<div className="fix-content-actions"><Link href="/guides">사용 가이드 보기</Link><Link href="/contact">오류 제보 및 문의</Link></div>
</InfoShell>}
