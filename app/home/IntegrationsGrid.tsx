"use client";

import { LineChart, Braces } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { messages } from "../i18n/messages";
import type { MessageKey } from "../i18n/messages";
import styles from "./integrations-grid.module.css";

/**
 * IntegrationsGrid — langages / plateformes audités (Pine, MQL5, Python).
 * Textes via catalogue i18n 12 langues. CSS Modules + design tokens clairs.
 */
export default function IntegrationsGrid() {
  const { locale } = useI18n();
  const localized = messages[locale] as Partial<Record<MessageKey, string>>;
  const t = (key: MessageKey) =>
    localized[key] ?? messages.en[key] ?? messages.fr[key];

  const items: { key: MessageKey; titleKey: MessageKey; platformKey: MessageKey; descKey: MessageKey; statusKey: MessageKey; icon: typeof Braces }[] = [
    { key: "integ.pine", titleKey: "integ.pine", platformKey: "integ.pinePlatform", descKey: "integ.pineDesc", statusKey: "integ.statusParser", icon: LineChart },
    { key: "integ.mql", titleKey: "integ.mql", platformKey: "integ.mqlPlatform", descKey: "integ.mqlDesc", statusKey: "integ.statusEngine", icon: Braces },
    { key: "integ.python", titleKey: "integ.python", platformKey: "integ.pythonPlatform", descKey: "integ.pythonDesc", statusKey: "integ.statusRuntime", icon: Braces },
  ];

  return (
    <section aria-label={t("integ.heading")}>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div className={styles.card} key={item.key}>
                <div className={styles.top}>
                  <div className={styles.icon} aria-hidden="true">
                    <Icon />
                  </div>
                  <span className={styles.status}>{t(item.statusKey)}</span>
                </div>
                <div className={styles.body}>
                  <h3>{t(item.titleKey)}</h3>
                  <p className={styles.platform}>{t(item.platformKey)}</p>
                  <p>{t(item.descKey)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}