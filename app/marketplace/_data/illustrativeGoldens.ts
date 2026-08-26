// Fiches "goldens" de laboratoire — Marketplace illustrative.
// Aucune donnée de performance réelle : ce sont des exemples calculés pour
// illustrer la métrique de score. Proof not storytelling : jamais promesse
// de gains, vocabulaire labo uniquement.
//
// Formule du score (déterministe, documentée ici) :
//   pf_norm  = clamp((PF - 0.5) / 2,  0, 1)
//   wr_norm  = clamp(WR / 70,         0, 1)
//   dd_score = 1 - clamp((|DD| - 5) / 30, 0, 1)
//   score    = round(35*pf_norm + 25*wr_norm + 25*dd_score + 15*integ)
//   integ ∈ {1 (audit complet), 0.5 (aperçu labo), 0 (contrôle négatif)}
//
// Le score est calculé ici en une seule source de vérité (computeScore), puis
// figé dans chaque fiche via illustrativeGoldens — aucun calcul à la volée côté
// rendu pour que l'affichage reste déterministe.

export type GoldenStatus = "positive" | "negative_control";

export interface IllustrativeGolden {
  id: string;
  asset: string;
  timeframe: string;
  status: GoldenStatus;
  pf: number; // profit factor
  wr: number; // win rate, en % (0-100)
  dd: number; // drawdown, en % (négatif)
  integ: 1 | 0.5 | 0; // statut d'intégrité du labo
  score: number;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function computeScore(g: {
  pf: number;
  wr: number;
  dd: number;
  integ: number;
}): number {
  const pfNorm = clamp((g.pf - 0.5) / 2, 0, 1);
  const wrNorm = clamp(g.wr / 70, 0, 1);
  const ddScore = 1 - clamp((Math.abs(g.dd) - 5) / 30, 0, 1);
  return Math.round(
    35 * pfNorm + 25 * wrNorm + 25 * ddScore + 15 * g.integ,
  );
}

type GoldenSeed = Omit<IllustrativeGolden, "score">;

const seeds: GoldenSeed[] = [
  {
    id: "G-PIN-001",
    asset: "XRP",
    timeframe: "H4",
    status: "positive",
    pf: 0.37,
    wr: 28.6,
    dd: -34,
    integ: 0.5, // aperçu labo — presque tout est pénalisé, score bas
  },
  {
    id: "G-PIN-002",
    asset: "SOL",
    timeframe: "H4",
    status: "positive",
    pf: 4.63,
    wr: 83,
    dd: -8,
    integ: 1, // profil audit complet, score élevé
  },
  {
    id: "G-NEG-768",
    asset: "ETH",
    timeframe: "H4",
    status: "negative_control",
    pf: 0.5,
    wr: 30,
    dd: -60,
    integ: 0, // contrôle négatif — tiré vers le bas quoi qu'il arrive
  },
];

// Chaîne figée : seed + score calculé une seule fois à l'import.
export const illustrativeGoldens: IllustrativeGolden[] = seeds.map((s) => ({
  ...s,
  score: computeScore(s),
}));
