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
  recommendations: string[];
  engine_version: string;
  generated_at: string;
};

type PageState = "loading" | "ready" | "pending" | "error";

const VERIFICATION_URL = "https://www.stratverity.com/crash-test/verify";

const SEVERITY_CLASS: Record<Diagnostic["severity"], string> = {
  success: "pillSuccess",
  warning: "pillWarning",
  critical: "pillCritical",
  info: "pillInfo",
};

export default function CrashTestReportPage() {
  const t = useCT();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [report, setReport] = useState<CrashTestReport | null>(null);
  const [message, setMessage] = useState("");

  const loadReport = useCallback(async (auditHash: string) => {
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
        return true;
      }

      if (response.status === 409) {
        setPageState("pending");
        setMessage(t("ct.report.analyzing"));
        return false;
      }

      setPageState("error");
      setMessage(
        typeof result.detail === "object" && result.detail?.message
          ? result.detail.message
          : t("ct.report.notFound"),
      );
      return true;
    } catch {
      setPageState("pending");
      setMessage(t("ct.report.connecting"));
      return false;
    }
  }, [t]);

  useEffect(() => {
    let stopped = false;

    const initialize = async () => {
      const sessionId =
        new URLSearchParams(window.location.search).get("session_id") ?? "";
      const auditHash = sessionId
        ? sessionStorage.getItem(`stratverity.crash-test:${sessionId}`) ?? ""
        : "";

      if (!auditHash) {
        setPageState("error");
        setMessage(t("ct.report.missingHash"));
        return;
      }

      for (let attempt = 0; attempt < 20 && !stopped; attempt += 1) {
        const done = await loadReport(auditHash);
        if (done || stopped) return;
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }
      if (!stopped) {
        setPageState("error");
        setMessage(t("ct.report.timeout"));
      }
    };

    void initialize();
    return () => {
      stopped = true;
    };
  }, [loadReport, t]);

  const downloadPdf = () => {
    window.print();
  };

  const copyVerificationUrl = () => {
    if (report) {
      void navigator.clipboard?.writeText(
        `${VERIFICATION_URL}?hash=${report.audit_hash}`,
      );
    }
  };

  if (pageState !== "ready" || !report) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <span className={styles.statusLine}>
            {pageState === "pending" ? (
              <span className={styles.statusLineDot} />
            ) : null}
            {message || t("ct.report.loading")}
          </span>
          {pageState === "error" && (
            <Link href="/crash-test" className={styles.btnPrimary}>
              {t("ct.report.back")}
            </Link>
          )}
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
              {t("ct.report.badge")}
            </span>
            <h1>{t("ct.report.title")}</h1>
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
                  style={{ transition: "stroke-dashoffset 1s var(--ease)" }}
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

        <section className={styles.recommendations}>
          <h2>{t("ct.report.recommendations")}</h2>
          <ol>
            {report.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ol>
        </section>

        <div className={styles.certBar}>
          <div className={styles.certHash}>
            <b>{t("ct.report.certTitle")}</b>
            <div>audit_hash : {report.audit_hash}</div>
            <div>
              {t("ct.report.copyUrl")} : {VERIFICATION_URL}?hash={report.audit_hash}
            </div>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.btnSecondary}
              onClick={downloadPdf}
              type="button"
            >
              {t("ct.report.downloadPdf")}
            </button>
            <button
              className={styles.btnSecondary}
              onClick={copyVerificationUrl}
              type="button"
            >
              {t("ct.report.copyUrl")}
            </button>
          </div>
        </div>
      </article>

      <section className={styles.upsell}>
        <div>
          <h2>{t("ct.report.upsellTitle")}</h2>
          <p>{t("ct.report.upsellBody")}</p>
        </div>
        <Link href="/configure" className={styles.btnPrimary}>
          {t("ct.report.upsellCta")}
        </Link>
      </section>
    </main>
  );
}