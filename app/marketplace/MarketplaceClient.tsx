"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Activity, X } from "lucide-react";

type Listing = {
  listing_id: string;
  audit_hash: string;
  title: string;
  price_cents: number;
  currency: string;
  commission_bps: number;
  stats?: Record<string, unknown> | null;
};

function LaunchListModal({ onClose }: { onClose: () => void }) {
  const [profile, setProfile] = useState<"buyer" | "seller">("buyer");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit() {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/marketplace/launch-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, profile, source: "marketplace-launch-list" }),
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mp-modal-backdrop" role="dialog" aria-modal="true" aria-label="Join the launch list">
      <div className="mp-modal">
        <button className="mp-modal-close" type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h3>Join the launch list</h3>
        <p className="mp-modal-sub">Be the first to access certified strategies when the marketplace opens.</p>
        <div className="mp-profile-toggle" role="radiogroup" aria-label="I am a…">
          <button type="button" className={profile === "buyer" ? "active" : ""} onClick={() => setProfile("buyer")}>🧑‍💻 Buyer</button>
          <button type="button" className={profile === "seller" ? "active" : ""} onClick={() => setProfile("seller")}>🏷️ Seller</button>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          aria-label="Email address"
        />
        {state === "error" ? <p className="mp-modal-err" role="alert">Please enter a valid email address.</p> : null}
        {state === "done" ? (
          <p className="mp-modal-ok" role="status">You are on the list. We will email you at launch.</p>
        ) : (
          <button className="btn btn-primary mp-modal-cta" type="button" onClick={submit} disabled={state === "sending"}>
            {state === "sending" ? "Subscribing…" : "Notify me"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MarketplaceClient({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    fetch("/api/marketplace/listings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json() as Promise<{ listings: Listing[] }>;
      })
      .then((payload) => setListings(payload.listings))
      .catch(() => setMessage("The verified catalogue is temporarily unavailable."));
  }, [enabled]);

  async function buy(listingId: string) {
    setMessage("Preparing secure checkout…");
    const response = await fetch("/api/marketplace/checkout-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    if (response.status === 401) {
      router.push(`/login?return_to=${encodeURIComponent("/marketplace")}`);
      return;
    }
    const payload = (await response.json()) as { checkout_url?: string };
    if (!response.ok || !payload.checkout_url) {
      setMessage("Checkout is not available for this strategy yet.");
      return;
    }
    const target = new URL(payload.checkout_url);
    if (target.protocol !== "https:" || !target.hostname.endsWith("stripe.com")) {
      setMessage("The payment destination was refused for security reasons.");
      return;
    }
    location.assign(target.toString());
  }

  return (
    <>
      {message ? <p className="marketplace-message" role="status">{message}</p> : null}

      {/* Catalogue public — certifications réelles uniquement (aucun exemple fictif). */}
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
        {enabled ? (
          <div className="marketplace-grid">
            {listings.map((listing) => (
              <article className="marketplace-card" key={listing.listing_id}>
                <span className="marketplace-proof">Certified exact version</span>
                <h2>{listing.title}</h2>
                <p>SHA256 · {listing.audit_hash.slice(0, 18)}…</p>
                <strong>{(listing.price_cents / 100).toLocaleString("en", { style: "currency", currency: listing.currency })}</strong>
                <button className="btn btn-primary" type="button" onClick={() => buy(listing.listing_id)}>Buy securely</button>
              </article>
            ))}
            {!message && listings.length === 0 ? (
              <div className="marketplace-state">
                <strong>Aucune stratégie certifiée publique pour l&apos;instant.</strong>
                <p>
                  Les fiches apparaissent après audit DELIVERED, consentement de
                  publication et vérification. Faites auditer la vôtre dès maintenant.
                </p>
                <Link className="btn btn-primary" href="/configure">Faire auditer ma stratégie →</Link>
              </div>
            ) : null}
          </div>
        ) : (
                  <div className="marketplace-state">
                    <strong>Le catalogue certifié est en préparation.</strong>
                    <p>
                      Aucune vente ouverte pour le moment. Faites auditer votre stratégie :
                      elle pourra rejoindre la galerie publique avec ses preuves.
                    </p>
                    <Link className="btn btn-primary" href="/configure">Faire auditer ma stratégie →</Link>
                  </div>
                )}
      </section>

      {/* CTA conversion : join the launch list. */}
      <div className="mp-launch-cta">
        <div>
          <TrendingUp size={18} />
          <span>Ready to buy or sell certified strategies?</span>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
          <Activity size={16} /> Join the launch list
        </button>
      </div>

      <p className="marketplace-seller-link"><Link href="/marketplace/seller">Certified seller area →</Link></p>

      {showModal ? <LaunchListModal onClose={() => setShowModal(false)} /> : null}
    </>
  );
}