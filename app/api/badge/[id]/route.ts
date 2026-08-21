import { NextResponse } from "next/server";

/**
 * GET /api/badge/[id] — badge SVG dynamique, vert néon #00FF9D sur fond sombre.
 *
 * Route frontend légère (pas de secret). Pour un badge certifié lié au moteur
 * d'audit, le backend expose `/v1/badge/{audit_id}.svg` (FastAPI) ; cette route
 * Next.js fournit un badge embarquable autonome pour la vitrine du vendeur.
 *
 * Le `score` est passé en query (?score=92&label=Verified) ; par défaut un
 * badge générique "Verified by StratVerity" est servi.
 */
const NEON = "#00FF9D";

function badgeSvg(score: number | null, label: string): string {
  const statusText = score !== null ? `${label} · ${score}/100` : label;
  const subText =
    score !== null
      ? "Recalcul indépendant · stratverity.com"
      : "Certification indépendante · stratverity.com";
  const fill = NEON;

  return `<svg width="280" height="70" viewBox="0 0 280 70" xmlns="http://www.w3.org/2000/svg">
  <rect width="280" height="70" rx="10" fill="#06110d" stroke="#00FF9D" stroke-opacity="0.5" stroke-width="2"/>
  <circle cx="35" cy="35" r="18" fill="${fill}" fill-opacity="0.14"/>
  <path d="M28 35L33 40L42 29" stroke="${fill}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="65" y="30" fill="#eaf3ee" font-family="Arial, sans-serif" font-weight="bold" font-size="12">${statusText}</text>
  <text x="65" y="48" fill="#7b8f86" font-family="Arial, sans-serif" font-size="11">${subText}</text>
</svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safeId = (id || "verify").slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, "");

  // Analyse le score depuis l'URL (optionnel) : /api/badge/xyz?score=92
  const url = new URL(_request.url);
  const rawScore = url.searchParams.get("score");
  const score = rawScore ? Math.max(0, Math.min(100, Math.round(Number(rawScore)))) : null;
  const label = url.searchParams.get("label") || "Verified by StratVerity";
  const safeLabel = label.slice(0, 40).replace(/[<>"&]/g, "");

  const svg = badgeSvg(Number.isFinite(score as number) ? score : null, safeLabel || "Verified by StratVerity");

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Badge-Id": safeId,
    },
  });
}
