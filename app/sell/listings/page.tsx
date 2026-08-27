"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STATE_LABEL, type MarketplaceListing } from "../../marketplace/commerce";

/** /sell/listings — mes listings + états (draft/queued/…/listed). */

export default function SellerListings() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/marketplace/sell/listings", {
          cache: "no-store",
        });
        if (response.status === 401) {
          router.push(`/login?return_to=${encodeURIComponent("/sell/listings")}`);
          return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { listings: MarketplaceListing[] };
        setListings(payload.listings ?? []);
      } catch {
        setError("Impossible de charger vos listings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <main className="mp-page">
      <section className="mp-hero">
        <span className="mp-illust-eyebrow">Vendeur</span>
        <h1>
          Mes listings <em>et leur file d&apos;audit.</em>
        </h1>
        <p>
          Une stratégie n&apos;apparaît en vente qu&apos;une fois validée
          (LAB / opérateur). Tant que c&apos;est le cas, elle reste en file —
          aucune carte publique.
        </p>
        <div className="marketplace-actions">
          <Link className="btn btn-primary" href="/sell">+ Nouveau dépôt</Link>
          <Link className="btn btn-ghost" href="/sell/dashboard">Dashboard vendeur →</Link>
        </div>
      </section>

      {loading && <p className="marketplace-message">Chargement…</p>}
      {error && <p className="mp-modal-err">{error}</p>}

      {!loading && !error && (
        <div className="mp-grid">
          {listings.length === 0 && (
            <div className="marketplace-state">
              <strong>Aucun listing pour l&apos;instant.</strong>
              <p>Déposez votre première stratégie : elle entrera en QUEUE_AUDIT.</p>
            </div>
          )}
          {listings.map((l) => (
            <article className="mp-card" key={l.id}>
              <div className="mp-card-top">
                <span className="mp-engine">{l.kind}</span>
                <span className="mp-badge">{STATE_LABEL[l.state] ?? l.state}</span>
              </div>
              <h3>{l.title}</h3>
              <p className="mp-summary">{l.short_description ?? l.description}</p>
              <div className="mp-meta">
                <span>{l.platform?.join(" / ")}</span>
                <span>15 % commission incluse</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
