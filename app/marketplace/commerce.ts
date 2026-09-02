// Shared types + helpers for the Marketplace v1 COMMERCE front (invite_protected).
// This is the buyer/seller UI layer only. Persistence + Stripe live in the
// FastAPI backend (SAAS_AUDIT_BACKTEST) reached via /api/marketplace/* proxies.
// Doctrine: we sell ACCESS (Whop-model), never the source code.

export type ListingKind = "indicator" | "strategy" | "toolkit";
export type ListingPlatform = "tradingview" | "mt5" | "mt4" | "python";
export type ListingState =
  | "DRAFT"
  | "SUBMITTED"
  | "QUEUE_AUDIT"
  | "NEEDS_INFO"
  | "AUDIT_SEALED"
  | "LISTED"
  | "OPERATOR_LISTED"
  | "REJECTED"
  | "SUSPENDED"
  | "DELISTED";

export type SaleMode = "one_shot" | "rent_monthly" | "rent_quarterly" | "rent_yearly";

export interface ListingOffer {
  mode: SaleMode;
  price_cents: number;
}

export interface MarketplaceListing {
  id: string;
  slug: string;
  title: string;
  kind: ListingKind;
  platform: ListingPlatform[];
  asset_class: string[];
  description: string;
  short_description?: string;
  delivery_mode: "invite_protected";
  offers: ListingOffer[];
  seller_handle?: string;
  // Médias vendeur uploadés via Supabase Storage (décision fondateur
  // 2026-09-02) — URLs publiques https, ou absents/vides si le vendeur n'a
  // rien ajouté. avatar_url : photo de profil carrée du listing.
  // screenshots : captures d'écran illustrant l'indicateur/la stratégie.
  avatar_url?: string | null;
  screenshots?: string[];
  state: ListingState;
  badge?: "OPERATOR" | "SEALED";
  created_at?: string;
}

export interface LicenseView {
  listing_id: string;
  title: string;
  slug: string;
  handle: string;
  kind: ListingKind;
  mode: SaleMode;
  state: "active" | "pending_grant" | "revoked" | "past_due";
  message: string;
}

export interface SellerDashboard {
  listings: Array<{
    id: string;
    slug: string;
    title: string;
    state: ListingState;
  }>;
  stats: {
    views: number;
    unique_views: number;
    favorites: number;
    checkouts: number;
    sales: number;
    total_revenue_cents: number;
    rent_mrr_cents: number;
    churn: number;
  };
  balance_cents: number;
  granted: Array<{ license_id: string; handle: string; state: string }>;
}

export const COMMERCE_ENABLED =
  process.env.NEXT_PUBLIC_MARKETPLACE_COMMERCE === "true";

export const COMMISSION_PCT = 15;

// Planchers produit (décision fondateur 2026-08-30). Chaque vendeur fixe
// librement ses 3 prix au-dessus de ces planchers — principe marketplace :
// c'est le vendeur qui décide, la plateforme ne fait qu'empêcher les
// listings à prix dérisoire.
export const MIN_ONE_SHOT_CENTS = 30_000; // 300 €
export const MIN_RENT_MONTHLY_CENTS = 2_000; // 20 €/mois
export const MIN_RENT_QUARTERLY_CENTS = 5_000; // 50 €/trimestre (plancher
// autonome ; si une offre mensuelle existe aussi, la vraie contrainte est la
// dégressivité ci-dessous).
export const MIN_RENT_YEARLY_CENTS = 20_000; // 200 €/an (plancher autonome ;
// si une offre mensuelle existe aussi, la vraie contrainte est la
// dégressivité ci-dessous, toujours plus stricte que ce plancher seul).

// Miroir exact de MAX_SCREENSHOTS côté backend (marketplace_v1.py) — garder
// synchronisé. Le backend refuse déjà au-delà, ce plafond côté front n'est
// qu'un garde-fou UX (désactive le bouton d'ajout avant l'envoi du formulaire).
export const MAX_LISTING_SCREENSHOTS = 6;

/** Échelle des paliers de location, du plus court au plus long, avec le
 * nombre de "mois équivalents" couverts par chaque palier. Miroir exact de
 * RENT_LADDER côté backend (marketplace_v1.py) — garder synchronisé. */
const RENT_LADDER: ReadonlyArray<readonly [SaleMode, number]> = [
  ["rent_monthly", 1],
  ["rent_quarterly", 3],
  ["rent_yearly", 12],
];

const RENT_DURATION_LABEL: Partial<Record<SaleMode, string>> = {
  rent_monthly: "mensuel",
  rent_quarterly: "trimestriel",
  rent_yearly: "annuel",
};

/** Règle bloquante : pour chaque paire de paliers de location actifs, le plus
 * long doit être strictement moins cher que le nombre équivalent de fois le
 * plus court (sinon "économisez en prenant plus long" serait faux pour
 * l'acheteur). Prend les 3 prix (null si l'offre correspondante n'est pas
 * activée) et retourne le premier message d'erreur trouvé, ou null. */
export function degressivePricingError(
  monthlyCents: number | null,
  quarterlyCents: number | null,
  yearlyCents: number | null,
): string | null {
  const prices: Partial<Record<SaleMode, number>> = {};
  if (monthlyCents !== null) prices.rent_monthly = monthlyCents;
  if (quarterlyCents !== null) prices.rent_quarterly = quarterlyCents;
  if (yearlyCents !== null) prices.rent_yearly = yearlyCents;
  const present = RENT_LADDER.filter(([mode]) => mode in prices);
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const [shortMode, shortMonths] = present[i];
      const [longMode, longMonths] = present[j];
      const ratio = longMonths / shortMonths;
      const shortPrice = prices[shortMode] as number;
      const longPrice = prices[longMode] as number;
      if (longPrice >= shortPrice * ratio) {
        return `Le prix ${RENT_DURATION_LABEL[longMode]} doit être strictement inférieur à ${ratio}× le prix ${RENT_DURATION_LABEL[shortMode]} (dégressivité obligatoire).`;
      }
    }
  }
  return null;
}

/** % d'économie affiché à l'acheteur pour un palier plus long vs le nombre
 * équivalent de fois le palier plus court (ex. annuel vs 12 mensualités,
 * trimestriel vs 3 mensualités). */
export function savingsPct(shortCents: number, longCents: number, monthsRatio: number): number {
  if (shortCents <= 0) return 0;
  const fullDuration = shortCents * monthsRatio;
  if (fullDuration <= 0) return 0;
  return Math.round((1 - longCents / fullDuration) * 100);
}

/** @deprecated utiliser savingsPct(monthlyCents, yearlyCents, 12) — conservé
 * pour compatibilité avec le code appelant existant. */
export function yearlySavingsPct(monthlyCents: number, yearlyCents: number): number {
  return savingsPct(monthlyCents, yearlyCents, 12);
}

export function formatCents(cents: number): string {
  const euros = (cents / 100).toLocaleString("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
  return euros;
}

export const MODE_LABEL: Record<SaleMode, string> = {
  one_shot: "Accès permanent",
  rent_monthly: "Location mensuelle",
  rent_quarterly: "Location trimestrielle",
  rent_yearly: "Location annuelle",
};

/** Suffixe court à accoler à un prix formaté (ex. "19 €" + " /mois"). */
export const MODE_PRICE_SUFFIX: Record<SaleMode, string> = {
  one_shot: "",
  rent_monthly: " /mois",
  rent_quarterly: " /trimestre",
  rent_yearly: " /an",
};

export const MODE_SUMMARY_SUFFIX: Record<SaleMode, string> = {
  one_shot: " — licence à vie",
  rent_monthly: " /mois, résiliable à tout moment",
  rent_quarterly: " /trimestre, résiliable à tout moment",
  rent_yearly: " /an, résiliable à tout moment",
};

export const KIND_LABEL: Record<ListingKind, string> = {
  indicator: "Indicateur",
  strategy: "Stratégie",
  toolkit: "Pack d'outils",
};

export const STATE_LABEL: Record<ListingState, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Déposé",
  QUEUE_AUDIT: "En attente d'audit",
  NEEDS_INFO: "Infos manquantes",
  AUDIT_SEALED: "Audit scellé",
  LISTED: "En ligne",
  OPERATOR_LISTED: "En ligne (opérateur)",
  REJECTED: "Rejeté",
  SUSPENDED: "Suspendu",
  DELISTED: "Retiré",
};

// v1: only invite_protected is available. No source download, ever.
export function deliveryLabel(mode: "invite_protected"): string {
  return "Accès plateforme en invite — source jamais transmise";
}
