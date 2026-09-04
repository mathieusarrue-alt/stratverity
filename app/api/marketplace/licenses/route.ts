import { proxyMarketplace } from "../proxy";

/**
 * Buyer licenses — GET /v1/marketplace/licenses (Bearer auth).
 * Contract backend :
 * → { licenses:[{listing_id,title,slug,handle,kind,mode:"one_shot"|"rent_monthly"|"rent_quarterly"|"rent_yearly",
 *     state:"active"|"pending_grant"|"revoked"|"past_due", message}] }
 */
export async function GET(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/licenses");
}
