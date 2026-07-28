export default function DesignChoice() {
  return (
    <main className="design-choice-page">
      <header className="choice-header">
        <a className="brand" href="/" aria-label="StratVerity — choix du design">
          <span className="brand-mark">SV</span>
          <span className="brand-lockup">
            <strong>Strat<span>Verity</span></strong>
            <small>Frontend review</small>
          </span>
        </a>
        <span>Prototype privé · Choix visuel</span>
      </header>

      <section className="choice-intro">
        <span className="section-kicker">DEUX DIRECTIONS · UNE MÊME MÉTHODE</span>
        <h1>Quel visage doit porter la preuve&nbsp;?</h1>
        <p>
          Les deux concepts présentent BacktestProof avec le même niveau
          d’exigence. Compare surtout la confiance perçue, la clarté du dépôt et
          la capacité du design à accueillir les futurs produits StratVerity.
        </p>
      </section>

      <section className="concept-grid">
        <article className="concept-card concept-terminal">
          <div className="concept-preview terminal-preview" aria-hidden="true">
            <div className="preview-nav"><b>SV</b><span /><i /></div>
            <div className="preview-terminal-copy">
              <small>BACKTESTPROOF · AUDIT ENGINE</small>
              <strong>NE FAITES PAS<br />CONFIANCE À<br /><em>UNE COURBE.</em></strong>
              <span />
            </div>
            <div className="preview-report">
              <small>ROBUSTNESS REPORT</small>
              <i />
              <i />
              <i />
              <b>PROOF READY</b>
            </div>
          </div>
          <div className="concept-copy">
            <span className="concept-number">DIRECTION A</span>
            <h2>Proof Terminal</h2>
            <p>
              Un univers sombre et précis, proche d’un terminal de recherche
              quantitative. La preuve, les contrôles et la robustesse dominent.
            </p>
            <ul>
              <li>Très distinctif et crédible pour les traders avancés</li>
              <li>Fort impact visuel pour la publicité et les réseaux</li>
              <li>Positionnement immédiatement technique</li>
            </ul>
            <a className="concept-button" href="/design-a">
              Ouvrir le concept A <span>↗</span>
            </a>
          </div>
        </article>

        <article className="concept-card concept-studio">
          <div className="concept-preview studio-preview" aria-hidden="true">
            <div className="preview-nav"><b>SV</b><span /><i /></div>
            <div className="studio-proof-mark">V</div>
            <div className="studio-preview-copy">
              <small>BACKTESTPROOF</small>
              <strong>Know what your<br />strategy can prove.</strong>
              <span />
              <span />
            </div>
            <div className="studio-mini-report">
              <small>VERIFICATION NOTE</small>
              <b>Evidence before confidence.</b>
              <i />
              <i />
            </div>
          </div>
          <div className="concept-copy">
            <span className="concept-number">DIRECTION B</span>
            <h2>Verified Studio</h2>
            <p>
              Un design clair, premium et éditorial. Plus accessible aux
              créateurs, il prépare mieux une plateforme, un catalogue et des
              offres complémentaires.
            </p>
            <ul>
              <li>Confiance plus institutionnelle et internationale</li>
              <li>Lecture plus simple pour les profils moins techniques</li>
              <li>Architecture extensible vers Lab, Radar et Market</li>
            </ul>
            <a className="concept-button light-choice" href="/design-b">
              Ouvrir le concept B <span>↗</span>
            </a>
          </div>
        </article>
      </section>

      <p className="choice-note">
        Aucun des deux concepts n’utilise de résultat client réel ou de
        promesse de rendement. Le design retenu remplacera cette page avant la
        publication privée.
      </p>
    </main>
  );
}
