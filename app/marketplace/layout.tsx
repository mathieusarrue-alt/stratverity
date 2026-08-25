import "./marketplace.css";
import type { Metadata } from "next";

// Phase 1 : galerie lecture seule, aucune vente. MARKETPLACE_ENABLED reste OFF
// (pas de commerce). Page noindex tant que rien à indexer.

export function generateMetadata(): Metadata {
  return {
    robots: { index: false, follow: false },
    title: "Catalogue des audits certifiés — StratVerity",
    description:
      "Stratégies auditées par le labo StratVerity, chiffres vérifiés (fees inclus). Aucune vente encore : les preuves publiées suivent un audit réel.",
    alternates: { canonical: "/marketplace" },
    openGraph: {
      title: "Catalogue des audits certifiés | StratVerity",
      description:
        "Audit de backtest vérifié par le labo StratVerity — Proof, not storytelling.",
      type: "website",
      url: "https://www.stratverity.com/marketplace",
      siteName: "StratVerity",
    },
  };
}