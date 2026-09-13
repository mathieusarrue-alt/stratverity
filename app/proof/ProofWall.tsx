"use client";

import { useState } from "react";

type Card = {
  seed: string;
  model: string;
  asset: string;
  window: string;
  digest: string;
  report_id: string;
  engine_version: string;
  verdict: string;
  checks: { PASS: number; FAIL: number; NOT_TESTED: number; WARNING: number };
  metrics: {
    net_profit: number;
    pf: { year: string; value: number } | null;
    max_dd_pct: number;
    trades: number;
  };
  equity: { t: string; v: number }[];
};

const GREEN = "#00FF9D";
const RED = "#EF4444";
const DIM = "#8B98A5";
const mono = { fontFamily: "var(--mono)" } as const;

function Sparkline({ equity }: { equity: Card["equity"] }) {
  const pts = equity;
  if (pts.length < 2) return <span style={{ color: DIM, fontSize: 12, ...mono }}>—</span>;
  const W = 132, H = 40, P = 3;
  const vs = pts.map((p) => p.v);
  const vmin = Math.min(...vs, 0);
  const vmax = Math.max(...vs, 0);
  const span = vmax - vmin || 1;
  const coords = pts.map((p, i) => {
    const x = P + (i / (pts.length - 1)) * (W - 2 * P);
    const y = H - P - ((p.v - vmin) / span) * (H - 2 * P);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = vs[vs.length - 1];
  const stroke = last >= 0 ? GREEN : RED;
  return (
    <svg width={W} height={H} style={{ display: "block" }} aria-hidden="true">
      <line x1={P} x2={W - P} y1={H / 2} y2={H / 2} stroke="rgba(255,255,255,.10)" strokeWidth={1} strokeDasharray="3 3" />
      <polyline points={coords.join(" ")} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1].split(",")[0]} cy={coords[coords.length - 1].split(",")[1]} r={2.6} fill={stroke} />
    </svg>
  );
}

function CardView({ card }: { card: Card }) {
  const m = card.metrics;
  const pillColor = card.verdict === "FAIL" ? RED : DIM;
  return (
    <article style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 22px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border-soft)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, letterSpacing: "-.01em" }}>{card.model}</span>
        <span style={{ ...mono, fontSize: 11, color: pillColor, border: `1px solid ${pillColor}66`, borderRadius: 6, padding: "2px 8px" }}>{card.verdict}</span>
      </div>
      <div style={{ color: DIM, fontSize: 12, ...mono }}>
        {card.asset} · {card.window.split("->").map((s) => s.trim().slice(0, 10)).join("→")}
      </div>
      <Sparkline equity={card.equity} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        {[
          ["PF net", m.pf ? `${m.pf.value.toFixed(2)}×` : "n/a", m.pf ? `(20${m.pf.year.slice(2)})` : ""],
          ["Net P&L", `${m.net_profit >= 0 ? "+" : ""}${m.net_profit.toFixed(2)}`, ""],
          ["Max DD", `${m.max_dd_pct.toFixed(4)}%`, ""],
        ].map(([label, val, sub]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: DIM, fontSize: 10.5 }}>{label}</span>
            <span style={{ ...mono, fontSize: 13.5, fontWeight: 700, color: label === "Net P&L" && m.net_profit >= 0 ? GREEN : label === "Net P&L" ? RED : undefined }}>{val}</span>
            <span style={{ color: DIM, fontSize: 10, ...mono }}>{sub}</span>
          </div>
        ))}
      </div>
      <div style={{ color: DIM, fontSize: 12, ...mono }}>
        seal <span style={{ color: "#E6EDF3" }}>{card.digest}</span>… · {m.trades} trades
      </div>
      <a href={`/verify/${card.digest}`} style={{ ...mono, fontSize: 12.5, fontWeight: 700, color: GREEN, textDecoration: "none", border: `1px solid ${GREEN}55`, borderRadius: 8, padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
        Verify seal →
      </a>
    </article>
  );
}

export function ProofWall({ cards }: { cards: Card[] }) {
  const assets = ["All assets", ...Array.from(new Set(cards.map((c) => c.asset)))];
  const verdicts = ["All verdicts", "FAIL", "NOT_TESTED"];
  const [asset, setAsset] = useState(assets[0]);
  const [verdict, setVerdict] = useState(verdicts[0]);

  const filtered = cards.filter(
    (c) => (asset === "All assets" || c.asset === asset) && (verdict === "All verdicts" || c.verdict === verdict)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {verdicts.map((v) => (
          <button key={v} onClick={() => setVerdict(v)} aria-pressed={verdict === v}
            style={{ ...mono, fontSize: 13, padding: "7px 14px", borderRadius: 999, cursor: "pointer", border: verdict === v ? `1px solid ${GREEN}` : "1px solid var(--border-soft)", color: verdict === v ? GREEN : DIM, background: "transparent" }}>
            {v}
          </button>
        ))}
        <span style={{ color: DIM, fontSize: 12, padding: "0 8px" }}>·</span>
        {assets.map((a) => (
          <button key={a} onClick={() => setAsset(a)} aria-pressed={asset === a}
            style={{ ...mono, fontSize: 13, padding: "7px 14px", borderRadius: 999, cursor: "pointer", border: asset === a ? `1px solid ${GREEN}` : "1px solid var(--border-soft)", color: asset === a ? GREEN : DIM, background: "transparent" }}>
            {a}
          </button>
        ))}
      </div>
      <p style={{ color: DIM, fontSize: 12.5, ...mono }}>{filtered.length}/{cards.length} seals</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 22 }}>
        {filtered.map((c) => <CardView key={c.seed} card={c} />)}
      </div>
    </div>
  );
}