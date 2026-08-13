"use client";

import Link from "next/link";
import styles from "../auth.module.css";
import { useI18n } from "../i18n/I18nProvider";

type LoginUser = { displayName: string } | null;

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "Google") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.7 4.7 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" /><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" /><path fill="#fbbc05" d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3a10 10 0 0 0 0 9.3L6.4 14Z" /><path fill="#ea4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3 7.4l3.4 2.7C7.2 7.7 9.4 6 12 6Z" /></svg>;
  }
  if (provider === "Apple") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.1 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2.1c-1.6-.2-3.1.9-3.9.9-.8 0-2-1-3.3-.9a4.9 4.9 0 0 0-4.1 2.5c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.3-.9-2.3-3.5ZM14.5 5c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.9-1.4Z" /></svg>;
  }
  if (provider === "Microsoft") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f25022" d="M2 2h9.5v9.5H2z" /><path fill="#7fba00" d="M12.5 2H22v9.5h-9.5z" /><path fill="#00a4ef" d="M2 12.5h9.5V22H2z" /><path fill="#ffb900" d="M12.5 12.5H22V22h-9.5z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function LoginContent({ user, destination }: { user: LoginUser; destination: string }) {
  const { t } = useI18n();
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <span className={styles.eyebrow}>{t("login.eyebrow")}</span>
          <h1>{t("login.title")}<em>{t("login.titleAccent")}</em></h1>
          <p>{t("login.intro")}</p>
          <ul className={styles.trustList}><li>{t("login.trust.secure")}</li><li>{t("login.trust.minimal")}</li><li>{t("login.trust.noChats")}</li></ul>
        </section>
        <section className={styles.card} aria-labelledby="login-title" data-premium-surface>
          <span className={styles.cardLabel}>{t(user ? "login.sessionKnown" : "login.signIn")}</span>
          <h2 id="login-title">{user ? t("login.welcome", { name: user.displayName }) : t("login.continueTitle")}</h2>
          <p>{t(user ? "login.knownBody" : "login.newBody")}</p>
          <Link className={styles.primaryAction} href={destination}><span>{t(user ? "login.openAccount" : "login.continue")}</span><span aria-hidden="true">→</span></Link>
          {!user ? <><p className={styles.providerCaption}>{t("login.chooseMethod")}</p><div className={styles.providers} aria-label={t("login.methods")}>
            {["Google", "Apple", "Microsoft", "Email"].map((provider) => <Link className={styles.providerLink} href={destination} key={provider} aria-label={t("login.providerAria", { provider })}><ProviderIcon provider={provider} /><span>{provider}</span></Link>)}
          </div><p className={styles.providerNote}>{t("login.githubLater")}</p></> : null}
          <p className={styles.finePrint}>{t("login.finePrint")} · <Link href="/legal/privacy">{t("common.privacy")}</Link></p>
        </section>
      </div>
    </main>
  );
}
