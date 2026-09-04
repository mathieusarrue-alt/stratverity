import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Free Strategy Health Check — Pine Script, MQL4/5 & Python | StratVerity",
  description:
    "Scan trading strategy code for free in seconds. Get a 0-100 health score and detect look-ahead bias, repainting and structural issues in Pine Script, MQL4, MQL5 and Python.",
  keywords: [
    "health check gratuit",
    "scanner pine script gratuit",
    "verifier code pine script",
    "detecter lookahead bias",
    "MQL5 static code analyzer free",
    "testeur de bug robot de trading",
    "score de sante strategie trading",
    "analyse code trading gratuit",
  ],
  openGraph: {
    title:
      "Free Strategy Health Check — Pine Script, MQL4/5 & Python | StratVerity",
    description:
      "Scan trading strategy code for free in seconds. Detect look-ahead bias, repainting and structural issues in Pine Script, MQL and Python.",
  },
};

export default function HealthCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Outil gratuit public : aucune session requise (cf. /free-tools et la FAQ).
  return <>{children}</>;
}
