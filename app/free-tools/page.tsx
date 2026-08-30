"use client";

import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./free-tools.module.css";
import ToolCostComparison, {
  type ComparisonItem,
} from "@/components/ui/ToolCostComparison";

const tools = [
  { icon: "/icons/health-check.png", title: "freeTools.healthTitle", body: "freeTools.healthBody", href: "/health-check" },
  { icon: "/icons/robustness.png", title: "freeTools.scoreTitle", body: "freeTools.scoreBody", href: "/score" },
  { icon: "/icons/fees.png", title: "freeTools.feesTitle", body: "freeTools.feesBody", href: "/fees" },
] as const;

export default function FreeToolsPage() {
  const { t } = useI18n();
  const comparison: ComparisonItem = {
    id: "look-ahead-bias",
    tool: "Look-Ahead Bias",
    dangerTitle: t("freeTools.compareRiskTitle"),
    dangerBody: t("freeTools.compareRiskBody"),
    dangerCost: t("freeTools.compareRiskSignal"),
    solutionLabel: t("freeTools.compareSolutionLabel"),
    solutionBody: t("freeTools.compareMethodBody"),
    solutionCost: t("freeTools.compareMethodSignal"),
    ctaLabel: t("freeTools.compareCta"),
    ctaHref: "/health-check",
  };

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
            <strong className={styles.icon} aria-hidden="true">
              <img src={tool.icon} width={52} height={52} alt="" />
            </strong>
            <h2>{t(tool.title)}</h2>
            <p>{t(tool.body)}</p>
            <span>{t("freeTools.open")} →</span>
          </Link>
        ))}
      </section>
      <section className={styles.compare} aria-label={t("freeTools.compareTitle")}>
        <h2>{t("freeTools.compareTitle")}</h2>
        <ToolCostComparison item={comparison} />
      </section>
      <p className={styles.notice}>{t("freeTools.notice")}</p>
    </main>
  );
}
