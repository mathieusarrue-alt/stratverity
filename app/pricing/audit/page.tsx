import type { Metadata } from "next";
import Link from "next/link";
import ComparisonTable, { type ComparisonTier, type FeatureGroup } from "../ComparisonTable";
import styles from "../pricing.module.css";

/**
 * /pricing/audit — comparatif détaillé des 3 paliers d'Audit (19 / 49 / dès 79 €).
 * Les 3 tarifs viennent de app/configure/pricing.ts (moteur de calcul réel, déjà
 * en production) — rien n'est inventé ici, uniquement présenté palier par palier.
 * Les 3 CTA renvoient vers /configure : les 3 profondeurs (ESSENTIAL/PREMIUM/CUSTOM)
 * y sont réellement sélectionnables en self-serve.
 */

export const metadata: Metadata = {
  title: "Tarifs Audit — StratVerity",
  description:
    "Comparez les 3 paliers d'Audit StratVerity : Essential, Premium et Custom. Recalcul net de frais, détection de biais, score de robustesse et certification SHA-256.",
};

const TIERS: ComparisonTier[] = [
  {
    id: "essential",
    name: "Essential",
    price: "19 €",
    priceNote: "/ stratégie",
    tagline: "Un contexte, la vérité recalculée. Le point d'entrée pour vérifier une stratégie.",
    cta: { label: "Choisir Essential", href: "/configure" },
  },
  {
    id: "premium",
    name: "Premium",
    price: "49 €",
    priceNote: "/ stratégie",
    tagline: "Le même contexte, analysé bien plus en profondeur — historique long, comparaisons poussées.",
    cta: { label: "Choisir Premium", href: "/configure" },
    highlight: true,
    badge: "★ Le plus choisi",
  },
  {
    id: "custom",
    name: "Custom",
    price: "dès 79 €",
    priceNote: "/ stratégie",
    tagline: "Plusieurs actifs et unités de temps dans un seul rapport, tarif dégressif au volume.",
    cta: { label: "Configurer un audit multi-contexte", href: "/configure" },
  },
];

const GROUPS: FeatureGroup[] = [
  {
    title: "Périmètre",
    rows: [
      { label: "Contextes (actif × unité de temps)", values: ["1", "1", "Illimité, payant"] },
      { label: "Historique couvert", values: ["2 ans", "8 ans", "10 ans"] },
      { label: "Stratégies par commande", values: ["1", "1", "Plusieurs"] },
    ],
  },
  {
    title: "Recalcul & détection de biais",
    rows: [
      { label: "Recalcul net de frais (commissions, spread, slippage)", values: [true, true, true] },
      { label: "Détection du look-ahead bias", values: [true, true, true] },
      { label: "Walk-forward hors-échantillon (70/30)", values: [true, true, true] },
      { label: "Rapport de divergence déclaré vs recalculé", values: ["Basique", "Approfondi", "Approfondi"] },
      { label: "Pistes de robustesse détaillées", values: [false, true, true] },
    ],
  },
  {
    title: "Score & certification",
    rows: [
      { label: "Score de robustesse (0–100)", values: [true, true, true] },
      { label: "Verdict CERTIFIED si score ≥ 70", values: [true, true, true] },
      { label: "Badge scellé SHA-256, vérifiable publiquement", values: [true, true, true] },
    ],
  },
  {
    title: "Formats & livraison",
    rows: [
      { label: "Pine Script, Python, MQL4/5", values: [true, true, true] },
      { label: "Validation humaine avant accès au rapport", values: [true, true, true] },
      { label: "Lien de téléchargement temporaire", values: [true, true, true] },
    ],
  },
];

export default function AuditPricingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Tarifs · Audit</span>
        <h1>
          Un audit, <em>pas un abonnement à des promesses.</em>
        </h1>
        <p>
          Les trois paliers partagent le même moteur — recalcul net de frais, détection de
          look-ahead, walk-forward hors-échantillon. Ce qui change : la profondeur d&apos;historique
          et le nombre de contextes couverts dans un même rapport.
        </p>
        <p className={styles.softNote}>
          Pas encore sûr ? <Link href="/free-tools">Testez le Health-Check gratuit d&apos;abord →</Link>
        </p>
      </section>

      <ComparisonTable
        tiers={TIERS}
        groups={GROUPS}
        footNote="Prix hors TVA (franchise en base). Paiement unique, sans reconduction automatique. Un backtest reste une mesure historique — aucune garantie de performance future."
      />

      <section className={styles.ctaBand}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(22px,2.6vw,32px)" }}>
          Plusieurs stratégies à faire passer, ou un déploiement clé en main ?
        </h2>
        <p>
          Le palier Custom couvre le multi-contexte à la carte. Pour un volume de stratégies ou
          un déploiement Auto-Pilot, on en discute directement.
        </p>
        <Link className="btn btn-primary" style={{ marginTop: 18 }} href="/contact">
          Nous contacter
        </Link>
      </section>
    </main>
  );
}
