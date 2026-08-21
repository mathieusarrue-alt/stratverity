import { requireSupabaseUser } from "../../supabase/server";
import SellerConsole from "./SellerConsole";

export default async function MarketplaceSellerPage() {
  const user = await requireSupabaseUser("/marketplace/seller");
  return (
    <main className="marketplace-shell">
      <header className="marketplace-hero">
        <span>VERIFIED SELLER</span>
        <h1>List the exact strategy <em>you own.</em></h1>
        <p>Signed in as {user.email}. Your email must remain verified. Every listing stays private until human activation and Stripe KYC are complete.</p>
      </header>
      <SellerConsole enabled={process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED === "true"} />
    </main>
  );
}