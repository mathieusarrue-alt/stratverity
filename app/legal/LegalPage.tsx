"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./legal.module.css";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

export function LegalPage({
  titleKey,
  leadKey,
  children,
}: {
  titleKey: MessageKey;
  leadKey: MessageKey;
  children: ReactNode;
}) {
  const { locale, t } = useI18n();
  return (
    <main className={styles.page}>
      <article className={styles.article} data-premium-surface>
        <span className={styles.status}>
          {t("legal.status")}
        </span>
        <h1>{t(titleKey)}</h1>
        <p className={styles.lead}>{t(leadKey)}</p>
        <p className={styles.meta}>
          {t("legal.meta")}
        </p>
        {locale !== "fr" ? (
          <p className={styles.warning}>{t("legal.translationNotice")}</p>
        ) : null}
        {children}
        <nav className={styles.footer} aria-label={t("legal.nav")}>
          <Link href="/legal/terms">{t("common.conditions")}</Link>
          <Link href="/legal/privacy">{t("common.privacy")}</Link>
          <Link href="/legal/content-license">{t("common.contentLicense")}</Link>
          <Link href="/legal/refunds">{t("legal.refunds")}</Link>
          <Link href="/legal/risk">{t("common.risks")}</Link>
        </nav>
      </article>
    </main>
  );
}

export { styles };
