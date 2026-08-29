"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COMMERCE_ENABLED,
  KIND_LABEL,
  MarketplaceListing,
  MODE_PRICE_SUFFIX,
  formatCents,
  STATE_LABEL,
} from "./commerce";

function isBuyable(state?: string) {
  return state === "LISTED" || state === "OPERATOR_LISTED";
}

async function toggleFavorite(listingId: string, slug: string) {
  const response = await fetch("/api/marketplace/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listing_id: listingId, action: "toggle" }),
  });
  if (response.status === 401) {
    window.location.href = `/login?return_to=${encodeURIComponent(`/marketplace/${slug}`)}`;
    return false;
  }
  return response.ok;
}

export default function CommerceCatalogue() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/marketplace/listings", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { listings: MarketplaceListing[] };
        // Catalogue public : uniquement LISTED / OPERATOR_LISTED.
        setListings((payload.listings ?? []).filter((l) => isBuyable(l.state)));
      } catch {
        setError("Catalogue indisponible pour le moment.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  if (!COMMERCE_ENABLED) {
    return (
      <div className="marketplace-state">
        <strong>Le marché n&apos;est pas encore ouvert.</strong>
        <p>
          La vitrine vendeur arrive après validation des paiements. En attendant,
          les goldens de laboratoire restent consultables ci-dessous.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="marketplace-message">Chargement du catalogue…</p>;
  }

  if (error) return <p className="marketplace-message">{error}</p>;

  if (listings.length === 0) {
    return (
      <div className="marketplace-state">
        <strong>Aucune stratégie en vente pour l&apos;instant.</strong>
        <p>
          Les premiers listings apparaissent après le contrôle opérateur.
          Les cartes de labo ci-dessous restent illustratives — elles ne sont pas
          à vendre.
        </p>
        <Link className="btn btn-ghost" href="/sell">
          Déposer un listing (vendeur) →
        </Link>
      </div>
    );
  }

  return (
    <div className="marketplace-grid">
      {listings.map((listing) => {
        const first = listing.offers?.[0];
        const priceLabel = first
          ? `${formatCents(first.price_cents)}${MODE_PRICE_SUFFIX[first.mode]}`
          : "—";
        return (
          <Link
            className="marketplace-card"
            href={`/marketplace/${listing.slug}`}
            key={listing.id}
          >
            <span className="mp-engine">
              {KIND_LABEL[listing.kind] ?? listing.kind} ·{" "}
              {listing.platform.join(" / ")}
            </span>
            {listing.badge ? (
              <span className="mp-badge">{listing.badge}</span>
            ) : (
              <span className="mp-badge">{STATE_LABEL[listing.state]}</span>
            )}
            <h2>{listing.title}</h2>
            {listing.short_description && <p className="mp-summary">{listing.short_description}</p>}
            <div className="mp-meta">
              <span>{priceLabel}</span>
              <span>{listing.state === "OPERATOR_LISTED" ? "Accès invite · source non transmise" : ""}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}