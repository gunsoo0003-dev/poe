export type OfficialVideo = {
  id: string;
  title: string;
  thumbnail: string;
  published?: string;
};

const CHANNEL_VIDEOS_URL = "https://www.youtube.com/@playpathofexile/videos";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// Static fallback keeps the gallery working if YouTube changes its page markup
// or temporarily blocks the server-side request. Runtime data replaces these.
const FALLBACK_VIDEOS: OfficialVideo[] = [
  {
    id: "1h3pZCdwtlE",
    title: "Face the Darkness",
    thumbnail: "https://i.ytimg.com/vi/1h3pZCdwtlE/hqdefault.jpg",
  },
  {
    id: "y320TPooDs8",
    title: "The Dreamer Must Wake",
    thumbnail: "https://i.ytimg.com/vi/y320TPooDs8/hqdefault.jpg",
  },
  {
    id: "x6q1UMNM9eY",
    title: "Stop the Madness",
    thumbnail: "https://i.ytimg.com/vi/x6q1UMNM9eY/hqdefault.jpg",
  },
  {
    id: "leKD92i_KYs",
    title: "Uncover Ancient Truths",
    thumbnail: "https://i.ytimg.com/vi/leKD92i_KYs/hqdefault.jpg",
  },
];

function textOf(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record.simpleText === "string") return record.simpleText;
  if (Array.isArray(record.runs)) {
    return record.runs
      .map((run) => {
        if (!run || typeof run !== "object") return "";
        const text = (run as Record<string, unknown>).text;
        return typeof text === "string" ? text : "";
      })
      .join("")
      .trim();
  }
  return "";
}

function extractInitialData(html: string): unknown | null {
  const markers = [
    "var ytInitialData = ",
    "window[\"ytInitialData\"] = ",
    "ytInitialData = ",
  ];

  for (const marker of markers) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex < 0) continue;

    const start = html.indexOf("{", markerIndex + marker.length);
    if (start < 0) continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < html.length; i += 1) {
      const char = html[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;

      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          break;
        }
      }
    }
  }

  return null;
}

function isRenderer(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isLiveOrShort(renderer: Record<string, unknown>): boolean {
  const endpoint = renderer.navigationEndpoint;
  if (isRenderer(endpoint)) {
    const metadata = endpoint.commandMetadata;
    if (isRenderer(metadata)) {
      const web = metadata.webCommandMetadata;
      if (isRenderer(web) && typeof web.url === "string" && web.url.includes("/shorts/")) {
        return true;
      }
    }
  }

  const overlays = renderer.thumbnailOverlays;
  if (Array.isArray(overlays)) {
    for (const overlay of overlays) {
      if (!isRenderer(overlay)) continue;
      const status = overlay.thumbnailOverlayTimeStatusRenderer;
      if (!isRenderer(status)) continue;
      const style = typeof status.style === "string" ? status.style.toUpperCase() : "";
      if (style.includes("SHORTS") || style.includes("LIVE") || style.includes("UPCOMING")) {
        return true;
      }
    }
  }

  const title = textOf(renderer.title).toLowerCase();
  return title.includes("#shorts") || title.includes(" shorts");
}

function collectVideos(node: unknown, output: OfficialVideo[], seen: Set<string>): void {
  if (!node) return;

  if (Array.isArray(node)) {
    node.forEach((item) => collectVideos(item, output, seen));
    return;
  }

  if (!isRenderer(node)) return;

  for (const rendererKey of ["videoRenderer", "gridVideoRenderer"]) {
    const renderer = node[rendererKey];
    if (!isRenderer(renderer)) continue;

    const id = typeof renderer.videoId === "string" ? renderer.videoId : "";
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || seen.has(id) || isLiveOrShort(renderer)) continue;

    const title = textOf(renderer.title) || textOf(renderer.headline) || "Path of Exile";
    const published = textOf(renderer.publishedTimeText) || undefined;

    seen.add(id);
    output.push({
      id,
      title,
      published,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }

  Object.values(node).forEach((value) => collectVideos(value, output, seen));
}

export async function getLatestOfficialVideos(limit = 4): Promise<OfficialVideo[]> {
  try {
    const response = await fetch(CHANNEL_VIDEOS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: THIRTY_DAYS },
    });

    if (!response.ok) throw new Error(`YouTube responded ${response.status}`);

    const html = await response.text();
    const initialData = extractInitialData(html);
    if (!initialData) throw new Error("Could not parse YouTube initial data");

    const videos: OfficialVideo[] = [];
    collectVideos(initialData, videos, new Set<string>());

    const selected = videos.slice(0, limit);
    if (selected.length >= limit) return selected;

    const merged = [...selected];
    for (const fallback of FALLBACK_VIDEOS) {
      if (!merged.some((video) => video.id === fallback.id)) merged.push(fallback);
      if (merged.length >= limit) break;
    }
    return merged.slice(0, limit);
  } catch {
    return FALLBACK_VIDEOS.slice(0, limit);
  }
}
