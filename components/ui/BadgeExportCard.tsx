"use client";

import { useState } from "react";

/**
 * BadgeExportCard — composant réutilisable d'export de badge embarquable.
 * Fournit les snippets HTML et Markdown prêts à coller (README GitHub, MQL5,
 * landing), et un aperçu du badge. L'ID d'audit et le score sont paramétrables.
 */
export type BadgeExportCardProps = {
  auditId: string;
  score: number;
  status?: "certified" | "failed";
  label?: string;
};

export default function BadgeExportCard({
  auditId,
  score,
  status = "certified",
  label = "Verified by StratVerity",
}: BadgeExportCardProps) {
  const [copied, setCopied] = useState<"html" | "md" | null>(null);

  const badgeUrl = `/api/badge/${auditId}?score=${score}&status=${status}&label=${encodeURIComponent(label)}`;
  const absoluteBadgeUrl = `https://www.stratverity.com${badgeUrl}`;
  const verifyUrl = `https://www.stratverity.com/verify/${auditId}`;
  const htmlSnippet = `<a href="${verifyUrl}"><img src="${absoluteBadgeUrl}" alt="${label} ${score}/100" width="300" height="80" /></a>`;
  const markdownSnippet = `[![${label} ${score}/100](${absoluteBadgeUrl})](${verifyUrl})`;

  const copy = async (kind: "html" | "md", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
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
      {/* Aperçu */}
      {/* eslint-disable-next-line @next/next/no-img-element -- badge SVG embarquable, volontairement <img> pour le copy-paste HTML du vendeur */}
      <img
        src={badgeUrl}
        alt={`${label} ${score}/100`}
        width={300}
        height={80}
        style={{ display: "block", marginBottom: 6 }}
      />

      <div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
          HTML (vitrine / landing)
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
        <button type="button" style={btnStyle} onClick={() => copy("html", htmlSnippet)}>
          {copied === "html" ? "Copié ✓" : "Copier HTML"}
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
        <button type="button" style={btnStyle} onClick={() => copy("md", markdownSnippet)}>
          {copied === "md" ? "Copié ✓" : "Copier Markdown"}
        </button>
      </div>
    </div>
  );
}
