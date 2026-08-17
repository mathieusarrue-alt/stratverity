"use client";

import { useState } from "react";
import Link from "next/link";

type Check = {
  name: string;
  passed: boolean;
  detail: string;
};

function analyzeCode(code: string): { score: number; verdict: string; checks: Check[] } {
  const normalized = code.toLowerCase();
  const checks: Check[] = [];

  const lookahead =
    /request\.security/.test(normalized) &&
    /lookahead\s*=\s*barmerge\.lookahead_on/.test(normalized);
  checks.push({
    name: "Look-ahead / repaint",
    passed: !lookahead,
    detail: lookahead
      ? "Uses future data via request.security lookahead."
      : "No obvious future-data reference detected.",
  });

  const missingFees =
    !/commission/.test(normalized) && !/slippage/.test(normalized);
  checks.push({
    name: "Fees & slippage",
    passed: !missingFees,
    detail: missingFees
      ? "No commission or slippage modeled — the edge may be gross, not net."
      : "Commission / slippage is modeled.",
  });

  const paramCount = (code.match(/input\s+/gi) || []).length;
  const overfit = paramCount > 8;
  checks.push({
    name: "Overfitting risk",
    passed: !overfit,
    detail: overfit
      ? `${paramCount} input parameters — high curve-fitting risk.`
      : `${paramCount} input parameters — acceptable.`,
  });

  const hasWalkForward =
    /walk.?forward/.test(normalized) || /out.?of.?sample/.test(normalized) || /oos/.test(normalized);
  checks.push({
    name: "Walk-forward / OOS",
    passed: hasWalkForward,
    detail: hasWalkForward
      ? "Walk-forward or out-of-sample validation present."
      : "No walk-forward or out-of-sample validation mentioned.",
  });

  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);

  let verdict: string;
  if (score >= 75) verdict = "Looks credible — but verify independently.";
  else if (score >= 50) verdict = "Several red flags — do not trust the numbers yet.";
  else verdict = "Your backtest is likely lying to you.";

  return { score, verdict, checks };
}

export default function ScorePage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ score: number; verdict: string; checks: Check[] } | null>(null);

  const runScore = () => {
    if (!code.trim()) return;
    setResult(analyzeCode(code));
  };

  const tone = result
    ? result.score >= 75
      ? "var(--emerald-500)"
      : result.score >= 50
        ? "var(--amber-500)"
        : "var(--risk-500)"
    : "var(--ink-3)";

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 80px" }}>
      <header style={{ marginBottom: 28 }}>
        <span style={{ color: "var(--emerald-500)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
          Free tool
        </span>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "8px 0 12px" }}>
          Your backtest is <span style={{ color: "var(--risk-500)" }}>lying to you.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: 17, maxWidth: 620 }}>
          Paste your Pine Script or Python strategy. Get a credibility score in seconds —
          look-ahead, missing fees, and overfitting, flagged one by one.
        </p>
      </header>

      <section style={{ display: "grid", gap: 16 }}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={"// Paste your Pine Script or Python strategy here…\n//@version=5\nstrategy('My strategy', overlay=true)\nstrategy.entry('Long', strategy.long)"}
          rows={10}
          style={{
            width: "100%",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontFamily: "var(--font-mono-loaded), monospace",
            background: "var(--surface-2)",
            color: "var(--ink-1)",
            border: "1px solid var(--line-2)",
            resize: "vertical",
          }}
        />
        <button
          onClick={runScore}
          disabled={!code.trim()}
          style={{
            padding: "14px 24px",
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 10,
            border: "none",
            cursor: code.trim() ? "pointer" : "not-allowed",
            background: code.trim() ? "var(--emerald-500)" : "var(--line-2)",
            color: code.trim() ? "#06110d" : "var(--ink-3)",
          }}
        >
          Score my strategy
        </button>
      </section>

      {result && (
        <section style={{ marginTop: 32, padding: 24, borderRadius: 16, background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `6px solid ${tone}`,
                fontSize: 34,
                fontWeight: 900,
                color: tone,
              }}
            >
              {result.score}/100
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{result.verdict}</div>
              <p style={{ color: "var(--ink-2)", fontSize: 14 }}>
                Illustrative demo score. The full audit recomputes real metrics and ties every
                number to the evidence.
              </p>
            </div>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "grid", gap: 10 }}>
            {result.checks.map((check) => (
              <li
                key={check.name}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: 12,
                  borderRadius: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--line-2)",
                }}
              >
                <span style={{ color: check.passed ? "var(--emerald-500)" : "var(--risk-500)", fontWeight: 900 }}>
                  {check.passed ? "✓" : "✕"}
                </span>
                <div>
                  <div style={{ fontWeight: 700 }}>{check.name}</div>
                  <div style={{ color: "var(--ink-2)", fontSize: 13 }}>{check.detail}</div>
                </div>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
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
              Get the full audit
            </Link>
            <Link
              href="/learn"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: "none",
                border: "1px solid var(--line-2)",
                color: "var(--ink-1)",
              }}
            >
              Learn how to fix it
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
