"use client";

import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import styles from "../legal/legal.module.css";

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <main className={styles.page}>
      <article className={styles.article} data-premium-surface>
        <span className={styles.status}>{t("contact.status")}</span>
        <h1>{t("contact.title")}</h1>
        <p className={styles.lead}>{t("contact.lead")}</p>
        <section data-premium-surface>
          <h2>{t("contact.emailTitle")}</h2>
          <p><a href="mailto:support@stratverity.com">support@stratverity.com</a></p>
          <p>{t("contact.emailNote")}</p>
        </section>
        <section data-premium-surface>
          <h2>{t("contact.businessTitle")}</h2>
          <p>{t("contact.businessBody")}</p>
        </section>
        <nav className={styles.footer} aria-label={t("common.contact")}>
          <Link href="/configure">{t("contact.auditCta")}</Link>
          <Link href="/legal/privacy">{t("contact.privacyCta")}</Link>
        </nav>
      </article>
    </main>
  );
}
