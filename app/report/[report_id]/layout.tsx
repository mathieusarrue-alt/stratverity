import type { Metadata } from "next";

// Rapport partagé : couté indexable (report_id public mais page utilitaire).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "Rapport d'audit — StratVerity",
};