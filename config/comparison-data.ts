// Données centralisées du composant "Coût de la faille" (ToolCostComparison).
// Chaque entrée oppose le danger réel (coût de la faille non détectée) à la
// solution StratVerity (coût maîtrisé). Source : doctrine produit StratVerity.

export type ComparisonItem = {
  id: string;
  tool: string;
  dangerTitle: string;
  dangerBody: string;
  dangerCost: string;
  solutionBody: string;
  solutionCost: string;
  ctaLabel: string;
  ctaHref: string;
};

export const comparisonData: ComparisonItem[] = [
  {
    id: "look-ahead-bias",
    tool: "Look-Ahead Bias",
    dangerTitle: "Backtest truqué",
    dangerBody: "Des décisions prises avec une information qui n'existait pas encore à la clôture de la bougie.",
    dangerCost: "-10 000 € perdus sur un backtest truqué",
    solutionBody: "Détection des fausses promesses avant de trader, hors échantillon (walk-forward 70/30).",
    solutionCost: "0 € — Détection des fausses promesses avant de trader",
    ctaLabel: "Analyser mon code",
    ctaHref: "/free-tools",
  },
  {
    id: "live-drift",
    tool: "Live Drift Monitoring",
    dangerTitle: "Compte liquidé en silence",
    dangerBody: "La stratégie dérive progressivement du backtest sans qu'aucune alerte ne soit émise.",
    dangerCost: "Compte de 10 000 € liquidé en une nuit sans alerte",
    solutionBody: "Comparaison continue du drawdown et du win-rate réels à la courbe théorique, alerte instantanée.",
    solutionCost: "29 € / mois — Alerte Telegram au moindre écart",
    ctaLabel: "Surveiller ma stratégie",
    ctaHref: "/contact",
  },
  {
    id: "anti-martingale",
    tool: "Anti-Martingale / Stress Test",
    dangerTitle: "Ruine mathématique",
    dangerBody: "Une martingale gagne jusqu'au jour où elle rase le compte entier.",
    dangerCost: "Bande de roulement gagnante qui finit par raser le compte",
    solutionBody: "Audit du risque de ruine mathématique et détection des stratégies de type Martingale (rédhibitoire).",
    solutionCost: "Inclus — Audit du risque de ruine mathématique",
    ctaLabel: "Tester mon risque de ruine",
    ctaHref: "/configure",
  },
  {
    id: "slippage-fees",
    tool: "Slippage & Fee Auditor",
    dangerTitle: "Gains dévorés",
    dangerBody: "Les frais de courtage et le slippage réels annulent l'edge déclaré du backtest.",
    dangerCost: "Gains du backtest entièrement dévorés par les frais du broker",
    solutionBody: "Simulation des conditions réelles de marché : commissions, spread et slippage par classe d'instrument.",
    solutionCost: "Inclus — Simulation des conditions réelles de marché",
    ctaLabel: "Calculer mes frais réels",
    ctaHref: "/fees",
  },
  {
    id: "zk-proof",
    tool: "ZK-Proof Certification",
    dangerTitle: "Méfiance des acheteurs",
    dangerBody: "Les acheteurs n'ont aucune preuve d'authenticité et refusent d'acheter le bot.",
    dangerCost: "Ventes de bots bloquées par la méfiance des acheteurs",
    solutionBody: "Preuve d'audit incassable, scellée par hash SHA-256, sans jamais exposer le code source.",
    solutionCost: "19 € / certificat — Preuve d'audit incassable sans donner son code",
    ctaLabel: "Certifier ma stratégie",
    ctaHref: "/configure",
  },
  {
    id: "vscode-extension",
    tool: "Extension VS Code",
    dangerTitle: "Bugs déployés en live",
    dangerBody: "Les failles passent inaperçues jusqu'au déploiement en conditions réelles.",
    dangerCost: "Des heures de dev gâchées et des bugs déployés en live",
    solutionBody: "Surlignage des failles (lookahead_on, recalculs instables) directement dans l'éditeur.",
    solutionCost: "Gratuit — Surlignage des erreurs pendant que tu codes",
    ctaLabel: "Installer l'extension",
    ctaHref: "/free-tools",
  },
];
