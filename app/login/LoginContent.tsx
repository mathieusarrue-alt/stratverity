"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";
import { useI18n } from "../i18n/I18nProvider";
import { getSupabaseBrowserClient } from "../supabase/browser";
import type { SocialProvider } from "../supabase/config";

type LoginUser = { displayName: string; emailVerified: boolean } | null;

const providers: Array<{ label: string; value: SocialProvider }> = [
  { label: "Google", value: "google" },
  { label: "GitHub", value: "github" },
  { label: "Microsoft", value: "azure" },
];

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "Google") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.7 4.7 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" /><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" /><path fill="#fbbc05" d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3a10 10 0 0 0 0 9.3L6.4 14Z" /><path fill="#ea4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3 7.4l3.4 2.7C7.2 7.7 9.4 6 12 6Z" /></svg>;
  }
  if (provider === "GitHub") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.03 1.54 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0 1 12 6.84c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>;
  }
  if (provider === "Microsoft") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f25022" d="M2 2h9.5v9.5H2z" /><path fill="#7fba00" d="M12.5 2H22v9.5h-9.5z" /><path fill="#00a4ef" d="M2 12.5h9.5V22H2z" /><path fill="#ffb900" d="M12.5 12.5H22V22h-9.5z" /></svg>;
  }
  return null;
}

export default function LoginContent({
  user,
  returnTo,
  enabledProviders,
  authError,
}: {
  user: LoginUser;
  returnTo: string;
  enabledProviders: SocialProvider[];
  authError?: string | null;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const enabled = new Set(enabledProviders);

  const authErrorMessage = authError
    ? authError === "email_exists"
      ? t("login.emailExists")
      : t("login.authError")
    : null;

  function callbackUrl() {
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("return_to", returnTo);
    return url.toString();
  }

  async function signInWithProvider(provider: SocialProvider) {
    if (!enabled.has(provider)) return;
    setBusy(provider);
    setMessage(null);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setMessage(t("login.error"));
      setBusy(null);
    }
  }

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setBusy("email");
    setMessage(null);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: callbackUrl(),
        shouldCreateUser: true,
      },
    });
    setBusy(null);
    setMessage(t(error ? "login.error" : "login.linkSent"));
  }

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
          {user ? (
            <Link className={styles.primaryAction} href={returnTo}><span>{t("login.openAccount")}</span><span aria-hidden="true">→</span></Link>
          ) : (
            <>
              <form className={styles.emailForm} onSubmit={sendMagicLink}>
                <label htmlFor="login-email">{t("login.emailLabel")}</label>
                <div className={styles.emailRow}>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                  />
                  <button className={styles.primaryAction} disabled={busy !== null} type="submit">
                    <span>{t(busy === "email" ? "login.sending" : "login.sendLink")}</span><span aria-hidden="true">→</span>
                  </button>
                </div>
                <small>{t("login.emailHelp")}</small>
              </form>
              <p className={styles.providerCaption}>{t("login.chooseMethod")}</p>
              <div className={styles.providers} aria-label={t("login.methods")}>
                {providers.map(({ label, value }) => {
                  const isEnabled = enabled.has(value);
                  return (
                    <button
                      className={styles.providerLink}
                      type="button"
                      disabled={!isEnabled || busy !== null}
                      onClick={() => signInWithProvider(value)}
                      key={value}
                      title={!isEnabled ? t("login.providerUnavailable") : undefined}
                      aria-label={isEnabled
                        ? t("login.providerAria", { provider: label })
                        : t("login.providerUnavailableAria", { provider: label })}
                    >
                      <ProviderIcon provider={label} /><span>{label}</span>
                    </button>
                  );
                })}
              </div>
              {enabledProviders.length < providers.length ? <p className={styles.providerNote}>{t("login.providerNote")}</p> : null}
              {authErrorMessage ? <p className={styles.authMessage} role="alert">{authErrorMessage}</p> : null}
              {message ? <p className={styles.authMessage} role="status" aria-live="polite">{message}</p> : null}
            </>
          )}
          <p className={styles.finePrint}>{t("login.finePrint")} · <Link href="/legal/privacy">{t("common.privacy")}</Link></p>
        </section>
      </div>
    </main>
  );
}