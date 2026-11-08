"use client";

import { useEffect } from "react";
import type { OfficialVideo } from "@/lib/youtube";

declare global {
  interface Window {
    FIXLGS_POE2_VIDEOS?: OfficialVideo[];
    FIXLGS_POE2_HOME_DESTROY?: () => void;
  }
}

export default function V019Interactions({ videos }: { videos: OfficialVideo[] }) {
  useEffect(() => {
    window.FIXLGS_POE2_VIDEOS = videos.slice(0, 3);
    const script = document.createElement("script");
    script.src = "/poe-home/script.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
      window.FIXLGS_POE2_HOME_DESTROY?.();
      window.FIXLGS_POE2_HOME_DESTROY = undefined;
      window.FIXLGS_POE2_VIDEOS = undefined;
    };
  }, [videos]);
  return null;
}
