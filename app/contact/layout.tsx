import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact StratVerity",
  description:
    "Contact the StratVerity team for questions about backtest audits, strategy verification, pricing, or support for Pine Script and Python trading systems.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact StratVerity",
    description:
      "Questions about backtest audits or strategy verification? Contact StratVerity.",
    type: "website",
    url: "https://www.stratverity.com/contact",
    siteName: "StratVerity",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
