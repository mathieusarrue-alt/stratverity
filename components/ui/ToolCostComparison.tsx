"use client";

import Link from "next/link";
import styles from "./ToolCostComparison.module.css";

export type ComparisonItem = {
  id: string;
  tool: string;
  dangerTitle: string;
  dangerBody: string;
  dangerCost: string;
  solutionLabel: string;
  solutionBody: string;
  solutionCost: string;
  ctaLabel: string;
  ctaHref: string;
};

/**
 * Comparaison factuelle entre un risque détectable et le périmètre réel du
 * diagnostic. Aucun montant de perte ni résultat client n'est extrapolé.
 */
export default function ToolCostComparison({ item }: { item: ComparisonItem }) {
  return (
    <div className={styles.grid}>
      {/* Carte danger */}
      <div className={styles.danger}>
        <div className={styles.dangerTitle}>{item.dangerTitle}</div>
        <p className={styles.dangerBody}>{item.dangerBody}</p>
        <div className={styles.dangerCost}>
          <span aria-hidden="true">❌</span>
          <span>{item.dangerCost}</span>
        </div>
      </div>

      {/* Carte solution */}
      <div className={styles.solution}>
        <span className={styles.badge}>{item.solutionLabel}</span>
        <p className={styles.solutionBody}>{item.solutionBody}</p>
        <p className={styles.solutionCost}>{item.solutionCost}</p>
        <Link href={item.ctaHref} className={styles.cta}>
          {item.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
