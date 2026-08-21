import { proxyMarketplace } from "../proxy";

export async function GET(request: Request) { return proxyMarketplace(request, "/v1/marketplace/listings"); }
export async function POST(request: Request) { return proxyMarketplace(request, "/v1/marketplace/listings"); }