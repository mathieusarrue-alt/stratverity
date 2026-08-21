"use client";

import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./health-check.module.css";

const FREE_ELIGIBILITY_ENABLED =
  process.env.NEXT_PUBLIC_FREE_ELIGIBILITY_ENABLED === "true";

type Language = "pinescript" | "python" | "mql4" | "mql5";
type ScanState = "idle" | "scanning" | "done" | "error";
type HealthCheckResponse = {
  score: number;
  verdict: string;
  warnings: string[];
  details: Record<string, unknown>;
  cta: string;
};

const LANGUAGE_LABELS: Record<Language, string> = {
  pinescript: "Pine Script (.pine)",
  python: "Python (.py)",
  mql4: "MQL4 (.mq4)",
  mql5: "MQL5 (.mq5)",
};

const subscribeToUrl = () => () => {};

function scoreColor(score: number): string {
  if (score >= 75) return "var(--success-500)";
  if (score >= 50) return "var(--warning-500)";
  return "var(--danger-500)";
}

export default function HealthCheckPage() {
  const { t } = useI18n();
  const [language, setLanguage] = useState<Language>("pinescript");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const emailVerified = useSyncExternalStore(
    subscribeToUrl,
    () => new URLSearchParams(window.location.search).get("email") === "verified",
    () => false,
  );
  const [verificationSent, setVerificationSent] = useState(false);
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isReady = code.trim().length >= 10;
  const scoreLabel = (score: number) => {
    if (score >= 75) return t("health.excellent");
    if (score >= 50) return t("health.average");
    return t("health.review");
  };

  const requestEmailVerification = async () => {
    const session = await fetch("/api/eligibility/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!session.ok) throw new Error(t("health.unknownError"));
    const verification = await fetch("/api/eligibility/email/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!verification.ok) throw new Error(t("health.unknownError"));
    setVerificationSent(true);
    setState("idle");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) return;
    setState("scanning");
    setError("");
    setResult(null);

    if (FREE_ELIGIBILITY_ENABLED && !emailVerified) {
      try {
        await requestEmailVerification();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("health.unknownError"));
        setState("error");
      }
      return;
    }

    try {
      const resp = await fetch("/api/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!resp.ok) {
        if (resp.status === 403) throw new Error(t("health.notEligible"));
        const body = await resp.json().catch(() => ({}));
        throw new Error(
          (body as { detail?: { message?: string } }).detail?.message ??
            `HTTP ${resp.status}`,
        );
      }
      const data: HealthCheckResponse = await resp.json();
      setResult(data);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("health.unknownError"));
      setState("error");
    }
  };

  const shareText = (score: number) =>
    t("health.shareText", { score });

  const shareUrl = (score: number) =>
    `https://www.stratverity.com/health-check?score=${score}`;

  const copyLink = async (score: number) => {
    try {
      await navigator.clipboard.writeText(shareUrl(score));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponible (permissions) : ignorer silencieusement.
    }
  };

  const openShare = (network: "whatsapp" | "x", score: number) => {
    const text = encodeURIComponent(shareText(score));
    const url = encodeURIComponent(shareUrl(score));
    const target =
      network === "whatsapp"
        ? `https://wa.me/?text=${text}%20${url}`
        : `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const downloadCard = (score: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dark = "#06110d";
    const accent = scoreColor(score);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#eaf3ee";
    ctx.font = "bold 64px Inter, system-ui, sans-serif";
    ctx.fillText("StratVerity · Health-Check", 64, 120);
    ctx.font = "bold 200px Inter, system-ui, sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(`${score}/100`, 64, 360);
    ctx.fillStyle = "#7b8f86";
    ctx.font = "34px Inter, system-ui, sans-serif";
    ctx.fillText("Teste ta stratégie gratuitement — stratverity.com", 64, 520);
    const link = document.createElement("a");
    link.download = `stratverity-health-check-${score}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const shareStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  };
  const shareBtn: React.CSSProperties = {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid var(--line-2)",
    background: "var(--surface-2)",
    color: "var(--ink-1)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  };

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <Link
          href="/free-tools"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--ink-2)",
            textDecoration: "none",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {t("health.back")}
        </Link>
        <span className={styles.eyebrow}>{t("freeTools.eyebrow")}</span>
        <h1 className={styles.title}>{t("health.title")}</h1>
        <p className={styles.subtitle}>{t("health.subtitle")}</p>
      </div>

      {FREE_ELIGIBILITY_ENABLED && !emailVerified && (
        <div className={styles.emailGate}>
          <label htmlFor="health-email">{t("health.email")}</label>
          <input
            id="health-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("health.emailPlaceholder")}
            required
          />
          {verificationSent ? <p role="status">{t("health.verifySent")}</p> : null}
        </div>
      )}
      {FREE_ELIGIBILITY_ENABLED && emailVerified && (
        <p className={styles.verifiedNotice} role="status">
          {t("health.emailVerified")}
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.toolbar}>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className={styles.select}
            aria-label="Source language"
          >
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={
              !isReady ||
              state === "scanning" ||
              (FREE_ELIGIBILITY_ENABLED && !emailVerified && !email)
            }
            className={styles.scanButton}
          >
            {state === "scanning"
              ? t("health.scanning")
              : FREE_ELIGIBILITY_ENABLED && !emailVerified
                ? t("health.verify")
                : t("health.scan")}
          </button>
        </div>
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t("health.placeholder", { language: LANGUAGE_LABELS[language] })}
          className={styles.editor}
          rows={16}
          spellCheck={false}
        />
      </form>

      {state === "scanning" && (
        <div className={styles.loading} aria-live="polite">
          <div className={styles.spinner} />
          <p>{t("health.analyzing")}</p>
        </div>
      )}
      {state === "error" && (
        <div className={styles.errorBox} role="alert"><p>{error}</p></div>
      )}
      {state === "done" && result && (
        <div className={styles.result}>
          <div className={styles.scoreSection}>
            <div
              className={styles.gauge}
              style={{
                background: `conic-gradient(${scoreColor(result.score)} ${result.score}%, var(--surface-2) ${result.score}%)`,
              }}
            >
              <span className={styles.scoreValue}>{result.score}</span>
            </div>
            <div className={styles.verdictBlock}>
              <span
                className={styles.verdictBadge}
                style={{ borderColor: scoreColor(result.score), color: scoreColor(result.score) }}
              >
                {result.verdict}
              </span>
              <p className={styles.scoreLabel}>
                {t("health.score", { score: result.score, label: scoreLabel(result.score) })}
              </p>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className={styles.warnings}>
              <h2>{t("health.attention")}</h2>
              <ul>{result.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>
            </div>
          )}

          <div className={styles.cta}>
            <p>{result.cta}</p>
            <Link href="/configure" className="btn btn-primary">{t("health.auditCta")}</Link>
          </div>

          {/* Boucle virale : partage du score */}
          <div style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 20, margin: "0 0 6px" }}>{t("health.shareTitle")}</h2>
            <p style={{ color: "var(--ink-2)", fontSize: 14, margin: "0 0 4px" }}>
              {t("health.shareHint")}
            </p>
            <div style={shareStyle}>
              <button type="button" style={shareBtn} onClick={() => openShare("whatsapp", result.score)}>
                WhatsApp
              </button>
              <button type="button" style={shareBtn} onClick={() => openShare("x", result.score)}>
                X (Twitter)
              </button>
              <button type="button" style={shareBtn} onClick={() => copyLink(result.score)}>
                {copied ? t("health.shareCopied") : t("health.shareCopy")}
              </button>
              <button type="button" style={shareBtn} onClick={() => downloadCard(result.score)}>
                {t("health.shareDownload")}
              </button>
            </div>
          </div>

          {/* Différenciation Health-Check vs Robustness Score */}
          <div
            style={{
              marginTop: 28,
              padding: "18px 20px",
              borderRadius: 14,
              border: "1px solid var(--line-2)",
              background: "var(--surface-2)",
            }}
          >
            <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>{t("health.diffTitle")}</h2>
            <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>
              {t("health.diffBody")}
            </p>
            <Link href="/score" className="btn btn-ghost" style={{ justifyContent: "center" }}>
              {t("health.diffCta")}
            </Link>
          </div>
        </div>
      )}
      <div className={styles.footer}><p>{t("health.privacy")}</p></div>
    </main>
  );
}
