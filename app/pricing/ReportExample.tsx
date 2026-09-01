import type { ReactNode } from "react";
import styles from "./ReportExample.module.css";

/**
 * Aperçu visuel "exemple illustratif" affiché sous le tableau comparatif de
 * /pricing/audit et /pricing/optimizer — un même contenu type (issu de nos
 * schémas de recherche interne), avec la profondeur qui augmente palier par
 * palier. Aucun de ces chiffres n'est celui d'un client réel.
 */

type Variant = "audit" | "optimizer";

type Metric = { label: string; value: string };

type ChecklistItem = { label: string; ok?: boolean; note?: string };

function MetricChips({ metrics }: { metrics: Metric[] }) {
  return (
    <div className={styles.chips}>
      {metrics.map((m) => (
        <span className={styles.chip} key={m.label}>
          <span className={styles.chipLabel}>{m.label}</span>
          <span className={styles.chipValue}>{m.value}</span>
        </span>
      ))}
    </div>
  );
}

function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className={styles.checklist}>
      {items.map((it) => (
        <li key={it.label}>
          <span className={it.ok === false ? styles.dotWarn : styles.dotOk}>
            {it.ok === false ? "⚠" : "✓"}
          </span>
          <span>
            {it.label}
            {it.note ? <strong className={styles.checklistNote}> {it.note}</strong> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlainList({ items }: { items: string[] }) {
  return (
    <ul className={styles.plainList}>
      {items.map((it) => (
        <li key={it}>{it}</li>
      ))}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.block}>
      <span className={styles.blockTitle}>{title}</span>
      {children}
    </div>
  );
}

const AUDIT_METRICS: Metric[] = [
  { label: "PF net", value: "1.51" },
  { label: "Perf", value: "+21.6 %" },
  { label: "Max DD", value: "−16.2 %" },
  { label: "Trades", value: "55" },
];

const AUDIT_BASE_ITEMS: ChecklistItem[] = [
  { label: "Recalcul net de frais" },
  { label: "Détection du look-ahead bias" },
  { label: "Walk-forward hors-échantillon (70/30)" },
];

const AUDIT_ROBUSTNESS: string[] = [
  "Réduire la taille de position en régime de haute volatilité",
  "Élargir le stop sous 0.3×ATR",
  "Revalider sur 8 ans d'historique",
];

function AuditCards() {
  return (
    <div className={styles.grid}>
      <article className={styles.card}>
        <span className={styles.tierLabel}>ESSENTIAL</span>
        <AuditHeader />
        <MetricChips metrics={AUDIT_METRICS} />
        <Checklist
          items={[...AUDIT_BASE_ITEMS, { label: "Divergence déclarée vs recalculée :", note: "Basique" }]}
        />
      </article>

      <article className={`${styles.card} ${styles.cardHighlight}`}>
        <span className={styles.tierBadge}>PALIER MIS EN AVANT</span>
        <span className={styles.tierLabel}>PREMIUM</span>
        <AuditHeader />
        <MetricChips metrics={AUDIT_METRICS} />
        <Checklist
          items={[...AUDIT_BASE_ITEMS, { label: "Divergence déclarée vs recalculée :", note: "Approfondi" }]}
        />
        <Block title="Biais détectés (approfondi)">
          <Checklist
            items={[
              { label: "Look-ahead :", note: "aucun" },
              { label: "Sur-optimisation :", note: "risque modéré", ok: false },
            ]}
          />
        </Block>
        <Block title="3 pistes de robustesse">
          <PlainList items={AUDIT_ROBUSTNESS} />
        </Block>
      </article>

      <article className={styles.card}>
        <span className={styles.tierLabel}>CUSTOM</span>
        <AuditHeader />
        <MetricChips metrics={AUDIT_METRICS} />
        <Checklist
          items={[...AUDIT_BASE_ITEMS, { label: "Divergence déclarée vs recalculée :", note: "Approfondi" }]}
        />
        <Block title="Biais détectés (approfondi)">
          <Checklist
            items={[
              { label: "Look-ahead :", note: "aucun" },
              { label: "Sur-optimisation :", note: "risque modéré", ok: false },
            ]}
          />
        </Block>
        <Block title="3 pistes de robustesse">
          <PlainList items={AUDIT_ROBUSTNESS} />
        </Block>
        <Block title="Contextes ajoutés au même rapport">
          <div className={styles.contextChips}>
            <span className={styles.contextChip}>+ ETHUSDT · 4H</span>
            <span className={styles.contextChip}>+ SOLUSDT · 1H</span>
          </div>
          <p className={styles.smallNote}>Jusqu&apos;à 10 ans d&apos;historique par contexte, rapport consolidé.</p>
        </Block>
      </article>
    </div>
  );
}

function AuditHeader() {
  return (
    <div className={styles.reportHead}>
      <span className={styles.reportTitle}>Wolfe B — BTCUSDT · 4H</span>
      <span className={styles.certifiedBadge}>CERTIFIED · 74/100</span>
    </div>
  );
}

const OPT_CONFIGS: string[] = [
  "Config A — PF 1.42 · DD −18 %",
  "Config B — PF 1.35 · DD −14 %",
  "Config C — PF 1.18 · DD −9 %",
];

function OptimizerHeader() {
  return (
    <div className={styles.reportHead}>
      <span className={styles.reportTitle}>Recherche de paramètres — 3 configurations testées</span>
    </div>
  );
}

function AntiOverfitBlock() {
  return (
    <Block title="Anti-surapprentissage">
      <div className={styles.kvRow}>
        <span>Probability of Backtest Overfitting (PBO)</span>
        <strong className={styles.kvGood}>18 % — risque faible</strong>
      </div>
      <div className={styles.kvRow}>
        <span>Walk-forward roulant</span>
        <strong>6 fenêtres purgées (embargo)</strong>
      </div>
    </Block>
  );
}

function MonteCarloBlock() {
  return (
    <Block title="Simulation Monte-Carlo">
      <div className={styles.chips}>
        <span className={styles.chip}>
          <span className={styles.chipLabel}>p5</span>
          <span className={styles.chipValue}>−22 %</span>
        </span>
        <span className={styles.chip}>
          <span className={styles.chipLabel}>p50</span>
          <span className={styles.chipValue}>+19 %</span>
        </span>
        <span className={styles.chip}>
          <span className={styles.chipLabel}>p95</span>
          <span className={styles.chipValue}>+61 %</span>
        </span>
      </div>
    </Block>
  );
}

function OptimizerCards() {
  return (
    <div className={styles.grid}>
      <article className={styles.card}>
        <span className={styles.tierLabel}>ESSENTIEL</span>
        <OptimizerHeader />
        <span className={styles.certifiedBadge}>Top-3 robustes</span>
        <PlainList items={OPT_CONFIGS} />
      </article>

      <article className={`${styles.card} ${styles.cardHighlight}`}>
        <span className={styles.tierBadge}>PALIER MIS EN AVANT</span>
        <span className={styles.tierLabel}>PRO</span>
        <OptimizerHeader />
        <PlainList items={OPT_CONFIGS} />
        <AntiOverfitBlock />
        <MonteCarloBlock />
      </article>

      <article className={styles.card}>
        <span className={styles.tierLabel}>ELITE</span>
        <OptimizerHeader />
        <PlainList items={OPT_CONFIGS} />
        <AntiOverfitBlock />
        <MonteCarloBlock />
        <Block title="Généralisation multi-actifs">
          <div className={styles.contextChips}>
            <span className={styles.contextChipOk}>BTC ✓</span>
            <span className={styles.contextChipOk}>ETH ✓</span>
            <span className={styles.contextChipWarn}>SOL ⚠</span>
            <span className={styles.contextChipOk}>XRP ✓</span>
            <span className={styles.contextChipOk}>ADA ✓</span>
          </div>
          <p className={styles.smallNote}>4/5 actifs passent (80 %)</p>
        </Block>
        <Block title="Stress-test par régime">
          <div className={styles.kvRow}>
            <span>Fees ×3</span>
            <strong>→ PF 1.24</strong>
          </div>
          <div className={styles.kvRow}>
            <span>Slippage ×2</span>
            <strong>→ PF 1.11</strong>
          </div>
        </Block>
        <span className={styles.certifiedBadge}>Artefact prêt à déployer</span>
      </article>
    </div>
  );
}

export default function ReportExample({ variant }: { variant: Variant }) {
  const isAudit = variant === "audit";
  return (
    <section className={styles.section}>
      <span className={styles.eyebrow}>EXEMPLE ILLUSTRATIF</span>
      <h2 className={styles.title}>
        {isAudit
          ? "Ce que vous recevez, palier par palier."
          : "Ce que révèle chaque palier d'optimisation."}
      </h2>
      <p className={styles.lead}>
        {isAudit
          ? "Extraits (illustratifs, pas un client réel) d'un même rapport d'audit, avec la profondeur ajoutée à chaque palier. Les chiffres viennent des schémas de notre moteur de recherche interne."
          : "Extraits illustratifs d'un même run d'optimisation. La profondeur d'analyse anti-surapprentissage augmente avec le palier."}
      </p>
      {isAudit ? <AuditCards /> : <OptimizerCards />}
    </section>
  );
}
