"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FormEvent } from "react";
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

function scoreTone(score: number): "good" | "mid" | "bad" {
  if (score >= 80) return "good";
  if (score >= 50) return "mid";
  return "bad";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#00FF9D";
  if (score >= 50) return "#F5A524";
  return "#FF4D6A";
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const [display, setDisplay] = useState(score);
  const color = scoreColor(score);
  const tone = scoreTone(score);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // display reste à sa valeur initiale (score), pas d'animation.
    let frame = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(score * eased));
      if (p < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [score]);

  const gaugeStyle = {
    ["--gauge-color" as string]: color,
    ["--gauge-pct" as string]: `${display}%`,
  } as CSSProperties;

  return (
    <div className={`${styles.gauge} ${styles[`gauge_${tone}`]}`} style={gaugeStyle} role="img" aria-label={`Score ${score}/100`}>
      <div className={styles.gaugeRing} />
      <div className={styles.gaugeCore}>
        <span className={styles.scoreValue}>{display}</span>
        <span className={styles.scoreMax}>/100</span>
      </div>
    </div>
  );
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
    if (score >= 80) return t("health.excellent");
    if (score >= 50) return t("health.average");
    return t("health.review");
  };

  const pineBadge = useMemo(() => {
    if (language === "pinescript") return "Verified Pine Script · v5 ready";
    if (language === "python") return "Python strategy scan";
    if (language === "mql5") return "MQL5 Expert scan";
    return "MQL4 Expert scan";
  }, [language]);

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
          (body as { detail?: { message?: string } }).detail?.message ?? `HTTP ${resp.status}`,
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

  const shareText = (score: number) => t("health.shareText", { score });
  const shareUrl = (score: number) =>
    `https://www.stratverity.com/health-check?score=${score}`;

  const copyLink = async (score: number) => {
    try {
      await navigator.clipboard.writeText(shareUrl(score));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
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
    ctx.fillStyle = "#06110d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#eaf3ee";
    ctx.font = "bold 56px Inter, system-ui, sans-serif";
    ctx.fillText("StratVerity · Health-Check", 64, 110);
    ctx.font = "bold 200px Inter, system-ui, sans-serif";
    ctx.fillStyle = scoreColor(score);
    ctx.fillText(`${score}/100`, 64, 360);
    ctx.fillStyle = "#7b8f86";
    ctx.font = "32px Inter, system-ui, sans-serif";
    ctx.fillText("Free strategy scan — stratverity.com", 64, 520);
    const link = document.createElement("a");
    link.download = `stratverity-health-check-${score}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <Link href="/free-tools" className={styles.backLink}>
          ← {t("health.back")}
        </Link>
        <span className={styles.eyebrow}>{t("freeTools.eyebrow")}</span>
        <h1 className={styles.title}>{t("health.title")}</h1>
        <p className={styles.subtitle}>{t("health.subtitle")}</p>
        <span className={styles.langBadge}>{pineBadge}</span>
      </div>

      {FREE_ELIGIBILITY_ENABLED && !emailVerified && (
        <div className={styles.emailGate}>
          <label htmlFor="health-email">{t("health.email")}</label>
          <input
            id="health-email"
            type="email"
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
              <option key={key} value={key}>
                {label}
              </option>
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
        <div className={styles.errorBox} role="alert">
          <p>{error}</p>
        </div>
      )}

      {state === "done" && result && (
        <div className={styles.result}>
          <div className={styles.scoreSection}>
            <ScoreGauge score={result.score} />
            <div className={styles.verdictBlock}>
              <span
                className={styles.verdictBadge}
                style={{ borderColor: scoreColor(result.score), color: scoreColor(result.score) }}
              >
                {result.verdict}
              </span>
              <span className={styles.verifiedChip}>✓ {pineBadge}</span>
              <p className={styles.scoreLabel}>
                {t("health.score", { score: result.score, label: scoreLabel(result.score) })}
              </p>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className={styles.warnings}>
              <h2>{t("health.attention")}</h2>
              <ul>
                {result.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`} className={styles.warningCard}>
                    <span className={styles.warningIcon}>
                      <IconAlert />
                    </span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className={styles.lockedReport} aria-labelledby="locked-report-title">
            <div className={styles.lockedHeader}>
              <span>{t("health.lockedEyebrow")}</span>
              <span className={styles.lockedBadge}>🔒 {t("health.lockedBadge")}</span>
            </div>
            <h2 id="locked-report-title">{t("health.lockedTitle")}</h2>
            <p>{t("health.lockedBody")}</p>
            <div className={styles.lockedMetrics}>
              {(["health.lockedMetricFees", "health.lockedMetricWalkForward", "health.lockedMetricStability"] as const).map((key) => (
                <div className={styles.lockedMetric} key={key}>
                  <span>{t(key)}</span>
                  <span className={styles.lockedValue} aria-hidden="true" />
                </div>
              ))}
            </div>
            <Link href="/configure" className={styles.lockedCta}>
              {t("health.lockedCta")} <span aria-hidden="true">→</span>
            </Link>
          </section>

          <div className={styles.cta}>
            <p>{result.cta}</p>
            <Link href="/configure" className={styles.ctaButton}>
              {t("health.auditCta")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className={styles.shareBlock}>
            <h2>{t("health.shareTitle")}</h2>
            <p>{t("health.shareHint")}</p>
            <div className={styles.shareRow}>
              <button type="button" className={styles.shareBtn} onClick={() => openShare("whatsapp", result.score)}>
                <IconWhatsApp /> WhatsApp
              </button>
              <button type="button" className={styles.shareBtn} onClick={() => openShare("x", result.score)}>
                <IconX /> X
              </button>
              <button type="button" className={styles.shareBtn} onClick={() => copyLink(result.score)}>
                <IconCopy /> {copied ? t("health.shareCopied") : t("health.shareCopy")}
              </button>
              <button type="button" className={styles.shareBtn} onClick={() => downloadCard(result.score)}>
                <IconDownload /> {t("health.shareDownload")}
              </button>
            </div>
          </div>

          <div className={styles.diffCard}>
            <h2>{t("health.diffTitle")}</h2>
            <p>{t("health.diffBody")}</p>
            <Link href="/score" className={styles.diffLink}>
              {t("health.diffCta")}
            </Link>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p>{t("health.privacy")}</p>
      </div>
    </main>
  );
}