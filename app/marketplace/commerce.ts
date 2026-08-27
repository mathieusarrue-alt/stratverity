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

export type SaleMode = "one_shot" | "rent_monthly";

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

export const MIN_ONE_SHOT_CENTS = 900; // 9 €
export const MIN_RENT_CENTS = 400; // 4 €/mo

export function formatCents(cents: number): string {
  const euros = (cents / 100).toLocaleString("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
  return euros;
}

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