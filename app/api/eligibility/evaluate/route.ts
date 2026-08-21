import { proxyEligibility } from "../proxy";

export async function POST(request: Request) {
  return proxyEligibility(request, "/v1/eligibility/evaluate");
}