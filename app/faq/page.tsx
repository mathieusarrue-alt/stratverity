import type { Metadata } from "next";
import FAQSection from "@/components/faq/FAQSection";

export const metadata: Metadata = {
  title: "FAQ — Backtest Audit & Strategy Verification | StratVerity",
  description:
    "How StratVerity audits backtests, detects look-ahead bias, and documents evidence for Pine Script and Python strategies.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — StratVerity backtest verification & security",
    description:
      "Backtest auditing, look-ahead bias detection, evidence, scope, and pricing — answered.",
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
