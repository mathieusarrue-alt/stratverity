import type { Metadata } from "next";
import { requireSupabaseUser } from "../supabase/server";

export const metadata: Metadata = {
  title: "Configure your strategy audit",
  description:
    "Choose your backtest audit scope: asset, timeframe, and plan. Upload a Pine Script or Python strategy and get an evidence-based verification.",
  alternates: {
    canonical: "/configure",
  },
  openGraph: {
    title: "Configure your strategy audit | StratVerity",
    description:
      "Pick your audit scope and upload your strategy. StratVerity recomputes metrics and detects bias.",
    type: "website",
    url: "https://www.stratverity.com/configure",
    siteName: "StratVerity",
  },
};

export default async function ConfigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login obligatoire avant /configure : source avant Stripe, session requise.
  await requireSupabaseUser("/configure");
  return <>{children}</>;
}
