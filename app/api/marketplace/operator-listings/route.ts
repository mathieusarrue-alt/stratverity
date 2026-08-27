import { proxyMarketplace } from "../proxy";

/**
 * POST /api/marketplace/operator-listings — bypass opérateur pour seeds.
 * Contract backend : POST /v1/marketplace/operator-listings (admin auth)
 * Marque le listing OPERATOR_LISTED (badge « Operator »), jamais un score
 * inventé. Réservé aux 2 listings seed du fondateur.
 */
export async function POST(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/operator-listings");
}