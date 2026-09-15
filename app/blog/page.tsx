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
];

export default function BlogPage() {
  return <BlogList articles={articles} />;
}