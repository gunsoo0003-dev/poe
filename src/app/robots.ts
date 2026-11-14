import type { MetadataRoute } from "next";

// V264: Public pages may be crawled; private endpoints and diagnostics are excluded.
// The primary host is deliberately independent from fixlgs.com.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/pob/engine-lab"],
    },
    sitemap: "https://poe2.fixlgs.com/sitemap.xml",
  };
}
