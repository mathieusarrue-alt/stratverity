"use client";

import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./free-tools.module.css";
import { HealthCheckIcon, RobustnessIcon, FeesIcon } from "@/components/ui/ToolIcons";

const tools = [
  { icon: <HealthCheckIcon />, title: "freeTools.healthTitle", body: "freeTools.healthBody", href: "/health-check" },
  { icon: <RobustnessIcon />, title: "freeTools.scoreTitle", body: "freeTools.scoreBody", href: "/score" },
  { icon: <FeesIcon />, title: "freeTools.feesTitle", body: "freeTools.feesBody", href: "/fees" },
] as const;

export default function FreeToolsPage() {
  const { t } = useI18n();
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <span>{t("freeTools.eyebrow")}</span>
        <h1>{t("freeTools.title")}</h1>
        <p>{t("freeTools.lead")}</p>
      </header>
      <section className={styles.grid} aria-label={t("freeTools.eyebrow")}>
        {tools.map((tool) => (
          <Link className={styles.card} href={tool.href} key={tool.href}>
            <strong className={styles.icon} aria-hidden="true">{tool.icon}</strong>
            <h2>{t(tool.title)}</h2>
            <p>{t(tool.body)}</p>
            <span>{t("freeTools.open")} →</span>
          </Link>
        ))}
      </section>
      <section className={styles.comparison} aria-labelledby="evidence-levels-title">
        <header className={styles.compareIntro}>
          <h2 id="evidence-levels-title">{t("freeTools.compareTitle")}</h2>
          <p>{t("freeTools.compareLead")}</p>
        </header>
        <div className={styles.tierGrid}>
          {[
            {
              index: "01",
              title: "freeTools.tierDiagnostic",
              body: "freeTools.tierDiagnosticBody",
              features: ["freeTools.tierDiagnosticF1", "freeTools.tierDiagnosticF2", "freeTools.tierDiagnosticF3"],
              cta: "freeTools.tierDiagnosticCta",
              href: "/health-check",
            },
            {
              index: "02",
              title: "freeTools.tierAudit",
              body: "freeTools.tierAuditBody",
              features: ["freeTools.tierAuditF1", "freeTools.tierAuditF2", "freeTools.tierAuditF3"],
              cta: "freeTools.tierAuditCta",
              href: "/configure",
              featured: true,
            },
            {
              index: "03",
              title: "freeTools.tierCertification",
              body: "freeTools.tierCertificationBody",
              features: ["freeTools.tierCertificationF1", "freeTools.tierCertificationF2", "freeTools.tierCertificationF3"],
              cta: "freeTools.tierCertificationCta",
              href: "/cert",
            },
          ].map((tier) => (
            <article className={`${styles.tierCard} ${tier.featured ? styles.featuredTier : ""}`} key={tier.index}>
              <span className={styles.tierIndex}>{tier.index}</span>
              <h3>{t(tier.title)}</h3>
              <p>{t(tier.body)}</p>
              <ul className={styles.tierList}>
                {tier.features.map((feature) => <li key={feature}>{t(feature)}</li>)}
              </ul>
              <Link className={styles.tierCta} href={tier.href}>{t(tier.cta)} →</Link>
            </article>
          ))}
        </div>
      </section>
      <p className={styles.notice}>{t("freeTools.notice")}</p>
    </main>
  );
}