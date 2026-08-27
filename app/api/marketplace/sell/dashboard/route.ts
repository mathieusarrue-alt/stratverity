import { proxyMarketplace } from "../../proxy";

/**
 * Seller dashboard — GET /v1/marketplace/sell/dashboard (Bearer auth).
 * Contract backend :
 * → { listings:[{id,slug,title,state,downloads}], stats:{views,unique_views,
 *     favorites,checkouts,sales,total_revenue_cents,rent_mrr_cents,churn},
 *     balance_cents, granted:[{license_id,handle,state}] }
 */
export async function GET(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/sell/dashboard");
}

/**
 * Vendor grants access / revokes — POST /v1/marketplace/sell/dashboard/grant
 * Body : { license_id, action: "grant" | "revoke" }
 * → { license_id, state }
 */
export async function POST(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/sell/dashboard/grant");
}
