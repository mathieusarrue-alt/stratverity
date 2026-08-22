"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { languages } from "../i18n/messages";
import type { Locale } from "../i18n/messages";
import { useI18n } from "../i18n/I18nProvider";
import { ShieldIcon } from "./StratVerityLogo";

type Theme = "light" | "dark";

const THEME_COLORS: Record<Theme, string> = {
  light: "#f6f3ec",
  dark: "#06110d",
};

function applyDocumentTheme(nextTheme: Theme, persist = false) {
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;

  let themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"][data-stratverity-theme]',
  );
  if (!themeColor) {
    themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.dataset.stratverityTheme = "true";
    document.head.append(themeColor);
  }
  themeColor.content = THEME_COLORS[nextTheme];

  if (persist) {
    try {
      window.localStorage.setItem("sv-theme", nextTheme);
    } catch {
      // Le thème reste fonctionnel même si Safari bloque le stockage local.
    }
  }
}

const navItems = [
  ["nav.product", "/#product"],
  ["nav.method", "/#method"],
  ["nav.freeTools", "/free-tools"],
  ["nav.pricing", "/#pricing"],
  ["nav.verify", "/cert"],
] as const;

export default function SiteHeader() {
  const { locale, setLocale, t } = useI18n();
  const [theme, setTheme] = useState<Theme>("light");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const languageRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncTheme = () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem("sv-theme");
      } catch {
        // Certains modes de navigation privée mobiles refusent localStorage.
      }
      const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      const nextTheme: Theme = stored === "dark" || stored === "light" ? stored : preferred;
      setTheme(nextTheme);
      applyDocumentTheme(nextTheme);
    };
    syncTheme();
    window.addEventListener("pageshow", syncTheme);
    return () => window.removeEventListener("pageshow", syncTheme);
  }, []);

  useEffect(() => {
    const closeLanguage = (event: MouseEvent) => {
      if (!languageRoot.current?.contains(event.target as Node)) setLanguageOpen(false);
    };
    document.addEventListener("pointerdown", closeLanguage);
    return () => document.removeEventListener("pointerdown", closeLanguage);
  }, []);

  useEffect(() => {
    let scheduled = false;
    const update = () => {
      const root = document.documentElement;
      const distance = Math.max(1, root.scrollHeight - root.clientHeight);
      setProgress(Math.min(100, (root.scrollTop / distance) * 100));
      setScrolled(window.scrollY > 8);
      scheduled = false;
    };
    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const currentTheme: Theme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyDocumentTheme(nextTheme, true);
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setLanguageOpen(false);
  };

  return (
    <header className={`site-head${scrolled ? " scrolled" : ""}`}>
      <div className="progress" style={{ width: `${progress}%` }} />
      <div className="container head-row">
        <Link className="brand" href="/" aria-label="StratVerity, accueil" onClick={closeMenus}>
                  <ShieldIcon className="brand-shield" />
                  <span className="brand-full-text">Strat<span>Verity</span></span>
                </Link>
        <nav className="nav" aria-label={t("header.primaryNav")}>
          {navItems.map(([key, href]) => (
            <Link href={href} key={key}>{t(key)}</Link>
          ))}
        </nav>
        <div className="head-tools">
          <div className="lang" ref={languageRoot}>
            <button
              className="icon-btn"
              type="button"
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              aria-label={t("header.chooseLanguage")}
              onClick={() => setLanguageOpen((open) => !open)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
              </svg>
              <span className="sr-only">{locale.toUpperCase()}</span>
            </button>
            <div className={`lang-menu${languageOpen ? " open" : ""}`} role="menu">
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={locale === language.code}
                  onClick={() => {
                    setLocale(language.code as Locale);
                    setLanguageOpen(false);
                  }}
                  style={locale === language.code ? { background: "var(--surface-2)" } : undefined}
                >
                  <span>{language.label}</span><span className="tag">{language.tag}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={t("header.toggleTheme")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {theme === "dark" ? (
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              ) : (
                <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
              )}
            </svg>
          </button>
          <Link className="btn btn-ghost btn-sm desk" href="/login?return_to=/account">{t("nav.login")}</Link>
          <Link className="btn btn-primary btn-sm desk-cta" href="/configure">{t("nav.cta")}</Link>
          <button className="icon-btn burger" type="button" aria-expanded={mobileOpen} aria-label="Menu" onClick={() => setMobileOpen((open) => !open)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
      <nav className={`mobile-nav${mobileOpen ? " open" : ""}`} aria-label={t("header.mobileNav")}>
        {navItems.map(([key, href]) => <Link href={href} key={key} onClick={closeMenus}>{t(key)}</Link>)}
        <Link href="/login?return_to=/account" onClick={closeMenus}>{t("nav.login")}</Link>
        <div className="mobile-lang" aria-label={t("header.chooseLanguage")}>
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              aria-pressed={locale === language.code}
              className={locale === language.code ? "active" : ""}
              onClick={() => {
                setLocale(language.code as Locale);
                closeMenus();
              }}
            >
              {language.tag}
            </button>
          ))}
        </div>
        <Link className="btn btn-primary mobile-cta" href="/configure" onClick={closeMenus}>{t("nav.cta")}</Link>
      </nav>
    </header>
  );
}
