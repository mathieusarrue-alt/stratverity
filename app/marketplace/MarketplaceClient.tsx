"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import ProductMark from "../components/ProductMark";
import IllustrativeModelCards from "./IllustrativeModelCards";
import CommerceCatalogue from "./CommerceCatalogue";

// Marketplace v1 COMPLET : les goldens labo restent une vitrine ILLUSTRATIVE
// (jamais à vendre), le catalogue COMMERCE (LISTED / OPERATOR_LISTED) est
// affiché séparément, uniquement quand NEXT_PUBLIC_MARKETPLACE_COMMERCE=true.
// On vend l'ACCÈS (invite plateforme), jamais le code source.

export default function MarketplaceClient(_props: { enabled: boolean }) {
  return (
    <>
      {/* Vitrine illustrative — goldens de laboratoire, hors panier. */}
      <section aria-label="Vitrine de laboratoire" className="mp-models">
        <div className="mp-models-head">
          <div>
            <span className="mp-illust-eyebrow">Lab · illustratif</span>
            <h2>
              Exemples du labo, <em>pas à vendre</em>
            </h2>
            <p>
              Ces cartes illustrent la méthode du labo. Elles ne sont pas des
              listings vendeurs et ne prédisent aucune performance.
            </p>
          </div>
        </div>
        <IllustrativeModelCards />
        <div className="mp-illust-cta">
          <Link className="btn btn-ghost" href="/lab-evidence">
            Voir les preuves du labo →
          </Link>
        </div>
      </section>

      {/* Catalogue commerce — seulement LISTED / OPERATOR_LISTED. */}
      <section aria-label="Catalogue vendeurs" className="mp-public">
        <div className="mp-public-head">
          <div className="mp-public-title">
            <span className="mp-product-mark" aria-hidden="true">
              <ProductMark product="marketplace" size="md" />
            </span>
            <div>
              <span className="marketplace-proof">Catalogue vendeurs</span>
              <h2>Stratégies en accès protégé.</h2>
            </div>
          </div>
          <p>
            L&apos;achat donne un accès plateforme en invite (TradingView,
            MetaTrader…). Le code source n&apos;est jamais transmis. La
            commission StratVerity de 15 % est incluse dans le prix affiché.
          </p>
        </div>
        <CommerceCatalogue />
      </section>

      <div className="mp-launch-cta">
        <div>
          <TrendingUp size={18} />
          <span>Vous êtes créateur ? Déposez un listing et rejoignez la file d&apos;audit.</span>
        </div>
        <Link className="btn btn-primary" href="/sell">
          Déposer un listing →
        </Link>
      </div>
    </>
  );
}
