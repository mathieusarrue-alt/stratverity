import BlogList, { type Article } from "@/components/BlogList";

export const metadata = {
  title: "Blog — Éducation Trading & Audit | StratVerity",
  description:
    "Guides pratiques, audits de stratégies, et insights sur le trading algorithmique.",
};

const articles: Article[] = [
  {
    slug: "comment-lire-backtest-honnete",
    title: "Comment lire un backtest honnête (sans se faire avoir)",
    excerpt:
      "80% des backtests que vous voyez sont faux. Apprenez les 5 métriques à vérifier et les questions à poser pour distinguer un backtest fiable d'un backtest trompeur.",
    date: "2026-09-14",
    readingTime: "8 min",
    tags: ["backtest", "audit", "éducation"],
  },
  {
    slug: "5-biais-trading",
    title: "5 biais qui faussent vos résultats de trading (et comment les détecter)",
    excerpt:
      "Look-ahead, overfitting, survivorship, cost model, data snooping. Les 5 biais les plus courants expliqués avec des exemples concrets et des méthodes de détection.",
    date: "2026-09-14",
    readingTime: "10 min",
    tags: ["biais", "trading", "éducation"],
  },
  {
    slug: "sharpe-ratio-explique",
    title: "Le Sharpe Ratio expliqué simplement",
    excerpt:
      "Ce que mesure vraiment le Sharpe Ratio, comment le lire, et pourquoi un chiffre trop élevé sur un backtest est presque toujours suspect.",
    date: "2026-09-16",
    readingTime: "6 min",
    tags: ["sharpe ratio", "risque", "éducation"],
  },
  {
    slug: "max-drawdown",
    title: "Max Drawdown : plus important que le profit",
    excerpt:
      "La mathématique de la récupération après une perte est brutale et asymétrique. Pourquoi le drawdown devrait toujours être regardé avant le rendement.",
    date: "2026-09-16",
    readingTime: "7 min",
    tags: ["max drawdown", "risque", "gestion du risque"],
  },
  {
    slug: "win-rate-vs-profit-factor",
    title: "Win Rate vs Profit Factor : lequel regarder en premier ?",
    excerpt:
      "Un winrate de 85% peut cacher une stratégie perdante. Un winrate de 35% peut être excellent. Comprendre le Profit Factor et le payoff ratio.",
    date: "2026-09-16",
    readingTime: "6 min",
    tags: ["win rate", "profit factor", "statistiques"],
  },
  {
    slug: "backtests-vendeurs-faux",
    title: "Pourquoi les backtests des vendeurs sont (souvent) faux",
    excerpt:
      "Look-ahead bias, overfitting, survivorship, coûts absents, data snooping : les mécanismes techniques — pas les intentions — derrière les backtests trompeurs.",
    date: "2026-09-16",
    readingTime: "8 min",
    tags: ["backtest", "biais", "vendeur stratégie"],
  },
  {
    slug: "esperance-mathematique-trading",
    title: "L'espérance mathématique : la seule métrique qui prédit si vous serez rentable",
    excerpt:
      "Le winrate se vend bien, le Profit Factor rassure, mais c'est l'espérance mathématique en R qui répond à la vraie question : ce processus, répété des centaines de fois, m'enrichit-il ?",
    date: "2026-09-17",
    readingTime: "7 min",
    tags: ["espérance mathématique", "expectancy", "R-multiple"],
  },
  {
    slug: "position-sizing-money-management",
    title: "Position sizing : pourquoi la meilleure stratégie du monde peut vous ruiner",
    excerpt:
      "Une stratégie à espérance positive peut quand même ruiner un compte si le dimensionnement des positions est mal calibré. Risque de ruine, ATR-sizing, Critère de Kelly.",
    date: "2026-09-17",
    readingTime: "8 min",
    tags: ["position sizing", "money management", "gestion du risque"],
  },
  {
    slug: "mql4-mql5-pine-script-differences",
    title: "MQL4 vs MQL5 vs Pine Script : ce que ça change pour auditer une stratégie",
    excerpt:
      "Repaint Pine Script, mode 'Open prices only' MQL4, netting vs hedging MQL5 : les pièges spécifiques à chaque langage qui faussent un backtest sans toucher à la logique de trading.",
    date: "2026-09-17",
    readingTime: "8 min",
    tags: ["MQL4", "MQL5", "Pine Script"],
  },
  {
    slug: "slippage-execution-backtest-realiste",
    title: "Slippage et exécution réelle : pourquoi votre backtest ment sur l'exécution",
    excerpt:
      "Latence, profondeur de marché, gaps sur les stops : ce qui sépare un prix théorique de signal d'un prix réel d'exécution, et comment le modéliser correctement.",
    date: "2026-09-17",
    readingTime: "7 min",
    tags: ["slippage", "exécution", "liquidité"],
  },
  {
    slug: "long-only-vs-long-short",
    title: "Long-only vs Long/Short : ce que ça change pour le risque et le backtest",
    excerpt:
      "Un backtest long-only flatteur peut simplement refléter un marché haussier. Ce que le short ajoute vraiment en termes de risque, de coûts et de robustesse.",
    date: "2026-09-17",
    readingTime: "7 min",
    tags: ["long/short", "exposition directionnelle", "gestion du risque"],
  },
  {
    slug: "robustesse-multi-actifs-backtest",
    title: "Robustesse multi-actifs : pourquoi une stratégie qui marche sur un seul actif ne suffit pas",
    excerpt:
      "Tester sur plusieurs actifs corrélés n'apporte presque aucune garantie supplémentaire. Comment estimer le nombre de vérifications réellement indépendantes.",
    date: "2026-09-17",
    readingTime: "8 min",
    tags: ["multi-actifs", "diversification", "généralisation"],
  },
];

export default function BlogPage() {
  return <BlogList articles={articles} />;
}