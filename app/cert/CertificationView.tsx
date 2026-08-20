"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./cert.module.css";
import type { CertificationData, CertificationView, Tone } from "./certification-state";
import { buildBadgeEmbed, buildCertificationView } from "./certification-state";

const TONE_STYLES: Record<Tone, { dot: string; chip: string; bar: string }> = {
  green: { dot: "#22c55e", chip: "chipGreen", bar: "barGreen" },
  orange: { dot: "#f59e0b", chip: "chipOrange", bar: "barOrange" },
  red: { dot: "#ef4444", chip: "chipRed", bar: "barRed" },
  gray: { dot: "#64748b", chip: "chipGray", bar: "barGray" },
};

const FLAG_LABELS: Record<string, string> = {
  MARTINGALE_PROFILE: "Martingale / grid profile — instant liquidation risk",
  FEES_BELOW_MINIMUM: "Realistic minimum fees not respected",
  OOS_NOT_PROVIDED: "No out-of-sample validation provided",
  OOS_HIGHER_THAN_IS: "Out-of-sample looks better than in-sample (window artefact)",
  PROFIT_FACTOR_EXTREME: "Extreme profit factor — overfitting control required",
  RUIN_RISK: "High drawdown — ruin risk",
  DSR_NEGATIVE: "Deflated Sharpe negative",
  PBO_HIGH: "High probability of backtest overfitting (PBO)",
};

export function formatPillarNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

interface CertificationViewProps {
  auditId: string;
  data: CertificationData | null;
  view: CertificationView;
  apiOrigin: string;
  siteOrigin: string;
}

export default function CertificationView({
  auditId,
  data,
  view,
  apiOrigin,
  siteOrigin,
}: CertificationViewProps) {
  const [sourceCode, setSourceCode] = useState("");
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [copied, setCopied] = useState<"markdown" | "html" | "hash" | null>(null);

  // La vérification du code réévalue l'état complet : si le hash soumis ne
  // correspond plus, la vue bascule en « Révision obsolète / Non vérifié ».
  const effectiveView = useMemo(() => {
    if (computedHash !== null && data) {
      return buildCertificationView(data, computedHash);
    }
    return view;
  }, [computedHash, data, view]);

  const badgeUrl = useMemo(() => {
    if (!effectiveView.badgeUrl) return null;
    return `${apiOrigin.replace(/\/+$/, "")}/${effectiveView.badgeUrl.replace(/^\/+/, "")}`;
  }, [apiOrigin, effectiveView.badgeUrl]);

  const embed = useMemo(
    () => buildBadgeEmbed(auditId, effectiveView.badgeUrl ?? "", apiOrigin, siteOrigin),
    [auditId, effectiveView.badgeUrl, apiOrigin, siteOrigin],
  );

  const verifySource = useCallback(async () => {
    if (!sourceCode.trim() || sourceCode.trim().length < 8) return;
    setVerifyBusy(true);
    try {
      const hash = await sha256Hex(sourceCode);
      setComputedHash(hash);
    } finally {
      setVerifyBusy(false);
    }
  }, [sourceCode]);

  const copy = useCallback(async (kind: "markdown" | "html" | "hash", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // Naviguer vers l'API clipboard sous iOS nécessite l'activation
      // d'un user gesture : on ignore silencieusement en environnement restreint.
      setCopied(null);
    }
  }, []);

  const tones = TONE_STYLES[effectiveView.tone];
  const toneChip = styles[tones.chip as keyof typeof styles];
  const toneBar = styles[tones.bar as keyof typeof styles];
  const verification =
    computedHash !== null
      ? computedHash === effectiveView.codeHash
        ? "matched"
        : "stale"
      : null;

  return (
    <main className={styles.page}>
      <header className={`${styles.bar} ${toneBar}`}>
        <span className={styles.kicker}>StratVerity certification</span>
        <h1 className={styles.title}>
          {effectiveView.strategyName ?? "Audit certification"}
        </h1>
        <p className={styles.auditId}>Audit {auditId}</p>

        <div className={styles.statusRow}>
          <span className={`${styles.chip} ${toneChip}`}>
            <span className={styles.dot} style={{ background: tones.dot }} />
            {effectiveView.statusLabel}
          </span>
          <span className={styles.scorePill}>
            {effectiveView.score !== null ? (
              <>
                <strong>{effectiveView.score}</strong>/100 robust
              </>
            ) : (
              "no score"
            )}
          </span>
        </div>
        <p className={styles.sub}>{effectiveView.statusSub}</p>
      </header>

      <section className={`${styles.panel} ${toneBar}`}>
        {badgeUrl && (
          <div className={styles.badgeBox}>
            {/* Le badge officiel est rendu par l'API (infalsifiable). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl}
              alt={`StratVerity audit badge ${auditId}`}
              width={280}
              height={70}
            />
          </div>
        )}

        <div className={styles.pillars}>
          <div className={styles.pillar}>
            <span className={styles.pillarLabel}>Net profit factor</span>
            <span className={styles.pillarValue}>
              {formatPillarNumber(effectiveView.pillars.profit_factor_net)}
            </span>
            <span className={styles.pillarHint}>After fees &amp; slippage</span>
          </div>
          <div className={styles.pillar}>
            <span className={styles.pillarLabel}>Max drawdown</span>
            <span className={styles.pillarValue}>
              {formatPillarNumber(effectiveView.pillars.max_drawdown_percent)}
              {typeof effectiveView.pillars.max_drawdown_percent === "number" ? "%" : ""}
            </span>
            <span className={styles.pillarHint}>On settled equity</span>
          </div>
          <div className={styles.pillar}>
            <span className={styles.pillarLabel}>Trades</span>
            <span className={styles.pillarValue}>
              {formatPillarNumber(effectiveView.pillars.trade_count)}
            </span>
            <span className={styles.pillarHint}>Sample size</span>
          </div>
        </div>

        {effectiveView.flags.length > 0 || effectiveView.warnings.length > 0 ? (
          <aside className={styles.alertBox}>
            <h2>Automated risk flags</h2>
            <ul>
              {effectiveView.flags.map((flag) => (
                <li key={flag}>
                  <strong>{FLAG_LABELS[flag] ?? flag}</strong>
                </li>
              ))}
              {effectiveView.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </aside>
        ) : (
          <aside className={styles.cleanBox}>
            No automated risk flags raised by the engine.
          </aside>
        )}
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2>Signed source hash</h2>
          <p className={styles.muted}>
            SHA-256 of the audited strategy code. If the seller changes the
            source, this signature no longer matches and the badge is void.
          </p>
          {effectiveView.codeHash ? (
            <>
              <code className={styles.hash} data-testid="code-hash">
                {effectiveView.codeHash}
              </code>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => void copy("hash", effectiveView.codeHash ?? "")}
              >
                {copied === "hash" ? "Copied" : "Copy hash"}
              </button>

              <h3>Verify the current code</h3>
              <textarea
                className={styles.source}
                placeholder="Paste the current strategy source code to compare its SHA-256…"
                value={sourceCode}
                onChange={(event) => {
                  setSourceCode(event.target.value);
                  setComputedHash(null);
                }}
                rows={6}
              />
              <button
                type="button"
                className={styles.ghost}
                disabled={verifyBusy || sourceCode.trim().length < 8}
                onClick={() => void verifySource()}
              >
                {verifyBusy ? "Hashing…" : "Verify signature"}
              </button>
              {verification !== null && (
                <p
                  className={
                    verification === "matched" ? styles.matchOk : styles.matchBad
                  }
                >
                  {verification === "matched"
                    ? "Identity verified — the audited source signature matches."
                    : "Revision stale — the code provided does not match the audited signature. Do not display this badge."}
                </p>
              )}
            </>
          ) : (
            <p className={styles.muted}>
              No source signature was sealed for this audit.
            </p>
          )}
        </div>

        <div className={styles.card}>
          <h2>Embed this badge</h2>
          <p className={styles.muted}>
            Show the proof on MQL5, TradingView, GitHub or your own storefront.
          </p>
          <div className={styles.embedRow}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => void copy("markdown", embed.markdown)}
            >
              {copied === "markdown" ? "Copied" : "Copy Markdown"}
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => void copy("html", embed.html)}
            >
              {copied === "html" ? "Copied" : "Copy HTML"}
            </button>
          </div>
          <pre className={styles.embed} data-testid="badge-embed">
            {embed.markdown}
          </pre>
        </div>
      </section>

      <footer className={styles.cta}>
        <Link className={styles.primaryLink} href="/configure">
          Submit a strategy for audit
        </Link>
        <Link className={styles.secondaryLink} href="/learn">
          How StratVerity audits work
        </Link>
      </footer>
    </main>
  );
}