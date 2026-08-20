import type { Metadata } from "next";

// Métadonnées de section de la page de certification (pattern des autres
// routes : app/configure/layout.tsx, app/contact/layout.tsx, …).
export const metadata: Metadata = {
  title: {
    default: "StratVerity certification",
    template: "%s | StratVerity",
  },
  description:
    "Public StratVerity audit certification pages — robustness scores, out-of-sample validation and anti-overfitting checks for trading strategies.",
  openGraph: {
    siteName: "StratVerity",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

export default function CertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}