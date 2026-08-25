"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import type { Metadata } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.stratverity.com";

// noindex pour les pages de rapport partagées (métadonnées indiées au runtime)
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ReportPage({
  params,
}: {
  params: Promise<{ report_id: string }>;
}) {
  const { report_id } = use(params);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/reports/${encodeURIComponent(report_id)}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((h) => active && setHtml(h))
      .catch(() => active && setError("Rapport introuvable / inaccessible."));
    return () => {
      active = false;
    };
  }, [report_id]);

  const url =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.stratverity.com/report/${report_id}`;
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
      {error && (
        <div style={{ color: "#b91c1c" }}>{error} (ID : {report_id})</div>
      )}
      {html && (
        <>
          {/* le rapport pro est injecté tel quel (navigation safety) */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <a href={links.x} target="_blank" rel="noopener noreferrer">X</a>
            <a href={links.wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={links.tg} target="_blank" rel="noopener noreferrer">Telegram</a>
            <button onClick={copy}>{copied ? "Copié ✓" : "Copier le lien"}</button>
            <span style={{ color: "#64748b" }}>{shareText}</span>
          </div>
          <noscript>
             Activer JavaScript pour copier/partager le lien.
          </noscript>
        </>
      )}
    </main>
  );
}