import type { MetadataRoute } from "next";
import { pobGuides } from "@/lib/pobGuides";
const origin="https://poe.fixlgs.com";
export default function sitemap():MetadataRoute.Sitemap {
  const routes=["/","/filter","/pob","/guides","/filter/guide","/guides/filter-troubleshooting","/about","/contact","/privacy/site","/privacy","/terms",...pobGuides.map(g=>`/guides/pob/${g.slug}`)];
  return routes.map(path=>({url:origin+path,changeFrequency:path==="/"?("weekly" as const):("monthly" as const),priority:path==="/"?1:path.startsWith("/guides")?0.7:0.5}));
}
