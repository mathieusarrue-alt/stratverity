"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import IllustrativeModelCards from "./IllustrativeModelCards";

// Vitrine lecture seule. MARKETPLACE_ENABLED OFF — aucune vente.
// Catalogue client réel = vide. Goldens labo = ILLUSTRATIVE uniquement.

export default function MarketplaceClient(_props: { enabled: boolean }) {
  return (
    <>
      <IllustrativeModelCards />

      <section aria-label="Catalogue certifié public" className="mp-public">
        <div className="mp-public-head">
          <div>
            <span className="marketplace-proof">Certified catalogue</span>
            <h2>Aucune fiche cliente publique pour l&apos;instant.</h2>
          </div>
          <p>
            Une stratégie n&apos;entre dans ce catalogue qu&apos;après audit
            StratVerity et consentement de publication. Les trois cartes
            ci-dessus sont des goldens de laboratoire, pas des listings
            vendeurs.
          </p>
        </div>

        <div className="marketplace-state">
          <strong>Catalogue réel : vide, volontairement.</strong>
          <p>
            Faites auditer la vôtre. Si vous le souhaitez ensuite, une preuve
            vérifiée pourra être publiée ici — jamais une courbe saisie à la
            main.
          </p>
          <Link className="btn btn-primary" href="/configure">
            Faire auditer ma stratégie →
          </Link>
        </div>
      </section>

      <div className="mp-launch-cta">
        <div>
          <TrendingUp size={18} />
          <span>Publier une preuve après audit ? Commencez par le labo.</span>
        </div>
      </div>
    </>
  );
}
