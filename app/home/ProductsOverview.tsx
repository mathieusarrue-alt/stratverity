"use client";

import Link from "next/link";
import { Gauge, ShieldCheck, SlidersHorizontal, Store } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ProductsOverview.module.css";

/**
 * Vue d'ensemble des produits — catégories seulement, sans détail, chaque
 * tuile renvoie vers sa page dédiée (exactement le comportement du header).
 * Réutilisé tel quel sur la landing page (remplace l'ancien bloc #pricing,
 * qui n'était qu'un tableau tarifaire Audit et laissait Optimiseur/Marketplace
 * sans prix ni page de destination) et sur /produits en page autonome.
 *
 * Catalogue local (comme IntegrationsGrid) : messages.ts est un fichier
 * généré, on n'y ajoute pas de clé à la main pour un bloc neuf.
 */
const LOCAL: Record<string, { fr: string; en: string }> = {
  "prod.eyebrow": { fr: "NOS PRODUITS", en: "OUR PRODUCTS" },
  "prod.title": { fr: "Un moteur, quatre façons de s'en servir.", en: "One engine, four ways to use it." },
  "prod.lead": {
    fr: "Chaque produit fait une seule chose et la fait bien — cliquez pour voir le détail et les tarifs.",
    en: "Each product does one thing well — click through for the detail and the pricing.",
  },
  "prod.free.tag": { fr: "Gratuit", en: "Free" },
  "prod.free.price": { fr: "0 €", en: "€0" },
  "prod.free.title": { fr: "Outils gratuits", en: "Free tools" },
  "prod.free.text": {
    fr: "Health-Check, calculateur de frais, score indicatif — en quelques secondes, sans envoyer votre code.",
    en: "Health-Check, fee calculator, indicative score — in seconds, without sending your code.",
  },
  "prod.audit.tag": { fr: "Constate", en: "Verifies" },
  "prod.audit.price": { fr: "dès 19 €", en: "from €19" },
  "prod.audit.title": { fr: "Audit", en: "Audit" },
  "prod.audit.text": {
    fr: "Ce qu'une stratégie vaut vraiment : recalcul net de frais, biais détectés, score de robustesse certifié.",
    en: "What a strategy is really worth: net-of-fees recompute, detected biases, certified robustness score.",
  },
  "prod.optimizer.tag": { fr: "Améliore", en: "Improves" },
  "prod.optimizer.price": { fr: "dès 149 €", en: "from €149" },
  "prod.optimizer.title": { fr: "Optimiseur", en: "Optimizer" },
  "prod.optimizer.text": {
    fr: "Cherche ce qui l'améliore sans la sur-ajuster : PBO, walk-forward roulant, Monte-Carlo, multi-actifs.",
    en: "Finds what improves it without over-fitting: PBO, rolling walk-forward, Monte-Carlo, multi-asset.",
  },
  "prod.marketplace.tag": { fr: "Déploie", en: "Deploys" },
  "prod.marketplace.price": { fr: "Accès protégé", en: "Protected access" },
  "prod.marketplace.title": { fr: "Marketplace", en: "Marketplace" },
  "prod.marketplace.text": {
    fr: "Stratégies déjà auditées et certifiées, en location ou en achat d'accès — jamais le code source.",
    en: "Already audited and certified strategies, rented or access-purchased — never the source code.",
  },
};

const ITEMS = [
  { key: "free", icon: Gauge, href: "/free-tools" },
  { key: "audit", icon: ShieldCheck, href: "/pricing/audit" },
  { key: "optimizer", icon: SlidersHorizontal, href: "/pricing/optimizer" },
  { key: "marketplace", icon: Store, href: "/marketplace" },
] as const;

export default function ProductsOverview() {
  const { locale } = useI18n();
  const tx = (key: string) => {
    const local = LOCAL[key];
    if (!local) return key;
    return locale === "fr" ? local.fr : local.en;
  };

  return (
    <section className={styles.section} aria-labelledby="products-overview-title">
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{tx("prod.eyebrow")}</span>
          <h2 id="products-overview-title" className={styles.title}>
            {tx("prod.title")}
          </h2>
          <p className={styles.lead}>{tx("prod.lead")}</p>
        </div>

        <ul className={styles.grid}>
          {ITEMS.map(({ key, icon: Icon, href }) => (
            <li key={key}>
              <Link className={styles.card} href={href}>
                <div className={styles.top}>
                  <span className={styles.iconWrap} aria-hidden="true">
                    <Icon className={styles.icon} strokeWidth={1.9} />
                  </span>
                  <span className={styles.tag}>{tx(`prod.${key}.tag`)}</span>
                </div>
                <h3 className={styles.cardTitle}>{tx(`prod.${key}.title`)}</h3>
                <p className={styles.cardText}>{tx(`prod.${key}.text`)}</p>
                <span className={styles.price}>{tx(`prod.${key}.price`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
