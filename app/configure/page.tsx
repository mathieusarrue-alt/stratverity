"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import styles from "./scope-configurator.module.css";
import { calculatePrice, formatPrice } from "./pricing";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://signals.13-39-177-70.sslip.io/backtestproof";

const ASSET_PRESETS = [
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
  "OANDA:EURUSD",
  "OANDA:XAUUSD",
  "SP:SPX",
  "NASDAQ:NDX",
] as const;
const TIMEFRAME_PRESETS = ["5m", "15m", "1h", "4h"] as const;
const MAX_STRATEGIES = 10;
const MAX_ASSETS = 50;
const MAX_CONTEXTS = 10_000;
const REQUEST_LIMIT_BYTES = 2 * 1024 * 1024;

type Product = "AUDIT" | "SCAN";
type AuditDepth = "STANDARD" | "ROBUSTNESS" | "CUSTOM";
type EvaluationMode = "BAR_CLOSE" | "INTRABAR";
type SubmissionState =
  | "idle"
  | "submitting"
  | "checkout"
  | "success"
  | "fallback"
  | "error";

type StrategyVersion = {
  id: string;
  name: string;
  sha256: string;
  size: number;
};

type PreviewResponse = {
  scope_fingerprint: string;
  product: Product;
  offer_family: "BASE" | "MATRIX" | "PRO" | "CUSTOM";
  context_count: number;
  pricing_status: "TO_BE_DEFINED";
  technical_estimate: {
    quote_required: boolean;
    quote_reasons: string[];
  };
};

type CheckoutResponse = {
  checkout_attempt_id: string;
  checkout_session_id: string;
  checkout_url: string;
  scope_fingerprint: string;
  status: string;
};

function createOwnerToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} o`;
  return `${(value / 1024).toFixed(1)} Ko`;
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function checkoutScopeHash(payload: object): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function isStripeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

export default function ScopeConfiguratorPage() {
  const [product, setProduct] = useState<Product>("SCAN");
  const [strategies, setStrategies] = useState<StrategyVersion[]>([]);
  const [assets, setAssets] = useState<string[]>(["BINANCE:BTCUSDT"]);
  const [timeframes, setTimeframes] = useState<string[]>(["15m"]);
  const [assetDraft, setAssetDraft] = useState("");
  const [auditDepth, setAuditDepth] = useState<AuditDepth>("STANDARD");
  const [evaluationMode, setEvaluationMode] =
    useState<EvaluationMode>("BAR_CLOSE");
  const [retentionDays, setRetentionDays] = useState("30");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const checkoutAttemptRef = useRef<{
    scopeHash: string;
    idempotencyKey: string;
    ownerToken: string;
  } | null>(null);

  const projectedStrategyCount = Math.max(strategies.length, 1);
  const contextCount =
    projectedStrategyCount * assets.length * timeframes.length;
  const offerFamily =
    product === "AUDIT"
      ? auditDepth === "CUSTOM"
        ? "CUSTOM"
        : auditDepth === "ROBUSTNESS"
          ? "PRO"
          : contextCount === 1
            ? "BASE"
            : "MATRIX"
      : evaluationMode === "INTRABAR"
        ? "PRO"
        : contextCount === 1
          ? "BASE"
          : "MATRIX";
  const price = calculatePrice({
    product,
    contextCount,
    strategyCount: projectedStrategyCount,
    auditDepth,
    evaluationMode,
    retentionDays: Number(retentionDays),
  });

  const buildPayload = () => {
    const auditOptions =
      auditDepth === "STANDARD"
        ? {
            depth: "STANDARD",
            historical_windows: 1,
            stress_scenarios: 1,
            parameter_variants: 1,
            human_review: false,
          }
        : auditDepth === "ROBUSTNESS"
          ? {
              depth: "ROBUSTNESS",
              historical_windows: 3,
              stress_scenarios: 3,
              parameter_variants: 5,
              human_review: false,
            }
          : {
              depth: "CUSTOM",
              historical_windows: 3,
              stress_scenarios: 3,
              parameter_variants: 5,
              human_review: true,
            };

    return {
      schema_version: "0.1.0",
      scope_id: "scope-preview",
      product,
      offer_family: offerFamily,
      commercial_unit: "STRATEGY_ASSET_TIMEFRAME_CONTEXT",
      strategies: strategies.map((strategy) => ({
        strategy_version_id: strategy.id,
        sha256: strategy.sha256,
      })),
      contexts: strategies.flatMap((strategy) =>
        assets.flatMap((asset) =>
          timeframes.map((timeframe) => ({
            strategy_version_id: strategy.id,
            asset_id: asset,
            timeframe,
          })),
        ),
      ),
      audit_options: product === "AUDIT" ? auditOptions : null,
      scan_options:
        product === "SCAN"
          ? {
              evaluation_mode: evaluationMode,
              retention_days: Number(retentionDays),
              alert_quota: Math.max(100, contextCount * 100),
              service_tier: "SHARED",
            }
          : null,
      pricing_status: "TO_BE_DEFINED",
    };
  };

  const estimatedRequestBytes =
    strategies.length > 0
      ? new TextEncoder().encode(JSON.stringify(buildPayload())).byteLength
      : 0;

  const chooseStrategies = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    if (strategies.length + files.length > MAX_STRATEGIES) {
      setState("error");
      setMessage(`Maximum ${MAX_STRATEGIES} stratégies par configuration.`);
      return;
    }
    setState("submitting");
    setMessage("Calcul des empreintes, sans envoyer les fichiers…");
    try {
      const offset = strategies.length;
      const hashed = await Promise.all(
        files.map(async (file, index) => {
          const digest = await sha256(file);
          return {
            id: `strategy-${offset + index + 1}-${digest.slice(0, 12)}`,
            name: file.name,
            sha256: digest,
            size: file.size,
          };
        }),
      );
      setStrategies((current) => {
        const seen = new Set(current.map((strategy) => strategy.sha256));
        const unique = hashed.filter((strategy) => {
          if (seen.has(strategy.sha256)) return false;
          seen.add(strategy.sha256);
          return true;
        });
        return [...current, ...unique];
      });
      setState("idle");
      setMessage("");
      setPreview(null);
    } catch {
      setState("error");
      setMessage("Impossible de calculer l’empreinte de ce fichier.");
    }
  };

  const toggleAsset = (asset: string) => {
    setPreview(null);
    setAssets((current) =>
      current.includes(asset)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== asset)
        : current.length >= MAX_ASSETS
          ? current
          : [...current, asset],
    );
  };

  const addAsset = () => {
    const asset = assetDraft.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._:/-]{0,99}$/.test(asset)) {
      setState("error");
      setMessage("Utilisez un symbole comme BINANCE:BTCUSDT ou OANDA:EURUSD.");
      return;
    }
    if (!assets.includes(asset) && assets.length < MAX_ASSETS) {
      setAssets((current) => [...current, asset]);
    }
    setAssetDraft("");
    setPreview(null);
    setState("idle");
    setMessage("");
  };

  const toggleTimeframe = (timeframe: string) => {
    setPreview(null);
    setTimeframes((current) =>
      current.includes(timeframe)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== timeframe)
        : [...current, timeframe],
    );
  };

  const submitPreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (strategies.length === 0) {
      setState("error");
      setMessage("Ajoutez au moins un fichier de stratégie.");
      return;
    }
    if (contextCount > MAX_CONTEXTS) {
      setState("error");
      setMessage(`La matrice dépasse la limite de ${MAX_CONTEXTS} contextes.`);
      return;
    }
    const payload = buildPayload();
    const requestBytes = new TextEncoder().encode(
      JSON.stringify(payload),
    ).byteLength;
    if (requestBytes > REQUEST_LIMIT_BYTES) {
      setState("error");
      setMessage("La configuration dépasse la limite de 2 Mio.");
      return;
    }

    setState("submitting");
    setMessage("Validation sécurisée du périmètre…");
    try {
      const response = await fetch(`${API_URL}/v1/service-scopes/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as PreviewResponse & {
        detail?: { code?: string; message?: string } | string;
      };
      if (!response.ok) {
        const detail =
          typeof result.detail === "object" ? result.detail : undefined;
        setPreview(null);
        setState(response.status === 404 || response.status >= 500 ? "fallback" : "error");
        setMessage(
          response.status === 404 || response.status >= 500
            ? "L’API consolidée est en cours de déploiement. Le calcul affiché reste une estimation locale."
            : detail?.message ?? "Le périmètre n’a pas pu être validé.",
        );
        return;
      }
      setPreview(result);
      setState("success");
      setMessage(
        "Périmètre et tarif confirmés. Aucun débit ni scan n’a encore été activé.",
      );
    } catch {
      setPreview(null);
      setState("fallback");
      setMessage(
        "L’API consolidée est en cours de déploiement. Le calcul affiché reste une estimation locale.",
      );
    }
  };

  const startCheckout = async () => {
    if (!preview || strategies.length === 0) return;
    const scope = buildPayload();
    const pricedRequest = { pricing_version: "launch-v0.1", scope };
    setState("checkout");
    setMessage("Préparation du paiement sécurisé sur Stripe…");
    try {
      const scopeHash = await checkoutScopeHash(pricedRequest);
      if (checkoutAttemptRef.current?.scopeHash !== scopeHash) {
        checkoutAttemptRef.current = {
          scopeHash,
          idempotencyKey: `checkout-${crypto.randomUUID().replaceAll("-", "")}`,
          ownerToken: createOwnerToken(),
        };
      }
      const idempotencyKey = checkoutAttemptRef.current.idempotencyKey;
      const ownerToken = checkoutAttemptRef.current.ownerToken;
      const request = { ...pricedRequest, owner_token: ownerToken };
      const requestBytes = new TextEncoder().encode(
        JSON.stringify(request),
      ).byteLength;
      if (requestBytes > REQUEST_LIMIT_BYTES) {
        setState("error");
        setMessage("La demande de paiement dépasse la limite de 2 Mio.");
        return;
      }
      const response = await fetch(`${API_URL}/v1/billing/checkout-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(request),
      });
      const result = (await response.json()) as CheckoutResponse & {
        detail?: { code?: string; message?: string } | string;
      };
      if (!response.ok) {
        const detail =
          typeof result.detail === "object" ? result.detail : undefined;
        const billingUnavailable =
          response.status === 503 ||
          detail?.code === "BILLING_DISABLED" ||
          detail?.code === "STRIPE_TEST_KEY_REQUIRED";
        setState("error");
        setMessage(
          billingUnavailable
            ? "Le compte Stripe test doit encore être relié avant d’ouvrir le paiement. Votre configuration est conservée."
            : detail?.message ??
                "Le paiement n’a pas pu être préparé. Aucun débit n’a eu lieu.",
        );
        return;
      }
      if (!isStripeCheckoutUrl(result.checkout_url)) {
        setState("error");
        setMessage(
          "La destination de paiement reçue n’est pas une page Stripe valide. Aucun débit n’a eu lieu.",
        );
        return;
      }
      sessionStorage.setItem(
        `stratverity.order-owner:${result.checkout_session_id}`,
        ownerToken,
      );
      window.location.assign(result.checkout_url);
    } catch {
      setState("error");
      setMessage(
        "Le service de paiement est temporairement indisponible. Aucun débit n’a eu lieu.",
      );
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span aria-hidden="true">S/V</span>
          <strong>STRATVERITY</strong>
          <small>BACKTESTPROOF · RADAR</small>
        </Link>
        <Link className={styles.backLink} href="/">
          Retour au site <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>CONFIGURATEUR DE PÉRIMÈTRE · V0.1</span>
          <h1>
            Composez votre audit.
            <em>Ou votre scan.</em>
          </h1>
          <p>
            Sélectionnez vos stratégies, actifs et unités de temps. Nous
            calculons immédiatement les contextes et le prix total. Vous
            décidez ensuite si vous souhaitez continuer vers le paiement.
          </p>
        </div>
        <aside className={styles.privacyNote}>
          <span aria-hidden="true">01</span>
          <strong>Vos fichiers restent locaux</strong>
          <p>
            Cette prévisualisation calcule uniquement leur empreinte SHA-256.
            Aucun code de stratégie n’est envoyé.
          </p>
        </aside>
      </section>

      <form className={styles.workspace} onSubmit={submitPreview}>
        <div className={styles.builder}>
          <fieldset className={styles.block}>
            <legend><span>01</span>Quel service souhaitez-vous ?</legend>
            <div className={styles.productChoices}>
              {(["AUDIT", "SCAN"] as Product[]).map((choice) => (
                <button
                  aria-pressed={product === choice}
                  className={product === choice ? styles.selectedCard : ""}
                  key={choice}
                  onClick={() => {
                    setProduct(choice);
                    setPreview(null);
                  }}
                  type="button"
                >
                  <small>{choice === "AUDIT" ? "Ponctuel" : "Récurrent"}</small>
                  <strong>{choice === "AUDIT" ? "Audit" : "Scan live"}</strong>
                  <p>
                    {choice === "AUDIT"
                      ? "Analyser une matrice historique et produire un rapport."
                      : "Surveiller signaux, positions et dérives dans le temps."}
                  </p>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>02</span>Ajoutez vos stratégies</legend>
            <label className={styles.filePicker}>
              <input
                accept=".pine,.py,.ipynb,.zip,text/plain,application/zip"
                multiple
                onChange={chooseStrategies}
                type="file"
              />
              <span aria-hidden="true">＋</span>
              <strong>Choisir un ou plusieurs fichiers</strong>
              <small>10 stratégies maximum · empreinte locale uniquement</small>
            </label>
            {strategies.length > 0 ? (
              <ul className={styles.strategyList}>
                {strategies.map((strategy, index) => (
                  <li key={strategy.sha256}>
                    <span>0{index + 1}</span>
                    <div>
                      <strong>{strategy.name}</strong>
                      <small>
                        {formatBytes(strategy.size)} · SHA{" "}
                        {strategy.sha256.slice(0, 12)}…
                      </small>
                    </div>
                    <button
                      aria-label={`Retirer ${strategy.name}`}
                      onClick={() => {
                        setStrategies((current) =>
                          current.filter((item) => item.sha256 !== strategy.sha256),
                        );
                        setPreview(null);
                      }}
                      type="button"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyLine}>
                1 stratégie sera comptée dans l’estimation initiale.
              </p>
            )}
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>03</span>Sélectionnez les actifs</legend>
            <div className={styles.chips}>
              {ASSET_PRESETS.map((asset) => (
                <button
                  aria-pressed={assets.includes(asset)}
                  className={assets.includes(asset) ? styles.activeChip : ""}
                  key={asset}
                  onClick={() => toggleAsset(asset)}
                  type="button"
                >
                  {asset.replace(/^.*:/, "")}
                  <small>{asset.split(":")[0]}</small>
                </button>
              ))}
            </div>
            <div className={styles.customAsset}>
              <label htmlFor="custom-asset">Autre symbole</label>
              <div>
                <input
                  id="custom-asset"
                  onChange={(event) => setAssetDraft(event.target.value)}
                  placeholder="EXCHANGE:SYMBOL"
                  value={assetDraft}
                />
                <button onClick={addAsset} type="button">Ajouter</button>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>04</span>Choisissez les unités de temps</legend>
            <div className={styles.timeframes}>
              {TIMEFRAME_PRESETS.map((timeframe) => (
                <button
                  aria-pressed={timeframes.includes(timeframe)}
                  className={
                    timeframes.includes(timeframe) ? styles.activeTimeframe : ""
                  }
                  key={timeframe}
                  onClick={() => toggleTimeframe(timeframe)}
                  type="button"
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend><span>05</span>Ajustez la profondeur</legend>
            {product === "AUDIT" ? (
              <div className={styles.optionGrid}>
                {(["STANDARD", "ROBUSTNESS", "CUSTOM"] as AuditDepth[]).map(
                  (depth) => (
                    <button
                      aria-pressed={auditDepth === depth}
                      className={auditDepth === depth ? styles.activeOption : ""}
                      key={depth}
                      onClick={() => {
                        setAuditDepth(depth);
                        setPreview(null);
                      }}
                      type="button"
                    >
                      <strong>
                        {depth === "STANDARD"
                          ? "Standard"
                          : depth === "ROBUSTNESS"
                            ? "Robustesse"
                            : "Sur mesure"}
                      </strong>
                      <small>
                        {depth === "STANDARD"
                          ? "Une lecture bornée"
                          : depth === "ROBUSTNESS"
                            ? "Fenêtres et stress"
                            : "Robustesse + revue humaine"}
                      </small>
                    </button>
                  ),
                )}
              </div>
            ) : (
              <div className={styles.scanOptions}>
                <div className={styles.optionGrid}>
                  {(["BAR_CLOSE", "INTRABAR"] as EvaluationMode[]).map(
                    (evaluation) => (
                      <button
                        aria-pressed={evaluationMode === evaluation}
                        className={
                          evaluationMode === evaluation ? styles.activeOption : ""
                        }
                        key={evaluation}
                        onClick={() => {
                          setEvaluationMode(evaluation);
                          setPreview(null);
                        }}
                        type="button"
                      >
                        <strong>
                          {evaluation === "BAR_CLOSE"
                            ? "Clôture de bougie"
                            : "Intrabar Premium"}
                        </strong>
                        <small>
                          {evaluation === "BAR_CLOSE"
                            ? "Socle recommandé"
                            : "Calcul renforcé"}
                        </small>
                      </button>
                    ),
                  )}
                </div>
                <label>
                  Rétention
                  <select
                    onChange={(event) => {
                      setRetentionDays(event.target.value);
                      setPreview(null);
                    }}
                    value={retentionDays}
                  >
                    <option value="30">30 jours</option>
                    <option value="90">90 jours</option>
                    <option value="365">1 an</option>
                  </select>
                </label>
              </div>
            )}
          </fieldset>
        </div>

        <aside className={styles.summary}>
          <div className={styles.summaryHead}>
            <span>PÉRIMÈTRE ACTUEL</span>
            <strong>{offerFamily}</strong>
          </div>
          <div className={styles.contextNumber}>
            <strong>{contextCount.toLocaleString("fr-FR")}</strong>
            <span>contexte{contextCount > 1 ? "s" : ""}</span>
          </div>
          <p className={styles.formula}>
            {projectedStrategyCount} stratégie
            {projectedStrategyCount > 1 ? "s" : ""} × {assets.length} actif
            {assets.length > 1 ? "s" : ""} × {timeframes.length} UT
          </p>
          <div className={styles.livePrice}>
            <span>TARIF LANCEMENT · PRIX EN TEMPS RÉEL</span>
            <strong>
              {formatPrice(price.totalCents)}
              <small>
                {price.cadence === "MONTHLY" ? " TTC / mois" : " TTC"}
              </small>
            </strong>
            <p>
              {formatPrice(price.subtotalExVatCents)} HT · TVA France estimée
              à 20 %
            </p>
            {price.cadence === "MONTHLY" ? (
              <div>
                Premier paiement : <b>{formatPrice(price.dueTodayCents)} TTC</b>
                <small>
                  dont {formatPrice(
                    price.activationExVatCents + price.activationVatCents,
                  )}{" "}
                  TTC de mise en service
                </small>
              </div>
            ) : (
              <div>
                Paiement unique · <b>aucun renouvellement automatique</b>
              </div>
            )}
          </div>
          <details className={styles.priceBreakdown}>
            <summary>Voir le calcul du prix</summary>
            <dl>
              {price.lines.map((line) => (
                <div key={line.label}>
                  <dt>{line.label}</dt>
                  <dd>
                    {formatPrice(line.amountExVatCents)} HT
                    {line.cadence === "MONTHLY" ? " / mois" : ""}
                  </dd>
                </div>
              ))}
              <div>
                <dt>TVA estimée</dt>
                <dd>{formatPrice(price.vatCents)}</dd>
              </div>
            </dl>
            <p>
              Le prix final et la taxe applicable seront confirmés avant le
              paiement selon le pays de facturation.
            </p>
          </details>
          <dl className={styles.metrics}>
            <div>
              <dt>Service</dt>
              <dd>{product === "AUDIT" ? "Audit ponctuel" : "Scan récurrent"}</dd>
            </div>
            <div>
              <dt>Requête estimée</dt>
              <dd>
                {estimatedRequestBytes
                  ? formatBytes(estimatedRequestBytes)
                  : "Après ajout du fichier"}
              </dd>
            </div>
            <div><dt>Limite API</dt><dd>2 Mio</dd></div>
            <div>
              <dt>Tarification</dt>
              <dd>Automatique · sans devis</dd>
            </div>
          </dl>
          <div className={styles.limitTrack} aria-label="Utilisation de la limite API">
            <i
              style={{
                width: `${Math.min(
                  100,
                  (estimatedRequestBytes / REQUEST_LIMIT_BYTES) * 100,
                )}%`,
              }}
            />
          </div>
          <button
            className={styles.submit}
            disabled={
              state === "submitting" ||
              state === "checkout" ||
              strategies.length === 0
            }
            type="submit"
          >
            <span>
              {state === "submitting" ? "Validation…" : "Confirmer ce tarif"}
            </span>
            <i aria-hidden="true">→</i>
          </button>
          <p
            aria-live="polite"
            className={`${styles.message} ${
              state === "error" || state === "fallback" ? styles.warning : ""
            }`}
          >
            {message ||
              "Le prix évolue immédiatement avec vos choix. Aucun débit à cette étape."}
          </p>
          {preview ? (
            <div className={styles.serverProof}>
              <span>VALIDÉ PAR LE SERVEUR</span>
              <strong>{preview.scope_fingerprint.slice(0, 18)}…</strong>
              <dl>
                <div><dt>Contextes</dt><dd>{preview.context_count}</dd></div>
                <div>
                  <dt>Traitement</dt>
                  <dd>
                    {preview.technical_estimate.quote_required
                      ? "Renforcé"
                      : "Standard"}
                  </dd>
                </div>
              </dl>
              <button
                className={styles.checkoutButton}
                disabled={state === "checkout"}
                onClick={startCheckout}
                type="button"
              >
                {state === "checkout"
                  ? "Ouverture de Stripe…"
                  : "Continuer vers Stripe →"}
              </button>
            </div>
          ) : null}
        </aside>
      </form>

      <footer className={styles.footer}>
        <span>STRATVERITY · LA PREUVE AVANT LA PROMESSE</span>
        <p>
          Aucun rendement futur garanti. Cette page configure un périmètre de
          test, pas un conseil d’investissement.
        </p>
      </footer>
    </main>
  );
}
