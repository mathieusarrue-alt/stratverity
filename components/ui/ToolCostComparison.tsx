"use client";

import Link from "next/link";
import type { ComparisonItem } from "@/config/comparison-data";
import styles from "./ToolCostComparison.module.css";

/**
 * ToolCostComparison — composant "Coût de la faille".
 * Layout côte à côte (empilé sur mobile <720px) : carte Danger (rouge) vs
 * carte Solution StratVerity (vert néon #00FF9D). Utilise les tokens CSS du thème.
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
        <span className={styles.badge}>Solution recommandée</span>
        <p className={styles.solutionBody}>{item.solutionBody}</p>
        <p className={styles.solutionCost}>{item.solutionCost}</p>
        <Link href={item.ctaHref} className={styles.cta}>
          {item.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
