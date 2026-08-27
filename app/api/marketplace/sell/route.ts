import { proxyMarketplace } from "../proxy";

/**
 * POST /api/marketplace/sell — dépôt d'un listing vendeur (invite_protected).
 * Contract backend : POST /v1/marketplace/sell
 * Body attendu (JSON) : { kind, platform[], title, description, markets[],
 *  delivery_mode:"invite_protected", offers:[{mode:"one_shot"|"rent_monthly", price_cents}],
 *  seller_handle, screenshots[], consent:{cgu15:true,no_gain:true} }
 * → { listing_id, state:"QUEUE_AUDIT" }
 */
export async function POST(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/sell");
}
