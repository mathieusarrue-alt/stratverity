"use client";

import { DragEvent, FormEvent, useRef, useState } from "react";

type Stage = "upload" | "email" | "teaser";

const checks = [
  "Frais, slippage et hypothèses de marché",
  "Repaint, lookahead et biais de données",
  "Profit Factor, Avg R net et drawdown",
  "Stabilité long / short et concentration",
  "Robustesse multi-actifs et multi-unités",
  "Écart entre résultats déclarés et recalculés",
];

const faq = [
  {
    question: "Est-ce que vous exécutez mon code automatiquement ?",
    answer:
      "Non. Le premier niveau inspecte et recalcule les preuves fournies sans exécuter un code client inconnu. Les futurs tests isolés auront un périmètre annoncé séparément.",
  },
  {
    question: "Pourquoi le rapport gratuit est-il limité ?",
    answer:
      "Il sert à prouver la méthode sans offrir une matrice de calcul coûteuse. Le rapport complet ajoute davantage de contrôles, de comparaisons et de tests indépendants.",
  },
  {
    question: "Un bon winrate suffit-il ?",
    answer:
      "Non. Un winrate élevé peut masquer un mauvais ratio gains/pertes, des frais destructeurs ou un drawdown fragile. Nous privilégions PF, Avg R net, coûts et stabilité.",
  },
  {
    question: "Garantissez-vous une performance future ?",
    answer:
      "Jamais. L’audit mesure la cohérence et la robustesse d’un backtest. Il ne prédit pas les rendements et ne constitue pas un conseil financier.",
  },
];

function formatSize(size: number) {
  if (size < 1024) return `${size} o`;
  return `${(size / 1024).toFixed(size < 1024 * 100 ? 1 : 0)} Ko`;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [email, setEmail] = useState("");
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");

  const selectFile = (candidate?: File) => {
    if (!candidate) return;
    const extension = candidate.name.split(".").pop()?.toLowerCase();
    if (!["pine", "py", "txt"].includes(extension ?? "")) {
      setMessage("Format non reconnu. Utilise un fichier .pine, .py ou .txt.");
      return;
    }
    if (candidate.size > 2 * 1024 * 1024) {
      setMessage("Ce prototype accepte un fichier de 2 Mo maximum.");
      return;
    }
    setFile(candidate);
    setMessage("");
    setStage("upload");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const beginAudit = () => {
    if (!file) {
      setMessage("Sélectionne d’abord un fichier Pine ou Python.");
      return;
    }
    if (!termsAccepted) {
      setMessage("Accepte les conditions contractuelles pour continuer.");
      return;
    }
    setMessage("");
    setStage("email");
  };

  const submitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@") || email.length < 5) {
      setMessage("Saisis une adresse email valide.");
      return;
    }
    setMessage("");
    setEmail("");
    setStage("teaser");
  };

  const resetDemo = () => {
    setFile(null);
    setStage("upload");
    setTermsAccepted(false);
    setEmail("");
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="BacktestProof — accueil">
          <span className="brand-mark">BP</span>
          <span>Backtest<span>Proof</span></span>
        </a>
        <nav aria-label="Navigation principale">
          <a href="#method">Méthode</a>
          <a href="#checks">Contrôles</a>
          <a href="#offers">Offres</a>
        </nav>
        <a className="header-cta" href="#audit">Tester mon backtest</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            Audit indépendant Pine & Python
          </div>
          <h1>
            Ne faites pas confiance à une courbe.
            <span> Faites-la auditer.</span>
          </h1>
          <p className="hero-lead">
            Déposez votre stratégie et son backtest. Nous cherchons les biais,
            recalculons les métriques prioritaires et séparons les performances
            déclarées des preuves réellement vérifiables.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#audit">
              Auditer gratuitement
              <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#method">
              Voir la méthode <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="trust-row" aria-label="Principes du service">
            <span>Sans compte</span>
            <span>Code non exécuté</span>
            <span>Résultats reliés aux preuves</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Exemple illustratif d’un rapport flouté">
          <div className="visual-topline">
            <div>
              <span className="micro-label">ROBUSTNESS REPORT</span>
              <strong>Strategy / BTC — H1</strong>
            </div>
            <span className="status-chip">AUDIT READY</span>
          </div>
          <div className="chart-head">
            <div>
              <span>Equity recalculée</span>
              <strong className="blurred-value">+184.72%</strong>
            </div>
            <div className="chart-legend">
              <span className="legend-dot" />
              Preuve indépendante
            </div>
          </div>
          <div className="chart">
            <div className="chart-grid" />
            <div className="chart-area" />
            <div className="chart-end-dot" />
            <span className="chart-label">Illustration — aucune performance promise</span>
          </div>
          <div className="metric-strip">
            {["Profit Factor", "Avg R net", "Drawdown"].map((label) => (
              <div key={label}>
                <span>{label}</span>
                <strong className="blurred-value">2.41</strong>
              </div>
            ))}
          </div>
          <div className="visual-footer">
            <span><i className="check-mark">✓</i> 28 contrôles versionnés</span>
            <span>Rapport exemple</span>
          </div>
        </div>
      </section>

      <section className="proof-band" aria-label="Différenciation du produit">
        <p>Pas un nouveau backtester.</p>
        <div className="proof-statement">
          <span>Votre backtest</span>
          <b>→</b>
          <span>Nos recalculs</span>
          <b>→</b>
          <span>Un verdict traçable</span>
        </div>
      </section>

      <section className="audit-section" id="audit">
        <div className="section-heading centered">
          <span className="section-kicker">PREMIER DIAGNOSTIC</span>
          <h2>Votre stratégie mérite mieux qu’un screenshot.</h2>
          <p>
            Déposez une source Pine ou Python. Cette version privée démontre le
            parcours : aucun fichier ni email n’est transmis ou conservé.
          </p>
        </div>

        <div className="audit-shell">
          <div className="audit-progress" aria-label="Progression">
            {[
              ["01", "Dépôt"],
              ["02", "Email"],
              ["03", "Aperçu"],
            ].map(([number, label], index) => {
              const active =
                (stage === "upload" && index === 0) ||
                (stage === "email" && index <= 1) ||
                (stage === "teaser");
              return (
                <div className={active ? "progress-step active" : "progress-step"} key={number}>
                  <span>{number}</span>
                  <b>{label}</b>
                </div>
              );
            })}
          </div>

          {stage === "upload" && (
            <div className="upload-stage">
              <div
                className={`drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pine,.py,.txt"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                  aria-label="Choisir une stratégie Pine ou Python"
                />
                <button
                  className="upload-icon"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Parcourir les fichiers"
                >
                  {file ? "✓" : "↑"}
                </button>
                {file ? (
                  <>
                    <strong>{file.name}</strong>
                    <span>
                      {file.name.endsWith(".py") ? "Python" : "Pine Script"} · {formatSize(file.size)}
                    </span>
                    <button className="replace-file" type="button" onClick={() => inputRef.current?.click()}>
                      Remplacer le fichier
                    </button>
                  </>
                ) : (
                  <>
                    <strong>Déposez votre stratégie ici</strong>
                    <span>Pine Script ou Python · 2 Mo maximum</span>
                    <button className="browse-button" type="button" onClick={() => inputRef.current?.click()}>
                      Parcourir les fichiers
                    </button>
                  </>
                )}
              </div>

              <label className="terms-line">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  J’accepte les <a href="#terms">conditions contractuelles</a>,
                  incluant les droits d’audit, d’amélioration et d’exploitation
                  décrits avant le dépôt.
                </span>
              </label>
              <button className="full-button" type="button" onClick={beginAudit}>
                Lancer le diagnostic gratuit <span>→</span>
              </button>
            </div>
          )}

          {stage === "email" && (
            <form className="email-stage" onSubmit={submitEmail}>
              <div className="stage-symbol">@</div>
              <span className="section-kicker">LIVRAISON SÉCURISÉE</span>
              <h3>Où devons-nous envoyer le rapport limité ?</h3>
              <p>
                Aucun compte à créer. L’email sert à vérifier l’éligibilité et à
                livrer ce rapport transactionnel, pas à vous inscrire à une newsletter.
              </p>
              <label>
                Adresse email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="vous@entreprise.com"
                  autoComplete="email"
                  required
                />
              </label>
              <button className="full-button" type="submit">
                Recevoir mon lien sécurisé <span>→</span>
              </button>
              <button className="back-button" type="button" onClick={() => setStage("upload")}>
                ← Revenir au fichier
              </button>
            </form>
          )}

          {stage === "teaser" && (
            <div className="teaser-stage">
              <div className="teaser-heading">
                <div>
                  <span className="section-kicker">APERÇU DE DÉMONSTRATION</span>
                  <h3>Le rapport limité est prêt à être livré.</h3>
                  <p>
                    Le produit final affichera ici les preuves de traitement,
                    tandis que les métriques resteront masquées jusqu’à la
                    vérification email.
                  </p>
                </div>
                <span className="status-chip">PROTOTYPE PRIVÉ</span>
              </div>
              <div className="teaser-grid">
                {["Profit Factor net", "Avg R après frais", "Drawdown recalculé"].map(
                  (label) => (
                    <div className="teaser-metric" key={label}>
                      <span>{label}</span>
                      <strong className="deep-blur">1.87</strong>
                      <i>Vérification requise</i>
                    </div>
                  ),
                )}
              </div>
              <div className="work-proof">
                <strong>Ce que le moteur a prévu de vérifier</strong>
                <div>
                  <span><i>✓</i> Empreinte du fichier</span>
                  <span><i>✓</i> Analyse statique versionnée</span>
                  <span><i>✓</i> Recalcul des coûts</span>
                  <span><i>✓</i> Diagnostic long / short</span>
                </div>
              </div>
              <div className="prototype-note">
                <span>i</span>
                Démonstration d’interface uniquement : aucun audit n’a été
                calculé et aucune donnée n’a quitté votre navigateur.
              </div>
              <button className="full-button muted" type="button" onClick={resetDemo}>
                Recommencer la démonstration
              </button>
            </div>
          )}

          {message && <p className="form-message" role="alert">{message}</p>}
        </div>
      </section>

      <section className="method-section" id="method">
        <div className="section-heading">
          <span className="section-kicker">LA MÉTHODE</span>
          <h2>Trois couches. Un seul objectif : séparer le signal du storytelling.</h2>
        </div>
        <div className="method-grid">
          {[
            {
              number: "01",
              title: "Contrôler",
              text: "Nous inspectons le code, les paramètres, les dates, les coûts et l’intégrité des preuves fournies.",
              tag: "STATIC AUDIT",
            },
            {
              number: "02",
              title: "Recalculer",
              text: "Nous reconstruisons les métriques prioritaires depuis les transactions disponibles, sans compléter silencieusement les données absentes.",
              tag: "EVIDENCE ENGINE",
            },
            {
              number: "03",
              title: "Mettre à l’épreuve",
              text: "Les offres avancées confrontent la stratégie à d’autres actifs, périodes, unités de temps et hypothèses de friction.",
              tag: "ROBUSTNESS LAB",
            },
          ].map((item) => (
            <article className="method-card" key={item.number}>
              <span className="card-number">{item.number}</span>
              <div className="method-line" />
              <span className="micro-label">{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="checks-section" id="checks">
        <div className="checks-copy">
          <span className="section-kicker">CE QUE NOUS CHERCHONS</span>
          <h2>Les détails qui transforment un beau backtest en mauvaise surprise.</h2>
          <p>
            Le verdict ne dépend pas d’une impression générale. Chaque alerte
            est reliée à une règle, une preuve et une limite connue.
          </p>
          <div className="checks-list">
            {checks.map((check, index) => (
              <div key={check}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{check}</b>
                <i aria-hidden="true">↗</i>
              </div>
            ))}
          </div>
        </div>
        <div className="risk-panel">
          <div className="risk-top">
            <span className="micro-label">AUDIT SIGNALS</span>
            <span className="warning-chip">3 RISQUES DÉTECTÉS</span>
          </div>
          <div className="risk-score">
            <div className="score-ring"><span>?</span></div>
            <div>
              <span>Indice de reproductibilité</span>
              <strong>En attente de preuves</strong>
              <p>Aucun score n’est inventé lorsque les données sont incomplètes.</p>
            </div>
          </div>
          <div className="risk-items">
            <div>
              <span className="risk-icon high">!</span>
              <p><b>Frais non démontrés</b><small>Impact potentiel sur l’Avg R net</small></p>
              <em>HAUT</em>
            </div>
            <div>
              <span className="risk-icon medium">~</span>
              <p><b>Échantillon concentré</b><small>Robustesse hors période à tester</small></p>
              <em>MOYEN</em>
            </div>
            <div>
              <span className="risk-icon unknown">?</span>
              <p><b>Drawdown intratrade</b><small>Preuve absente du fichier fourni</small></p>
              <em>NON TESTÉ</em>
            </div>
          </div>
          <p className="example-label">Exemple de présentation — pas un audit réel</p>
        </div>
      </section>

      <section className="offers-section" id="offers">
        <div className="section-heading centered">
          <span className="section-kicker">DU DIAGNOSTIC AU MONITORING</span>
          <h2>Un produit qui grandit avec votre stratégie.</h2>
        </div>
        <div className="offer-grid">
          {[
            ["01", "Audit", "Vérifiez la fiabilité du code et des résultats fournis.", "Disponible en premier"],
            ["02", "Amélioration", "Testez entrées, sorties, stops et paramètres sans confondre optimisation et preuve.", "Laboratoire contrôlé"],
            ["03", "Monitoring", "Surveillez en temps réel la dérive entre backtest et comportement observé.", "Abonnement futur"],
            ["04", "Stratégies vérifiées", "Découvrez plus tard des bots et indicateurs accompagnés d’un audit versionné.", "Marketplace future"],
          ].map(([number, title, text, tag]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <small>{tag}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div>
          <span className="section-kicker">LA PREUVE AVANT LA PROMESSE</span>
          <h2>Votre stratégie peut être excellente.<br />Ou simplement bien présentée.</h2>
        </div>
        <a className="primary-button light" href="#audit">
          Commencer le diagnostic <span>↗</span>
        </a>
      </section>

      <section className="faq-section">
        <div className="section-heading">
          <span className="section-kicker">QUESTIONS FRÉQUENTES</span>
          <h2>Clair avant même le dépôt.</h2>
        </div>
        <div className="faq-list">
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}<span>+</span></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <a className="brand" href="#top">
            <span className="brand-mark">BP</span>
            <span>Backtest<span>Proof</span></span>
          </a>
          <p>
            Audit de backtests fondé sur les preuves.<br />
            Aucun rendement futur n’est garanti.
          </p>
        </div>
        <div className="footer-bottom" id="terms">
          <span>© 2026 BacktestProof — prototype privé</span>
          <div>
            <a href="#terms">Conditions</a>
            <a href="#terms">Confidentialité</a>
            <a href="#terms">Avertissement risque</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
