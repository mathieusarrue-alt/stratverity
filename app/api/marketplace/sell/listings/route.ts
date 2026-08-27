import { proxyMarketplace } from "../../proxy";

/**
 * Seller's own listings — GET /v1/marketplace/sell/listings.
 * Contract backend : GET /v1/marketplace/sell/listings (Bearer auth)
 * → { listings: [{ id, slug, title, kind, platform[], state, created_at }] }
 */
export async function GET(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/sell/listings");
}
