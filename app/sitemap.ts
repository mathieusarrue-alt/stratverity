import type { MetadataRoute } from "next";

const baseUrl = "https://www.stratverity.com";
const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ?? "https://api.stratverity.com";

// Fixed publish date: avoids "lastModified = now" anti-pattern which makes
// crawlers re-fetch everything on every visit.
const lastModified = new Date("2026-08-16T22:00:00Z");

async function certifiedAudits(): Promise<
  { audit_id: string; updated_at?: string }[]
> {
  try {
    const response = await fetch(`${API_URL}/v1/certifications?limit=500`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      certifications?: { audit_id: string; updated_at?: string }[];
    };
    return data.certifications ?? [];
  } catch {
    // L'API est hors-ligne au moment de la génération : on n'omet que les
    // URL de certification, jamais le reste du sitemap.
    return [];
  }
}

function parseDate(value: string | undefined): Date {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : lastModified;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: {
    path: string;
    priority: number;
    changeFrequency:
      | "weekly"
      | "monthly"
      | "yearly"
      | "daily"
      | "always"
      | "hourly"
      | "never";
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/configure", priority: 0.9, changeFrequency: "weekly" },
    { path: "/crash-test", priority: 0.9, changeFrequency: "weekly" },
    { path: "/score", priority: 0.8, changeFrequency: "monthly" },
    { path: "/fees", priority: 0.8, changeFrequency: "monthly" },
    { path: "/gallery", priority: 0.7, changeFrequency: "monthly" },
    { path: "/marketplace", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/health-check", priority: 0.9, changeFrequency: "weekly" },
    { path: "/learn", priority: 0.8, changeFrequency: "weekly" },
    {
      path: "/learn/look-ahead-bias-backtest",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      path: "/learn/overfitting-trading-strategy",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      path: "/learn/walk-forward-analysis-guide",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      path: "/learn/survivorship-bias-trading",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      path: "/learn/monte-carlo-vs-walk-forward",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      path: "/learn/pine-script-backtest-pitfalls",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/risk", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/refunds", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries = routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Routes dynamiques : chaque certification publique /cert/<id>.
  const certified = await certifiedAudits();
  const certificationEntries = certified.map((item) => ({
    url: `${baseUrl}/cert/${encodeURIComponent(item.audit_id)}`,
    lastModified: parseDate(item.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...certificationEntries];
}