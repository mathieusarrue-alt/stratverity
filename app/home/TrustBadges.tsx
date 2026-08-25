"use client";

import {
  ShieldCheck,
  Lock,
  Scale,
  BadgeCheck,
} from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import styles from "./TrustBadges.module.css";

/** Temporary local catalogue until messages.ts is regenerated from app-messages. */
const LOCAL: Record<string, { fr: string; en: string }> = {
  "trust.eyebrow": { fr: "PREUVES DE CONFIANCE", en: "TRUST SIGNALS" },
  "trust.title": { fr: "Des preuves, pas des promesses.", en: "Evidence, not promises." },
  "trust.lead": {
    fr: "Chaque audit est indépendant, le code reste privé, les badges sont scellés et une validation automatique précède toute livraison.",
    en: "Every audit is independent, code stays private, badges are sealed, and automatic audit precedes delivery.",
  },
  "trust.independent.t": { fr: "Audit indépendant", en: "Independent audit" },
  "trust.independent.p": {
    fr: "Tiers neutre : aucune affiliation avec les vendeurs de stratégies.",
    en: "Neutral third party: no affiliation with strategy sellers.",
  },
  "trust.private.t": { fr: "Code jamais partagé", en: "Code never shared" },
  "trust.private.p": {
    fr: "Analyse en lecture seule. Aucune publication ni revente de votre source.",
    en: "Read-only analysis. No publishing or resale of your source.",
  },
  "trust.sealed.t": { fr: "Badge scellé SHA-256", en: "SHA-256 sealed badge" },
  "trust.sealed.p": {
    fr: "Chaque certification est liée à l’empreinte immuable du code audité.",
    en: "Each certification is tied to the immutable fingerprint of the audited code.",
  },
  "trust.human.t": { fr: "Validation automatique obligatoire", en: "Mandatory automatic audit" },
  "trust.human.p": {
    fr: "Aucun rapport livré sans validation automatique des preuves et des limites.",
    en: "No report is delivered without automatic validation of evidence and limits.",
  },
};

const k = (key: string) => key as MessageKey;

const ITEMS = [
  { key: "independent" as const, icon: Scale },
  { key: "private" as const, icon: Lock },
  { key: "sealed" as const, icon: ShieldCheck },
  { key: "human" as const, icon: BadgeCheck },
] as const;

export default function TrustBadges() {
  const { t, locale } = useI18n();

  const tx = (key: string) => {
    const fromCatalogue = t(k(key));
    if (fromCatalogue && fromCatalogue !== key) return fromCatalogue;
    const local = LOCAL[key];
    if (!local) return key;
    return locale === "fr" ? local.fr : local.en;
  };

  return (
    <section className={styles.section} aria-labelledby="trust-badges-title">
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{tx("trust.eyebrow")}</span>
          <h2 id="trust-badges-title" className={styles.title}>
            {tx("trust.title")}
          </h2>
          <p className={styles.lead}>{tx("trust.lead")}</p>
        </div>

        <ul className={styles.grid}>
          {ITEMS.map(({ key, icon: Icon }) => (
            <li key={key} className={styles.card}>
              <span className={styles.iconWrap} aria-hidden="true">
                <Icon className={styles.icon} strokeWidth={1.9} />
              </span>
              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{tx(`trust.${key}.t`)}</h3>
                <p className={styles.cardText}>{tx(`trust.${key}.p`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
