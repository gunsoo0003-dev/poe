import type { MetadataRoute } from "next";
import { pobGuides } from "@/lib/pobGuides";

const origin = "https://poe2.fixlgs.com";

// Include only real public pages. Do not list API endpoints or the PoB diagnostics lab.
// Guide URLs follow the published article data so new guides need no sitemap edits.
const publicPages = [
  "/",
  "/filter",
  "/pob",
  "/filter/guide",
  "/guides",
  "/guides/filter-troubleshooting",
  "/about",
  "/contact",
  "/privacy",
  "/privacy/site",
  "/terms",
  "/news",
  "/news/poe2-1-0-full-release",
  "/news/poe2-1-0-atlas-passive-rework",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...publicPages.map((path) => ({ url: `${origin}${path === "/" ? "" : path}` })),
    ...pobGuides.map((guide) => ({ url: `${origin}/guides/pob/${guide.slug}` })),
  ];
}
