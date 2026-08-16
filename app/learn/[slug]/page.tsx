import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../learn.module.css";

const articles = {
  "look-ahead-bias-backtest": {
    title: "Look-ahead bias in backtests",
    description:
      "Learn how future information sneaks into a backtest and why it can make a strategy look far stronger than it really is.",
    summary:
      "A strategy can appear profitable when the model sees bars that were not available at the time of decision-making. This is look-ahead bias, and it turns a plausible backtest into a false signal.",
    sections: [
      {
        heading: "What look-ahead bias is",
        body:
          "Look-ahead bias happens when a backtest uses information that the strategy would not have had when it needed to decide. Common examples include using the current bar to set a stop, reading a future close to decide a pivot, or relying on a confirmation that is only available after the trade has already been initiated.",
      },
      {
        heading: "Why it matters",
        body:
          "Once the future leaks in, the model can optimize its rules against information that would never have existed in real time. The result is a beautiful equity curve that cannot be replicated in a live or paper-trading environment.",
      },
      {
        heading: "How to check it",
        body:
          "Audit the signal timing at the exact decision point. Verify that each input uses data available at the bar close or the moment of the signal. The typical practical test is to confirm that the rule only depends on data from the current or previous bars, never on bars that come after the decision point.",
      },
    ],
  },
  "overfitting-trading-strategy": {
    title: "Overfitting a trading strategy",
    description:
      "A quick framework for recognizing curve-fitted strategy parameters that have no real edge outside the exact backtest window.",
    summary:
      "Overfitting occurs when a strategy is tuned to historical noise rather than reproducible structure. It often looks great in-sample and disappears as soon as you test on unseen data.",
    sections: [
      {
        heading: "The pattern to watch",
        body:
          "The clearest sign of overfitting is a parameter set that is excellent in-sample but unstable under small walk-forward changes. A strategy that only works when you choose a precise combination of inputs can be a statistical artifact rather than an edge.",
      },
      {
        heading: "Why walk-forward matters",
        body:
          "A walk-forward split keeps the model honest by measuring performance on data it never saw during tuning. If the same configuration only works in one narrow window, it is usually not a durable edge.",
      },
      {
        heading: "What to do instead",
        body:
          "Use a simple, clearly defined rule set. Keep the parameter space broad enough to avoid hand-picking a magical setup. Then validate the result on a holdout period and test the same logic across multiple instruments and timeframes.",
      },
    ],
  },
  "walk-forward-analysis-guide": {
    title: "Walk-forward analysis guide",
    description:
      "Understand how to run a walk-forward test that measures a strategy’s resilience instead of its ability to memorize a single cycle.",
    summary:
      "Walk-forward analysis is a disciplined way to estimate whether a strategy still works when the market regime changes. The idea is to tune on one segment, test on the next, and repeat the process consistently.",
    sections: [
      {
        heading: "How the method works",
        body:
          "You split the data into sequential windows, tune the model on an initial segment, and then measure performance on the following segment. The process repeats so the strategy is judged on how it performs when it has not seen the test period during optimization.",
      },
      {
        heading: "What good walk-forward results look like",
        body:
          "The best outcomes are not just positive returns. They combine stable profit factor, controlled drawdown, and a repeatable pattern across multiple windows. A strategy that wins only once or only on one instrument usually lacks robustness.",
      },
      {
        heading: "The core lesson",
        body:
          "A strategy that survives walk-forward testing is more likely to handle regime shifts without collapsing under data noise. It is one of the most practical ways to separate a real edge from a curve-fit story.",
      },
    ],
  },
} as const;

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = articles[params.slug as keyof typeof articles];

  if (!article) {
    return {
      title: "Article not found | StratVerity",
    };
  }

  const canonical = `/learn/${params.slug}`;

  return {
    title: `${article.title} | StratVerity`,
    description: article.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${article.title} | StratVerity`,
      description: article.description,
      type: "article",
      url: `https://www.stratverity.com${canonical}`,
    },
  };
}

export default function LearnArticlePage({ params }: { params: { slug: string } }) {
  const article = articles[params.slug as keyof typeof articles];

  if (!article) {
    notFound();
  }

  return (
    <main className={styles.article}>
      <Link href="/learn" className={styles.back}>
        ← Back to Learn
      </Link>

      <header>
        <span className={styles.kicker}>Trading research</span>
        <h1>{article.title}</h1>
        <p className={`${styles.lead} ${styles.articleLead}`}>{article.summary}</p>
      </header>

      <div className={styles.content}>
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>

      <div className={styles.ctaRow}>
        <Link href="/configure" className={styles.primary}>
          Audit my strategy
        </Link>
        <Link href="/learn" className={styles.secondary}>
          Explore more articles
        </Link>
      </div>
    </main>
  );
}
