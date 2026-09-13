import { proxyMarketplace } from "../../../proxy";

// Phase 6 : vue enrichie d'un listing (médias, offres v2, reviews vérifiées).
// Le backend expose /v1/marketplace/listings/{id}/enriched ; le PATHS du proxy
// matche /v1/marketplace/listings/enriched (routage par segment suffixé ci-dessous).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyMarketplace(request, `/v1/marketplace/listings/${encodeURIComponent(id)}/enriched`);
}