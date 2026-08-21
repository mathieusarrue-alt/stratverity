"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Listing = {
  listing_id: string;
  audit_hash: string;
  title: string;
  price_cents: number;
  currency: string;
  commission_bps: number;
  stats?: Record<string, unknown> | null;
};

export default function MarketplaceClient({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState("");
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

  if (!enabled) {
    return (
      <div className="marketplace-state">
        <strong>Private release gate</strong>
        <p>The audited-strategy marketplace is in final Connect and delivery testing. No illustrative strategy is presented as a real product.</p>
        <div className="marketplace-actions">
          <Link className="btn btn-primary" href="/configure">Audit my strategy</Link>
          <Link className="btn btn-secondary" href="/contact">Join the launch list</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {message ? <p className="marketplace-message" role="status">{message}</p> : null}
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
      </div>
      {!message && listings.length === 0 ? <div className="marketplace-state"><strong>No strategy for sale yet.</strong><p>Listings only appear after certification, seller verification, KYC and exact-file approval.</p></div> : null}
      <p className="marketplace-seller-link"><Link href="/marketplace/seller">Certified seller area →</Link></p>
    </>
  );
}