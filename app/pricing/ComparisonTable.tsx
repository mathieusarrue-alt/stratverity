import type { ReactNode } from "react";
import styles from "./pricing.module.css";

export type ComparisonTier = {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  priceFrom?: string;
  tagline: string;
  cta: { label: string; href: string };
  highlight?: boolean;
  badge?: string;
};

/** Une valeur par palier : true = coché, false = tiret, string = texte libre (ex. "8 ans"). */
export type FeatureValue = boolean | string;

export type FeatureRow = {
  label: string;
  values: FeatureValue[];
};

export type FeatureGroup = {
  title: string;
  rows: FeatureRow[];
};

function IconCheck() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Cell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <div className={styles.cell}>
        <span className={styles.cellCheck}><IconCheck /></span>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className={styles.cell}>
        <span className={styles.cellDash}>—</span>
      </div>
    );
  }
  return (
    <div className={styles.cell}>
      <span className={styles.cellText}>{value}</span>
    </div>
  );
}

export default function ComparisonTable({
  tiers,
  groups,
  footNote,
}: {
  tiers: ComparisonTier[];
  groups: FeatureGroup[];
  footNote?: ReactNode;
}) {
  return (
    <div className={styles.compareWrap}>
      <div className={styles.compareSurface}>
        <div className={styles.grid}>
          <div className={styles.tierRow}>
            <div className={styles.rowLabelHead}>
              <span>Ce qui change</span>
            </div>
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`${styles.tierCard} ${tier.highlight ? styles.highlight : ""}`}
              >
                {tier.badge && <span className={styles.tierBadge}>{tier.badge}</span>}
                <div className={styles.tierName}>{tier.name}</div>
                <p className={styles.tierTagline}>{tier.tagline}</p>
                <div className={styles.tierPrice}>
                  <strong>{tier.price}</strong>
                  {tier.priceNote && <span>{tier.priceNote}</span>}
                </div>
                {tier.priceFrom && <div className={styles.tierPriceFrom}>{tier.priceFrom}</div>}
                <a className={styles.tierCta} href={tier.cta.href}>{tier.cta.label}</a>
              </div>
            ))}
          </div>

          {groups.map((group) => (
            <div key={group.title} style={{ display: "contents" }}>
              <div className={styles.groupTitle}>{group.title}</div>
              {group.rows.map((row) => (
                <div key={row.label} className={styles.row}>
                  <div className={styles.rowLabel}>{row.label}</div>
                  {row.values.map((value, index) => (
                    <Cell key={`${row.label}-${tiers[index]?.id ?? index}`} value={value} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {footNote && <p className={styles.footNote}>{footNote}</p>}
    </div>
  );
}
