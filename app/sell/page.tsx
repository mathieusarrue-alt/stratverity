"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  COMMISSION_PCT,
  MAX_LISTING_SCREENSHOTS,
  MIN_ONE_SHOT_CENTS,
  MIN_RENT_MONTHLY_CENTS,
  MIN_RENT_QUARTERLY_CENTS,
  MIN_RENT_YEARLY_CENTS,
  degressivePricingError,
  savingsPct,
} from "../marketplace/commerce";
import {
  MediaUploadError,
  deleteMarketplaceMedia,
  uploadMarketplaceMedia,
} from "../marketplace/media-upload";
import styles from "./sell.module.css";

/**
 * /sell — dépôt vendeur Marketplace v1 (invite_protected).
 * Livre l'ACCÈS plateforme (Whop-model), jamais le code source.
 * Submit → QUEUE_AUDIT + email x2 (backend). Login requis (layout serveur).
 *
 * "toolkit" est une valeur backend déjà supportée
 * (marketplace_v1_http.py: kind pattern "^(indicator|strategy|toolkit)$") —
 * utilisée ici pour les outils d'optimisation / scripts utilitaires.
 *
 * Principe marketplace (décision fondateur 2026-08-30, étendue 2026-09-02
 * au palier trimestriel) : c'est le VENDEUR qui fixe ses 4 prix (achat
 * définitif / location mensuelle / trimestrielle / annuelle), la plateforme
 * n'impose que des planchers anti-abus et une règle bloquante : chaque
 * palier plus long doit être strictement moins cher que le nombre
 * équivalent de fois le palier plus court (ex. annuel < 12× mensuel,
 * trimestriel < 3× mensuel, annuel < 4× trimestriel).
 */

const KINDS = [
  {
    value: "indicator",
    label: "Indicateur",
    hint: "Pine Script, TV",
    desc: "Un signal, un dashboard, un overlay — vendu en accès invite.",
  },
  {
    value: "strategy",
    label: "Stratégie",
    hint: "Pine strategy, EA",
    desc: "Une logique d'entrée/sortie complète, prête à trader.",
  },
  {
    value: "toolkit",
    label: "Outil / Optimiseur",
    hint: "script, utilitaire",
    desc: "Optimiseur de paramètres, gestion du risque, utilitaire de backtest.",
  },
] as const;

const PLATFORMS = [
  { value: "tradingview", label: "TradingView" },
  { value: "mt5", label: "MetaTrader 5" },
  { value: "mt4", label: "MetaTrader 4" },
] as const;

const MARKETS = [
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "indices", label: "Indices" },
  { value: "metals", label: "Métaux" },
  { value: "multi", label: "Multi-actifs" },
] as const;

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function SellListing() {
  const router = useRouter();
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("indicator");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["value"]>("tradingview");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [markets, setMarkets] = useState<string[]>(["crypto"]);

  // Prix saisis en EUROS (unité humaine) ; convertis en centimes uniquement à
  // la soumission. 3 offres possibles, chacune activable indépendamment —
  // c'est le vendeur qui fixe ses prix, la plateforme ne fait qu'appliquer
  // des planchers et la règle de dégressivité annuel < 12×mensuel.
  const [oneShot, setOneShot] = useState(true);
  const [oneShotPriceEur, setOneShotPriceEur] = useState(String(MIN_ONE_SHOT_CENTS / 100));
  const [rentMonthly, setRentMonthly] = useState(false);
  const [rentMonthlyPriceEur, setRentMonthlyPriceEur] = useState(String(MIN_RENT_MONTHLY_CENTS / 100));
  const [rentQuarterly, setRentQuarterly] = useState(false);
  const [rentQuarterlyPriceEur, setRentQuarterlyPriceEur] = useState(String(MIN_RENT_QUARTERLY_CENTS / 100));
  const [rentYearly, setRentYearly] = useState(false);
  const [rentYearlyPriceEur, setRentYearlyPriceEur] = useState(String(MIN_RENT_YEARLY_CENTS / 100));

  const [sellerHandle, setSellerHandle] = useState("");
  const [fileName, setFileName] = useState("");
  const [cgu, setCgu] = useState(false);
  const [noGain, setNoGain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState("");

  // Médias vendeur — upload réel via Supabase Storage (décision fondateur
  // 2026-09-02). avatarUrl/screenshots contiennent déjà les URLs publiques
  // https renvoyées par Supabase après upload ; c'est ce qui part au backend
  // dans le payload de dépôt.
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [mediaError, setMediaError] = useState("");

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMediaError("");
    setAvatarUploading(true);
    try {
      const previous = avatarUrl;
      const url = await uploadMarketplaceMedia(file, "avatar");
      setAvatarUrl(url);
      if (previous) void deleteMarketplaceMedia(previous);
    } catch (err) {
      setMediaError(err instanceof MediaUploadError ? err.message : "Échec de l'upload de la photo de profil.");
    } finally {
      setAvatarUploading(false);
    }
  }

  function removeAvatar() {
    if (avatarUrl) void deleteMarketplaceMedia(avatarUrl);
    setAvatarUrl("");
  }

  async function handleScreenshotsChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setMediaError("");
    const room = MAX_LISTING_SCREENSHOTS - screenshots.length;
    if (room <= 0) {
      setMediaError(`Maximum ${MAX_LISTING_SCREENSHOTS} captures d'écran par listing.`);
      return;
    }
    const toUpload = files.slice(0, room);
    setScreenshotUploading(true);
    try {
      for (const file of toUpload) {
        try {
          const url = await uploadMarketplaceMedia(file, "screenshot");
          setScreenshots((prev) => [...prev, url]);
        } catch (err) {
          setMediaError(err instanceof MediaUploadError ? err.message : "Échec de l'upload d'un screenshot.");
        }
      }
    } finally {
      setScreenshotUploading(false);
    }
  }

  function removeScreenshot(url: string) {
    void deleteMarketplaceMedia(url);
    setScreenshots((prev) => prev.filter((s) => s !== url));
  }

  function toggleMarket(m: string) {
    setMarkets((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }

  const netOneShot = useMemo(() => {
    const eur = Number(oneShotPriceEur) || 0;
    return Math.round(eur * (100 - COMMISSION_PCT)) / 100;
  }, [oneShotPriceEur]);
  const netRentMonthly = useMemo(() => {
    const eur = Number(rentMonthlyPriceEur) || 0;
    return Math.round(eur * (100 - COMMISSION_PCT)) / 100;
  }, [rentMonthlyPriceEur]);
  const netRentQuarterly = useMemo(() => {
    const eur = Number(rentQuarterlyPriceEur) || 0;
    return Math.round(eur * (100 - COMMISSION_PCT)) / 100;
  }, [rentQuarterlyPriceEur]);
  const netRentYearly = useMemo(() => {
    const eur = Number(rentYearlyPriceEur) || 0;
    return Math.round(eur * (100 - COMMISSION_PCT)) / 100;
  }, [rentYearlyPriceEur]);

  // Dégressivité mensuel/trimestriel/annuel — bloquant pour chaque paire de
  // paliers de location actifs en même temps (décision fondateur 2026-08-30,
  // étendue 2026-09-02 au palier trimestriel).
  const degressiveError = useMemo(() => {
    const monthlyCents = rentMonthly ? Math.round((Number(rentMonthlyPriceEur) || 0) * 100) : null;
    const quarterlyCents = rentQuarterly ? Math.round((Number(rentQuarterlyPriceEur) || 0) * 100) : null;
    const yearlyCents = rentYearly ? Math.round((Number(rentYearlyPriceEur) || 0) * 100) : null;
    return degressivePricingError(monthlyCents, quarterlyCents, yearlyCents);
  }, [rentMonthly, rentQuarterly, rentYearly, rentMonthlyPriceEur, rentQuarterlyPriceEur, rentYearlyPriceEur]);

  const quarterlySavingsPct = useMemo(() => {
    if (!rentMonthly || !rentQuarterly || degressiveError) return null;
    const monthlyCents = Math.round((Number(rentMonthlyPriceEur) || 0) * 100);
    const quarterlyCents = Math.round((Number(rentQuarterlyPriceEur) || 0) * 100);
    if (monthlyCents <= 0 || quarterlyCents <= 0) return null;
    return savingsPct(monthlyCents, quarterlyCents, 3);
  }, [rentMonthly, rentQuarterly, degressiveError, rentMonthlyPriceEur, rentQuarterlyPriceEur]);

  const yearlySavingsVsMonthlyPct = useMemo(() => {
    if (!rentMonthly || !rentYearly || degressiveError) return null;
    const monthlyCents = Math.round((Number(rentMonthlyPriceEur) || 0) * 100);
    const yearlyCents = Math.round((Number(rentYearlyPriceEur) || 0) * 100);
    if (monthlyCents <= 0 || yearlyCents <= 0) return null;
    return savingsPct(monthlyCents, yearlyCents, 12);
  }, [rentMonthly, rentYearly, degressiveError, rentMonthlyPriceEur, rentYearlyPriceEur]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!title.trim() || !description.trim() || !sellerHandle.trim()) {
      setError("Titre, description et handle vendeur sont obligatoires.");
      return;
    }
    if (!oneShot && !rentMonthly && !rentQuarterly && !rentYearly) {
      setError("Choisissez au moins un mode de vente (achat, location mensuelle, trimestrielle ou annuelle).");
      return;
    }
    if (degressiveError) {
      setError(degressiveError);
      return;
    }
    if (!cgu || !noGain) {
      setError("Acceptez les CGV vendeur et la clause « pas de promesse de gains ».");
      return;
    }
    setBusy(true);
    try {
      const offers = [];
      if (oneShot) {
        const cents = Math.round((Number(oneShotPriceEur) || 0) * 100);
        offers.push({ mode: "one_shot", price_cents: cents >= MIN_ONE_SHOT_CENTS ? cents : MIN_ONE_SHOT_CENTS });
      }
      if (rentMonthly) {
        const cents = Math.round((Number(rentMonthlyPriceEur) || 0) * 100);
        offers.push({
          mode: "rent_monthly",
          price_cents: cents >= MIN_RENT_MONTHLY_CENTS ? cents : MIN_RENT_MONTHLY_CENTS,
        });
      }
      if (rentQuarterly) {
        const cents = Math.round((Number(rentQuarterlyPriceEur) || 0) * 100);
        offers.push({
          mode: "rent_quarterly",
          price_cents: cents >= MIN_RENT_QUARTERLY_CENTS ? cents : MIN_RENT_QUARTERLY_CENTS,
        });
      }
      if (rentYearly) {
        const cents = Math.round((Number(rentYearlyPriceEur) || 0) * 100);
        offers.push({
          mode: "rent_yearly",
          price_cents: cents >= MIN_RENT_YEARLY_CENTS ? cents : MIN_RENT_YEARLY_CENTS,
        });
      }
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
        avatar_url: avatarUrl || null,
        screenshots,
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
      <main className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.doneCard} data-premium-surface>
            <span className={styles.eyebrow}>Dépôt reçu</span>
            <h1>En file d&apos;audit</h1>
            <p>
              Référence <strong className="mono">{doneId}</strong>. Le fichier source
              part sous escrow — il ne sera jamais rendu public ni transmis à un
              acheteur. Un email récapitulatif (fiche, empreinte, prix) part au
              vendeur et à StratVerity.
            </p>
            <div className={styles.doneActions}>
              <button className="btn btn-ghost" onClick={() => router.push("/sell/listings")}>
                Mes listings →
              </button>
              <button className="btn btn-ghost" onClick={() => router.push("/marketplace")}>
                Voir le catalogue
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Vendre sur StratVerity</span>
        <h1>
          Votre outil, votre code. <em>Vos revenus, sans le publier.</em>
        </h1>
        <p>
          L&apos;acheteur reçoit un accès invité sur sa propre plateforme (TradingView
          ou MetaTrader) — jamais votre fichier source. Vous fixez librement vos
          prix — achat définitif, location mensuelle et/ou annuelle. StratVerity
          prélève {COMMISSION_PCT} % à l&apos;encaissement, sur chaque mode ; le
          reste part directement chez vous.
        </p>
        <div className={styles.trustRow}>
          <span className={styles.trustItem}><IconLock /> Code jamais transmis à l&apos;acheteur</span>
          <span className={styles.trustItem}><IconCheck /> Chaque dépôt passe en file d&apos;audit</span>
          <span className={styles.trustItem}><IconCheck /> Vous fixez vos prix, paiement sécurisé</span>
        </div>
      </section>

      <form onSubmit={submit} className={styles.workspace}>
        <div className={styles.builder}>
          <fieldset className={styles.block}>
            <legend><span>01</span> Que vendez-vous ?</legend>
            <p className={styles.blockHint}>Le type détermine ce que l&apos;acheteur voit dans le catalogue.</p>
            <div className={styles.productChoices}>
              {KINDS.map((k) => (
                <button
                  type="button"
                  key={k.value}
                  className={kind === k.value ? styles.selected : undefined}
                  onClick={() => setKind(k.value)}
                >
                  <small>{k.hint}</small>
                  <strong>{k.label}</strong>
                  <p>{k.desc}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>02</span> Plateforme &amp; marchés</legend>
            <div className={styles.field} style={{ marginTop: 0 }}>
              <span>Plateforme</span>
              <div className={styles.chips}>
                {PLATFORMS.map((p) => (
                  <button
                    type="button"
                    key={p.value}
                    className={platform === p.value ? styles.selected : undefined}
                    onClick={() => setPlatform(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <span>Marchés couverts</span>
              <div className={styles.chips}>
                {MARKETS.map((m) => (
                  <button
                    type="button"
                    key={m.value}
                    className={markets.includes(m.value) ? styles.selected : undefined}
                    onClick={() => toggleMarket(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>03</span> Fiche publique</legend>
            <p className={styles.blockHint}>
              Ce que l&apos;acheteur obtient concrètement — pas une promesse de gains. Les
              backtests ne garantissent rien pour l&apos;avenir.
            </p>
            <label className={styles.field} style={{ marginTop: 0 }}>
              <span>Titre public</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                placeholder="Ex. Volatility Sweep TV"
              />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Logique, marchés, unités de temps, réglages recommandés…"
              />
            </label>

            <div className={styles.field}>
              <span>Photo de profil</span>
              <div className={styles.avatarRow}>
                {avatarUrl ? (
                  <div className={styles.avatarPreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="Avatar du listing" />
                    <button type="button" onClick={removeAvatar} aria-label="Retirer la photo de profil">
                      ×
                    </button>
                  </div>
                ) : (
                  <label className={styles.avatarPicker}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                    />
                    <span>{avatarUploading ? "…" : "+"}</span>
                  </label>
                )}
                <small>Icône carrée affichée sur la carte du catalogue et la fiche listing. PNG/JPEG/WebP, 5 Mo max.</small>
              </div>
            </div>

            <div className={styles.field}>
              <span>Captures d&apos;écran (TradingView, MetaTrader…)</span>
              <div className={styles.screenshotGrid}>
                {screenshots.map((url) => (
                  <div className={styles.screenshotThumb} key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Screenshot du listing" />
                    <button type="button" onClick={() => removeScreenshot(url)} aria-label="Retirer ce screenshot">
                      ×
                    </button>
                  </div>
                ))}
                {screenshots.length < MAX_LISTING_SCREENSHOTS && (
                  <label className={styles.screenshotAdd}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      onChange={handleScreenshotsChange}
                      disabled={screenshotUploading}
                    />
                    <span>{screenshotUploading ? "…" : "+"}</span>
                  </label>
                )}
              </div>
              <small>
                Jusqu&apos;à {MAX_LISTING_SCREENSHOTS} captures d&apos;écran illustrant l&apos;indicateur ou la
                stratégie en conditions réelles. {screenshots.length}/{MAX_LISTING_SCREENSHOTS} ajoutées.
              </small>
              {mediaError && <p className={styles.errorNote}>{mediaError}</p>}
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>04</span> Vos prix</legend>
            <p className={styles.blockHint}>
              Principe marketplace : vous fixez vous-même chaque prix, au-dessus du
              plancher indiqué. Activez au moins un mode — vous pouvez cumuler les
              trois. Si location mensuelle ET annuelle sont actives, l&apos;annuel doit
              rester strictement moins cher que 12 mensualités.
            </p>
            <div className={styles.offerGrid}>
              <div className={`${styles.offerCard} ${oneShot ? styles.active : ""}`}>
                <div className={styles.offerCardHead} onClick={() => setOneShot((v) => !v)}>
                  <strong>Achat définitif</strong>
                  <span className={styles.toggleDot} />
                </div>
                <p>Paiement unique, minimum {MIN_ONE_SHOT_CENTS / 100} €.</p>
                {oneShot && (
                  <div className={styles.priceRow}>
                    <input
                      type="number"
                      min={MIN_ONE_SHOT_CENTS / 100}
                      value={oneShotPriceEur}
                      onChange={(e) => setOneShotPriceEur(e.target.value)}
                    />
                    <span>vous touchez ≈ {netOneShot.toFixed(2)} €</span>
                  </div>
                )}
              </div>
              <div className={`${styles.offerCard} ${rentMonthly ? styles.active : ""}`}>
                <div className={styles.offerCardHead} onClick={() => setRentMonthly((v) => !v)}>
                  <strong>Location mensuelle</strong>
                  <span className={styles.toggleDot} />
                </div>
                <p>Abonnement récurrent, minimum {MIN_RENT_MONTHLY_CENTS / 100} €/mois.</p>
                {rentMonthly && (
                  <div className={styles.priceRow}>
                    <input
                      type="number"
                      min={MIN_RENT_MONTHLY_CENTS / 100}
                      value={rentMonthlyPriceEur}
                      onChange={(e) => setRentMonthlyPriceEur(e.target.value)}
                    />
                    <span>vous touchez ≈ {netRentMonthly.toFixed(2)} €/mois</span>
                  </div>
                )}
              </div>
              <div className={`${styles.offerCard} ${rentQuarterly ? styles.active : ""}`}>
                <div className={styles.offerCardHead} onClick={() => setRentQuarterly((v) => !v)}>
                  <strong>Location trimestrielle</strong>
                  <span className={styles.toggleDot} />
                </div>
                <p>Abonnement tous les 3 mois, minimum {MIN_RENT_QUARTERLY_CENTS / 100} €/trimestre.</p>
                {rentQuarterly && (
                  <div className={styles.priceRow}>
                    <input
                      type="number"
                      min={MIN_RENT_QUARTERLY_CENTS / 100}
                      value={rentQuarterlyPriceEur}
                      onChange={(e) => setRentQuarterlyPriceEur(e.target.value)}
                    />
                    <span>vous touchez ≈ {netRentQuarterly.toFixed(2)} €/trimestre</span>
                  </div>
                )}
                {rentQuarterly && rentMonthly && quarterlySavingsPct !== null && quarterlySavingsPct > 0 && (
                  <p className={styles.savingsBadge}>
                    Économie affichée à l&apos;acheteur : −{quarterlySavingsPct} % vs 3 mensualités
                  </p>
                )}
                {rentQuarterly && rentMonthly && degressiveError && (
                  <p className={styles.errorNote} style={{ marginTop: 10 }}>{degressiveError}</p>
                )}
              </div>
              <div className={`${styles.offerCard} ${rentYearly ? styles.active : ""}`}>
                <div className={styles.offerCardHead} onClick={() => setRentYearly((v) => !v)}>
                  <strong>Location annuelle</strong>
                  <span className={styles.toggleDot} />
                </div>
                <p>Abonnement annuel dégressif, minimum {MIN_RENT_YEARLY_CENTS / 100} €/an.</p>
                {rentYearly && (
                  <div className={styles.priceRow}>
                    <input
                      type="number"
                      min={MIN_RENT_YEARLY_CENTS / 100}
                      value={rentYearlyPriceEur}
                      onChange={(e) => setRentYearlyPriceEur(e.target.value)}
                    />
                    <span>vous touchez ≈ {netRentYearly.toFixed(2)} €/an</span>
                  </div>
                )}
                {rentYearly && rentMonthly && yearlySavingsVsMonthlyPct !== null && yearlySavingsVsMonthlyPct > 0 && (
                  <p className={styles.savingsBadge}>
                    Économie affichée à l&apos;acheteur : −{yearlySavingsVsMonthlyPct} % vs 12 mensualités
                  </p>
                )}
                {rentYearly && (rentMonthly || rentQuarterly) && degressiveError && (
                  <p className={styles.errorNote} style={{ marginTop: 10 }}>{degressiveError}</p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>05</span> Livraison &amp; preuve</legend>
            <label className={styles.field} style={{ marginTop: 0 }}>
              <span>Handle vendeur (username TradingView ou MetaTrader)</span>
              <input
                type="text"
                value={sellerHandle}
                onChange={(e) => setSellerHandle(e.target.value)}
                placeholder="ex. @mathieu_tv"
              />
              <small>Sert à envoyer les invitations aux acheteurs — jamais affiché publiquement.</small>
            </label>
            <div className={styles.field}>
              <span>Fichier source (escrow StratVerity)</span>
              <label className={styles.filePicker}>
                <input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
                <span><IconLock /></span>
                <strong>{fileName || "Déposer le fichier"}</strong>
                <small>Chiffré, conservé comme preuve — jamais envoyé à un acheteur.</small>
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>06</span> Conditions</legend>
            <label className={styles.legalRow} style={{ marginTop: 0 }}>
              <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} />
              <span>
                J&apos;accepte les CGV vendeur : commission StratVerity {COMMISSION_PCT} % sur
                chaque encaissement, livraison exclusivement par accès invite.
              </span>
            </label>
            <label className={styles.legalRow}>
              <input type="checkbox" checked={noGain} onChange={(e) => setNoGain(e.target.checked)} />
              <span>Je ne vends aucune promesse de gains : un backtest n&apos;est pas une performance future.</span>
            </label>
            {error && <p className={styles.errorNote}>{error}</p>}
          </fieldset>
        </div>

        <aside className={styles.summary} data-premium-surface>
          <div className={styles.summaryHead}>
            <span>VOTRE DÉPÔT</span>
            <span>{KINDS.find((k) => k.value === kind)?.label ?? "—"}</span>
          </div>
          <div className={styles.summaryBody}>
            {oneShot && (
              <div className={styles.summaryLine}>
                <span>Achat définitif, net vendeur</span>
                <strong>{netOneShot.toFixed(2)} €</strong>
              </div>
            )}
            {rentMonthly && (
              <div className={styles.summaryLine}>
                <span>Location mensuelle, net vendeur</span>
                <strong>{netRentMonthly.toFixed(2)} €/mois</strong>
              </div>
            )}
            {rentQuarterly && (
              <div className={styles.summaryLine}>
                <span>Location trimestrielle, net vendeur</span>
                <strong>{netRentQuarterly.toFixed(2)} €/trimestre</strong>
              </div>
            )}
            {rentYearly && (
              <div className={styles.summaryLine}>
                <span>Location annuelle, net vendeur</span>
                <strong>{netRentYearly.toFixed(2)} €/an</strong>
              </div>
            )}
            {!oneShot && !rentMonthly && !rentQuarterly && !rentYearly && (
              <div className={styles.summaryLine}>
                <span>Activez un mode de vente</span>
                <strong>—</strong>
              </div>
            )}
            <div className={`${styles.summaryLine} ${styles.total}`}>
              <span>Commission StratVerity</span>
              <strong>{COMMISSION_PCT} %</strong>
            </div>
          </div>
          <ul className={styles.summaryPoints}>
            <li><IconCheck /> Code source jamais transmis — accès invite uniquement.</li>
            <li><IconCheck /> Chaque dépôt passe en file d&apos;audit avant publication.</li>
            <li><IconCheck /> C&apos;est vous qui fixez vos 3 prix, commission prélevée à la source.</li>
          </ul>
          <button className={styles.ctaButton} type="submit" disabled={busy || !!degressiveError}>
            {busy ? "Dépôt en cours…" : "Déposer le listing"}
          </button>
        </aside>
      </form>
    </main>
  );
}
