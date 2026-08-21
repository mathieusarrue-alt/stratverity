import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/stripe — relais webhook Stripe (frontend Next.js).
 *
 * ARCHITECTURE (source de vérité : skill stratverity-saas-dev) :
 * La logique métier des webhooks Stripe vit dans le BACKEND FastAPI :
 *   - Crash-Test   : /v1/audit/crash-test/webhook   (checkout.session.completed)
 *   - Marketplace  : /v1/marketplace/webhooks/stripe (Connect + refunds/disputes)
 * Cette route frontend NE DUPLIQUE PAS cette logique (risque de double
 * traitement). Elle est un POINT D'ENTRÉE unique documenté qui :
 *   1) valide la signature `stripe-signature` quand STRIPE_WEBHOOK_SECRET est
 *      défini (écho fidèle de la séquence d'événements Stripe) ;
 *   2) route l'événement au backend réel via l'URL cible configurée.
 *
 * Si les secrets sont absents (mode hors-live), la route répond 503 : le
 * webhook live doit pointer sur le backend FastAPI, pas ici.
 */

const MAX_BODY_BYTES = 1 * 1024 * 1024; // 1 Mo

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "REQUEST_TOO_LARGE" }, { status: 413 });
  }

  const sig = request.headers.get("stripe-signature");

  // Relais : transmet l'événement au backend réel (configuré par env).
  const backendTarget = process.env.STRIPE_WEBHOOK_BACKEND_TARGET;
  if (!backendTarget) {
    // Aucun backend cible : le webhook live doit être configuré côté FastAPI.
    return NextResponse.json(
      {
        ok: false,
        error: "BACKEND_TARGET_UNSET",
        detail:
          "Configure the Stripe webhook endpoint on the FastAPI backend (/v1/...), not the frontend.",
      },
      { status: 503 },
    );
  }

  try {
    const target = new URL(backendTarget);
    if (target.protocol !== "https:" && !target.hostname.endsWith(".amazonaws.com")) {
      return NextResponse.json({ ok: false, error: "UNSAFE_TARGET" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const upstream = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sig ? { "stripe-signature": sig } : {}),
      },
      body: raw,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return NextResponse.json(
      { ok: upstream.ok, upstreamStatus: upstream.status },
      { status: upstream.ok ? 200 : 502 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }
}

/** Le webhook Stripe ne se lit qu'en POST (évite tout GET non intentionnel). */
export async function GET() {
  return NextResponse.json({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
