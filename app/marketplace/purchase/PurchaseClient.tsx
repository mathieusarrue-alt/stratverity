"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_ORIGIN = process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ?? "https://api.stratverity.com";

export default function PurchaseClient({ enabled, sessionId }: { enabled: boolean; sessionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("Stripe is confirming the signed payment webhook.");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [working, setWorking] = useState(false);

  async function unlock() {
    if (!sessionId || working) return;
    setWorking(true);
    setMessage("Reconciling your purchase with the signed Stripe event…");
    try {
      const response = await fetch("/api/marketplace/download-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (response.status === 401) {
        router.push(`/login?return_to=${encodeURIComponent(`/marketplace/purchase?session_id=${sessionId}`)}`);
        return;
      }
      const payload = (await response.json()) as { download_url?: string };
      if (!response.ok || !payload.download_url) {
        setMessage("Payment is not confirmed yet. Wait a few seconds, then try again.");
        return;
      }
      const target = new URL(payload.download_url);
      const expected = new URL(API_ORIGIN);
      if (
        target.protocol !== "https:" ||
        target.origin !== expected.origin ||
        !target.pathname.startsWith("/v1/marketplace/downloads/")
      ) {
        setMessage("The delivery destination was refused for security reasons.");
        return;
      }
      setDownloadUrl(target.toString());
      setMessage("Payment confirmed. This encrypted link expires in 10 minutes and works once.");
    } catch {
      setMessage("Delivery is temporarily unavailable. Your payment remains recorded; retry shortly.");
    } finally {
      setWorking(false);
    }
  }

  if (!enabled) {
    return (
      <main className="marketplace-shell">
        <div className="marketplace-state">
          <strong>Marketplace delivery is not open yet.</strong>
          <p>No purchase can be fulfilled while the private release gate is closed.</p>
          <Link className="btn btn-secondary" href="/marketplace">Return to Marketplace</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="marketplace-shell">
      <header className="marketplace-hero">
        <span>SECURE DELIVERY</span>
        <h1>Your certified file, <em>exactly verified.</em></h1>
        <p>Delivery opens only after the signed Stripe webhook matches the buyer, amount, currency and certified listing.</p>
      </header>
      <section className="marketplace-state" aria-live="polite">
        <strong>{sessionId ? "Purchase received" : "Missing checkout reference"}</strong>
        <p>{sessionId ? message : "Return from the Stripe Checkout success page to unlock your purchase."}</p>
        <div className="marketplace-actions">
          {downloadUrl ? (
            <a className="btn btn-primary" href={downloadUrl} rel="noreferrer">Download once</a>
          ) : (
            <button className="btn btn-primary" type="button" disabled={!sessionId || working} onClick={unlock}>
              {working ? "Confirming…" : "Unlock certified file"}
            </button>
          )}
          <Link className="btn btn-secondary" href="/marketplace">Back to Marketplace</Link>
        </div>
      </section>
    </main>
  );
}