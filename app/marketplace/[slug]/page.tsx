"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COMMERCE_ENABLED,
  deliveryLabel,
  formatCents,
  KIND_LABEL,
  MODE_LABEL,
  MODE_PRICE_SUFFIX,
  MODE_SUMMARY_SUFFIX,
  type MarketplaceListing,
  type SaleMode,
} from "../commerce";

/** /marketplace/[slug] — détail + checkout (one_shot | rent_monthly | rent_yearly). */

export default function ListingDetail() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [mode, setMode] = useState<SaleMode>("one_shot");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const response = await fetch(`/api/marketplace/listings?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const payload = (await response.json()) as { listings: MarketplaceListing[] };
        const found = (payload.listings ?? []).find((l) => l.slug === slug);
        if (!found) throw new Error();
        setListing(found);
        if (found.offers?.some((o) => o.mode === "rent_monthly")) setMode("rent_monthly");
        else if (found.offers?.some((o) => o.mode === "rent_yearly")) setMode("rent_yearly");
      } catch {
        setError("Listing introuvable.");
      }
    })();
  }, [slug]);

  async function checkout() {
    if (!listing || busy) return;
    if (!handle.trim()) {
      setError("Votre identifiant plateforme est obligatoire pour la livraison de l'accès.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace/checkout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          mode,
          handle: handle.trim(),
        }),
      });
      if (response.status === 401) {
        router.push(`/login?return_to=${encodeURIComponent(`/marketplace/${slug}`)}`);
        return;
      }
      const payload = (await response.json()) as { checkout_url?: string; error?: string };
      if (!response.ok || !payload.checkout_url) {
        setError(payload?.error ?? "Impossible de préparer le paiement.");
        return;
      }
      window.location.href = payload.checkout_url;
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !listing) return <main className="mp-page"><p className="mp-modal-err">{error}</p></main>;

  if (!listing) return <main className="mp-page"><p className="marketplace-message">Chargement…</p></main>;

  const buyable = listing.state === "LISTED" || listing.state === "OPERATOR_LISTED";
  const selected = listing.offers?.find((o) => o.mode === mode);

  return (
    <main className="mp-page">
      <Link className="marketplace-seller-link" href="/marketplace">← Retour au catalogue</Link>
      <section className="mp-hero" style={{ marginTop: 16 }}>
        <span className="mp-engine">
          {KIND_LABEL[listing.kind]} · {listing.platform.join(" / ")}
        </span>
        {listing.badge && <span className="mp-badge">{listing.badge}</span>}
        <h1>{listing.title}</h1>
        <p>{listing.description}</p>
        <p className="mp-summary">{deliveryLabel("invite_protected")}</p>
        <p className="mp-summary">
          Un backtest est une mesure historique : il ne garantit aucune
          performance future. Aucune promesse de gains.
        </p>
      </section>

      {buyable && COMMERCE_ENABLED ? (
        <section className="marketplace-state" style={{ textAlign: "left", maxWidth: 560 }}>
          <strong>Choisissez votre accès</strong>

          <div className="mp-profile-toggle" style={{ marginTop: 12 }}>
            {listing.offers?.map((offer) => (
              <button
                key={offer.mode}
                type="button"
                className={mode === offer.mode ? "active" : ""}
                onClick={() => setMode(offer.mode)}
              >
                {MODE_LABEL[offer.mode]}
                <br />
                <span className="mono">{formatCents(offer.price_cents)}{MODE_PRICE_SUFFIX[offer.mode]}</span>
              </button>
            ))}
          </div>

          <label>
            Identifiant plateforme (username TradingView ou MT)
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={listing.platform.includes("tradingview") ? "ex. @trader_abc" : "ex. MT5-12345678"}
            />
            <small>Requis pour livrer l&apos;accès en invite. Jamais utilisé à d&apos;autres fins.</small>
          </label>

          {selected && (
            <p className="mp-summary" style={{ marginTop: 10 }}>
              Total : <strong className="mono">{formatCents(selected.price_cents)}</strong>
              {MODE_SUMMARY_SUFFIX[selected.mode]}
              {" · commission StratVerity 15 % incluse (vendeur reçoit 85 %)."}
            </p>
          )}

          {error && <p className="mp-modal-err">{error}</p>}

          <div className="marketplace-actions">
            <button className="btn btn-primary" onClick={checkout} disabled={busy}>
              {busy ? "Préparation Stripe…" : `Payer ${selected ? formatCents(selected.price_cents) : ""}`}
            </button>
          </div>
        </section>
      ) : (
        <div className="marketplace-state">
          <strong>Listing en attente de validation.</strong>
          <p>
            Ce produit n&apos;est pas encore en vente publique (file d&apos;audit
            ou retrait opérateur).
          </p>
        </div>
      )}
    </main>
  );
}