import type { Metadata } from "next";
import { getLatestOfficialVideos } from "@/lib/youtube";
import { v019Markup } from "./home-v019-markup";
import V019Interactions from "./V019Interactions";
import "./home-v019.css";

export const revalidate = 2592000; // preserve V256's 30-day YouTube refresh semantics

export const metadata: Metadata = {
  title: "POE2 아이템 필터·POB 장비 비교 | FIXLGS",
  description: "NeverSink 기반 POE2 아이템 필터를 설정하고, poe.ninja 캐릭터와 거래소 장비의 DPS 변화를 FIX POB에서 비교하세요. 게임 가이드와 아이템 새소식도 확인하세요.",
  alternates: { canonical: "https://poe2.fixlgs.com/" },
};

export default async function PoeHome() {
  const latestVideos = await getLatestOfficialVideos(3);
  return (
    <div className="poe-v019-root" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: v019Markup }} />
      <V019Interactions videos={latestVideos} />
    </div>
  );
}
