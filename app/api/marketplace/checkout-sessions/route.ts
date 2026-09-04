import { proxyMarketplace } from "../proxy";

/**
 * POST /api/marketplace/checkout-sessions — create Stripe checkout.
 * Contract backend : POST /v1/marketplace/checkout-sessions
 * Body : { listing_id, mode: "one_shot" | "rent_monthly" | "rent_quarterly" | "rent_yearly", handle }
 *  - mode "one_shot"  → Stripe PaymentIntent / Checkout one-time (license lifetime)
 *  - mode "rent_monthly" → Stripe Subscription monthly (license active while paying)
 *  - mode "rent_quarterly" → Stripe Subscription every 3 months (interval=month, interval_count=3)
 *  - mode "rent_yearly" → Stripe Subscription yearly (license active while paying)
 *  - handle = tradingview_username (indicator/strategy TV) ou mt handle (MT5/MT4)
 * → { checkout_url } (redirect Stripe)
 */
export async function POST(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/checkout-sessions");
}
