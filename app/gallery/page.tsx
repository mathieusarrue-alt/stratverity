import Link from "next/link";

type Entry = {
  label: string;
  declared: string;
  verified: string;
  bias: string;
  score: number;
  fame: boolean;
};

const entries: Entry[] = [
  {
    label: "Wolfe+RSI · BTCUSDT · 4H",
    declared: "+212%",
    verified: "+41%",
    bias: "Missing fees & look-ahead",
    score: 43,
    fame: false,
  },
  {
    label: "Supertrend Trail · ETHUSDT · 1H",
    declared: "+96%",
    verified: "+88%",
    bias: "Robust across fees",
    score: 82,
    fame: true,
  },
  {
    label: "Mean reversion · SPX500 · 15m",
    declared: "+154%",
    verified: "−12%",
    bias: "Overfitting on a single window",
    score: 28,
    fame: false,
  },
  {
    label: "Breakout momentum · NAS100 · 1D",
    declared: "+63%",
    verified: "+57%",
    bias: "Stable in walk-forward",
    score: 78,
    fame: true,
  },
];

export default function GalleryPage() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 80px" }}>
      <header style={{ marginBottom: 28 }}>
        <span style={{ color: "var(--emerald-500)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
          Gallery
        </span>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "8px 0 12px" }}>
          The backtests that hold up — <span style={{ color: "var(--risk-500)" }}>and the ones that lie.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: 17, maxWidth: 620 }}>
          Illustrative examples of declared vs recomputed performance. Every entry is anonymised.
        </p>
      </header>

      <section style={{ display: "grid", gap: 32 }}>
        {(["fame", "shame"] as const).map((group) => (
          <div key={group}>
            <h2 style={{ fontSize: 22, margin: "0 0 16px", color: group === "fame" ? "var(--emerald-500)" : "var(--risk-500)" }}>
              {group === "fame" ? "✓ Hall of Fame" : "✕ Hall of Shame"}
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {entries
                .filter((e) => e.fame === (group === "fame"))
                .map((entry) => (
                  <div
                    key={entry.label}
                    style={{
                      padding: 18,
                      borderRadius: 14,
                      background: "var(--surface-2)",
                      border: "1px solid var(--line-2)",
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{entry.label}</div>
                      <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 4 }}>{entry.bias}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "var(--ink-2)", fontSize: 12 }}>Declared</div>
                        <div style={{ fontWeight: 800, color: "var(--amber-500)" }}>{entry.declared}</div>
                      </div>
                      <span style={{ color: "var(--ink-3)" }}>→</span>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "var(--ink-2)", fontSize: 12 }}>Verified</div>
                        <div style={{ fontWeight: 800, color: entry.fame ? "var(--emerald-500)" : "var(--risk-500)" }}>
                          {entry.verified}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `3px solid ${entry.fame ? "var(--emerald-500)" : "var(--risk-500)"}`,
                          fontWeight: 900,
                          color: entry.fame ? "var(--emerald-500)" : "var(--risk-500)",
                        }}
                      >
                        {entry.score}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </section>

      <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/score"
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
            background: "var(--emerald-500)",
            color: "#06110d",
          }}
        >
          Score my strategy
        </Link>
        <Link
          href="/configure"
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
            border: "1px solid var(--line-2)",
            color: "var(--ink-1)",
          }}
        >
          Audit my strategy
        </Link>
      </div>
    </main>
  );
}
