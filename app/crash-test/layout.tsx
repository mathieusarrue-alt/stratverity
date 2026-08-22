import type { Metadata } from "next";
import { requireSupabaseUser } from "../supabase/server";

const CRASH_TEST_ENABLED =
  process.env.NEXT_PUBLIC_CRASH_TEST_ENABLED === "true";

export function generateMetadata(): Metadata {
  // Noindex conditionnel : le crash-test est une surface payante/expérimentale.
  // Tant que le feature flag est off, on évite l'indexation d'une page
  // non activée. À l'activation, la page devient indexable.
  const indexable = CRASH_TEST_ENABLED;
  return {
    robots: { index: indexable, follow: indexable },
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
}

export default async function CrashTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate d'authentification : l'accès aux outils exige une session.
  await requireSupabaseUser("/crash-test");
  return <>{children}</>;
}
