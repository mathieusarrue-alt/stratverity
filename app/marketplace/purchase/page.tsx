import PurchaseClient from "./PurchaseClient";

type PurchasePageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function MarketplacePurchasePage({ searchParams }: PurchasePageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;
  const sessionId = typeof raw === "string" && raw.length <= 255 ? raw : "";
  return (
    <PurchaseClient
      enabled={process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED === "true"}
      sessionId={sessionId}
    />
  );
}