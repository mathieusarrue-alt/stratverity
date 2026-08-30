"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Success après checkout TBO. Statut lu depuis la licence.
// « Accès en cours pour @username — visible sous 24 h dans Indicateurs →
// Scripts sur invitation seulement. » Lien corriger le username si pending_grant.

function SuccessInner() {
  const search = useSearchParams();
  const sessionId = search.get("session_id") ?? "";
  const tv = search.get("tv_username") ?? "";
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionId || status) return;
    (async () => {
      try {
        const r = await fetch(
          `/api/marketplace/license-for-session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" },
        );
        if (!r.ok) return;
        const p = (await r.json()) as { status?: string; tv_username?: string };
        if (p.status) setStatus(p.status);
      } catch {
        /* non bloquant */
      }
    })();
  }, [sessionId, status]);

  const username = tv || status?.startsWith("@") ? tv : null;

  return (
    <main className="mp-page">
      <section className="mp-hero" style={{ maxWidth: 640 }}>
        <span className="mp-engine">Paiement reçu</span>
        <h1>
          Accès en cours pour <em>@{username || "…"}</em>
        </h1>
        <p>
          Le script <strong>Top/Bottom Oscillator v2.6.9</strong> vous est
          accordé sous invitation sur votre compte TradingView. Il doit
          apparaître sous{" "}
          <strong>24&nbsp;h dans Indicateurs&nbsp;→ Scripts sur invitation seulement</strong>.
        </p>
        <p className="mp-summary">
          {status === "pending_grant"
            ? "Votre accès est en attente d&apos;activation. Un e-mail de confirmation vous a été envoyé sans pièce jointe."
            : status === "active"
              ? "Votre accès est actif."
              : "Un e-mail de confirmation a été envoyé — sans pièce jointe. Vous n&apos;avez rien à répondre, aucun pseudo à renvoyer."}
        </p>
        {status === "pending_grant" && (
          <div className="marketplace-actions">
            <Link className="btn btn-ghost" href="/marketplace/top-bottom-oscillator">
              Corriger le username →
            </Link>
          </div>
        )}
        <div className="marketplace-seller-link" style={{ marginTop: 24 }}>
          <Link href="/marketplace">← Retour au catalogue</Link>
        </div>
      </section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="mp-page"><p className="marketplace-message">Chargement…</p></main>}>
      <SuccessInner />
    </Suspense>
  );
}