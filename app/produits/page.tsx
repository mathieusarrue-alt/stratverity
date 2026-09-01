import type { Metadata } from "next";
import ProductsOverview from "../home/ProductsOverview";

/**
 * /produits — vue d'ensemble autonome des 4 produits (mêmes catégories que le
 * header et le bloc landing page), sans détail. Chaque tuile renvoie vers sa
 * page dédiée. Réutilise le même composant que la landing page pour ne jamais
 * avoir deux catalogues à maintenir en parallèle.
 */
export const metadata: Metadata = {
  title: "Produits — StratVerity",
  description:
    "Outils gratuits, Audit, Optimiseur et Marketplace : les quatre produits StratVerity en un coup d'œil.",
};

export default function ProduitsPage() {
  return (
    <main style={{ paddingTop: 96 }}>
      <ProductsOverview />
    </main>
  );
}
