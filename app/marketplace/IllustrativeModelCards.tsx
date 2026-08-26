"use client";

import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import { illustrativeGoldens } from "./_data/illustrativeGoldens";
import type { IllustrativeGolden } from "./_data/illustrativeGoldens";

// Vitrine illustrative — cartes modèles du labo.
// Aucune donnée de performance réelle : exemples pour montrer le score
// déterministe (voire _data/illustrativeGoldens.ts). Vocabulaire labo,
// jamais de promesse de gains. Proof not storytelling.

const SCORE_MAX = 100;

function scoreCurve(g: IllustrativeGolden) {
  // Petite courbe CSS statique (largeur ∝ score). prefers-reduced-motion gèle tout.
  const pct = Math.max(0, Math.min(100, (g.score / SCORE_MAX) * 100));
  return {
    width: `${pct.toFixed(1)}%`,
    className:
      g.status === "negative_control"
        ? "mp-illust-curve mp-illust-curve-bad"
        : "mp-illust-curve",
  };
}

function GoldenCard({ g }: { g: IllustrativeGolden }) {
  const { t } = useI18n();
  const curve = scoreCurve(g);
  const halo =
    g.status === "negative_control"
      ? "mp-illust-card mp-illust-halo-bad"
      : g.score >= 70
        ? "mp-illust-card mp-illust-halo-good"
        : "mp-illust-card mp-illust-halo-bad";

  return (
    <article className={halo}>
      <div className="mp-illust-card-top">
        <span className="mp-illust-id">{g.id}</span>
        <span className="mp-illust-badge">{t("mp.illust.badge")}</span>
      </div>

      <h3 className="mp-illust-title">
        {g.asset} <span className="mp-illust-tf">{g.timeframe}</span>
      </h3>

      <div className="mp-illust-score">
        <div>
          <span className="mp-illust-score-label">
            {t("mp.illust.scoreLabel")}
          </span>
          <span className="mp-illust-score-value">{g.score}</span>
        </div>
        <div
          className={`mp-illust-curve-wrap ${curve.className}`}
          aria-hidden="true"
        >
          <div className="mp-illust-curve-bar" style={{ width: curve.width }} />
        </div>
      </div>

      <dl className="mp-illust-stats">
        <div>
          <dt>{t("mp.illust.stat.pf")}</dt>
          <dd>{g.pf.toFixed(2)}</dd>
        </div>
        <div>
          <dt>{t("mp.illust.stat.wr")}</dt>
          <dd>{g.wr.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>{t("mp.illust.stat.dd")}</dt>
          <dd>{g.dd.toFixed(0)}%</dd>
        </div>
        <div>
          <dt>integ</dt>
          <dd>{g.integ}</dd>
        </div>
      </dl>

      {g.status === "negative_control" && (
        <span className="mp-illust-neg">{t("mp.illust.negativeBadge")}</span>
      )}
    </article>
  );
}

export default function IllustrativeModelCards() {
  const { t } = useI18n();

  return (
    <section
      aria-label={t("mp.illust.title")}
      className="mp-illust"
      data-testid="illustrative-model-cards"
    >
      <div className="mp-illust-head">
        <div>
          <span className="mp-illust-eyebrow">{t("mp.illust.eyebrow")}</span>
          <h2>{t("mp.illust.title")}</h2>
          <p>{t("mp.illust.lead")}</p>
        </div>
      </div>

      <div className="mp-illust-grid">
        {illustrativeGoldens.map((g) => (
          <GoldenCard key={g.id} g={g} />
        ))}
      </div>

      <div className="mp-illust-cta">
        <Link className="btn btn-primary" href="/configure">
          {t("mp.illust.cta")} →
        </Link>
      </div>

      <div className="mp-illust-disclaimer">
        <strong>{t("mp.illust.disclaimerTitle")}</strong>
        <p>{t("mp.illust.disclaimerBody")}</p>
      </div>
    </section>
  );
}
