"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Check, Copy, RefreshCw, TrendingUp } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ?? "https://api.stratverity.com";

type Status = "loading" | "ready" | "error";

export default function ReportPage({
  params,
}: {
  params: Promise<{ report_id: string }>;
}) {
  const { report_id } = use(params);
  const [status, setStatus] = useState<Status>("loading");
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const publicUrl = useMemo(
    () => `https://www.stratverity.com/report/${encodeURIComponent(report_id)}`,
    [report_id],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    let active = true;
    fetch(`${API_URL}/v1/reports/${encodeURIComponent(report_id)}`, {
      signal: ctrl.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        if (ct && !ct.includes("text/html") && !ct.includes("text/plain")) {
          throw new Error(`Unexpected content-type: ${ct}`);
        }
        return r.text();
      })
      .then((h) => {
        if (!active) return;
        if (!h || h.trim().length === 0) throw new Error("empty body");
        setHtml(h);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!active) return;
        setStatus("error");
        setError(
          err instanceof Error
            ? `Rapport introuvable / inaccessible (${err.message}).`
            : "Rapport introuvable / inaccessible.",
        );
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [report_id, attempt]);

  const shareText =
    "StratVerity audit: recomputed metrics, with no performance promise.";
  const shareFrench =
    "Audit StratVerity : métriques recalculées, sans promesse de performance.";

  const links = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicUrl)}`,
    wa: `https://wa.me/?text=${encodeURIComponent(shareText + " " + publicUrl)}`,
    tg: `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`,
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* silencieux */
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "16px" }}>
      {/* Hero */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 28, height: 28, borderRadius: 8, background: "#16b981",
              color: "#083326", display: "inline-flex", alignItems: "center",
              justifyContent: "center", fontWeight: 900,
            }}
          >
            ◈
          </span>
          <span style={{ fontWeight: 800, letterSpacing: ".3px" }}>StratVerity</span>
          <span style={{ fontSize: 12, opacity: 0.8, color: "#16b981" }}>
            Proof, not storytelling.
          </span>
        </div>
        <span
          style={{
            display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700,
            color: "#083326", background: "#d9f7ea", padding: "4px 10px", borderRadius: 99,
          }}
        >
          Audit terminé
        </span>
      </div>

      {status === "loading" && <div>Chargement du rapport vérifié…</div>}

      {status === "error" && (
        <div style={{ color: "#b91c1c" }}>
          {error} (ID : {report_id})
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            style={{ minHeight: 44, marginLeft: 10 }}
          >
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      )}

      {status === "ready" && html && (
        <iframe
          sandbox=""
          title="Rapport d’audit"
          style={{ width: "100%", border: 0, minHeight: 720, borderRadius: 12 }}
          srcDoc={html}
        />
      )}

      {/* Share bar (reelle, 44px) — desactivee sans publicUrl (toujours present ici) */}
      <div
        style={{
          display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center",
        }}
      >
        <a
          href={links.x} target="_blank" rel="noopener noreferrer"
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 14px", background: "#0f172a", color: "#fff", borderRadius: 8, textDecoration: "none" }}
        >
          X
        </a>
        <a
          href={links.wa} target="_blank" rel="noopener noreferrer"
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 14px", background: "#25D366", color: "#083326", borderRadius: 8, textDecoration: "none" }}
        >
          WhatsApp
        </a>
        <a
          href={links.tg} target="_blank" rel="noopener noreferrer"
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 14px", background: "#229ED9", color: "#fff", borderRadius: 8, textDecoration: "none" }}
        >
          Telegram
        </a>
        <button
          type="button"
          onClick={copyLink}
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 14px", background: "#e2e8f0", color: "#0f172a", borderRadius: 8, border: "1px solid #cbd5e1", cursor: "pointer" }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Lien public copié" : "Copier le lien"}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{shareFrench}</p>

      {/* Disclaimer permanent */}
      <p style={{ fontSize: 12, color: "#475569", marginTop: 10 }}>
        Les métriques proviennent d&apos;un backtest (données historiques) : elles ne
        garantissent pas les performances futures. Aucune promesse de gain.
      </p>

      {/* CTA */}
      <div style={{ marginTop: 12 }}>
        <Link
          href="/configure"
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", gap: 8, padding: "0 16px", background: "#083326", color: "#fff", borderRadius: 8, textDecoration: "none" }}
        >
          <TrendingUp size={16} /> Auditer une stratégie
        </Link>
      </div>
    </main>
  );
}