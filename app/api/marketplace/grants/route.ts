import { proxyMarketplace } from "../proxy";

/** GET /v1/marketplace/grants — operator grant queue (admin auth). */
export async function GET(request: Request) {
  return proxyMarketplace(request, "/v1/marketplace/grants");
}
