"use client";

import Link from "next/link";
import { ILLUSTRATIVE_GOLDENS, type HaloTone, type IllustrativeGolden } from "./_data/illustrativeGoldens";
import StrategyAvatar from "./StrategyAvatar";

function toneClass(tone?: HaloTone) {
  if (tone === "good") return "mp-good";
  if (tone === "warn") return "mp-warn";
  if (tone === "bad") return "mp-bad";
  return "";
}

function Card({ g }: { g: IllustrativeGolden }) {
  return (
    <article className={`mp-card mp-tone-${g.halo}`}>
      <div className="mp-card-top">
        <StrategyAvatar seed={g.id} label={g.title} size={36} />
        <span className="mp-engine">{g.engine}</span>
        <div className="mp-gauge" aria-label={`Score labo ${g.scoreLabel}`}>
          <span className={`mp-score mp-score-${g.halo}`}>{g.scoreLabel}</span>
        </div>
      </div>
      <h3>{g.title}</h3>
      <p className="mp-meta">
        <span>
          {g.symbol} · {g.timeframe}
        </span>
        <span>{g.id}</span>
      </p>
      <p className="mp-summary">{g.summary}</p>
      <dl className="mp-stats">
        {g.metrics.map((m) => (
          <div key={m.label}>
            <dt>{m.label}</dt>
            <dd className={toneClass(m.tone)} title={m.hint}>
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mp-badges">
        {g.badges.map((b) => (
          <span
            key={b}
            className={`mp-badge${b === "ILLUSTRATIVE" ? " mp-badge-illust" : ""}${
              b === "NEGATIVE_CONTROL" ? " mp-badge-neg" : ""
            }`}
          >
            {b}
          </span>
        ))}
      </div>
      <p className="mp-sha">SHA {g.shaShort}</p>
      <p className="mp-notes">{g.notes}</p>
    </article>
  );
}

export default function IllustrativeModelCards() {
  return (
    <section className="mp-models" aria-label="Fiches labo illustratives">
      <div className="mp-models-head">
        <div>
          <span className="marketplace-proof">Lab vitrine · illustrative</span>
          <h2>
            Trois goldens du labo, <em>chiffres sourcés.</em>
          </h2>
        </div>
        <p>
          Ce ne sont pas des stratégies clientes à vendre. Ce sont des fixtures de
          laboratoire (même protocole, mêmes fichiers de référence). Badge
          ILLUSTRATIVE obligatoire — aucune promesse de performance.
        </p>
      </div>

      <div className="mp-grid">
        {ILLUSTRATIVE_GOLDENS.map((g) => (
          <Card key={g.id} g={g} />
        ))}
      </div>

      <p className="mp-illust-disclaimer">
        Score labo = 45&nbsp;% PF + 25&nbsp;% winrate + 20&nbsp;% drawdown + 10&nbsp;%
        nombre de trades. Un drawdown manquant vaut 50/100 (neutre). Le contrôle
        négatif n&apos;affiche pas ce score : il documente une divergence Python /
        TradingView. Passé ≠ futur. CTA unique : audit de votre propre code.
      </p>

      <div className="mp-models-cta">
        <Link className="btn btn-primary" href="/configure">
          Faire auditer ma stratégie →
        </Link>
      </div>
    </section>
  );
}
