import type { MetadataRoute } from "next";

const baseUrl = "https://www.stratverity.com";

// Fixed publish date: avoids "lastModified = now" anti-pattern which makes
// crawlers re-fetch everything on every visit.
const lastModified = new Date("2026-08-16T22:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/configure", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/learn", priority: 0.8, changeFrequency: "weekly" as const },
    {
      path: "/learn/look-ahead-bias-backtest",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/learn/overfitting-trading-strategy",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/learn/walk-forward-analysis-guide",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/legal/privacy",
      priority: 0.3,
      changeFrequency: "yearly" as const,
    },
    {
      path: "/legal/terms",
      priority: 0.3,
      changeFrequency: "yearly" as const,
    },
    {
      path: "/legal/risk",
      priority: 0.3,
      changeFrequency: "yearly" as const,
    },
    {
      path: "/legal/refunds",
      priority: 0.3,
      changeFrequency: "yearly" as const,
    },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
