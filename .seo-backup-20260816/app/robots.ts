import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/admin/", "/login/"],
    },
    sitemap: "https://stratverity.com/sitemap.xml",
    host: "https://stratverity.com",
  };
}
