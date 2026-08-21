// Stratégies modèles auditées — données locales de démonstration (vitrine).
// Ces entrées sont des EXEMPLES ILLUSTRATIFS (pas de vrais produits à vendre) :
// elles illustrent le format final d'une fiche certifiée. La doctrine
// anti-simulation impose de ne jamais présenter un exemple comme un produit réel.

export type StrategyMetric = {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad";
};

export type ModelStrategy = {
  id: string;
  sha256: string;
  title: string;
  engine: "PineScript v5" | "MQL5" | "Python";
  asset: string;
  timeframe: string;
  period: string;
  robustnessScore: number;
  netReturn: string;
  maxDrawdown: string;
  winRate: string;
  profitFactor: string;
  badges: string[];
  summary: string;
};

export const modelStrategies: ModelStrategy[] = [
  {
    id: "model-wolfe-rsi",
    sha256: "9f2c4a7e1b8d3f0c6a5e2d9b7c4f1a8e3d6b0c9a2f5e7d4b1c8a3f6e9d2c5b",
    title: "Wolfe Wave + RSI Confluence",
    engine: "PineScript v5",
    asset: "BTCUSDT",
    timeframe: "4H",
    period: "2021-01 → 2026-07",
    robustnessScore: 87,
    netReturn: "+184.2%",
    maxDrawdown: "12.4%",
    winRate: "61.8%",
    profitFactor: "2.31",
    badges: ["Look-ahead: clean", "Walk-forward: stable", "Certified"],
    summary:
      "Reconnaissance des vagues de Wolfe avec confirmation RSI. Recalculée sur 5 ans de bougies, walk-forward stable hors échantillon.",
  },
  {
    id: "model-divergence",
    sha256: "3c8d1f2a9b4e6d0c7a5f3b1e8d2c6f9a0b4e7d3c1f8a5b2e6d9c0f4a7b3e1d",
    title: "Hidden Divergence Trend-Following",
    engine: "PineScript v5",
    asset: "ETHUSDT",
    timeframe: "1D",
    period: "2022-03 → 2026-07",
    robustnessScore: 76,
    netReturn: "+96.7%",
    maxDrawdown: "18.2%",
    winRate: "54.3%",
    profitFactor: "1.72",
    badges: ["Look-ahead: clean", "Multi-asset: 6/8 positive"],
    summary:
      "Divergences cachées RSI/prix sur tendance confirmée. Validée sur une corbeille de 8 actifs, 6 positifs hors échantillon.",
  },
  {
    id: "model-breakout",
    sha256: "b7e3c9d5a1f8b2e6c4d0a7f3b1e5c9d2a8f4e0b6c3d7a1f5e9b2c8d0a4f6",
    title: "Volume-Confirmed Breakout",
    engine: "MQL5",
    asset: "XAUUSD",
    timeframe: "1H",
    period: "2023-06 → 2026-07",
    robustnessScore: 68,
    netReturn: "+52.4%",
    maxDrawdown: "24.6%",
    winRate: "48.9%",
    profitFactor: "1.41",
    badges: ["Fees included", "Slippage 2×: stable"],
    summary:
      "Cassures confirmées par volume anormal. Stress-test frais ×3 et slippage ×2 : l'avantage se maintient mais s'amenuise.",
  },
  {
    id: "model-meanrev",
    sha256: "5a1f9c3d7b2e8a4f6c0d5b1e3a7f9c2d8b4e0a6f3c1d7b5e9a2f8c4d0b6e",
    title: "Statistical Mean-Reversion",
    engine: "Python",
    asset: "SOLUSDT",
    timeframe: "15m",
    period: "2024-01 → 2026-07",
    robustnessScore: 59,
    netReturn: "+31.8%",
    maxDrawdown: "28.9%",
    winRate: "52.1%",
    profitFactor: "1.18",
    badges: ["Overfit: borderline", "Review recommended"],
    summary:
      "Retour à la moyenne par z-score. Rentable mais fragile : la fenêtre unique gonfle le résultat, revue de robustesse recommandée.",
  },
  {
    id: "model-grid",
    sha256: "e9b5a1f7c3d2b8e4a6f0c5d1b7e3a9f2c8d4b0e6a3f1c7d5b9e2a8f4c0d6b",
    title: "Grid + Range Detection",
    engine: "MQL5",
    asset: "EURUSD",
    timeframe: "5m",
    period: "2023-11 → 2026-07",
    robustnessScore: 44,
    netReturn: "+18.3%",
    maxDrawdown: "34.7%",
    winRate: "46.2%",
    profitFactor: "1.04",
    badges: ["Martingale risk: flagged", "Not certified"],
    summary:
      "Grille en range avec détection de consolidation. Drawdown élevé et motif proche d'une martingale : refusé à la certification.",
  },
];

export function formatSha(sha: string): string {
  return `${sha.slice(0, 12)}…${sha.slice(-8)}`;
}

export function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}