"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const MAX_POLLS = 8;
const POLL_DELAY_MS = 2_000;

type LicenseState =
  | "loading"
  | "pending_payment"
  | "pending_grant"
  | "active"
  | "past_due"
  | "revoke_pending"
  | "revoked"
  | "error";

type LicensePayload = {
  status?: LicenseState;
  tv_username?: string;
};

function SuccessInner() {
  const router = useRouter();
  const search = useSearchParams();
  const sessionId = search.get("session_id") ?? "";
  const [status, setStatus] = useState<LicenseState>(() =>
    sessionId ? "loading" : "error",
  );
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const response = await fetch(
          `/api/marketplace/license-for-session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (response.status === 401) {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          router.replace(`/login?return_to=${encodeURIComponent(returnTo)}`);
          return;
        }
        if (!response.ok) {
          if (attempts < MAX_POLLS && response.status !== 400 && response.status !== 401) {
            timer = setTimeout(poll, POLL_DELAY_MS);
            return;
          }
          setStatus("error");
          return;
        }

        const payload = (await response.json()) as LicensePayload;
        if (payload.tv_username) setUsername(payload.tv_username);
        const next = payload.status ?? "error";
        setStatus(next);
        if (next === "pending_payment" && attempts < MAX_POLLS) {
          timer = setTimeout(poll, POLL_DELAY_MS);
        }
      } catch {
        if (controller.signal.aborted) return;
        if (attempts < MAX_POLLS) {
          timer = setTimeout(poll, POLL_DELAY_MS);
        } else {
          setStatus("error");
        }
      }
    }

    void poll();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [router, sessionId]);

  const title =
    status === "active"
      ? "Accès TradingView actif"
      : status === "pending_grant"
        ? "Activation de l’accès en cours"
        : status === "pending_payment" || status === "loading"
          ? "Vérification du paiement"
          : status === "past_due" || status === "revoke_pending" || status === "revoked"
            ? "Accès à vérifier"
            : "Confirmation indisponible";

  const summary =
    status === "active"
      ? "Votre licence est active. Le script doit être visible dans vos scripts TradingView sur invitation."
      : status === "pending_grant"
        ? "Le paiement est rapproché. L’accès au script est en cours d’activation sur le compte indiqué."
        : status === "pending_payment"
          ? "Stripe traite encore la confirmation. Cette page se met à jour automatiquement pendant quelques secondes."
          : status === "loading"
            ? "Nous consultons l’état de la licence sans exposer votre session Stripe."
            : status === "past_due" || status === "revoke_pending" || status === "revoked"
              ? "La licence n’est pas active. Consultez votre compte ou contactez le support avec votre référence de commande."
              : "Nous ne pouvons pas confirmer la licence pour le moment. Aucun nouvel achat n’est nécessaire : réessayez depuis votre compte.";

  return (
    <main className="mp-page">
      <section className="mp-hero" style={{ maxWidth: 640 }}>
        <span className="mp-engine">État de votre commande</span>
        <h1>
          {title}
          {username ? <em> pour @{username}</em> : null}
        </h1>
        <p>
          Le script <strong>Top/Bottom Oscillator v2.6.9</strong> est fourni par
          invitation sur le compte TradingView associé à la commande.
        </p>
        <p className="mp-summary" role="status" aria-live="polite">
          {summary}
        </p>
        {status === "pending_grant" ? (
          <div className="marketplace-actions">
            <Link className="btn btn-ghost" href="/contact">
              Signaler une erreur de username →
            </Link>
          </div>
        ) : null}
        <div className="marketplace-seller-link" style={{ marginTop: 24 }}>
          <Link href="/account">Voir mon compte</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/marketplace">Retour au catalogue</Link>
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
