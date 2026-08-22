"use client";

import { Code2, FileCode2, NotebookPen } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import styles from "./IntegrationsGrid.module.css";

/** Temporary local catalogue until messages.ts is regenerated from app-messages. */
const LOCAL: Record<string, { fr: string; en: string }> = {
  "integ.eyebrow": { fr: "FORMATS PRIS EN CHARGE", en: "SUPPORTED FORMATS" },
  "integ.title": { fr: "Votre stack, tel quel.", en: "Your stack, as-is." },
  "integ.lead": {
    fr: "Pine, Python ou notebook : déposez le fichier, nous recalculons les métriques sans exécuter d’ordres réels.",
    en: "Pine, Python or notebook: upload the file; we recompute metrics without placing real orders.",
  },
  "integ.pine.t": { fr: "TradingView Pine", en: "TradingView Pine" },
  "integ.pine.p": {
    fr: "Scripts .pine et exports de trades pour rejouer le backtest net de frais.",
    en: ".pine scripts and trade exports to replay the net-of-fees backtest.",
  },
  "integ.python.t": { fr: "Python & bots", en: "Python & bots" },
  "integ.python.p": {
    fr: "Scripts et dossiers Python compatibles pour qualification statique puis audit.",
    en: "Compatible Python scripts and folders for static qualification then audit.",
  },
  "integ.notebook.t": { fr: "Notebooks", en: "Notebooks" },
  "integ.notebook.p": {
    fr: "Notebooks de recherche : structure inspectée, code non exécuté sur le serveur public.",
    en: "Research notebooks: structure inspected, code not executed on the public server.",
  },
};

const k = (key: string) => key as MessageKey;

const ITEMS = [
  { key: "pine" as const, icon: FileCode2, tag: "Pine Script" },
  { key: "python" as const, icon: Code2, tag: "Python" },
  { key: "notebook" as const, icon: NotebookPen, tag: "Notebook" },
] as const;

export default function IntegrationsGrid() {
  const { t, locale } = useI18n();

  const tx = (key: string) => {
    const fromCatalogue = t(k(key));
    if (fromCatalogue && fromCatalogue !== key) return fromCatalogue;
    const local = LOCAL[key];
    if (!local) return key;
    return locale === "fr" ? local.fr : local.en;
  };

  return (
    <section className={styles.section} aria-labelledby="integrations-title">
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{tx("integ.eyebrow")}</span>
          <h2 id="integrations-title" className={styles.title}>
            {tx("integ.title")}
          </h2>
          <p className={styles.lead}>{tx("integ.lead")}</p>
        </div>

        <ul className={styles.grid}>
          {ITEMS.map(({ key, icon: Icon, tag }) => (
            <li key={key} className={styles.card}>
              <div className={styles.top}>
                <span className={styles.iconWrap} aria-hidden="true">
                  <Icon className={styles.icon} strokeWidth={1.9} />
                </span>
                <span className={styles.tag}>{tag}</span>
              </div>
              <h3 className={styles.cardTitle}>{tx(`integ.${key}.t`)}</h3>
              <p className={styles.cardText}>{tx(`integ.${key}.p`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
