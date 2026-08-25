"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

// Phase 1 : galerie lecture seule, certifications réelles uniquement.
// Aucune vente / commission / seller area / checkout. MARKETPLACE_ENABLED OFF.

export default function MarketplaceClient(_props: { enabled: boolean }) {
  return (
    <>
      {/* Catalogue public — certifications réelles uniquement, en préparation. */}
      <section aria-label="Certified public catalogue" className="mp-public">
        <div className="mp-public-head">
          <div>
            <span className="marketplace-proof">Certified catalogue</span>
            <h2>Stratégies auditées, chiffres vérifiés.</h2>
          </div>
          <p>
            Aucune stratégie n&apos;est présentée ici sans audit StratVerity réel et
            consentement de publication. Les performances ne sont jamais saisies
            par le vendeur ni inventées.
          </p>
        </div>

        <div className="marketplace-state">
          <strong>Aucune stratégie certifiée publique pour l&apos;instant.</strong>
          <p>
            Les fiches apparaissent après audit du code, consentement de
            publication et vérification. Faites auditer la vôtre : une preuve
            vérifiée pourra ensuite être publiée.
          </p>
          <Link className="btn btn-primary" href="/configure">
            Faire auditer ma stratégie →
          </Link>
        </div>
      </section>

      {/* CTA acquisition : auditer puis publier une preuve. */}
      <div className="mp-launch-cta">
        <div>
          <TrendingUp size={18} />
          <span>Publier une preuve vérifiée après audit ? Commencez par auditer.</span>
        </div>
      </div>
    </>
  );
}