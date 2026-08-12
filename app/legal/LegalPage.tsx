import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./legal.module.css";

export function LegalPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          STRAT<span>VERITY</span>
        </Link>
        <Link href="/configure">Retour au configurateur ↗</Link>
      </header>
      <article className={styles.article}>
        <span className={styles.status}>
          Bêta de recette · aucun paiement réel
        </span>
        <h1>{title}</h1>
        <p className={styles.lead}>{lead}</p>
        <p className={styles.meta}>
          Bundle beta-fr-2026-08-12-v1 · publié le 12 août 2026
        </p>
        {children}
        <nav className={styles.footer} aria-label="Documents juridiques">
          <Link href="/legal/terms">Conditions</Link>
          <Link href="/legal/privacy">Confidentialité</Link>
          <Link href="/legal/content-license">Licence de contenu</Link>
          <Link href="/legal/refunds">Rétractation</Link>
          <Link href="/legal/risk">Risques</Link>
        </nav>
      </article>
    </main>
  );
}

export { styles };
