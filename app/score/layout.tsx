import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backtest Credibility Score",
  description:
    "Get a free credibility score for your backtest. Detect look-ahead bias, missing fees, and overfitting in seconds.",
  alternates: {
    canonical: "/score",
  },
  openGraph: {
    title: "Backtest Credibility Score | StratVerity",
    description:
      "Score your backtest in seconds. Detect look-ahead bias, missing fees, and overfitting before you risk real capital.",
    type: "website",
    url: "https://www.stratverity.com/score",
    siteName: "StratVerity",
  },
};

export default function ScoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Outil gratuit public : aucune session requise (cf. /free-tools et la FAQ).
  return <>{children}</>;
}
