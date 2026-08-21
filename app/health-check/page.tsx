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

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
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
        </div>
      )}
      <div className={styles.footer}><p>{t("health.privacy")}</p></div>
    </main>
  );
}