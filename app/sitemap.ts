import type { MetadataRoute } from "next";

const baseUrl = "https://www.stratverity.com";

// Fixed publish date: avoids "lastModified = now", which would make crawlers
// re-fetch every public route on every visit.
const lastModified = new Date("2026-08-21T00:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/configure", priority: 0.9, changeFrequency: "weekly" },
    { path: "/health-check", priority: 0.9, changeFrequency: "weekly" },
    { path: "/score", priority: 0.8, changeFrequency: "monthly" },
    { path: "/fees", priority: 0.8, changeFrequency: "monthly" },
    { path: "/learn", priority: 0.8, changeFrequency: "weekly" },
    { path: "/learn/look-ahead-bias-backtest", priority: 0.7, changeFrequency: "monthly" },
    { path: "/learn/overfitting-trading-strategy", priority: 0.7, changeFrequency: "monthly" },
    { path: "/learn/walk-forward-analysis-guide", priority: 0.7, changeFrequency: "monthly" },
    { path: "/learn/survivorship-bias-trading", priority: 0.7, changeFrequency: "monthly" },
    { path: "/learn/monte-carlo-vs-walk-forward", priority: 0.7, changeFrequency: "monthly" },
    { path: "/learn/pine-script-backtest-pitfalls", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/risk", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/refunds", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
