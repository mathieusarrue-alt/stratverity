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

export type SaleMode = "one_shot" | "rent_monthly" | "rent_yearly";

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
export const MIN_RENT_YEARLY_CENTS = 20_000; // 200 €/an (plancher autonome ;
// si une offre mensuelle existe aussi, la vraie contrainte est la
// dégressivité ci-dessous, toujours plus stricte que ce plancher seul).

/** Règle bloquante : si les deux offres coexistent, l'annuel doit être
 * strictement moins cher que 12× le mensuel (sinon "économisez en payant
 * annuel" serait faux pour l'acheteur). Retourne un message d'erreur ou null. */
export function degressivePricingError(
  monthlyCents: number | null,
  yearlyCents: number | null,
): string | null {
  if (monthlyCents === null || yearlyCents === null) return null;
  if (yearlyCents >= monthlyCents * 12) {
    return "Le prix annuel doit être strictement inférieur à 12× le prix mensuel (au moins 1 mois offert).";
  }
  return null;
}

/** % d'économie affiché à l'acheteur pour l'offre annuelle vs 12 mensualités. */
export function yearlySavingsPct(monthlyCents: number, yearlyCents: number): number {
  if (monthlyCents <= 0) return 0;
  const fullYear = monthlyCents * 12;
  if (fullYear <= 0) return 0;
  return Math.round((1 - yearlyCents / fullYear) * 100);
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
  rent_yearly: "Location annuelle",
};

/** Suffixe court à accoler à un prix formaté (ex. "19 €" + " /mois"). */
export const MODE_PRICE_SUFFIX: Record<SaleMode, string> = {
  one_shot: "",
  rent_monthly: " /mois",
  rent_yearly: " /an",
};

export const MODE_SUMMARY_SUFFIX: Record<SaleMode, string> = {
  one_shot: " — licence à vie",
  rent_monthly: " /mois, résiliable à tout moment",
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