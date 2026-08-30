"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Fiche produit SKU marketplace #1 — Top/Bottom Oscillator (TradingView invite-only).
// tv_script_id = qSG1KNKk · fulfillment = TV_INVITE_ONLY (jamais de .pine).
// Ce SKU est indépendant de l'audit /configure. is_public reste OFF tant qu'un
// paiement de test (mode Stripe test) + grant cobaye n'ont pas été validés.

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

// Regex TradingView : le nom sous l'avatar, pas l'e-mail.
export const TV_USERNAME_RE = /^[A-Za-z0-9_]{3,32}$/;

export function goodTvUsername(value: string): boolean {
  return TV_USERNAME_RE.test(value.trim());
}

export default function TopBottomOscillator() {
  const router = useRouter();
  const [sku, setSku] = useState<TboSkuCode>("tbo_1m");
  const [username, setUsername] = useState("");
  const [usernameConfirm, setUsernameConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = TBO_SKUS.find((s) => s.code === sku)!;

  function vUsername(): string | null {
    const v = username.trim();
    if (!TV_USERNAME_RE.test(v)) {
      return "Le nom sous l'avatar TradingView (3 à 32 caractères : lettres, chiffres, « _ »). Pas l'e-mail.";
    }
    return null;
  }

  async function checkout() {
    setError("");
    const uErr = vUsername();
    if (uErr) {
      setError(uErr);
      return;
    }
    if (username.trim() !== usernameConfirm.trim()) {
      setError("Les deux saisies du username ne correspondent pas.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/marketplace/checkout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku_code: sku,
          tv_username: username.trim(),
          product_slug: "top-bottom-oscillator",
          fulfillment: "TV_INVITE_ONLY",
          tv_script_id: "qSG1KNKk",
        }),
      });
      if (response.status === 401) {
        router.push(`/login?return_to=${encodeURIComponent("/marketplace/top-bottom-oscillator")}`);
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

  return (
    <main className="mp-page">
      <Link className="marketplace-seller-link" href="/marketplace">← Retour au catalogue</Link>

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
            onChange={(e) => setUsername(e.target.value)}
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
            onChange={(e) => setUsernameConfirm(e.target.value)}
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