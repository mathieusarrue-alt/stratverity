import "./marketplace.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Verified Strategy Marketplace",
  description:
    "A marketplace of independently audited trading strategies and bots. Every listing verified with real recomputed numbers. Coming soon.",
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

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
