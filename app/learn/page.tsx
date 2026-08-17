import type { Metadata } from "next";
import Link from "next/link";
import styles from "./learn.module.css";

const articles = [
  {
    slug: "look-ahead-bias-backtest",
    title: "Look-ahead bias in backtests",
    description:
      "Why a backtest that peeks into the future is a surprisingly common failure mode and how to test for it properly.",
  },
  {
    slug: "overfitting-trading-strategy",
    title: "Overfitting a trading strategy",
    description:
      "What overfitting looks like in practice and how walk-forward validation protects you from fragile parameter tuning.",
  },
  {
    slug: "walk-forward-analysis-guide",
    title: "Walk-forward analysis guide",
    description:
      "A practical framework for validating strategy quality without turning your research into a curve-fit artifact.",
  },
  {
    slug: "survivorship-bias-trading",
    title: "Survivorship bias in trading backtests",
    description:
      "Why testing only today's assets hides the strategies that failed and inflates your results.",
  },
  {
    slug: "monte-carlo-vs-walk-forward",
    title: "Monte Carlo vs walk-forward testing",
    description:
      "Two robustness tests that answer different questions about your strategy.",
  },
  {
    slug: "pine-script-backtest-pitfalls",
    title: "Common Pine Script backtest pitfalls",
    description:
      "The frequent mistakes in Pine Script backtests that inflate results.",
  },
] as const;

export const metadata: Metadata = {
  title: "Learn | StratVerity",
  description:
    "Learn how to audit strategies, detect bias, and validate trading systems with real evidence.",
  alternates: {
    canonical: "/learn",
  },
};

export default function LearnPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.kicker}>StratVerity learn</span>
        <h1>Evidence-based trading education</h1>
        <p className={styles.lead}>
          We translate strategy research into practical checks: bias detection, robustness,
          and the methods that keep a trading idea honest under out-of-sample pressure.
        </p>
      </header>

      <div className={styles.grid}>
        {articles.map((article) => (
          <Link key={article.slug} href={`/learn/${article.slug}`} className={styles.card}>
            <h2>{article.title}</h2>
            <p>{article.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
