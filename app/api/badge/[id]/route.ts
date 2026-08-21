import { NextResponse } from "next/server";

/**
 * GET /api/badge/[id] — badge SVG dynamique embarquable.
 *
 * Couleur réactive :
 *   - `status=certified` (défaut) → vert néon #00FF9D
 *   - `status=failed`              → rouge #EF4444
 * Paramètres (query) :
 *   - `score` (0-100) : score de robustesse affiché à droite du check.
 *   - `label`         : libellé de statut (défaut "Verified by StratVerity").
 *
 * L'ID d'audit (segment [id]) est affiché comme hash raccourci en bas.
 * En-tête Cache-Control optimisé (1 jour) : le badge est statique par audit.
 */
const NEON = "#00FF9D";
const DANGER = "#EF4444";

function shorten(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function badgeSvg(
  id: string,
  score: number | null,
  label: string,
  status: "certified" | "failed",
): string {
  const fill = status === "failed" ? DANGER : NEON;
  const statusText = score !== null ? `${label} · ${score}/100` : label;
  const iconPath =
    status === "failed"
      ? '<path d="M27 27L43 43M43 27L27 43" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M28 35L33 40L42 29" stroke="#00FF9D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';

  return `<svg width="300" height="80" viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="80" rx="12" fill="#06110d" stroke="${fill}" stroke-opacity="0.55" stroke-width="2"/>
  <circle cx="35" cy="35" r="18" fill="${fill}" fill-opacity="0.14"/>
  ${iconPath}
  <text x="65" y="30" fill="#eaf3ee" font-family="Arial, sans-serif" font-weight="bold" font-size="13">${statusText}</text>
  <text x="65" y="50" fill="#7b8f86" font-family="Arial, sans-serif" font-size="11">Recalcul indépendant · stratverity.com</text>
  <text x="65" y="66" fill="${fill}" font-family="monospace, sans-serif" font-size="10" opacity="0.85">#${shorten(id)}</text>
</svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safeId = (id || "verify").slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, "");

  const url = new URL(_request.url);
  const rawScore = url.searchParams.get("score");
  const score = rawScore ? Math.max(0, Math.min(100, Math.round(Number(rawScore)))) : null;
  const label = url.searchParams.get("label") || "Verified by StratVerity";
  const safeLabel = label.slice(0, 40).replace(/[<>"&]/g, "");
  const statusParam = url.searchParams.get("status");
  const status: "certified" | "failed" = statusParam === "failed" ? "failed" : "certified";

  const svg = badgeSvg(
    safeId,
    Number.isFinite(score as number) ? score : null,
    safeLabel || "Verified by StratVerity",
    status,
  );

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Badge-Id": safeId,
    },
  });
}
