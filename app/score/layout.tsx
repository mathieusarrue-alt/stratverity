import type { Metadata } from "next";
import { requireSupabaseUser } from "../supabase/server";

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

export default async function ScoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate d'authentification : l'accès aux outils exige une session.
  await requireSupabaseUser("/score");
  return <>{children}</>;
}
