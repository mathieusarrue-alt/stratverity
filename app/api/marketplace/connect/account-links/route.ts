import { proxyMarketplace } from "../../proxy";

export async function POST(request: Request) { return proxyMarketplace(request, "/v1/marketplace/connect/account-links"); }