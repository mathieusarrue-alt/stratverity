import { proxyEligibility } from "../eligibility/proxy";

export async function POST(request: Request) {
  return proxyEligibility(request, "/v1/health-check");
}
