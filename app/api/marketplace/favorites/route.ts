import { proxyMarketplace } from "../proxy";

/** GET /v1/marketplace/favorites — mes favoris (logged-in buyer). */
export async function GET(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/favorites");
}

/** POST /v1/marketplace/favorites — toggle favorite (logged-in buyer). */
export async function POST(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/favorites");
}
