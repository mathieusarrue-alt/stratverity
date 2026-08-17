import Link from "next/link";

export default function MarketplacePage() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 80px" }}>
      <header style={{ marginBottom: 28 }}>
        <span style={{ color: "var(--emerald-500)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
          Coming soon
        </span>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "8px 0 12px" }}>
          Buy strategies with <span style={{ color: "var(--emerald-500)" }}>proof.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: 17, maxWidth: 620 }}>
          A marketplace of independently audited bots and strategies. Every listing shows the
          declared numbers next to the recomputed reality.
        </p>
      </header>

      <section style={{ display: "grid", gap: 14, marginBottom: 28 }}>
        {[
          {
            t: "For buyers",
            d: "No more trusting a sales page. Every strategy is audited — look-ahead, fees, and overfitting checked — with the real numbers visible before you buy.",
          },
          {
            t: "For sellers",
            d: "Stand out in a feed of unverified bots. Pass the audit, get a Verified badge, and list on the marketplace. We take a cut on each sale.",
          },
          {
            t: "Every listing is versioned",
            d: "Each strategy is tied to an exact code version (SHA256). If the seller changes it, it must be re-audited. No silent edits.",
          },
        ].map((item) => (
          <div
            key={item.t}
            style={{
              padding: 18,
              borderRadius: 14,
              background: "var(--surface-2)",
              border: "1px solid var(--line-2)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.t}</div>
            <div style={{ color: "var(--ink-2)", fontSize: 15 }}>{item.d}</div>
          </div>
        ))}
      </section>

      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background: "var(--surface-2)",
          border: "1px solid var(--line-2)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Be first on the marketplace.
        </div>
        <p style={{ color: "var(--ink-2)", margin: "0 0 16px" }}>
          Sellers: join the free audit waitlist. Buyers: get notified at launch.
        </p>
        <Link
          href="/contact"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
            background: "var(--emerald-500)",
            color: "#06110d",
          }}
        >
          Get notified
        </Link>
      </div>
    </main>
  );
}
