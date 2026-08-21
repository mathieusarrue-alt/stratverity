"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../crash-test.module.css";
import { useCT } from "../i18n";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";

type Diagnostic = {
  label: string;
  status: string;
  severity: "success" | "warning" | "critical" | "info";
  detail: string;
};

type CrashTestReport = {
  audit_hash: string;
  language: string;
  symbol: string;
  timeframe: string;
  robustness_score: number;
  verdict: string;
  diagnostics: Diagnostic[];
  engine_version: string;
  generated_at: string;
};

type PageState = "loading" | "ready" | "error";

const SEVERITY_CLASS: Record<Diagnostic["severity"], string> = {
  success: "pillSuccess",
  warning: "pillWarning",
  critical: "pillCritical",
  info: "pillInfo",
};

export default function CrashTestVerifyPage() {
  const t = useCT();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [report, setReport] = useState<CrashTestReport | null>(null);
  const [message, setMessage] = useState("");

  const loadReport = useCallback(
    async (auditHash: string) => {
      try {
        const response = await fetch(
          `${API_URL}/v1/audit/crash-test/${auditHash}/report`,
        );
        const result = (await response.json()) as CrashTestReport & {
          detail?: { code?: string; message?: string };
        };
        if (response.ok) {
          setReport(result);
          setPageState("ready");
          return;
        }
        setPageState("error");
        setMessage(
          typeof result.detail === "object" && result.detail?.message
            ? result.detail.message
            : t("ct.verify.notFound"),
        );
      } catch {
        setPageState("error");
        setMessage(t("ct.verify.error"));
      }
    },
    [t],
  );

  useEffect(() => {
    const hash = new URLSearchParams(window.location.search).get("hash") ?? "";
    const timer = window.setTimeout(() => {
      if (!hash) {
        setPageState("error");
        setMessage(t("ct.verify.missingHash"));
        return;
      }
      void loadReport(hash);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReport, t]);

  if (pageState !== "ready" || !report) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <span className={styles.statusLine}>
            {pageState === "loading" ? (
              <span className={styles.statusLineDot} />
            ) : null}
            {message || t("ct.verify.loading")}
          </span>
          <Link href="/crash-test" className={styles.btnPrimary}>
            {t("ct.report.back")}
          </Link>
        </div>
      </main>
    );
  }

  const tone =
    report.robustness_score >= 70
      ? "verdictGreen"
      : report.robustness_score >= 40
        ? "verdictOrange"
        : "verdictRed";

  const scoreColor =
    report.robustness_score >= 70
      ? "var(--emerald-500)"
      : report.robustness_score >= 40
        ? "var(--amber-500)"
        : "var(--risk-500)";

  const ringRadius = 74;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - report.robustness_score / 100);

  return (
    <main className={`${styles.page} ${styles.reportPage}`}>
      <article className={styles.reportCard}>
        <header className={styles.reportHeader}>
          <div>
            <span className={styles.reportHeaderBadge}>
              {t("ct.verify.badge")}
            </span>
            <h1>{t("ct.verify.title")}</h1>
            <p>
              {report.language === "pinescript" ? "Pine Script" : "Python"} ·{" "}
              {report.symbol} · {report.timeframe}
            </p>
          </div>
          <div className={styles.reportMeta}>
            <div>{t("ct.report.engine")} : {report.engine_version}</div>
            <div>
              {t("ct.report.generated")} :{" "}
              {new Date(report.generated_at).toLocaleString("fr-FR")}
            </div>
            <div>audit_hash : {report.audit_hash}</div>
          </div>
        </header>

        <section className={styles.scoreSection}>
          <div className={styles.gauge}>
            <div className={styles.gaugeRing}>
              <svg viewBox="0 0 170 170">
                <circle
                  cx="85"
                  cy="85"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="12"
                />
                <circle
                  cx="85"
                  cy="85"
                  r={ringRadius}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className={styles.gaugeValue}>
                <strong>{report.robustness_score}</strong>
                <small>/ 100</small>
              </div>
            </div>
            <span className={`${styles.verdict} ${styles[tone]}`}>
              {report.verdict}
            </span>
          </div>

          <div className={styles.diagnostics}>
            {report.diagnostics.map((diag) => (
              <div className={styles.diagnostic} key={diag.label}>
                <header>
                  <strong>{diag.label}</strong>
                  <span
                    className={`${styles.pill} ${styles[SEVERITY_CLASS[diag.severity]]}`}
                  >
                    {diag.status}
                  </span>
                </header>
                <p>{diag.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.certBar}>
          <div className={styles.certHash}>
            <b>{t("ct.report.certTitle")}</b>
            <div>{t("ct.verify.certBody")}</div>
          </div>
          <div className={styles.actions}>
            <Link href="/crash-test" className={styles.btnPrimary}>
              {t("ct.verify.cta")}
            </Link>
          </div>
        </div>

        {/* Export de badge embarquable (backlink + vitrine) */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>
            {t("ct.verify.badgeExportTitle")}
          </h2>
          <p style={{ color: "var(--ink-2)", fontSize: 14, margin: "0 0 12px" }}>
            {t("ct.verify.badgeExportBody")}
          </p>
          {/* Aperçu du badge */}
          {/* eslint-disable-next-line @next/next/no-img-element -- badge SVG embarquable (non optimisé, volontairement <img> pour le copy-paste HTML du vendeur) */}
          <img
            src={`/api/badge/${report.audit_hash}?score=${report.robustness_score}&label=Verified%20by%20StratVerity`}
            alt="Badge Verified by StratVerity"
            width={280}
            height={70}
            style={{ display: "block", marginBottom: 16 }}
          />
          <ExportBadge
            auditHash={report.audit_hash}
            score={report.robustness_score}
          />
        </div>
      </article>
    </main>
  );
}

function ExportBadge({ auditHash, score }: { auditHash: string; score: number }) {
  const badgeUrl = `https://www.stratverity.com/api/badge/${auditHash}?score=${score}&label=Verified%20by%20StratVerity`;
  const verifyUrl = `https://www.stratverity.com/crash-test/verify?hash=${auditHash}`;
  const htmlSnippet = `<a href="${verifyUrl}"><img src="${badgeUrl}" alt="Verified by StratVerity ${score}/100" width="280" height="70" /></a>`;
  const markdownSnippet = `[![Verified by StratVerity ${score}/100](${badgeUrl})](${verifyUrl})`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard indisponible : ignorer */
    }
  };

  const btnStyle: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid var(--line-2)",
    background: "var(--surface-2)",
    color: "var(--ink-1)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
          HTML (vitrine)
        </div>
        <pre
          style={{
            background: "var(--surface-2)",
            padding: 10,
            borderRadius: 8,
            fontSize: 12,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          <code>{htmlSnippet}</code>
        </pre>
        <button type="button" style={btnStyle} onClick={() => copy(htmlSnippet)}>
          Copier HTML
        </button>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
          Markdown (README GitHub)
        </div>
        <pre
          style={{
            background: "var(--surface-2)",
            padding: 10,
            borderRadius: 8,
            fontSize: 12,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          <code>{markdownSnippet}</code>
        </pre>
        <button type="button" style={btnStyle} onClick={() => copy(markdownSnippet)}>
          Copier Markdown
        </button>
      </div>
    </div>
  );
}