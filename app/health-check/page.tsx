"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import styles from "./health-check.module.css";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ??
  "https://api.stratverity.com";

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

function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e"; // vert
  if (score >= 50) return "#f59e0b"; // orange
  return "#ef4444"; // rouge
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Moyen";
  return "À vérifier";
}

export default function HealthCheckPage() {
  const [language, setLanguage] = useState<Language>("pinescript");
  const [code, setCode] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState("");

  const isReady = code.trim().length >= 10;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) return;

    setState("scanning");
    setError("");
    setResult(null);

    try {
      const resp = await fetch(`${API_URL}/v1/health-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: { message?: string } }).detail?.message ??
            `Erreur ${resp.status}`
        );
      }

      const data: HealthCheckResponse = await resp.json();
      setResult(data);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setState("error");
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Health-Check Gratuit</h1>
        <p className={styles.subtitle}>
          Scannez votre code de stratégie en 3 secondes. Score de santé
          instantané, détection des erreurs, et recommandations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.toolbar}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className={styles.select}
          >
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!isReady || state === "scanning"}
            className={styles.scanButton}
          >
            {state === "scanning" ? "Scan en cours..." : "Scanner mon code"}
          </button>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`Collez votre code ${LANGUAGE_LABELS[language]} ici...`}
          className={styles.editor}
          rows={16}
          spellCheck={false}
        />
      </form>

      {state === "scanning" && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Analyse en cours...</p>
        </div>
      )}

      {state === "error" && (
        <div className={styles.errorBox}>
          <p>❌ {error}</p>
        </div>
      )}

      {state === "done" && result && (
        <div className={styles.result}>
          <div className={styles.scoreSection}>
            <div
              className={styles.gauge}
              style={{
                background: `conic-gradient(${scoreColor(result.score)} ${result.score}%, #1e293b ${result.score}%)`,
              }}
            >
              <span className={styles.scoreValue}>{result.score}</span>
            </div>
            <div className={styles.verdictBlock}>
              <span
                className={styles.verdictBadge}
                style={{ background: scoreColor(result.score) }}
              >
                {result.verdict}
              </span>
              <p className={styles.scoreLabel}>
                Score de santé : {result.score}/100 — {scoreLabel(result.score)}
              </p>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className={styles.warnings}>
              <h3>🔍 Points d&apos;attention</h3>
              <ul>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.cta}>
            <p>{result.cta}</p>
            <Link href="/crash-test" className={styles.ctaButton}>
              Lancer le Crash-Test Express (49€)
            </Link>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p>
          🔒 Votre code n&apos;est pas stocké. Analyse statique uniquement —
          aucune exécution.
        </p>
      </div>
    </main>
  );
}