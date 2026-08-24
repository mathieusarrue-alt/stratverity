"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import styles from "./scope-configurator.module.css";
import { getSupabaseBrowserClient } from "../supabase/browser";
import { calculatePrice } from "./pricing";
import {
  MARKET_CATALOG,
  MARKET_ASSET_IDS,
  timeframesForAssets,
} from "../config/market-catalog";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale, MessageKey } from "../i18n/messages";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";

const MAX_STRATEGIES = 10;
const MAX_ASSETS = MARKET_ASSET_IDS.length;
const STRATEGY_EXTENSIONS = new Set([
  ".pine",
  ".py",
  ".ipynb",
  ".zip",
]);
const STRATEGY_ACCEPT =
  ".pine,.py,.ipynb,.zip,application/zip,text/x-python";
// MQL (MetaTrader) : pas encore de rejeu labo -> ce format n'est pas facturé.
const LAB_MQL_ENABLED = false;
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
  file: File;
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

async function sessionEmail(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await getSupabaseBrowserClient().auth.getSession();
    const email = session?.user?.email;
    return typeof email === "string" && email ? email : null;
  } catch {
    return null;
  }
}

function formatBytes(value: number, locale: Locale): string {
  if (value < 1024) return `${new Intl.NumberFormat(locale).format(value)} B`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1024)} KiB`;
}

function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function isAllowedStrategyFile(file: File): boolean {
  return STRATEGY_EXTENSIONS.has(fileExtension(file.name));
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function uploadStrategySource(params: {
  apiUrl: string;
  attemptId: string;
  ownerToken: string;
  file: File;
  sha256: string;
  strategyVersionId: string;
  email?: string | null;
}): Promise<
  | { ok: true; sha256: string }
  | { ok: false; status: number; code?: string }
> {
  const body = new FormData();
  body.set("attempt_id", params.attemptId);
  body.set("checkout_attempt_id", params.attemptId);
  body.set("owner_token", params.ownerToken);
  body.set("artifact_role", "STRATEGY_SOURCE");
  body.set("strategy_version_id", params.strategyVersionId);
  body.set("expected_sha256", params.sha256);
  if (params.email) body.set("email", params.email);
  body.set("source", params.file, params.file.name);
  let response: Response;
  try {
    response = await fetch(`${params.apiUrl}/v1/checkout-artifacts`, {
      method: "POST",
      body,
    });
  } catch {
    return { ok: false, status: 0, code: "NETWORK_OR_CORS" };
  }
  let payload: {
    sha256?: string;
    detail?: { code?: string; message?: string } | string;
  } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    /* plain 500 body */
  }
  if (!response.ok) {
    const detail = typeof payload.detail === "object" ? payload.detail : undefined;
    return {
      ok: false,
      status: response.status,
      code:
        detail?.code ||
        (response.status >= 500 ? "SERVER_ERROR" : "UPLOAD_FAILED"),
    };
  }
  return { ok: true, sha256: payload.sha256 || params.sha256 };
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
  const [assets, setAssets] = useState<string[]>(["BTCUSDT"]);
  const [timeframes, setTimeframes] = useState<string[]>(["15m"]);
  const [auditDepth, setAuditDepth] = useState<AuditDepth>("ESSENTIAL");
  const [evaluationMode, setEvaluationMode] =
    useState<EvaluationMode>("BAR_CLOSE");
  const [retentionDays, setRetentionDays] = useState("30");
  const [state, setState] = useState<SubmissionState>("idle");
  const [notice, setNotice] = useState<UiNotice>(null);
  const [fileError, setFileError] = useState("");
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
  const message = fileError
    ? fileError
    : notice
      ? t(notice.key, notice.values)
      : "";

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
                human_review: false,
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

  const promoteEssentialForScope = (nextContextCount: number) => {
    if (product === "AUDIT" && auditDepth === "ESSENTIAL" && nextContextCount > 1) {
      setAuditDepth("STANDARD");
    }
  };

  const chooseStrategies = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    const rejected = files.filter((file) => !isAllowedStrategyFile(file));
    if (rejected.length > 0) {
      const hasMql = rejected.some((f) => {
        const ext = fileExtension(f.name);
        return ext === ".mq4" || ext === ".mq5";
      });
      setState("error");
      setNotice(null);
      if (hasMql) {
        setFileError(
          locale === "fr"
            ? "Le rejeu labo pour MQL (MetaTrader) n'est pas encore disponible. Aucun paiement n'est proposé pour ce format. Pine et Python sont acceptés."
            : "Lab replay for MQL (MetaTrader) is not available yet. Checkout is disabled for this format. Pine and Python are accepted.",
        );
      } else {
        setFileError(
          locale === "fr"
            ? `Fichier non accepté : ${rejected.map((f) => f.name).join(", ")}.`
            : `Unsupported file: ${rejected.map((f) => f.name).join(", ")}.`,
        );
      }
      return;
    }
    if (strategies.length + files.length > MAX_STRATEGIES) {
      setState("error");
      setNotice({
        key: "configure.msg.maxStrategies",
        values: { count: MAX_STRATEGIES },
      });
      return;
    }
    setState("submitting");
    setFileError("");
    setNotice({ key: "configure.msg.hashing" });
    try {
      const offset = strategies.length;
      const hashed = await Promise.all(
        files.map(async (file, index) => {
          const digest = await sha256(file);
          // Python (labo v1) : font bloqué si import non-stdlib hors périmètre.
          if (fileExtension(file.name) === ".py") {
            const src = await file.text();
            if (
              /^\s*(import|from)\s+(numpy|pandas|talib|sklearn)\b/m.test(src)
            ) {
              setState("error");
              setFileError(
                locale === "fr"
                  ? "Fichier .py avec dépendance non-stdlib (numpy/pandas/talib). Python labo v1 accepte stdlib uniquement."
                  : ".py with non-stdlib dependency (numpy/pandas/talib). LAB_PYTHON v1 accepts stdlib only.",
              );
              return;
            }
          }
          return {
            id: `strategy-${offset + index + 1}-${digest.slice(0, 12)}`,
            name: file.name,
            sha256: digest,
            size: file.size,
            file,
          };
        }),
      );
      const seen = new Set(strategies.map((s) => s.sha256));
      const unique = hashed.filter((s): s is NonNullable<typeof s> => {
        if (!s) return false;
        if (seen.has(s.sha256)) return false;
        seen.add(s.sha256);
        return true;
      });
      const next = [...strategies, ...unique];
      setStrategies(next);
      promoteEssentialForScope(next.length * assets.length * timeframes.length);
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
    setAssets((current) => {
      const next = current.includes(asset)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== asset)
        : current.length >= MAX_ASSETS
          ? current
          : [...current, asset];
      const allowed = timeframesForAssets(next);
      setTimeframes((tfs) => {
        const kept = tfs.filter((t) => allowed.includes(t));
        return kept.length ? kept : allowed.slice(0, 1);
      });
      promoteEssentialForScope(
        projectedStrategyCount * next.length * timeframes.length,
      );
      return next;
    });
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
      setNotice({ key: "configure.msg.addFile" });
      return;
    }
    const payload = buildPayload();
    setState("submitting");
    setFileError("");
    setNotice({ key: "configure.msg.validatingScope" });
    try {
      const response = await fetch(`${API_URL}/v1/service-scopes/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as PreviewResponse;
      if (!response.ok) {
        setPreview(null);
        setState(response.status >= 500 ? "fallback" : "error");
        setNotice({
          key:
            response.status >= 500
              ? "configure.msg.apiFallback"
              : "configure.msg.scopeFailed",
        });
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
    // Email de session requis (source avant Stripe, livraison rapport).
    const email = await sessionEmail();
    if (!email) {
      setState("error");
      setNotice({ key: "configure.msg.emailMissing" });
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
      if (!checkoutAttemptRef.current?.idempotencyKey) {
        checkoutAttemptRef.current = {
          scopeHash,
          idempotencyKey: `checkout-${crypto.randomUUID().replaceAll("-", "")}`,
          ownerToken: createOwnerToken(),
        };
      }
      const idempotencyKey = checkoutAttemptRef.current.idempotencyKey;
      const ownerToken = checkoutAttemptRef.current.ownerToken;

      for (const strategy of strategies) {
        if (!strategy.file) {
          setState("error");
          setNotice(null);
          setFileError(
            locale === "fr"
              ? "Fichier source manquant. Re-sélectionnez votre stratégie."
              : "Source file missing. Re-select your strategy.",
          );
          return;
        }
        const uploaded = await uploadStrategySource({
          apiUrl: API_URL,
          attemptId: idempotencyKey,
          ownerToken,
          file: strategy.file,
          sha256: strategy.sha256,
          strategyVersionId: strategy.id,
          email,
        });
        if (!uploaded.ok) {
          setState("error");
          setNotice(null);
          const code = uploaded.code || String(uploaded.status);
          const hints: Record<string, { fr: string; en: string }> = {
            SOURCE_REQUIRED: {
              fr: "Le serveur n'a pas reçu le fichier source. Re-sélectionnez le .pine / .py / .mq4 / .mq5.",
              en: "Server did not receive the strategy file. Re-select your file.",
            },
            SERVER_ERROR: {
              fr: "Erreur serveur (500) au dépôt du code source. Aucun débit. L'API checkout-artifacts doit être corrigée.",
              en: "Server error (500) storing source. Nothing charged. Backend must fix checkout-artifacts.",
            },
            NETWORK_OR_CORS: {
              fr: "Impossible de joindre l'API de dépôt source (réseau/CORS). Réessayez.",
              en: "Could not reach source deposit API (network/CORS). Retry.",
            },
            CHECKOUT_ATTEMPT_REQUIRED: {
              fr: "Identifiant de tentative manquant. Rechargez la page.",
              en: "Checkout attempt id missing. Reload the page.",
            },
            STRATEGY_VERSION_REQUIRED: {
              fr: "Identifiant de stratégie manquant. Re-ajoutez le fichier.",
              en: "Strategy version id missing. Re-add the file.",
            },
          };
          const hint = hints[code];
          setFileError(
            hint
              ? locale === "fr"
                ? hint.fr
                : hint.en
              : locale === "fr"
                ? `Dépôt source échoué (${code}). Aucun débit.`
                : `Source deposit failed (${code}). Nothing charged.`,
          );
          return;
        }
      }

      const request = { ...pricedRequest, owner_token: ownerToken, email };
      const response = await fetch(`${API_URL}/v1/billing/checkout-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(request),
      });
      const result = (await response.json()) as CheckoutResponse & {
        detail?: { code?: string };
      };
      if (!response.ok) {
        setState("error");
        const code =
          typeof result.detail === "object" ? result.detail?.code : undefined;
        if (
          code === "BILLING_DISABLED" ||
          code === "STRIPE_SECRET_KEY_REQUIRED"
        ) {
          setNotice({ key: "configure.msg.billingUnavailable" });
        } else {
          setNotice(null);
          setFileError(
            locale === "fr"
              ? `Préparation paiement échouée (${code || response.status}). Aucun débit.`
              : `Payment setup failed (${code || response.status}). Nothing charged.`,
          );
        }
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
      <div className={styles.betaBanner}>{t("configure.betaBanner")}</div>
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
            <legend>
              <span>01</span>
              {t("configure.step.service")}
            </legend>
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
                  <small>
                    {choice === "AUDIT"
                      ? t("configure.kind.oneTime")
                      : t("configure.kind.recurring")}
                  </small>
                  <strong>
                    {choice === "AUDIT"
                      ? t("configure.audit")
                      : t("configure.scanLive")}
                  </strong>
                  <p>
                    {choice === "AUDIT"
                      ? t("configure.auditDescription")
                      : t("configure.scanDescription")}
                  </p>
                  {choice === "SCAN" ? (
                    <em>{t("configure.invitationSoon")}</em>
                  ) : null}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.block} data-premium-surface>
            <legend>
              <span>02</span>
              {t("configure.step.strategies")}
            </legend>
            <label className={styles.filePicker}>
              <input
                accept={STRATEGY_ACCEPT}
                multiple
                onChange={chooseStrategies}
                type="file"
              />
              <span aria-hidden="true">＋</span>
              <strong>{t("configure.chooseFiles")}</strong>
              <small>
                {locale === "fr"
                  ? "Pine · Python · MQL · ZIP · dépôt source avant paiement"
                  : "Pine · Python · MQL · ZIP · source before payment"}
              </small>
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
                      type="button"
                      onClick={() => {
                        setStrategies((c) =>
                          c.filter((i) => i.sha256 !== strategy.sha256),
                        );
                        setPreview(null);
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyLine}>{t("configure.initialEstimate")}</p>
            )}
          </fieldset>

          <fieldset className={styles.block} data-premium-surface>
            <legend>
              <span>03</span>
              {t("configure.step.assets")}
            </legend>
            <div className={styles.chips}>
              {MARKET_CATALOG.map((asset) => (
                <button
                  aria-pressed={assets.includes(asset.id)}
                  className={assets.includes(asset.id) ? styles.activeChip : ""}
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                  type="button"
                  title={asset.display}
                >
                  <span
                    className={styles.assetIcon}
                    data-asset={asset.id}
                    aria-hidden="true"
                  >
                    {asset.icon}
                  </span>
                  <span className={styles.assetLabel}>
                    <strong>{asset.id}</strong>
                    <small>{asset.class}</small>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.block} data-premium-surface>
            <legend>
              <span>04</span>
              {t("configure.step.timeframes")}
            </legend>
            <div className={styles.timeframes}>
              {timeframesForAssets(assets).map((timeframe) => (
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
            <legend>
              <span>05</span>
              {t("configure.step.depth")}
            </legend>
            {product === "AUDIT" ? (
              <div className={styles.optionGrid}>
                {(
                  ["ESSENTIAL", "STANDARD", "ROBUSTNESS", "CUSTOM"] as AuditDepth[]
                ).map((depth) => (
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
                ))}
              </div>
            ) : (
              <p className={styles.emptyLine}>{t("configure.invitationSoon")}</p>
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
            <span>
              {t(
                contextCount === 1
                  ? "configure.context.one"
                  : "configure.context.other",
              )}
            </span>
          </div>
          <div className={styles.livePrice}>
            <span>{t("configure.launchPrice")}</span>
            <strong>
              {formatLocalizedPrice(price.totalCents)}
              <small>{t("configure.totalSuffix")}</small>
            </strong>
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
              {state === "submitting"
                ? t("configure.validating")
                : t("configure.confirmPrice")}
            </span>
            <i aria-hidden="true">→</i>
          </button>
          <p
            aria-live="polite"
            className={`${styles.message} ${
              state === "error" || fileError ? styles.warning : ""
            }`}
          >
            {message || t("configure.defaultMessage")}
          </p>
          {preview ? (
            <div className={styles.serverProof}>
              <span>{t("configure.serverValidated")}</span>
              <strong>{preview.scope_fingerprint.slice(0, 18)}…</strong>
              <label className={styles.contractAcceptance}>
                <input
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  {t("configure.contract.beforeTerms")}{" "}
                  <Link href="/legal/terms">{t("common.conditions")}</Link>
                </span>
              </label>
              <button
                className={styles.checkoutButton}
                disabled={state === "checkout" || !contractAccepted}
                onClick={startCheckout}
                type="button"
              >
                {state === "checkout"
                  ? t("configure.openingStripe")
                  : t("configure.continueStripe")}
              </button>
            </div>
          ) : null}
        </aside>
      </form>
    </main>
  );
}
