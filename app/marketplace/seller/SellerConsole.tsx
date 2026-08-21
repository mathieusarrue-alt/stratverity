"use client";

import { FormEvent, useState } from "react";

const CONSENT_VERSION = "marketplace-seller-2026-08-21-v1";

export default function SellerConsole({ enabled }: { enabled: boolean }) {
  const [auditId, setAuditId] = useState("");
  const [ownerToken, setOwnerToken] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("99");
  const [claimed, setClaimed] = useState(false);
  const [rights, setRights] = useState(false);
  const [commission, setCommission] = useState(false);
  const [liability, setLiability] = useState(false);
  const [message, setMessage] = useState("");

  async function post(path: string, body: object) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.detail?.message ?? payload?.error ?? "Request refused");
    return payload;
  }

  async function claim(event: FormEvent) {
    event.preventDefault();
    setMessage("Verifying ownership…");
    try {
      await post("/api/marketplace/ownership-claims", {
        audit_id: auditId,
        owner_token: ownerToken,
        consent_version: CONSENT_VERSION,
        rights_confirmed: rights,
        commission_confirmed: commission,
        liability_confirmed: liability,
      });
      setClaimed(true);
      setOwnerToken("");
      setMessage("Ownership verified. The owner token was not retained in this form.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ownership verification failed.");
    }
  }

  async function createListing(event: FormEvent) {
    event.preventDefault();
    setMessage("Creating private draft…");
    try {
      const cents = Math.round(Number(price) * 100);
      const result = await post("/api/marketplace/listings", {
        audit_hash: auditId,
        title,
        price_cents: cents,
        currency: "eur",
        commission_bps: 1500,
      });
      setMessage(`Draft ${result.listing_id} created. It is not public until human activation.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Draft creation failed.");
    }
  }

  async function refreshConnect() {
    setMessage("Refreshing Stripe verification…");
    try {
      const result = await post("/api/marketplace/connect/status", {});
      setMessage(
        result.status === "READY"
          ? "Stripe verification is ready. Human exact-file approval is the final gate."
          : "Stripe still requires information before this listing can be activated.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stripe status is unavailable.");
    }
  }
  async function connect() {
    setMessage("Opening Stripe-hosted KYC…");
    try {
      const result = await post("/api/marketplace/connect/account-links", {});
      const target = new URL(result.url);
      if (target.protocol !== "https:" || !target.hostname.endsWith("stripe.com")) throw new Error("Unsafe redirect refused");
      location.assign(target.toString());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stripe Connect is unavailable.");
    }
  }

  if (!enabled) return <div className="marketplace-state"><strong>Seller onboarding is not open yet.</strong><p>The secure flow is installed but remains disabled until the Stripe Connect production checkpoint is approved.</p></div>;

  return (
    <div className="marketplace-grid">
      <form className="marketplace-card" onSubmit={claim}>
        <span className="marketplace-proof">Step 1 · Ownership</span>
        <label>Certification ID<input value={auditId} onChange={(e) => setAuditId(e.target.value)} required /></label>
        <label>Private order owner token<input type="password" value={ownerToken} onChange={(e) => setOwnerToken(e.target.value)} minLength={32} required /></label>
        <label><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /> I own or control the distribution rights.</label>
        <label><input type="checkbox" checked={commission} onChange={(e) => setCommission(e.target.checked)} /> I accept the fixed 15% platform commission.</label>
        <label><input type="checkbox" checked={liability} onChange={(e) => setLiability(e.target.checked)} /> I remain responsible for the product, claims and support.</label>
        <button className="btn btn-primary" disabled={!rights || !commission || !liability}>Verify ownership</button>
      </form>
      <form className="marketplace-card" onSubmit={createListing}>
        <span className="marketplace-proof">Step 2 · Private draft</span>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required /></label>
        <label>Price in EUR<input type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></label>
        <button className="btn btn-primary" disabled={!claimed}>Create draft</button>
      </form>
      <section className="marketplace-card">
        <span className="marketplace-proof">Step 3 · Stripe KYC</span>
        <p>Stripe collects identity and payout information on its hosted page. StratVerity never receives your identity documents.</p>
        <button className="btn btn-secondary" type="button" onClick={connect}>Continue with Stripe</button>
        <button className="btn btn-secondary" type="button" onClick={refreshConnect}>Refresh verification status</button>
      </section>
      {message ? <p className="marketplace-message" role="status">{message}</p> : null}
    </div>
  );
}