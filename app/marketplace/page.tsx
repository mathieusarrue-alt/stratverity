import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Vitrine labo — StratVerity",
  description:
    "Goldens de laboratoire StratVerity (ILLUSTRATIVE). Pas un catalogue vendeur. Proof, not storytelling.",
  robots: { index: false, follow: false },
};

export default async function MarketplacePage() {
  return (
    <main className="mp-page">
      <section className="mp-hero">
        <h1>
          Preuves de labo, <em>pas un store.</em>
        </h1>
        <p>
          Trois fixtures versionnées du laboratoire (XRP, SOL, contrôle
          négatif ETH). Chiffres issus des fichiers de référence — pas
          d&apos;invention, pas de promesse de gain, pas de vente.
        </p>
      </section>
      <MarketplaceClient enabled={false} />
    </main>
  );
}
