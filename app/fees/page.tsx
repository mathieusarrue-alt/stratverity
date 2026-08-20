"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function applyFees(declared: number, trades: number, feePerTrade: number): number {
  // Geometric drag: each round-trip loses feePerTrade (as a fraction).
  const perTrade = 1 - feePerTrade / 100;
  const totalDrag = Math.pow(perTrade, trades);
  return declared * totalDrag;
}

export default function FeesPage() {
  const [declared, setDeclared] = useState(212);
  const [winRate, setWinRate] = useState(60);
  const [trades, setTrades] = useState(500);
  const [fee, setFee] = useState(0.1);

  const reality = useMemo(
    () => applyFees(declared, trades, fee),
    [declared, trades, fee],
  );

  const ratio = declared > 0 ? (reality / declared).toFixed(2) : "0";
  const lost = (declared - reality).toFixed(1);

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 80px" }}>
      <header style={{ marginBottom: 28 }}>
        <span style={{ color: "var(--emerald-500)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
          Free tool
        </span>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "8px 0 12px" }}>
          Watch your edge <span style={{ color: "var(--risk-500)" }}>melt.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: 17, maxWidth: 620 }}>
          Slide the fee cursor and see what your declared return becomes once commissions,
          spread and slippage are real.
        </p>
      </header>

      <section style={{ display: "grid", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <label style={{ display: "grid", gap: 6, color: "var(--ink-2)", fontSize: 13 }}>
            Declared return (%)
            <input
              type="number"
              value={declared}
              onChange={(e) => setDeclared(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 6, color: "var(--ink-2)", fontSize: 13 }}>
            Win rate (%)
            <input
              type="number"
              value={winRate}
              onChange={(e) => setWinRate(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 6, color: "var(--ink-2)", fontSize: 13 }}>
            Number of trades
            <input
              type="number"
              value={trades}
              onChange={(e) => setTrades(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Fees & slippage per trade</span>
            <strong style={{ color: "var(--amber-500)" }}>{fee.toFixed(2)}%</strong>
          </div>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--amber-500)" }}
          />
        </div>

        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "var(--surface-2)",
            border: "1px solid var(--line-2)",
            display: "grid",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ color: "var(--ink-2)", fontSize: 13 }}>Declared</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "var(--amber-500)" }}>+{declared}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--ink-2)", fontSize: 13 }}>Reality (fees included)</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "var(--emerald-500)" }}>+{reality.toFixed(1)}%</div>
            </div>
          </div>

          <div style={{ height: 14, borderRadius: 8, background: "var(--line)", overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: `${Math.max(2, (reality / Math.max(declared, 1)) * 100)}%`,
                background: "var(--emerald-500)",
                transition: "width .2s",
              }}
            />
          </div>

          <div style={{ color: "var(--ink-2)", fontSize: 14 }}>
            That&apos;s <strong style={{ color: "var(--risk-500)" }}>{ratio}× less</strong> than declared
            ({lost} points lost to fees over {trades} trades).
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/configure"
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
              background: "var(--emerald-500)",
              color: "#06110d",
            }}
          >
            Audit my real numbers
          </Link>
          <Link
            href="/score"
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid var(--line-2)",
              color: "var(--ink-1)",
            }}
          >
            Score my strategy
          </Link>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: 10,
  fontSize: 16,
  background: "var(--surface-2)",
  color: "var(--ink-1)",
  border: "1px solid var(--line-2)",
};
