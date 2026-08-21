import { proxyEligibility } from "../../proxy";

export async function GET(request: Request) {
  return proxyEligibility(request, "/v1/eligibility/email/confirm");
}