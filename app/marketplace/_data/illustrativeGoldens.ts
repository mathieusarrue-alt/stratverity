// Lab goldens shown on /marketplace as an ILLUSTRATIVE vitrine.
// Numbers come only from artifacts/goldens/*/metrics_ref.json.
// Not a live seller catalogue. Not a performance promise.
//
// Lab score (documented, deterministic, 0-100):
//   0.45 * pfScore + 0.25 * wrScore + 0.20 * ddScore + 0.10 * nScore
//   pfScore = clamp((PF / 2) * 100, 0, 100)   // PF 2.0 -> 100
//   wrScore = clamp(winratePct, 0, 100)
//   ddScore = DD missing -> 50
//             else clamp((50 - |DD|) / 40 * 100, 0, 100)  // |DD| 10 -> 100, 50 -> 0
//   nScore  = clamp(nTrades, 0, 100)
//
// NEGATIVE_CONTROL never uses that formula as a quality claim:
// the card exists to show Python vs TradingView divergence.

export type HaloTone = "good" | "warn" | "bad";

export type MetricPair = {
  label: string;
  value: string;
  tone?: HaloTone;
  hint?: string;
};

export type IllustrativeGolden = {
  id: string;
  engine: string;
  title: string;
  symbol: string;
  timeframe: string;
  summary: string;
  shaShort: string;
  halo: HaloTone;
  score: number | null;
  scoreLabel: string;
  badges: string[];
  metrics: MetricPair[];
  notes: string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function labScore(input: {
  profitFactor: number;
  winratePct: number;
  maxDdPct: number | null;
  nTrades: number;
}): number {
  const pfScore = clamp((input.profitFactor / 2) * 100, 0, 100);
  const wrScore = clamp(input.winratePct, 0, 100);
  const ddScore =
    input.maxDdPct == null
      ? 50
      : clamp(((50 - Math.abs(input.maxDdPct)) / 40) * 100, 0, 100);
  const nScore = clamp(input.nTrades, 0, 100);
  return Math.round(0.45 * pfScore + 0.25 * wrScore + 0.2 * ddScore + 0.1 * nScore);
}

const pin001Score = labScore({
  profitFactor: 0.372,
  winratePct: 28.57,
  maxDdPct: 34.1,
  nTrades: 14,
});

const pin002Score = labScore({
  profitFactor: 4.34,
  winratePct: 83.33,
  maxDdPct: null,
  nTrades: 24,
});

export const ILLUSTRATIVE_GOLDENS: IllustrativeGolden[] = [
  {
    id: "G-PIN-001",
    engine: "Pine · lab golden",
    title: "Wolfe window B — XRP",
    symbol: "XRPUSDT",
    timeframe: "H4",
    summary:
      "Golden positif faible : 14 trades, PF 0.372, winrate 28,57 %. Le labo publie aussi les cas qui ne tiennent pas.",
    shaShort: "177d77c9…",
    halo: "bad",
    score: pin001Score,
    scoreLabel: `${pin001Score}/100`,
    badges: ["ILLUSTRATIVE", "LAB GOLDEN"],
    metrics: [
      { label: "Profit factor", value: "0.372", tone: "bad", hint: "TV + Python alignés" },
      { label: "Winrate", value: "28.57 %", tone: "bad" },
      { label: "Trades", value: "14" },
      { label: "Max DD (Python)", value: "34.1 %", tone: "warn", hint: "TV manquant dans la réf. 723" },
    ],
    notes: "metrics_ref.json · reconstructed_from_723 · n_trades et WR alignés TV/Python.",
  },
  {
    id: "G-PIN-002",
    engine: "Pine · lab golden",
    title: "Wolfe window B — SOL",
    symbol: "SOLUSDT",
    timeframe: "H4",
    summary:
      "Golden positif fort sur le même script : 24 trades, WR 83,33 %, PF TV 4.34. Écart PF Python connu (4.63).",
    shaShort: "177d77c9…",
    halo: "good",
    score: pin002Score,
    scoreLabel: `${pin002Score}/100`,
    badges: ["ILLUSTRATIVE", "LAB GOLDEN"],
    metrics: [
      { label: "Profit factor (TV)", value: "4.34", tone: "good", hint: "Python 4.63 · écart connu 0.29" },
      { label: "Winrate", value: "83.33 %", tone: "good" },
      { label: "Trades", value: "24" },
      { label: "Max DD", value: "n/d", hint: "Non régénéré dans la réf. 723" },
    ],
    notes: "Même SHA Pine que G-PIN-001. Parité n_trades / WR ; gap PF documenté.",
  },
  {
    id: "G-NEG-768",
    engine: "NEGATIVE_CONTROL",
    title: "Contrôle négatif — ETH",
    symbol: "ETHUSDT",
    timeframe: "H4",
    summary:
      "Fixture volontairement négatif : le comptage d'entrées est proche, les résultats économiques divergent. Pas une certification.",
    shaShort: "a0824d6c…",
    halo: "warn",
    score: null,
    scoreLabel: "CTRL",
    badges: ["ILLUSTRATIVE", "NEGATIVE_CONTROL"],
    metrics: [
      { label: "PF TV / Python", value: "1.19 / 2.63", tone: "warn", hint: "must_not_match" },
      { label: "WR TV / Python*", value: "38.2 / 54.3 %", tone: "warn", hint: "*convention TV" },
      { label: "Trades (conv. TV)", value: "34 / 35" },
      { label: "Max DD (TV)", value: "8.1 %" },
    ],
    notes: "Fenêtre 2022-05-19 → 2026-07-25. Parité d'entrée seule — pas de parité de résultat.",
  },
];
