"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearActiveTboCheckout,
  getOrRotateTboCheckoutKey,
} from "./checkout-idempotency";

export type TboSkuCode = "tbo_1m" | "tbo_3m" | "tbo_12m" | "tbo_lifetime";

export const TBO_SKUS: Array<{
  code: TboSkuCode;
  label: string;
  priceCents: number;
  sub: string;
}> = [
  { code: "tbo_1m", label: "1 mois", priceCents: 5000, sub: "50 € HT" },
  { code: "tbo_3m", label: "3 mois", priceCents: 13000, sub: "130 € HT" },
  { code: "tbo_12m", label: "12 mois", priceCents: 48000, sub: "480 € HT" },
  { code: "tbo_lifetime", label: "À vie", priceCents: 140000, sub: "1 400 € HT" },
];

export const TV_USERNAME_RE = /^[A-Za-z0-9_]{3,32}$/;

export function goodTvUsername(value: string): boolean {
  return TV_USERNAME_RE.test(value.trim());
}

export function isAllowedStripeCheckout(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      url.hostname === "checkout.stripe.com" &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname.startsWith("/c/pay/")
    );
  } catch {
    return false;
  }
}

type MarketplaceErrorPayload = {
  error?: string;
  detail?: string | { message?: string };
};

function errorMessage(payload: MarketplaceErrorPayload): string {
  if (typeof payload.detail === "string") return payload.detail;
  if (payload.detail?.message) return payload.detail.message;
  return payload.error ?? "Impossible de préparer le paiement.";
}

export default function TopBottomOscillator() {
  const router = useRouter();
  const search = useSearchParams();
  const [sku, setSku] = useState<TboSkuCode>("tbo_1m");
  const [username, setUsername] = useState("");
  const [usernameConfirm, setUsernameConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = TBO_SKUS.find((item) => item.code === sku)!;

  useEffect(() => {
    if (search.get("tbo") !== "cancelled") return;
    clearActiveTboCheckout();
    router.replace("/marketplace/top-bottom-oscillator", { scroll: false });
  }, [router, search]);

  function validateUsername(): string | null {
    if (!TV_USERNAME_RE.test(username.trim())) {
      return "Le nom sous l'avatar TradingView (3 à 32 caractères : lettres, chiffres, « _ »). Pas l'e-mail.";
    }
    return null;
  }

  async function checkout() {
    setError("");
    const usernameError = validateUsername();
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (username.trim() !== usernameConfirm.trim()) {
      setError("Les deux saisies du username ne correspondent pas.");
      return;
    }
    if (busy) return;

    setBusy(true);
    try {
      const normalizedUsername = username.trim();
      const idempotencyKey = getOrRotateTboCheckoutKey(sku, normalizedUsername);
      const response = await fetch("/api/marketplace/checkout-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          sku_code: sku,
          tv_username: normalizedUsername,
          product_slug: "top-bottom-oscillator",
          fulfillment: "TV_INVITE_ONLY",
          tv_script_id: "qSG1KNKk",
        }),
      });
      if (response.status === 401) {
        router.push(
          `/login?return_to=${encodeURIComponent("/marketplace/top-bottom-oscillator")}`,
        );
        return;
      }

      const payload = (await response.json()) as MarketplaceErrorPayload & {
        checkout_url?: string;
      };
      if (!response.ok || !payload.checkout_url) {
        setError(errorMessage(payload));
        return;
      }
      if (!isAllowedStripeCheckout(payload.checkout_url)) {
        setError("La destination de paiement reçue n'est pas une page Stripe vérifiée.");
        return;
      }
      window.location.assign(payload.checkout_url);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mp-page">
      <Link className="marketplace-seller-link" href="/marketplace">
        ← Retour au catalogue
      </Link>

      <section className="mp-hero" style={{ marginTop: 16 }}>
        <span className="mp-engine">Indicateur TradingView · invite uniquement</span>
        <h1>
          Top/Bottom Oscillator <em>v2.6.9</em>
        </h1>
        <p>
          Un indicateur TradingView publié par StratVerity, fourni par
          <strong> invitation sur le compte de l&apos;auteur</strong> (script
          « invite-only »). Aucune pièce jointe&nbsp;: pas de fichier .pine. La
          livraison est l&apos;accès au script sur votre compte TradingView.
        </p>
        <p className="mp-summary">
          Aucune promesse de gains. Un indicateur aide à repérer des zones
          supposées de retournement ; il ne garantit aucune performance future.
        </p>
      </section>

      <section className="marketplace-state" style={{ textAlign: "left", maxWidth: 640 }}>
        <strong>Choisissez votre accès</strong>

        <div className="mp-profile-toggle" style={{ marginTop: 12 }}>
          {TBO_SKUS.map((option) => (
            <button
              key={option.code}
              type="button"
              className={sku === option.code ? "active" : ""}
              onClick={() => setSku(option.code)}
            >
              {option.label}
              <br />
              <span className="mono">{option.sub}</span>
            </button>
          ))}
        </div>

        <p className="mp-summary" style={{ marginTop: 10 }}>
          Prix HT (TVA non applicable, auto-entrepreneur)&nbsp;:
          <strong className="mono"> {selected.sub}</strong> · commission StratVerity
          15&nbsp;% incluse.
        </p>

        <label>
          Username TradingView
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="ex. Trader_Adam"
            autoComplete="off"
            spellCheck={false}
          />
          <small>
            Le nom sous l&apos;avatar TradingView, pas l&apos;e-mail. C&apos;est
            sur ce compte que l&apos;accès sera accordé.
          </small>
        </label>

        <label>
          Confirmer le username
          <input
            value={usernameConfirm}
            onChange={(event) => setUsernameConfirm(event.target.value)}
            placeholder="Retapez le même username"
            autoComplete="off"
            spellCheck={false}
          />
          <small>
            {usernameConfirm && username.trim() !== usernameConfirm.trim()
              ? "Les deux saisies ne correspondent pas."
              : "Confirmez le nom exact pour éviter une erreur de livraison."}
          </small>
        </label>

        {error && <p className="mp-modal-err">{error}</p>}

        <div className="marketplace-actions">
          <button className="btn btn-primary" onClick={checkout} disabled={busy}>
            {busy
              ? "Préparation Stripe…"
              : `Payer ${selected.sub} · accès à @${username.trim() || "…"}`}
          </button>
        </div>
      </section>
    </main>
  );
}
