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
];

export default function BlogPage() {
  return <BlogList articles={articles} />;
}