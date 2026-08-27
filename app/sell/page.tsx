"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  COMMISSION_PCT,
  MIN_ONE_SHOT_CENTS,
  MIN_RENT_CENTS,
} from "../marketplace/commerce";

/**
 * /sell — dépôt vendeur Marketplace v1 (invite_protected).
 * Livre l'ACCÈS plateforme (Whop-model), jamais le code source.
 * Submit → QUEUE_AUDIT + email x2 (backend). Login requis (layout serveur).
 */

const KINDS = ["indicator", "strategy"] as const;
const PLATFORMS = ["tradingview", "mt5", "mt4"] as const;
const MARKETS = ["crypto", "forex", "indices", "metals", "multi"] as const;

export default function SellListing() {
  const router = useRouter();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("indicator");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("tradingview");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [markets, setMarkets] = useState<string[]>(["crypto"]);
  const [oneShot, setOneShot] = useState(false);
  const [oneShotPrice, setOneShotPrice] = useState("1900"); // 19,00 €
  const [rent, setRent] = useState(true);
  const [rentPrice, setRentPrice] = useState("900"); // 9,00 €/mois
  const [sellerHandle, setSellerHandle] = useState("");
  const [fileName, setFileName] = useState("");
  const [cgu, setCgu] = useState(false);
  const [noGain, setNoGain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState("");

  function toggleMarket(m: string) {
    setMarkets((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!title.trim() || !description.trim() || !sellerHandle.trim()) {
      setError("Titre, description et handle vendeur sont obligatoires.");
      return;
    }
    if (!oneShot && !rent) {
      setError("Choisissez au moins un mode de vente (achat ou location).");
      return;
    }
    if (!cgu || !noGain) {
      setError("Acceptez les CGV vendeur et la clause « pas de promesse de gains ».");
      return;
    }
    setBusy(true);
    try {
      const offers = [];
      if (oneShot) offers.push({ mode: "one_shot", price_cents: Number(oneShotPrice) || MIN_ONE_SHOT_CENTS });
      if (rent) offers.push({ mode: "rent_monthly", price_cents: Number(rentPrice) || MIN_RENT_CENTS });
      const payload = {
        kind,
        platform: [platform],
        title: title.trim(),
        description: description.trim(),
        asset_class: markets,
        delivery_mode: "invite_protected",
        offers,
        seller_handle: sellerHandle.trim(),
        source_filename: fileName || null,
        consent: { cgu15: cgu, no_gain: noGain },
      };
      const response = await fetch("/api/marketplace/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        router.push(`/login?return_to=${encodeURIComponent("/sell")}`);
        return;
      }
      const data = (await response.json()) as {
        listing_id?: string;
        state?: string;
        detail?: { message?: string };
      };
      if (!response.ok || !data.listing_id) {
        setError(data?.detail?.message ?? "Dépôt refusé.");
        return;
      }
      setDoneId(data.listing_id);
    } catch {
      setError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  if (doneId) {
    return (
      <main className="mp-page">
        <section className="mp-hero">
          <span className="mp-illust-eyebrow">Dépôt reçu</span>
          <h1>
            En file d&apos;audit <em>— QUEUE_AUDIT</em>
          </h1>
          <p>
            Référence <strong className="mono">{doneId}</strong>. Le fichier
            source est stocké sous escrow — il ne sera jamais rendu public ni
            transmis à un acheteur. Un email récapitulatif (fiche + empreinte +
            prix) part au vendeur et à StratVerity.
          </p>
          <div className="marketplace-actions">
            <button className="btn btn-ghost" onClick={() => router.push("/sell/listings")}>
              Mes listings →
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/marketplace")}>
              Voir le catalogue
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mp-page">
      <section className="mp-hero">
        <span className="mp-illust-eyebrow">Vendre · accès protégé</span>
        <h1>
          Déposez votre stratégie <em>en accès invite.</em>
        </h1>
        <p>
          L&apos;acheteur accède à l&apos;outil sur sa plateforme (TradingView,
          MetaTrader) par invitation. Le code source reste chez vous — il n&apos;est
          jamais transmis. Commission StratVerity : {COMMISSION_PCT} % par
          encaissement (one-shot et loyer).
        </p>
      </section>

      <form onSubmit={submit} className="marketplace-state" style={{ textAlign: "left", maxWidth: 720 }}>
        <label>
          Type de produit
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="indicator">Indicateur (Pine / TV)</option>
            <option value="strategy">Stratégie (Pine strategy / EA)</option>
          </select>
        </label>
        <label>
          Plateforme
          <select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
            <option value="tradingview">TradingView</option>
            <option value="mt5">MetaTrader 5</option>
            <option value="mt4">MetaTrader 4</option>
          </select>
        </label>
        <label>
          Titre public
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Ex. Volatility Sweep TV" />
        </label>
        <label>
          Description (ce que l&apos;acheteur obtient, pas une promesse de gains)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Logique, marchés, TF, réglages…" />
        </label>
        <label>
          Marchés
          <span className="mp-badges">
            {MARKETS.map((m) => (
              <button type="button" key={m} className={`mp-badge ${markets.includes(m) ? "active" : ""}`} onClick={() => toggleMarket(m)}>
                {m}
              </button>
            ))}
          </span>
        </label>

        <fieldset>
          <legend>Offres</legend>
          <label>
            <input type="checkbox" checked={oneShot} onChange={(e) => setOneShot(e.target.checked)} />
            Accès permanent (one-shot) — min {MIN_ONE_SHOT_CENTS / 100} €
            {oneShot && (
              <input type="number" min={MIN_ONE_SHOT_CENTS / 100} value={oneShotPrice} onChange={(e) => setOneShotPrice(e.target.value)} />
            )}
          </label>
          <label>
            <input type="checkbox" checked={rent} onChange={(e) => setRent(e.target.checked)} />
            Location mensuelle — min {MIN_RENT_CENTS / 100} €/mois
            {rent && (
              <input type="number" min={MIN_RENT_CENTS / 100} value={rentPrice} onChange={(e) => setRentPrice(e.target.value)} />
            )}
          </label>
        </fieldset>

        <label>
          Handle vendeur (username TradingView ou MT) — pour les invitations
          <input value={sellerHandle} onChange={(e) => setSellerHandle(e.target.value)} placeholder="ex. @mathieu_tv" />
        </label>

        <label>
          Fichier source (escrow StratVerity — stockage privé, jamais public)
          <input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          <small>Le fichier est chiffré et conservé comme preuve. Il n&apos;est jamais envoyé à un acheteur.</small>
        </label>

        <label className="legal">
          <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} />
          J&apos;accepte les CGV vendeur : commission StratVerity {COMMISSION_PCT} % sur chaque encaissement, livraison par accès invite.
        </label>
        <label className="legal">
          <input type="checkbox" checked={noGain} onChange={(e) => setNoGain(e.target.checked)} />
          Je ne vends aucune promesse de gains : un backtest n&apos;est pas une performance future.
        </label>

        {error && <p className="mp-modal-err">{error}</p>}

        <div className="marketplace-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Dépôt en cours…" : "Déposer le listing (queue audit)"}
          </button>
        </div>
      </form>
    </main>
  );
}