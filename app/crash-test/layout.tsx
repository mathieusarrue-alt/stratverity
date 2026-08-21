import type { Metadata } from "next";
import { requireSupabaseUser } from "../supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Crash-Test Express — Audit de stratégie à 49€",
  description:
    "Auditez votre stratégie Pine Script ou Python sans abonnement. Paiement unique 49€, rapport certifié avec score de robustesse, détection de look-ahead bias et recommandations.",
  alternates: {
    canonical: "/crash-test",
  },
  openGraph: {
    title: "Crash-Test Express — Audit de stratégie à 49€ | StratVerity",
    description:
      "Paiement unique 49€. Rapport d'audit certifié : score de robustesse, look-ahead bias, sur-optimisation, sensibilité au spread/slippage.",
    type: "website",
    url: "https://www.stratverity.com/crash-test",
    siteName: "StratVerity",
  },
};

export default async function CrashTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate d'authentification : l'accès aux outils exige une session.
  await requireSupabaseUser("/crash-test");
  return <>{children}</>;
}
