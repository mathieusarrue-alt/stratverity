import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Catalogue des audits certifiés — StratVerity",
  description:
    "Stratégies auditées par le labo StratVerity, chiffres vérifiés. Aucune vente encore : publiez une preuve après audit.",
  robots: { index: false, follow: false },
};

export default async function MarketplacePage() {
  return (
    <main className="mp-page">
      <section className="mp-hero">
        <h1>Stratégies auditées, <em>preuves vérifiées.</em></h1>
        <p>
          Le labo StratVerity audite le code des stratégies (fees inclus,
          look-ahead, robustesse). Les fiches ci-dessous ne présentent que des
          certifications réelles — aucune donnée inventée ni exemple fictif.
        </p>
      </section>
      <MarketplaceClient enabled={false} />
    </main>
  );
}