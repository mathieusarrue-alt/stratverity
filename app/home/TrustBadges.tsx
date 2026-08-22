"use client";

import { Hash, EyeOff, Server, LockKeyhole } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { messages } from "../i18n/messages";
import type { MessageKey } from "../i18n/messages";
import styles from "./trust-badges.module.css";

/**
 * TrustBadges — réassurance de confiance (ledger, non-rétention, moteur
 * déterministe, anti look-ahead). Textes via le catalogue i18n 12 langues.
 * Design : CSS Modules + design tokens (palette --paper/--surface claire),
 * volontairement sans Tailwind ni framer-motion (aucune dépendance ajoutée).
 */
export default function TrustBadges() {
  const { locale } = useI18n();
  const localized = messages[locale] as Partial<Record<MessageKey, string>>;
  const t = (key: MessageKey) =>
    localized[key] ?? messages.en[key] ?? messages.fr[key];

  const badges: { key: MessageKey; titleKey: MessageKey; descKey: MessageKey; icon: typeof Hash }[] = [
    { key: "trust.hash", titleKey: "trust.hashTitle", descKey: "trust.hashDesc", icon: Hash },
    { key: "trust.retention", titleKey: "trust.retentionTitle", descKey: "trust.retentionDesc", icon: EyeOff },
    { key: "trust.deterministic", titleKey: "trust.deterministicTitle", descKey: "trust.deterministicDesc", icon: Server },
    { key: "trust.lookahead", titleKey: "trust.lookaheadTitle", descKey: "trust.lookaheadDesc", icon: LockKeyhole },
  ];

  return (
    <section aria-label={t("trust.heading")}>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div className={styles.card} key={badge.key}>
                <div className={styles.head}>
                  <div className={styles.icon} aria-hidden="true">
                    <Icon />
                  </div>
                  <div className={styles.body}>
                    <h3>{t(badge.titleKey)}</h3>
                    <p>{t(badge.descKey)}</p>
                  </div>
                </div>
                <div className={styles.meta}>
                  <span className={styles.dot} aria-hidden="true" />
                  <span>{t("trust.active")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}