import type { MetadataRoute } from "next";

const baseUrl = "https://stratverity.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/configure",
    "/contact",
    "/learn",
    "/learn/look-ahead-bias-backtest",
    "/learn/overfitting-trading-strategy",
    "/learn/walk-forward-analysis-guide",
    "/legal/privacy",
    "/legal/terms",
    "/legal/risk",
    "/legal/refunds",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/learn") ? 0.8 : 0.6,
  }));
}
