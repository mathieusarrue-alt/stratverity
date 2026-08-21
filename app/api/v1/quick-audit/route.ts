import { NextResponse } from "next/server";

/**
 * POST /api/v1/quick-audit — diagnostic statique léger (Custom GPT / API).
 *
 * GARDE-FOU (doctrine produit) : ce endpoint n'exécute JAMAIS le code soumis.
 * Il effectue une analyse statique bornée (détection de patterns connus) et
 * renvoie un diagnostic indicatif JSON. Le diagnostic déterministe complet
 * reste la responsabilité du backend FastAPI `/v1/audit/quick-check`.
 *
 * Corps accepté (JSON) :
 *   { "source": "<code>", "language": "pinescript|python|mql5" }
 * Réponse : { ok, language, length, indicators, summary }
 */

const MAX_BODY_BYTES = 64 * 1024;

type Indicator = { key: string; label: string; severity: "info" | "warning" | "critical" };

const PATTERNS: { key: string; label: string; severity: Indicator["severity"]; re: RegExp }[] = [
  { key: "lookahead", label: "Possible look-ahead (future reference)", severity: "critical", re: /future|request\.security|bar_index\[[+-]?\d+\]|\[\s*-\s*\d+\s*\]/i },
  { key: "repainting", label: "Possible repainting (recalculation)", severity: "warning", re: /repaint|security\(|recalculat|request\./i },
  { key: "overfitting", label: "Many hard-coded parameters (overfitting risk)", severity: "warning", re: /input(?:\.|_)|optimize\(|param\s*=/i },
  { key: "fees", label: "No commission/slippage reference", severity: "info", re: /commission|slippage|spread|fee/i },
];

function analyze(source: string): { indicators: Indicator[]; summary: string } {
  const found: Indicator[] = [];
  for (const p of PATTERNS) {
    if (p.re.test(source)) found.push({ key: p.key, label: p.label, severity: p.severity });
  }
  const critical = found.filter((f) => f.severity === "critical").length;
  const warnings = found.filter((f) => f.severity === "warning").length;
  let summary: string;
  if (critical > 0) summary = "Critical indicators detected — a full audit is strongly recommended.";
  else if (warnings > 0) summary = "Some risk indicators detected — consider a full audit.";
  else summary = "No obvious red flags in this static pass (full audit still advised).";
  return { indicators: found, summary };
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "JSON_REQUIRED" }, { status: 415 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "REQUEST_TOO_LARGE" }, { status: 413 });
  }

  let payload: { source?: string; language?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const source = typeof payload.source === "string" ? payload.source.slice(0, MAX_BODY_BYTES) : "";
  const language = typeof payload.language === "string" ? payload.language : "unknown";

  if (!source.trim()) {
    return NextResponse.json({ ok: false, error: "EMPTY_SOURCE" }, { status: 400 });
  }

  const { indicators, summary } = analyze(source);
  return NextResponse.json({
    ok: true,
    language,
    length: source.length,
    indicators,
    summary,
    disclaimer:
      "Static indicative diagnostic only — never executed, no investment advice, no performance guarantee.",
  });
}
