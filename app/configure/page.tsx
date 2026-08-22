"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import styles from "./scope-configurator.module.css";
import { calculatePrice } from "./pricing";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale, MessageKey } from "../i18n/messages";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";
const SHOW_TEST_BANNER =
  process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === "true";

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
const CHECKOUT_CONTRACT = {
  version: "beta-fr-2026-08-12-v1",
  language: "fr",
  digest: "c6500f4c391351fb245d3c1c445e77c91f866d70b9d1a121b7b334e8b2e95c7c",
  rights_profile: "AUDIT_BETA_NO_MARKETPLACE_RESALE",
  accepted: true,
  immediate_performance_requested: true,
  withdrawal_acknowledged: true,
} as const;

type Product = "AUDIT" | "SCAN";
type AuditDepth = "ESSENTIAL" | "STANDARD" | "ROBUSTNESS" | "CUSTOM";
type EvaluationMode = "BAR_CLOSE" | "INTRABAR";
type SubmissionState =
  | "idle"
  | "submitting"
  | "checkout"
  | "success"
  | "fallback"
  | "error";

type UiNotice =
  | { key: MessageKey; values?: Record<string, string | number> }
  | null;

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

function formatBytes(value: number, locale: Locale): string {
  if (value < 1024) return `${new Intl.NumberFormat(locale).format(value)} B`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1024)} KiB`;
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
  const { locale, t } = useI18n();
  const [product, setProduct] = useState<Product>("AUDIT");
  const [strategies, setStrategies] = useState<StrategyVersion[]>([]);
  const [assets, setAssets] = useState<string[]>(["BINANCE:BTCUSDT"]);
  const [timeframes, setTimeframes] = useState<string[]>(["15m"]);
  const [assetDraft, setAssetDraft] = useState("");
  const [auditDepth, setAuditDepth] = useState<AuditDepth>("ESSENTIAL");
  const [evaluationMode, setEvaluationMode] =
    useState<EvaluationMode>("BAR_CLOSE");
  const [retentionDays, setRetentionDays] = useState("30");
  const [state, setState] = useState<SubmissionState>("idle");
  const [notice, setNotice] = useState<UiNotice>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [contractAccepted, setContractAccepted] = useState(false);
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
  const formatLocalizedPrice = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  const message = notice
    ? t(notice.key, notice.values)
    : "";
  const translatePriceLine = (label: string) => {
    if (label.startsWith("Audit essentiel")) return t("configure.priceLine.auditEssential");
    if (label.startsWith("Audit standard")) return t("configure.priceLine.auditBase");
    if (label.startsWith("Tests de robustesse")) return t("configure.priceLine.robustness");
    if (label.startsWith("Revue humaine")) {
      return t("configure.priceLine.humanReview", { count: projectedStrategyCount });
    }
    if (label.startsWith("Scan live")) return t("configure.priceLine.scanBase");
    if (label.startsWith("Traitement intrabar")) return t("configure.priceLine.intrabar");
    if (label.startsWith("Conservation")) {
      return t("configure.priceLine.retention", { days: retentionDays });
    }
    return label;
  };

  const buildPayload = () => {
    const auditOptions =
      auditDepth === "ESSENTIAL"
        ? {
            depth: "ESSENTIAL",
            historical_windows: 1,
            stress_scenarios: 1,
            parameter_variants: 1,
            human_review: false,
          }
        : auditDepth === "STANDARD"
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

  const promoteEssentialForScope = (nextContextCount: number) => {
    if (product === "AUDIT" && auditDepth === "ESSENTIAL" && nextContextCount > 1) {
      setAuditDepth("STANDARD");
    }
  };

  const chooseStrategies = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    if (strategies.length + files.length > MAX_STRATEGIES) {
      setState("error");
      setNotice({ key: "configure.msg.maxStrategies", values: { count: MAX_STRATEGIES } });
      return;
    }
    setState("submitting");
    setNotice({ key: "configure.msg.hashing" });
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
      const seen = new Set(strategies.map((strategy) => strategy.sha256));
      const unique = hashed.filter((strategy) => {
        if (seen.has(strategy.sha256)) return false;
        seen.add(strategy.sha256);
        return true;
      });
      const nextStrategies = [...strategies, ...unique];
      setStrategies(nextStrategies);
      promoteEssentialForScope(nextStrategies.length * assets.length * timeframes.length);
      setState("idle");
      setNotice(null);
      setPreview(null);
    } catch {
      setState("error");
      setNotice({ key: "configure.msg.hashFailed" });
    }
  };

  const toggleAsset = (asset: string) => {
    setPreview(null);
    const nextAssetCount = assets.includes(asset)
      ? Math.max(1, assets.length - 1)
      : Math.min(MAX_ASSETS, assets.length + 1);
    promoteEssentialForScope(projectedStrategyCount * nextAssetCount * timeframes.length);
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
      setNotice({ key: "configure.msg.invalidSymbol" });
      return;
    }
    if (!assets.includes(asset) && assets.length < MAX_ASSETS) {
      setAssets((current) => [...current, asset]);
      promoteEssentialForScope(
        projectedStrategyCount * (assets.length + 1) * timeframes.length,
      );
    }
    setAssetDraft("");
    setPreview(null);
    setState("idle");
    setNotice(null);
  };

  const toggleTimeframe = (timeframe: string) => {
    setPreview(null);
    const nextTimeframeCount = timeframes.includes(timeframe)
      ? Math.max(1, timeframes.length - 1)
      : timeframes.length + 1;
    promoteEssentialForScope(projectedStrategyCount * assets.length * nextTimeframeCount);
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
      setNotice({ key: "configure.msg.addFile" });
      return;
    }
    if (contextCount > MAX_CONTEXTS) {
      setState("error");
      setNotice({ key: "configure.msg.tooLarge" });
      return;
    }
    const payload = buildPayload();
    const requestBytes = new TextEncoder().encode(
      JSON.stringify(payload),
    ).byteLength;
    if (requestBytes > REQUEST_LIMIT_BYTES) {
      setState("error");
      setNotice({ key: "configure.msg.tooLarge" });
      return;
    }

    setState("submitting");
    setNotice({ key: "configure.msg.validatingScope" });
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
        setPreview(null);
        setState(response.status === 404 || response.status >= 500 ? "fallback" : "error");
        setNotice(
          response.status === 404 || response.status >= 500
            ? { key: "configure.msg.apiFallback" }
            : { key: "configure.msg.scopeFailed" },
        );
        return;
      }
      setPreview(result);
      setState("success");
      setNotice({ key: "configure.msg.scopeConfirmed" });
    } catch {
      setPreview(null);
      setState("fallback");
      setNotice({ key: "configure.msg.apiFallback" });
    }
  };

  const startCheckout = async () => {
    if (!preview || strategies.length === 0) return;
    if (product === "SCAN") {
      setState("error");
      setNotice({ key: "configure.msg.scanUnavailable" });
      return;
    }
    if (!contractAccepted) {
      setState("error");
      setNotice({ key: "configure.msg.acceptContract" });
      return;
    }
    const scope = buildPayload();
    const pricedRequest = {
      pricing_version: "launch-v0.2",
      scope,
      contract_acceptance: CHECKOUT_CONTRACT,
    };
    setState("checkout");
    setNotice({ key: "configure.msg.preparingPayment" });
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
        setNotice({ key: "configure.msg.tooLarge" });
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
        setNotice(
          billingUnavailable
            ? { key: "configure.msg.billingUnavailable" }
            : { key: "configure.msg.paymentFailed" },
        );
        return;
      }
      if (!isStripeCheckoutUrl(result.checkout_url)) {
        setState("error");
        setNotice({ key: "configure.msg.invalidStripe" });
        return;
      }
      sessionStorage.setItem(
        `stratverity.order-owner:${result.checkout_session_id}`,
        ownerToken,
      );
      window.location.assign(result.checkout_url);
    } catch {
      setState("error");
      setNotice({ key: "configure.msg.paymentUnavailable" });
    }
  };

  return (
    <main className={styles.page}>
      {SHOW_TEST_BANNER ? (
        <div className={styles.betaBanner}>
          {t("configure.betaBanner")}
        </div>
      ) : null}

      <section className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>{t("configure.eyebrow")}</span>
          <h1>
            {t("configure.titlePrimary")}
            <em>{t("configure.titleAccent")}</em>
          </h1>
          <p>{t("configure.intro")}</p>
        </div>
        <aside className={styles.privacyNote} data-premium-surface>
          <span aria-hidden="true">01</span>
          <strong>{t("configure.localFilesTitle")}</strong>
          <p>{t("configure.localFilesBody")}</p>
        </aside>
      </section>

      <form className={styles.workspace} onSubmit={submitPreview}>
        <div className={styles.builder}>
          <fieldset className={styles.block} data-premium-surface>
            <legend><span>01</span>{t("configure.step.service")}</legend>
            <div className={styles.productChoices}>
              {(["AUDIT", "SCAN"] as Product[]).map((choice) => (
                <button
                  aria-pressed={product === choice}
                  className={product === choice ? styles.selectedCard : ""}
                  key={choice}
                  onClick={() => {
                    setProduct(choice);
                    if (choice === "AUDIT" && auditDepth === "ESSENTIAL" && contextCount > 1) {
                      setAuditDepth("STANDARD");
                    }
                    setPreview(null);
                  }}
                  type="button"
                >
                  <small>{choice === "AUDIT" ? t("configure.kind.oneTime") : t("configure.kind.recurring")}</small>
                  <strong>{choice === "AUDIT" ? t("configure.audit") : t("configure.scanLive")}</strong>
                  <p>
                    {choice === "AUDIT"
                      ? t("configure.auditDescription")
                      : t("configure.scanDescription")}
                  </p>
                  {choice === "SCAN" ? <em>{t("configure.invitationSoon")}</em> : null}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.block} data-premium-surface>
            <legend><span>02</span>{t("configure.step.strategies")}</legend>
            <label className={styles.filePicker}>
              <input
                accept=".pine,.py,.ipynb,.zip,text/plain,application/zip"
                multiple
                onChange={chooseStrategies}
                type="file"
              />
              <span aria-hidden="true">＋</span>
              <strong>{t("configure.chooseFiles")}</strong>
              <small>{t("configure.fileHelp")}</small>
            </label>
            {strategies.length > 0 ? (
              <ul className={styles.strategyList}>
                {strategies.map((strategy, index) => (
                  <li key={strategy.sha256}>
                    <span>0{index + 1}</span>
                    <div>
                      <strong>{strategy.name}</strong>
                      <small>
                        {formatBytes(strategy.size, locale)} · SHA{" "}
                        {strategy.sha256.slice(0, 12)}…
                      </small>
                    </div>
                    <button
                      aria-label={t("configure.removeStrategy", { name: strategy.name })}
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
                {t("configure.initialEstimate")}
              </p>
            )}
          </fieldset>

          <fieldset className={styles.block} data-premium-surface>
            <legend><span>03</span>{t("configure.step.assets")}</legend>
            <div className={styles.chips}>
              {ASSET_PRESETS.map((asset) => (
                <button
                  aria-pressed={assets.includes(asset)}
                  className={assets.includes(asset) ? styles.activeChip : ""}
                  key={asset}
                  onClick={() => toggleAsset(asset)}
                  type="button"
                >
                  <span className={styles.assetIcon} data-asset={asset.replace(/^.*:/, "")} aria-hidden="true">
                    {asset === "BINANCE:BTCUSDT" ? "₿" : asset === "BINANCE:ETHUSDT" ? "◆" : asset === "OANDA:EURUSD" ? "€$" : asset === "OANDA:XAUUSD" ? "Au" : asset === "SP:SPX" ? "S&P" : "N"}
                  </span>
                  <span className={styles.assetLabel}>
                    <strong>{asset.replace(/^.*:/, "")}</strong>
                    <small>{asset.split(":")[0]}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.customAsset}>
              <label htmlFor="custom-asset">{t("configure.customSymbol")}</label>
              <div>
                <input
                  id="custom-asset"
                  onChange={(event) => setAssetDraft(event.target.value)}
                  placeholder="EXCHANGE:SYMBOL"
                  value={assetDraft}
                />
                <button onClick={addAsset} type="button">{t("configure.add")}</button>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.block} data-premium-surface>
            <legend><span>04</span>{t("configure.step.timeframes")}</legend>
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

          <fieldset className={styles.block} data-premium-surface>
            <legend><span>05</span>{t("configure.step.depth")}</legend>
            {product === "AUDIT" ? (
              <div className={styles.optionGrid}>
                {(["ESSENTIAL", "STANDARD", "ROBUSTNESS", "CUSTOM"] as AuditDepth[]).map(
                  (depth) => (
                    <button
                      aria-pressed={auditDepth === depth}
                      className={auditDepth === depth ? styles.activeOption : ""}
                      disabled={depth === "ESSENTIAL" && contextCount > 1}
                      key={depth}
                      onClick={() => {
                        setAuditDepth(depth);
                        setPreview(null);
                      }}
                      type="button"
                    >
                      <strong>
                        {depth === "ESSENTIAL"
                          ? t("configure.depth.essential")
                          : depth === "STANDARD"
                            ? t("configure.depth.standard")
                          : depth === "ROBUSTNESS"
                            ? t("configure.depth.robustness")
                            : t("configure.depth.custom")}
                      </strong>
                      <small>
                        {depth === "ESSENTIAL"
                          ? t("configure.depth.essentialHelp")
                          : depth === "STANDARD"
                            ? t("configure.depth.standardHelp")
                          : depth === "ROBUSTNESS"
                            ? t("configure.depth.robustnessHelp")
                            : t("configure.depth.customHelp")}
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
                            ? t("configure.barClose")
                            : t("configure.intrabar")}
                        </strong>
                        <small>
                          {evaluation === "BAR_CLOSE"
                            ? t("configure.recommended")
                            : t("configure.enhancedCompute")}
                        </small>
                      </button>
                    ),
                  )}
                </div>
                <label>
                  {t("configure.retention")}
                  <select
                    onChange={(event) => {
                      setRetentionDays(event.target.value);
                      setPreview(null);
                    }}
                    value={retentionDays}
                  >
                    <option value="30">{t("configure.days30")}</option>
                    <option value="90">{t("configure.days90")}</option>
                    <option value="365">{t("configure.oneYear")}</option>
                  </select>
                </label>
              </div>
            )}
          </fieldset>
        </div>

        <aside className={styles.summary} data-premium-surface>
          <div className={styles.summaryHead}>
            <span>{t("configure.currentScope")}</span>
            <strong>{offerFamily}</strong>
          </div>
          <div className={styles.contextNumber}>
            <strong>{contextCount.toLocaleString(locale)}</strong>
            <span>{t(contextCount === 1 ? "configure.context.one" : "configure.context.other")}</span>
          </div>
          <p className={styles.formula}>
            {t("configure.formula", {
              strategies: projectedStrategyCount.toLocaleString(locale),
              assets: assets.length.toLocaleString(locale),
              timeframes: timeframes.length.toLocaleString(locale),
            })}
          </p>
          <div className={styles.livePrice}>
            <span>{t("configure.launchPrice")}</span>
            <strong>
              {formatLocalizedPrice(price.totalCents)}
              <small>
                {price.cadence === "MONTHLY" ? t("configure.perMonth") : t("configure.totalSuffix")}
              </small>
            </strong>
            <p>{t("configure.vatExempt")}</p>
            {product === "AUDIT" && auditDepth === "ESSENTIAL" ? (
              <p>{t("configure.essentialCredit")}</p>
            ) : null}
            {price.cadence === "MONTHLY" ? (
              <div>
                <b>{t("configure.firstPayment", { amount: formatLocalizedPrice(price.dueTodayCents) })}</b>
                <small>
                  {t("configure.activationIncluded", {
                    amount: formatLocalizedPrice(
                      price.activationExVatCents + price.activationVatCents,
                    ),
                  })}
                </small>
              </div>
            ) : (
              <div>
                {t("configure.oneTimePayment")} · <b>{t("configure.noRenewal")}</b>
              </div>
            )}
          </div>
          <details className={styles.priceBreakdown}>
            <summary>{t("configure.priceBreakdown")}</summary>
            <dl>
              {price.lines.map((line) => (
                <div key={line.label}>
                  <dt>{translatePriceLine(line.label)}</dt>
                  <dd>
                    {formatLocalizedPrice(line.amountExVatCents)}
                    {line.cadence === "MONTHLY" ? t("configure.perMonth") : ""}
                  </dd>
                </div>
              ))}
              <div>
                <dt>{t("configure.vat")}</dt>
                <dd>{formatLocalizedPrice(price.vatCents)}</dd>
              </div>
            </dl>
            <p>
              {t("configure.taxNote")}
            </p>
          </details>
          <dl className={styles.metrics}>
            <div>
              <dt>{t("configure.service")}</dt>
              <dd>{product === "AUDIT" ? t("configure.auditOneTime") : t("configure.scanRecurring")}</dd>
            </div>
            <div>
              <dt>{t("configure.requestEstimate")}</dt>
              <dd>
                {estimatedRequestBytes
                  ? formatBytes(estimatedRequestBytes, locale)
                  : t("configure.afterFile")}
              </dd>
            </div>
            <div><dt>{t("configure.apiLimit")}</dt><dd>2 MiB</dd></div>
            <div>
              <dt>{t("configure.pricing")}</dt>
              <dd>{t("configure.automaticNoQuote")}</dd>
            </div>
          </dl>
          <div className={styles.limitTrack} aria-label={t("configure.limitUsage")}>
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
              {state === "submitting" ? t("configure.validating") : t("configure.confirmPrice")}
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
              t("configure.defaultMessage")}
          </p>
          {preview ? (
            <div className={styles.serverProof}>
              <span>{t("configure.serverValidated")}</span>
              <strong>{preview.scope_fingerprint.slice(0, 18)}…</strong>
              <dl>
                <div><dt>{t("configure.contexts")}</dt><dd>{preview.context_count.toLocaleString(locale)}</dd></div>
                <div>
                  <dt>{t("configure.processing")}</dt>
                  <dd>
                    {preview.technical_estimate.quote_required
                      ? t("configure.enhanced")
                      : t("configure.depth.standard")}
                  </dd>
                </div>
              </dl>
              <label className={styles.contractAcceptance}>
                <input
                  checked={contractAccepted}
                  onChange={(event) => setContractAccepted(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  {t("configure.contract.beforeTerms")} <Link href="/legal/terms">{t("common.conditions")}</Link>,{" "}
                  {t("configure.contract.beforePrivacy")} <Link href="/legal/privacy">{t("common.privacy")}</Link>{" "}
                  {t("configure.contract.beforeLicense")} <Link href="/legal/content-license">{t("common.contentLicense")}</Link>
                  {t("configure.contract.afterLinks")}
                </span>
              </label>
              <button
                className={styles.checkoutButton}
                disabled={
                  state === "checkout" ||
                  product === "SCAN" ||
                  !contractAccepted
                }
                onClick={startCheckout}
                type="button"
              >
                {state === "checkout"
                  ? t("configure.openingStripe")
                  : product === "SCAN"
                    ? t("configure.scanInvitation")
                    : t("configure.continueStripe")}
              </button>
            </div>
          ) : null}
        </aside>
      </form>

      <footer className={styles.footer}>
        <span>{t("configure.footerTag")}</span>
        <p>
          {t("configure.disclaimer")} ·{" "}
          <Link href="/legal/terms">{t("common.conditions")}</Link> ·{" "}
          <Link href="/legal/privacy">{t("common.privacy")}</Link> ·{" "}
          <Link href="/legal/risk">{t("common.risks")}</Link>
        </p>
      </footer>
    </main>
  );
}
