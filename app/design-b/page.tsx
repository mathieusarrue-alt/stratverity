"use client";

import {
  ChangeEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Theme = "light" | "dark";

const studioChecks = [
  ["01", "Code", "Repaint, lookahead et cohérence des règles"],
  ["02", "Preuves", "Transactions, coûts et résultats déclarés"],
  ["03", "Robustesse", "Actifs, périodes et unités de temps"],
];

const studioSuite = [
  ["BacktestProof", "Audit", "Disponible en premier"],
  ["StratVerity Lab", "Amélioration", "Nom de travail"],
  ["StratVerity Radar", "Monitoring", "Nom de travail"],
  ["StratVerity Market", "Catalogue vérifié", "Nom de travail"],
];

function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <span className={footer ? "verity-brand footer-brand" : "verity-brand"}>
      <span className="verity-mark" aria-hidden="true">
        <span>V</span>
      </span>
      <span className="verity-wordmark">
        <strong>STRATVERITY</strong>
        <small>{footer ? "VERIFY · IMPROVE · MONITOR" : "BACKTESTPROOF"}</small>
      </span>
    </span>
  );
}

export default function VerifiedStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLDivElement>(null);
  const [fileName, setFileName] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem("stratverity-theme");
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(stored === "dark" || stored === "light" ? stored : preferredDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("stratverity-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(height > 0 ? window.scrollY / height : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name ?? "");
  };

  const moveSpotlight = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  };

  const tiltProof = (event: PointerEvent<HTMLDivElement>) => {
    const card = proofRef.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = card.getBoundingClientRect();
    const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7;
    const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -7;
    card.style.setProperty("--tilt-x", `${rotateX}deg`);
    card.style.setProperty("--tilt-y", `${rotateY}deg`);
  };

  const resetProofTilt = () => {
    proofRef.current?.style.setProperty("--tilt-x", "0deg");
    proofRef.current?.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <main className="studio-page premium-studio" data-theme={theme}>
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
        aria-hidden="true"
      />

      <header className="studio-header">
        <a className="studio-brand" href="#studio-top" aria-label="StratVerity — BacktestProof">
          <BrandLogo />
        </a>
        <nav aria-label="Navigation principale">
          <a href="#studio-method">Méthode</a>
          <a href="#studio-suite">Plateforme</a>
          <a href="#studio-audit">Déposer</a>
        </nav>
        <div className="studio-header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
            title={theme === "light" ? "Mode sombre" : "Mode clair"}
          >
            <span className="theme-track">
              <i className="theme-sun" aria-hidden="true">☼</i>
              <i className="theme-moon" aria-hidden="true">◐</i>
              <b />
            </span>
          </button>
          <a className="studio-nav-cta" href="#studio-audit">Commencer l’audit</a>
        </div>
      </header>

      <section className="studio-hero" id="studio-top" onPointerMove={moveSpotlight}>
        <div className="hero-noise" aria-hidden="true" />
        <div className="studio-hero-copy" data-reveal>
          <div className="studio-eyebrow">
            <span className="studio-status-dot" />
            <span>BACKTESTPROOF</span>
            <i />
            <small>VERIFICATION ENGINE · PRIVATE PREVIEW</small>
          </div>
          <h1>
            Know what your strategy<br />
            <em>can actually prove.</em>
          </h1>
          <p>
            Nous auditons le code, les preuves et les résultats de votre
            stratégie. Vous voyez ce qui est fiable, ce qui reste fragile et ce
            qui doit encore être testé.
          </p>
          <div className="studio-actions">
            <a className="premium-button" href="#studio-audit">
              <span>Auditer ma stratégie</span><i>→</i>
            </a>
            <a className="underlined-link" href="#studio-method">
              Découvrir la méthode <span>↘</span>
            </a>
          </div>
          <div className="studio-trust">
            <span><b>01</b><i>Sans compte</i></span>
            <span><b>02</b><i>Pine & Python</i></span>
            <span><b>03</b><i>Preuves traçables</i></span>
          </div>
        </div>

        <div className="studio-hero-proof" aria-label="Exemple de note de vérification" data-reveal>
          <div className="proof-halo" aria-hidden="true" />
          <div
            className="proof-document"
            ref={proofRef}
            onPointerMove={tiltProof}
            onPointerLeave={resetProofTilt}
          >
            <div className="document-head">
              <span className="document-seal"><span>V</span></span>
              <div>
                <small>STRATVERITY · VERIFICATION NOTE</small>
                <strong>Backtest evidence review</strong>
              </div>
              <em>EXAMPLE</em>
            </div>
            <div className="document-title">
              <small>STRATEGY / BTC · H1</small>
              <h2>Evidence before confidence.</h2>
              <p>Rapport illustratif — aucune performance promise.</p>
            </div>
            <div className="document-score">
              <div>
                <small>REPRODUCTIBILITÉ</small>
                <strong>À établir</strong>
              </div>
              <span>Preuves<br />incomplètes</span>
            </div>
            <div className="document-lines">
              <span><i className="verified" /> Métriques recalculables <b>PRÉVU</b></span>
              <span><i className="review" /> Coûts et slippage <b>À VÉRIFIER</b></span>
              <span><i className="missing" /> Données intratrade <b>NON FOURNIES</b></span>
            </div>
            <div className="document-foot">
              <span>REPORT ID · DEMO-2026</span>
              <strong>STRATVERITY / BP</strong>
            </div>
          </div>
          <div className="proof-orbit orbit-one"><span>PF</span></div>
          <div className="proof-orbit orbit-two"><span>R</span></div>
          <div className="proof-caption">MOVE TO INSPECT · EXAMPLE REPORT</div>
        </div>
      </section>

      <section className="studio-audit" id="studio-audit" data-reveal>
        <div className="audit-intro">
          <span className="studio-section-label">PREMIER DIAGNOSTIC</span>
          <h2>Déposez. Nous vérifions.</h2>
          <p>Aucun fichier n’est transmis dans ce prototype privé.</p>
        </div>
        <div className={fileName ? "studio-drop selected" : "studio-drop"}>
          <input
            ref={inputRef}
            type="file"
            accept=".pine,.py,.txt"
            onChange={chooseFile}
            aria-label="Choisir une stratégie Pine ou Python"
          />
          <button type="button" onClick={() => inputRef.current?.click()}>
            <span className="drop-symbol">{fileName ? "✓" : "↥"}</span>
            <strong>{fileName || "Choisir un fichier Pine ou Python"}</strong>
            <small>{fileName ? "Fichier sélectionné localement" : "2 Mo maximum · Aucun code exécuté"}</small>
          </button>
        </div>
        <button className="studio-audit-button premium-button" type="button" disabled={!fileName}>
          <span>Préparer mon diagnostic</span><i>→</i>
        </button>
      </section>

      <section className="studio-method" id="studio-method">
        <div className="studio-section-heading" data-reveal>
          <span className="studio-section-label">NOTRE STANDARD</span>
          <h2>Une conclusion n’a de valeur que si l’on peut remonter à ses preuves.</h2>
          <p>
            Chaque alerte est reliée à une règle, une limite connue et la donnée
            qui permet de la confirmer.
          </p>
        </div>
        <div className="studio-checks" data-reveal>
          {studioChecks.map(([number, title, text], index) => (
            <article key={number} style={{ "--item-delay": `${index * 90}ms` } as React.CSSProperties}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <i>↗</i>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-manifesto" onPointerMove={moveSpotlight}>
        <span className="manifesto-mark" data-reveal><span>V</span></span>
        <div data-reveal>
          <span className="studio-section-label">THE VERITY STANDARD</span>
          <blockquote>
            “Un backtest n’est pas une promesse. C’est une affirmation qui doit
            pouvoir être vérifiée.”
          </blockquote>
        </div>
        <p data-reveal>
          BacktestProof distingue les chiffres annoncés, les chiffres
          recalculés et les résultats de futurs tests indépendants.
        </p>
      </section>

      <section className="studio-suite" id="studio-suite">
        <div className="studio-section-heading" data-reveal>
          <span className="studio-section-label">STRATVERITY PLATFORM</span>
          <h2>De la première preuve au suivi continu.</h2>
          <p>Une architecture de produits claire, sans présenter les modules futurs comme déjà disponibles.</p>
        </div>
        <div className="studio-suite-grid" data-reveal>
          {studioSuite.map(([name, role, status], index) => (
            <article
              className={index === 0 ? "available" : ""}
              key={name}
              style={{ "--item-delay": `${index * 80}ms` } as React.CSSProperties}
            >
              <span>0{index + 1}</span>
              <small>{role}</small>
              <h3>{name}</h3>
              <p>{status}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="studio-footer">
        <div>
          <BrandLogo footer />
          <span className="footer-promise">BACKTESTPROOF · LA PREUVE AVANT LA PROMESSE</span>
        </div>
        <p>Prototype privé · Aucun rendement futur garanti · © 2026 StratVerity</p>
      </footer>
    </main>
  );
}
