import MarketplaceClient from "./MarketplaceClient";

export default function MarketplacePage() {
  const enabled = process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED === "true";
  return (
    <main className="marketplace-shell">
      <header className="marketplace-hero">
        <span>STRATVERITY MARKETPLACE</span>
        <h1>Buy strategies with <em>proof.</em></h1>
        <p>Every listing is tied to an independently audited code version. Declared performance never replaces recomputed evidence.</p>
      </header>
      <section className="marketplace-principles" aria-label="Marketplace safeguards">
        <article><strong>For buyers</strong><p>Fees, look-ahead risk, robustness and code version are checked before listing.</p></article>
        <article><strong>For sellers</strong><p>Verified account, ownership consent and Stripe KYC are mandatory. Platform commission: 15%.</p></article>
        <article><strong>Exact delivery</strong><p>The downloadable file must match the SHA256 hash sealed by the certification.</p></article>
      </section>
      <MarketplaceClient enabled={enabled} />
    </main>
  );
}