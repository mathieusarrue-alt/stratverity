import "./marketplace.css";
import type { Metadata } from "next";

const MARKETPLACE_ENABLED =
  process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED === "true";

export function generateMetadata(): Metadata {
  // Noindex conditionnel : tant que le marketplace est désactivé (flag off),
  // on évite d'indexer une vitrine vide ("coming soon") qui nuirait à
  // l'autorité du domaine. Dès activation, la page devient indexable.
  const indexable = MARKETPLACE_ENABLED;
  return {
    robots: { index: indexable, follow: indexable },
    title: "Verified Strategy Marketplace",
    description: indexable
      ? "Buy independently audited trading strategies. Every listing verified with real recomputed numbers."
      : "A marketplace of independently audited trading strategies and bots. Every listing verified with real recomputed numbers. Coming soon.",
    alternates: {
      canonical: "/marketplace",
    },
    openGraph: {
      title: "Verified Strategy Marketplace | StratVerity",
      description:
        "Buy strategies with proof. Every bot independently audited — declared vs recomputed performance, visible.",
      type: "website",
      url: "https://www.stratverity.com/marketplace",
      siteName: "StratVerity",
    },
  };
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
