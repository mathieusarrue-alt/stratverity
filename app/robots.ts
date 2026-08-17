import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/admin/", "/login/", "/account"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/admin/", "/login/", "/account"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/admin/", "/login/", "/account"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/admin/", "/login/", "/account"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/auth/", "/admin/", "/login/", "/account"],
      },
    ],
    sitemap: "https://www.stratverity.com/sitemap.xml",
    host: "https://www.stratverity.com",
  };
}
