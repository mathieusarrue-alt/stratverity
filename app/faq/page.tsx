import type { Metadata } from "next";
import FAQSection from "@/components/faq/FAQSection";

export const metadata: Metadata = {
  title: "FAQ — Backtest Audit Scope, Evidence & Pricing | StratVerity",
  description:
    "How StratVerity handles supported strategy audits, source isolation, evidence, delivery, pricing and current format limitations.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — StratVerity backtest verification & security",
    description:
      "Supported audit scope, source isolation, evidence, delivery and current pricing — answered directly.",
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
