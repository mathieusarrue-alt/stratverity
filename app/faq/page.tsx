import type { Metadata } from "next";
import FAQSection from "@/components/faq/FAQSection";

export const metadata: Metadata = {
  title: "FAQ — Backtest Verification, Auto-Pilot & Affiliate Program | StratVerity",
  description:
    "How StratVerity verifies backtests, detects look-ahead bias, secures non-custodial Auto-Pilot execution, and pays affiliate commissions. Answers to the most common questions.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — StratVerity backtest verification & security",
    description:
      "Backtest verification, look-ahead bias detection, Auto-Pilot API security, and the Affiliate Program — answered.",
    type: "website",
    url: "https://www.stratverity.com/faq",
    siteName: "StratVerity",
  },
};

export default function FaqPage() {
  return (
    <main style={{ width: "min(860px, calc(100% - 32px))", margin: "0 auto", padding: "76px 0 110px" }}>
      <FAQSection />
    </main>
  );
}