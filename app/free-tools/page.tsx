"use client";

import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./free-tools.module.css";
import ToolCostComparison from "@/components/ui/ToolCostComparison";
import { comparisonData } from "@/config/comparison-data";

const tools = [
  { icon: "</>", title: "freeTools.healthTitle", body: "freeTools.healthBody", href: "/health-check" },
  { icon: "100", title: "freeTools.scoreTitle", body: "freeTools.scoreBody", href: "/score" },
  { icon: "€", title: "freeTools.feesTitle", body: "freeTools.feesBody", href: "/fees" },
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
      <section className={styles.compare} aria-label="Coût de la faille">
        <h2>{t("freeTools.compareTitle")}</h2>
        <ToolCostComparison item={comparisonData[0]} />
      </section>
      <p className={styles.notice}>{t("freeTools.notice")}</p>
    </main>
  );
}