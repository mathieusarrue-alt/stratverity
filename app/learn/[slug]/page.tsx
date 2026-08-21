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
  "survivorship-bias-trading": {
    title: "Survivorship bias in trading backtests",
    description:
      "Why testing only the assets that still exist today hides the strategies that failed and inflates your results.",
    summary:
      "Survivorship bias appears when a backtest universe only contains assets that still exist today. Strategies look stronger because the losers have already been removed from the sample.",
    sections: [
      {
        heading: "What survivorship bias is",
        body:
          "Survivorship bias happens when the test universe includes only assets or strategies that survived until today. Delisted stocks, failed funds, and abandoned strategies are missing, so the average performance is flattered.",
      },
      {
        heading: "Why it distorts results",
        body:
          "A strategy backtested on survivors looks more profitable than it really is, because every asset that went to zero has been silently removed. The real-world universe was harder than the test one.",
      },
      {
        heading: "How to reduce it",
        body:
          "Use a point-in-time universe that includes delisted assets, or test across a broad basket and discount results that rely on a few surviving names.",
      },
    ],
  },
  "monte-carlo-vs-walk-forward": {
    title: "Monte Carlo vs walk-forward testing",
    description:
      "Two robustness tests that answer different questions about your strategy.",
    summary:
      "Walk-forward checks whether your strategy still works on data it never saw. Monte Carlo reshuffles the trade sequence to test how fragile the result is to luck and order.",
    sections: [
      {
        heading: "What walk-forward answers",
        body:
          "Walk-forward answers whether the edge persists out-of-sample: tune on one window, test on the next, and repeat. It protects against overfitting to a single period.",
      },
      {
        heading: "What Monte Carlo answers",
        body:
          "Monte Carlo answers whether the result could be luck. By reshuffling trades or resampling equity, it shows how often the same edge appears by chance alone.",
      },
      {
        heading: "Use both together",
        body:
          "Neither test is enough alone. Walk-forward validates temporal stability, Monte Carlo validates statistical significance. A robust strategy should survive both.",
      },
    ],
  },
  "pine-script-backtest-pitfalls": {
    title: "Common Pine Script backtest pitfalls",
    description:
      "The frequent mistakes in Pine Script backtests that inflate results.",
    summary:
      "Pine Script is powerful but easy to misuse. Default settings, repainting indicators, and ignored fees are the most common ways a backtest oversells a strategy.",
    sections: [
      {
        heading: "Repainting indicators",
        body:
          "Indicators that change their past values as new bars arrive make a backtest look better than live trading. Confirm your signals are calculated only from confirmed bars.",
      },
      {
        heading: "Ignoring fees and slippage",
        body:
          "Pine backtests often run with no commissions, spread, or slippage. Add realistic costs or the edge disappears on the first live trade.",
      },
      {
        heading: "Default data and look-ahead",
        body:
          "Using default bars or referencing future values leaks information into the test. Verify the signal uses only data available at the bar close.",
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
  const url = `https://www.stratverity.com${canonical}`;
  const publishedTime = "2026-08-16T22:00:00Z";

  return {
    title: article.title,
    description: article.description,
    keywords: [
      article.title.toLowerCase(),
      "trading strategy",
      "backtest audit",
      "Pine Script",
      "Python trading",
      "bias detection",
    ],
    alternates: {
      canonical,
    },
    authors: [{ name: "StratVerity Research" }],
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url,
      siteName: "StratVerity",
      publishedTime,
      authors: ["StratVerity Research"],
      section: "Trading Research",
      images: [{ url: "https://www.stratverity.com/og.png", width: 1672, height: 941 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["https://www.stratverity.com/og.png"],
    },
  };
}

export default function LearnArticlePage({ params }: { params: { slug: string } }) {
  const article = articles[params.slug as keyof typeof articles];

  if (!article) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Organization",
      name: "StratVerity Research",
    },
    publisher: {
      "@type": "Organization",
      name: "StratVerity",
      url: "https://www.stratverity.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.stratverity.com/favicon.svg",
      },
    },
    datePublished: "2026-08-16T22:00:00Z",
    dateModified: "2026-08-16T22:00:00Z",
    mainEntityOfPage: `https://www.stratverity.com/learn/${params.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.stratverity.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Learn",
        item: "https://www.stratverity.com/learn",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://www.stratverity.com/learn/${params.slug}`,
      },
    ],
  };

  return (
    <main className={styles.article}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
        <Link href="/health-check" className={styles.primary}>
          Run the free code health check
        </Link>
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
