export type PricingProduct = "AUDIT" | "SCAN" | "OPTIMIZER";
export type PricingAuditDepth =
  | "ESSENTIAL"
  | "PREMIUM"
  | "STANDARD"
  | "ROBUSTNESS"
  | "CUSTOM";
export type PricingOptimizerDepth = "ESSENTIAL" | "PRO" | "ELITE";
export type PricingEvaluationMode = "BAR_CLOSE" | "INTRABAR";

export type PricingLine = {
  label: string;
  amountExVatCents: number;
  cadence: "ONE_TIME" | "MONTHLY";
};

export type PricingResult = {
  version: "launch-v0.3";
  cadence: "ONE_TIME" | "MONTHLY";
  lines: PricingLine[];
  subtotalExVatCents: number;
  vatCents: number;
  totalCents: number;
  activationExVatCents: number;
  activationVatCents: number;
  dueTodayCents: number;
};

type PricingInput = {
  product: PricingProduct;
  contextCount: number;
  strategyCount: number;
  auditDepth: PricingAuditDepth;
  evaluationMode: PricingEvaluationMode;
  retentionDays: number;
  optimizerDepth?: PricingOptimizerDepth;
};

// Régime actuel de l'exploitant : franchise en base de TVA.
// Une future ouverture internationale devra recalculer la taxe selon le pays
// du client avant d'activer Stripe live.
const VAT_RATE = 0;

const AUDIT_CONTEXT_BANDS = [
  { capacity: 9, unitCents: 800 },
  { capacity: 40, unitCents: 400 },
  { capacity: 150, unitCents: 200 },
  { capacity: Number.POSITIVE_INFINITY, unitCents: 100 },
] as const;

const SCAN_CONTEXT_BANDS = [
  { capacity: 9, unitCents: 200 },
  { capacity: 40, unitCents: 80 },
  { capacity: 150, unitCents: 35 },
  { capacity: Number.POSITIVE_INFINITY, unitCents: 15 },
] as const;

function progressiveContextCost(
  contextCount: number,
  bands: readonly { capacity: number; unitCents: number }[],
): number {
  let remaining = Math.max(0, Math.floor(contextCount) - 1);
  let amount = 0;

  for (const band of bands) {
    if (remaining === 0) break;
    const units = Math.min(remaining, band.capacity);
    amount += units * band.unitCents;
    remaining -= units;
  }

  return amount;
}

function vat(amountExVatCents: number): number {
  return Math.round(amountExVatCents * VAT_RATE);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function calculatePrice(input: PricingInput): PricingResult {
  const contextCount = Math.max(1, Math.floor(input.contextCount));
  const strategyCount = Math.max(1, Math.floor(input.strategyCount));

  if (input.product === "AUDIT") {
    if (input.auditDepth === "ESSENTIAL") {
      return {
        version: "launch-v0.3",
        cadence: "ONE_TIME",
        lines: [
          {
            label:
              "Audit essentiel · 1 stratégie × 1 actif × 1 unité de temps · 2 ans d'historique",
            amountExVatCents: 1_900,
            cadence: "ONE_TIME",
          },
        ],
        subtotalExVatCents: 1_900,
        vatCents: 0,
        totalCents: 1_900,
        activationExVatCents: 0,
        activationVatCents: 0,
        dueTodayCents: 1_900,
      };
    }
    // PROMOTION : STANDARD / ROBUSTNESS (legacy) -> PREMIUM (migration) ;
    // multi-contexte -> CUSTOM (Premium est mono-contexte).
    const effectiveDepth =
      input.auditDepth === "STANDARD" || input.auditDepth === "ROBUSTNESS"
        ? "PREMIUM"
        : input.auditDepth;
    const multiContext = contextCount > 1;

    if (!multiContext && effectiveDepth === "PREMIUM") {
      return {
        version: "launch-v0.3",
        cadence: "ONE_TIME",
        lines: [
          {
            label:
              "Audit premium · 1 seul contexte · 8 ans d'historique",
            amountExVatCents: 4_900,
            cadence: "ONE_TIME",
          },
        ],
        subtotalExVatCents: 4_900,
        vatCents: 0,
        totalCents: 4_900,
        activationExVatCents: 0,
        activationVatCents: 0,
        dueTodayCents: 4_900,
      };
    }

    // CUSTOM / multi-contexte : grille variable (des ~79-99 EUR), 10 ans.
    const customScope =
      7_900 + progressiveContextCost(contextCount, AUDIT_CONTEXT_BANDS);
    const lines: PricingLine[] = [
      {
        label:
          "Audit personnalisé · multi-contexte · 10 ans d'historique",
        amountExVatCents: customScope,
        cadence: "ONE_TIME",
      },
    ];
    const subtotalExVatCents = lines.reduce(
      (sum, line) => sum + line.amountExVatCents,
      0,
    );
    const vatCents = vat(subtotalExVatCents);

    return {
      version: "launch-v0.3",
      cadence: "ONE_TIME",
      lines,
      subtotalExVatCents,
      vatCents,
      totalCents: subtotalExVatCents + vatCents,
      activationExVatCents: 0,
      activationVatCents: 0,
      dueTodayCents: subtotalExVatCents + vatCents,
    };
  }

  // OPTIMIZER — grille plate : Essentiel 149 € / Pro 299 € / Elite 549 € HT,
  // une seule ligne ONE_TIME. Miroir de `_flat_optimizer_price` backend
  // (pricing.py) — mêmes montants, cadence et conventions TVA.
  if (input.product === "OPTIMIZER") {
    const depth: PricingOptimizerDepth = input.optimizerDepth ?? "PRO";
    const amount =
      depth === "ESSENTIAL" ? 14_900 : depth === "ELITE" ? 54_900 : 29_900;
    const label =
      depth === "ESSENTIAL"
        ? "Optimizer Essentiel · recherche sous contrainte de drawdown + PBO"
        : depth === "ELITE"
          ? "Optimizer Elite · + multi-timeframe, stress tests de régime, artefact déployable, prompt d'édition IA, paper-trading"
          : "Optimizer Pro · + sélection OOS déflatée (CSCV), walk-forward purge, Monte-Carlo, généralisation multi-actifs";
    return {
      version: "launch-v0.3",
      cadence: "ONE_TIME",
      lines: [{ label, amountExVatCents: amount, cadence: "ONE_TIME" }],
      subtotalExVatCents: amount,
      vatCents: 0,
      totalCents: amount,
      activationExVatCents: 0,
      activationVatCents: 0,
      dueTodayCents: amount,
    };
  }

  const recurringScope =
    1_900 + progressiveContextCost(contextCount, SCAN_CONTEXT_BANDS);
  const lines: PricingLine[] = [
    {
      label: "Scan live · 1er contexte inclus",
      amountExVatCents: recurringScope,
      cadence: "MONTHLY",
    },
  ];

  if (input.evaluationMode === "INTRABAR") {
    lines.push({
      label: "Traitement intrabar",
      amountExVatCents: Math.round(recurringScope * 0.6),
      cadence: "MONTHLY",
    });
  }

  const beforeRetention = lines.reduce(
    (sum, line) => sum + line.amountExVatCents,
    0,
  );
  const retentionRate =
    input.retentionDays >= 365 ? 0.25 : input.retentionDays >= 90 ? 0.1 : 0;
  if (retentionRate > 0) {
    lines.push({
      label: `Conservation ${input.retentionDays} jours`,
      amountExVatCents: Math.round(beforeRetention * retentionRate),
      cadence: "MONTHLY",
    });
  }

  const subtotalExVatCents = lines.reduce(
    (sum, line) => sum + line.amountExVatCents,
    0,
  );
  const vatCents = vat(subtotalExVatCents);
  const activationExVatCents = 2_900 * strategyCount;
  const activationVatCents = vat(activationExVatCents);

  return {
    version: "launch-v0.3",
    cadence: "MONTHLY",
    lines,
    subtotalExVatCents,
    vatCents,
    totalCents: subtotalExVatCents + vatCents,
    activationExVatCents,
    activationVatCents,
    dueTodayCents:
      subtotalExVatCents +
      vatCents +
      activationExVatCents +
      activationVatCents,
  };
}