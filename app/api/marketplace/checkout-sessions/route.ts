import { proxyMarketplace } from "../proxy";

/**
 * POST /api/marketplace/checkout-sessions — create Stripe checkout.
 * Contract backend : POST /v1/marketplace/checkout-sessions
 * Body : { listing_id, mode: "one_shot" | "rent_monthly", handle }
 *  - mode "one_shot"  → Stripe PaymentIntent / Checkout one-time (license lifetime)
 *  - mode "rent_monthly" → Stripe Subscription (license active while paying)
 *  - handle = tradingview_username (indicator/strategy TV) ou mt handle (MT5/MT4)
 * → { checkout_url } (redirect Stripe)
 */
export async function POST(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/checkout-sessions");
}
