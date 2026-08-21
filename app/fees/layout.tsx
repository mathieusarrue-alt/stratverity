import type { Metadata } from "next";
import { requireSupabaseUser } from "../supabase/server";

export const metadata: Metadata = {
  title: "Fee & Slippage Reality Check",
  description:
    "See how commissions, spread and slippage eat your backtest edge. Interactive reality check for trading strategy returns.",
  alternates: {
    canonical: "/fees",
  },
  openGraph: {
    title: "Fee & Slippage Reality Check | StratVerity",
    description:
      "Watch your declared return melt when you add realistic fees and slippage.",
    type: "website",
    url: "https://www.stratverity.com/fees",
    siteName: "StratVerity",
  },
};

export default async function FeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate d'authentification : l'accès aux outils exige une session.
  await requireSupabaseUser("/fees");
  return <>{children}</>;
}
