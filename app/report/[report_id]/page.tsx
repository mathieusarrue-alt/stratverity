"use client";

import { useEffect, useState } from "react";
import { use } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ?? "https://api.stratverity.com";

export default function ReportPage({
  params,
}: {
  params: Promise<{ report_id: string }>;
}) {
  const { report_id } = use(params);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        setState("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!active) return;
        setState("error");
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
  }, [report_id]);

  const url = `https://www.stratverity.com/report/${encodeURIComponent(report_id)}`;
  const shareText = "Audit backtest StratVerity — métriques vérifiées. Aucune promesse de gain.";

  const links = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
    wa: `https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`,
    tg: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* silencieux */
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
      {state === "loading" && <div>Chargement du rapport vérifié…</div>}
      {state === "error" && (
        <div style={{ color: "#b91c1c" }}>{error} (ID : {report_id})</div>
      )}
      {state === "ready" && html && (
        <>
          <div dangerouslySetInnerHTML={{ __html: html }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <a href={links.x} target="_blank" rel="noopener noreferrer">X</a>
            <a href={links.wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={links.tg} target="_blank" rel="noopener noreferrer">Telegram</a>
            <button onClick={copy}>{copied ? "Copié ✓" : "Copier le lien"}</button>
            <span style={{ color: "#64748b" }}>{shareText}</span>
          </div>
        </>
      )}
    </main>
  );
}