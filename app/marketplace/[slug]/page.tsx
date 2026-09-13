"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COMMERCE_ENABLED,
  deliveryLabel,
  formatCents,
  formatCentsV2,
  KIND_LABEL,
  MODE_LABEL,
  MODE_PRICE_SUFFIX,
  MODE_SUMMARY_SUFFIX,
  offerDiscountPct,
  offerLabel,
  type EnrichedListing,
  type MarketplaceListing,
  type OfferV2,
  type SaleMode,
} from "../commerce";
import StrategyAvatar from "../StrategyAvatar";

/**
 * /marketplace/[slug] — détail + checkout.
 * v1 : one_shot | rent_monthly | rent_quarterly | rent_yearly.
 * Phase 6 : enrichissement optionnel (médias, offres v2 multi-durée + lifetime,
 * reviews vérifiées) via l'endpoint /enriched — fallback v1 si indisponible.
 */

export default function ListingDetail() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [enriched, setEnriched] = useState<EnrichedListing | null>(null);
  const [mode, setMode] = useState<SaleMode>("one_shot");
  const [offerV2, setOfferV2] = useState<OfferV2 | null>(null);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const response = await fetch(
          `/api/marketplace/listings?slug=${encodeURIComponent(slug)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error();
        const payload = (await response.json()) as { listings: MarketplaceListing[] };
        const found = (payload.listings ?? []).find((l) => l.slug === slug);
        if (!found) throw new Error();
        setListing(found);
        if (found.offers?.some((o) => o.mode === "rent_monthly")) setMode("rent_monthly");
        else if (found.offers?.some((o) => o.mode === "rent_quarterly")) setMode("rent_quarterly");
        else if (found.offers?.some((o) => o.mode === "rent_yearly")) setMode("rent_yearly");
        // Phase 6 : enrichissement optionnel (ne casse pas l'expérience v1).
        try {
          const enrichedResponse = await fetch(
            `/api/marketplace/listings/${encodeURIComponent(found.id)}/enriched`,
            { cache: "no-store" },
          );
          if (enrichedResponse.ok) {
            const enrichedPayload = (await enrichedResponse.json()) as EnrichedListing;
            setEnriched(enrichedPayload);
            const firstSubscription = enrichedPayload.offers_v2?.find(
              (o) => o.kind === "subscription" && o.active === 1,
            );
            if (firstSubscription) setOfferV2(firstSubscription);
          }
        } catch {
          // enrichissement indisponible : listing v1 seul
        }
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
  const media = enriched?.media ?? [];
  const offersV2 = enriched?.offers_v2?.filter((o) => o.active === 1) ?? [];
  const monthlyV2 = offersV2.find((o) => o.kind === "subscription" && o.duration_months === 1) ?? null;
  const reviewData = enriched?.reviews;

  return (
    <main className="mp-page">
      <Link className="marketplace-seller-link" href="/marketplace">← Retour au catalogue</Link>
      <section className="mp-hero" style={{ marginTop: 16 }}>
        <span className="mp-engine">
          {KIND_LABEL[listing.kind]} · {listing.platform.join(" / ")}
        </span>
        {listing.badge && (
          <span className="mp-badge" title="Audit indépendant StratVerity — résultat scellé SHA-256">
            ✅ Audité · {listing.badge}
          </span>
        )}
        <div style={{ alignItems: "center", display: "flex", gap: 14, marginBottom: 4 }}>
          <StrategyAvatar seed={listing.id} label={listing.title} size={48} imageUrl={listing.avatar_url} />
          <h1 style={{ margin: 0 }}>{listing.title}</h1>
        </div>
        <p>{listing.description}</p>
        <p className="mp-summary">{deliveryLabel("invite_protected")}</p>
        <p className="mp-summary">
          Un backtest est une mesure historique : il ne garantit aucune
          performance future. Aucune promesse de gains.
        </p>
        {/* Galerie médias — v2 (mp_listing_media) puis fallback screenshots v1 */}
        {(media.length > 0 || (listing.screenshots && listing.screenshots.length > 0)) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {(media.length > 0 ? media : (listing.screenshots ?? []).map((url) => ({ url }))).map((m, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={m.url}
                alt={("alt_text" in m && m.alt_text) || `Capture d'écran — ${listing.title}`}
                style={{
                  border: "1px solid var(--line-2)",
                  borderRadius: 12,
                  height: 130,
                  objectFit: "cover",
                  width: 190,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {buyable && COMMERCE_ENABLED ? (
        <section className="marketplace-state" style={{ textAlign: "left", maxWidth: 560 }}>
          <strong>Choisissez votre accès</strong>

          {/* Offres v1 (mode Stripe existant) */}
          <div className="mp-profile-toggle" style={{ marginTop: 12 }}>
            {listing.offers?.map((offer) => (
              <button
                key={offer.mode}
                type="button"
                className={mode === offer.mode ? "active" : ""}
                onClick={() => {
                  setMode(offer.mode);
                  setOfferV2(null);
                }}
              >
                {MODE_LABEL[offer.mode]}
                <br />
                <span className="mono">{formatCents(offer.price_cents)}{MODE_PRICE_SUFFIX[offer.mode]}</span>
              </button>
            ))}
          </div>

          {/* Offres v2 (Phase 6 — multi-durée dégressive + lifetime), si présentes */}
          {offersV2.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {offersV2.map((offer) => {
                const discount = offerDiscountPct(offer, monthlyV2?.price_cents ?? null);
                const active = offerV2?.offer_id === offer.offer_id;
                return (
                  <button
                    key={offer.offer_id}
                    type="button"
                    className={active ? "active" : ""}
                    style={{ alignItems: "center", display: "flex", gap: 6, lineHeight: 1.2 }}
                    onClick={() => {
                      setOfferV2(offer);
                      setMode("one_shot");
                    }}
                  >
                    {offerLabel(offer)}
                    <span className="mono">{formatCentsV2(offer)}</span>
                    {discount !== null && discount > 0 && (
                      <span className="mp-badge" style={{ background: "var(--accent-2, #22c55e)", color: "#08130c" }}>
                        -{discount}%
                      </span>
                    )}
                    {offer.kind === "lifetime_access" && (
                      <span className="mp-badge" title="Accès à vie — jamais le code source">LIFETIME</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <label>
            Identifiant plateforme (username TradingView ou MT)
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={listing.platform.includes("tradingview") ? "ex. @trader_abc" : "ex. MT5-12345678"}
            />
            <small>Requis pour livrer l&apos;accès en invite. Jamais utilisé à d&apos;autres fins.</small>
          </label>

          {offerV2 ? (
            <p className="mp-summary" style={{ marginTop: 10 }}>
              Total : <strong className="mono">{formatCentsV2(offerV2)}</strong>
              {" · commission StratVerity 15 % incluse (vendeur reçoit 85 %)."}
            </p>
          ) : (
            selected && (
              <p className="mp-summary" style={{ marginTop: 10 }}>
                Total : <strong className="mono">{formatCents(selected.price_cents)}</strong>
                {MODE_SUMMARY_SUFFIX[selected.mode]}
                {" · commission StratVerity 15 % incluse (vendeur reçoit 85 %)."}
              </p>
            )
          )}

          {error && <p className="mp-modal-err">{error}</p>}

          <div className="marketplace-actions">
            <button className="btn btn-primary" onClick={checkout} disabled={busy}>
              {busy
                ? "Préparation Stripe…"
                : `Payer ${offerV2 ? formatCentsV2(offerV2) : selected ? formatCents(selected.price_cents) : ""}`}
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

      {/* Reviews vérifiées (Phase 6) */}
      {reviewData && reviewData.count > 0 && (
        <section className="marketplace-state" style={{ textAlign: "left", marginTop: 16, maxWidth: 560 }}>
          <strong>
            Reviews vérifiées · {reviewData.count} avis
            {reviewData.avg_rating > 0 ? ` · ${reviewData.avg_rating.toLocaleString("fr-FR")} / 5` : ""}
          </strong>
          {reviewData.items.slice(0, 3).map((review) => (
            <div key={review.review_id} style={{ borderBottom: "1px solid var(--line-2)", padding: "10px 0" }}>
              <span style={{ color: "var(--accent, #4f8cff)" }}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
              <span className="mp-badge" style={{ marginLeft: 8 }}>✓ Achat vérifié</span>
              <p style={{ margin: "4px 0 0", fontSize: 14 }}>{review.body}</p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}