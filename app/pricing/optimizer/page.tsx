import type { Metadata } from "next";
import Link from "next/link";
import ComparisonTable, { type ComparisonTier, type FeatureGroup } from "../ComparisonTable";
import ReportExample from "../ReportExample";
import styles from "../pricing.module.css";

/**
 * /pricing/optimizer — comparatif des 3 paliers Optimiseur/Lab (149 / 299 / 549 €).
 * Tarifs et contenu validés par étude de marché (voir 800_LAB_PRODUCT_SPEC.md §7,
 * décisions du 27/08/2026). Le checkout self-serve est prêt côté frontend :
 * chaque CTA mène au configurateur (`/configure?product=OPTIMIZER&depth=…`).
 * L'activation en prod du flag backend
 * (`STRATVERITY_OPTIMIZER_CHECKOUT_ENABLED`, fail-closed) est décidée
 * séparément par le fondateur.
 */

export const metadata: Metadata = {
  title: "Tarifs Optimiseur / Lab — StratVerity",
  description:
    "Comparez les 3 paliers de l'Optimiseur StratVerity : Essentiel, Pro et Elite. Recherche de paramètres avec garde-fous anti-surapprentissage, PBO, walk-forward roulant et Monte-Carlo.",
};

const TIERS: ComparisonTier[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: "149 €",
    priceNote: "/ stratégie",
    tagline: "Une optimisation contrainte par ton drawdown max, avec le garde-fou anti-surapprentissage inclus.",
    cta: {
      label: "Démarrer — Essentiel",
      href: "/configure?product=OPTIMIZER&depth=ESSENTIAL",
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: "299 €",
    priceNote: "/ stratégie",
    tagline: "Validation complète : walk-forward roulant, Monte-Carlo et généralisation multi-actifs.",
    cta: {
      label: "Démarrer — Pro",
      href: "/configure?product=OPTIMIZER&depth=PRO",
    },
    highlight: true,
    badge: "★ Palier de référence",
  },
  {
    id: "elite",
    name: "Elite",
    price: "549 €",
    priceNote: "/ stratégie",
    tagline: "Tout Pro, plus le stress-test par régime et un artefact prêt à déployer.",
    cta: {
      label: "Démarrer — Elite",
      href: "/configure?product=OPTIMIZER&depth=ELITE",
    },
  },
];

const GROUPS: FeatureGroup[] = [
  {
    title: "Optimisation & anti-surapprentissage",
    rows: [
      { label: "Recherche de paramètres contrainte par ton drawdown max", values: [true, true, true] },
      { label: "Probability of Backtest Overfitting (PBO) affichée", values: [true, true, true] },
      { label: "Écart d'optimisme mesuré (résultat in-sample vs hors-échantillon)", values: [true, true, true] },
      {
        label: "Configs recommandées",
        values: ["Top-3 robustes", "Sélection dégonflée (OOS médian, CSCV)", "Sélection dégonflée (OOS médian, CSCV)"],
      },
      { label: "Walk-forward roulant purgé (embargo)", values: [false, true, true] },
      { label: "Simulation Monte-Carlo (p5 / p50 / p95)", values: [false, true, true] },
    ],
  },
  {
    title: "Périmètre testé",
    rows: [
      { label: "Généralisation multi-actifs", values: [false, true, true] },
      { label: "Test multi-unités de temps", values: [false, false, true] },
      { label: "Stress-test par régime de marché", values: [false, false, true] },
    ],
  },
  {
    title: "Livrable",
    rows: [
      { label: "Rapport de verdict (PBO, dégradation OOS, attentes réalistes)", values: [true, true, true] },
      { label: "Fréquence de trading affichée (trades / an)", values: [true, true, true] },
      { label: "Filtres et paramètres rejetés listés (transparence)", values: [true, true, true] },
      { label: "Artefact prêt à déployer (Pine / EA / bot Python)", values: [false, false, true] },
      { label: "Votre stratégie réécrite avec la config gagnante", values: [false, false, true] },
      { label: "Prompt d'édition fourni (ajuster vous-même, sans coder)", values: [false, false, true] },
      { label: "Paper-trading avant mise en réel", values: [false, false, true] },
      { label: "Passerelle vers Auto-Pilot (exécution automatisée)", values: [false, false, true] },
    ],
  },
];

export default function OptimizerPricingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Tarifs · Optimiseur / Lab</span>
        <h1>
          L&apos;optimisation qui <em>ne se ment pas à elle-même.</em>
        </h1>
        <p>
          L&apos;optimisation native de MetaTrader ou TradingView cherche les meilleurs paramètres
          sur l&apos;historique qu&apos;elle vient de voir — le piège classique du surapprentissage.
          L&apos;Optimiseur StratVerity applique la même discipline que notre recherche interne :
          validation hors-échantillon obligatoire et détection explicite des faux gagnants, à
          chaque palier.
        </p>
        <p className={styles.softNote}>
          On ne vend pas la meilleure courbe, on vend un verdict de robustesse — voir{" "}
          <Link href="/#research">les biais qu&apos;on détecte sur l&apos;Audit →</Link>
        </p>
      </section>

      <ComparisonTable
        tiers={TIERS}
        groups={GROUPS}
        footNote="Prix hors TVA (franchise en base), paiement unique par stratégie. Paiement sécurisé par Stripe, livraison automatique du rapport Optimiseur une fois la commande confirmée. L'Optimiseur accepte actuellement le Python (.py) — Pine et MQL arrivent bientôt. Outil analytique, aucun conseil en investissement : performance passée ≠ performance future."
      />

      <ReportExample variant="optimizer" />

      <section className={styles.ctaBand}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(22px,2.6vw,32px)" }}>
          Envie de cumuler Audit et Optimiseur ?
        </h2>
        <p>
          Constater d&apos;abord ce que ta stratégie vaut réellement, puis chercher ce qui
          l&apos;améliore sans la sur-ajuster — les deux moteurs partagent la même définition du
          robuste.
        </p>
        <Link className="btn btn-primary" style={{ marginTop: 18 }} href="/contact">
          Nous contacter
        </Link>
      </section>
    </main>
  );
}
