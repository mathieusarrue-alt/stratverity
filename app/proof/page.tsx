import type { Metadata } from "next";
import { PROOF_META, PROOF_CARDS } from "./proof.data";
import { ProofWall } from "./ProofWall";

export const metadata: Metadata = {
  title: "Proof Wall — sealed audits | StratVerity",
  description:
    "Every seal certifies that a real audit was run and the report is immutable — not that the strategy makes money. We publish every verdict, including failures.",
  openGraph: {
    title: "StratVerity — Proof Wall",
    description:
      "Sealed SHA-256 audit reports, recomputed net of fees. We publish every verdict, including failures — a wall of only good grades would be worthless.",
    type: "website",
    url: "https://www.stratverity.com/proof",
  },
};

const GREEN = "#00FF9D";
const DIM = "#8B98A5";

export default function ProofPage() {
  const prov = PROOF_META;
  return (
    <main style={{ width: "min(1180px, calc(100% - 32px))", margin: "0 auto", padding: "52px 0 96px" }}>
      <span style={{ color: DIM, fontSize: 12, letterSpacing: ".14em", fontFamily: "var(--mono)" }}>
        PROOF WALL · {prov.count} SEALED AUDITS
      </span>
      <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(1.9rem, 4.5vw, 3rem)", letterSpacing: "-.04em", margin: "8px 0 14px" }}>
        Proof, not storytelling.
      </h1>

      {/* Ligne de confiance — positionnement trust */}
      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.12)",
          background: "var(--surface-2)",
          padding: "16px 20px",
          color: "#E6EDF3",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {"A seal certifies that an audit was run and the report is immutable — "}<span style={{ color: GREEN }}>not</span>{" that the strategy makes money. We publish every verdict, including failures. A wall of only good grades would be worthless."}
      </div>
      <p style={{ color: DIM, fontSize: 15, lineHeight: 1.6, margin: "6px 0 34px", maxWidth: 680 }}>
        Every number on every card comes from the engine&apos;s seal — nothing is typed by hand. Use the filters to see every verdict we publish.
      </p>

      <ProofWall cards={PROOF_CARDS} />

      {/* Mention lot initial */}
      <div
        style={{
          marginTop: 30,
          borderRadius: 12,
          border: "1px dashed rgba(255,255,255,.14)",
          padding: "12px 18px",
          color: DIM,
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
      >
        Initial batch: model strategies audited by the engine for demonstration purposes. Client seals appear as real audits complete.
      </div>

      {/* CTA */}
      <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <a
          href="/health-check"
          style={{
            fontFamily: "var(--mono)",
            fontWeight: 700,
            color: "#0B0E11",
            background: GREEN,
            borderRadius: 10,
            padding: "13px 22px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Get your strategy sealed →
        </a>
        <span style={{ color: DIM, fontSize: 13 }}>
          Free health-check first — then a full sealed audit from €19.
        </span>
      </div>
    </main>
  );
}