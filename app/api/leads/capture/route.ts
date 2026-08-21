import { NextResponse } from "next/server";

/**
 * POST /api/leads/capture — capture d'email après un outil gratuit.
 *
 * Transmet l'email (et le contexte outil/score) au webhook de marketing
 * automation (n8n / Make / webhook personnalisé) pour la livraison séquentielle
 * du rapport PDF par e-mail.
 *
 * GARDE-FOU :
 * - Validation stricte de l'email (regex + taille bornée).
 * - L'URL du webhook est injectée par env (`LEAD_WEBHOOK_URL`) ; si absente,
 *   la route répond 200 "queued" mais n'envoie rien (mode dégradé, aucun échec
 *   visible pour l'utilisateur). Aucun secret n'est embarqué côté client.
 * - Rate-limit minimal : taille de payload bornée, pas de spam de webhook.
 */

const MAX_BODY_BYTES = 8 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "JSON_REQUIRED" }, { status: 415 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "REQUEST_TOO_LARGE" }, { status: 413 });
  }

  let payload: { email?: string; tool?: string; score?: number };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
  }

  const tool = typeof payload.tool === "string" ? payload.tool.slice(0, 60) : "unknown";
  const score = typeof payload.score === "number" ? payload.score : null;

  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tool,
          score,
          source: "stratverity-frontend",
          capturedAt: new Date().toISOString(),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      // Échec du webhook : on ne bloque pas l'utilisateur (livraison différée).
    }
  }

  return NextResponse.json({ ok: true, queued: true });
}
