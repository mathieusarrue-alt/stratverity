"use client";

import Link from "next/link";
import styles from "../auth.module.css";
import { useI18n } from "../i18n/I18nProvider";

export default function AccountContent({ user, signOutPath }: { user: { displayName: string; email: string }; signOutPath: string }) {
  const { t } = useI18n();
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "S";
  return <main className={styles.page}><div className={styles.accountShell}><section className={styles.accountCard} data-premium-surface>
    <span className={styles.cardLabel}>{t("account.label")}</span>
    <h1>{t("account.welcome", { name: user.displayName })}</h1><p>{t("account.intro")}</p>
    <div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{initial}</span><div><strong>{user.displayName}</strong><small>{user.email}</small></div><span className={styles.status}>{t("account.verified")}</span></div>
    <div className={styles.actions}><Link className={styles.actionCard} href="/configure" data-premium-surface><strong>{t("account.audit")}</strong><small>{t("account.auditHelp")}</small></Link><Link className={styles.actionCard} href="/#method" data-premium-surface><strong>{t("account.method")}</strong><small>{t("account.methodHelp")}</small></Link></div>
    <Link className={styles.signOut} href={signOutPath}>{t("account.signOut")}</Link>
  </section></div></main>;
}
