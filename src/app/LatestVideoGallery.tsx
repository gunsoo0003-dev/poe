"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OfficialVideo } from "@/lib/youtube";

type YTPlayer = {
  destroy: () => void;
  mute: () => void;
  playVideo: () => void;
};

type YTEvent = { target: YTPlayer; data: number };

type YTNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: YTEvent) => void;
        onStateChange: (event: YTEvent) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

export default function LatestVideoGallery({ videos }: { videos: OfficialVideo[] }) {
  const usableVideos = useMemo(() => videos.slice(0, 4), [videos]);
  const [activeIndex, setActiveIndex] = useState(0);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!usableVideos.length || !playerHostRef.current) return;

    let cancelled = false;
    const host = playerHostRef.current;

    const destroyPlayer = () => {
      try {
        playerRef.current?.destroy();
      } catch {
        // The host can already be detached during a React transition.
      }
      playerRef.current = null;
    };

    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    host.replaceChildren();
    const mount = document.createElement("div");
    mount.className = "poe-v26-player-mount";
    host.appendChild(mount);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !host.isConnected) return;

      playerRef.current = new YT.Player(mount, {
        videoId: usableVideos[activeIndex].id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data !== YT.PlayerState.ENDED) return;
            advanceTimerRef.current = window.setTimeout(() => {
              setActiveIndex((current) => (current + 1) % usableVideos.length);
            }, 450);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      destroyPlayer();
      try {
        host.replaceChildren();
      } catch {
        // Detached hosts need no further cleanup.
      }
    };
  }, [activeIndex, usableVideos]);

  if (!usableVideos.length) return null;

  return (
    <div className="poe-v28-gallery-shell">
      <div className="poe-v26-video-row poe-v28-video-row" aria-label="Path of Exile 최신 공식 영상">
        {usableVideos.map((video, index) => {
          const active = index === activeIndex;
          return (
            <button
              type="button"
              key={video.id}
              className={`poe-v26-video-tile poe-v28-video-tile poe-v34-video-tile${active ? " is-active" : ""}`}
              style={{ backgroundImage: `url("${video.thumbnail}")` }}
              onClick={() => setActiveIndex(index)}
              aria-label={`${video.title}${active ? " 재생 중" : " 재생"}`}
            >
              <img
                className="poe-v32-tile-bg"
                src={video.thumbnail}
                alt=""
                aria-hidden="true"
              />
              <div className="poe-v32-tile-bg-shade" aria-hidden="true" />

              <div className="poe-v32-media-stage">
                <div className="poe-v32-media-frame">
                  {active ? (
                    <div className="poe-v26-player-host poe-v28-player-host poe-v32-player-host" ref={playerHostRef} />
                  ) : (
                    <img className="poe-v32-foreground-thumb" src={video.thumbnail} alt="" />
                  )}
                </div>
              </div>

              <div className="poe-v26-tile-shade poe-v28-tile-shade poe-v32-tile-shade" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
