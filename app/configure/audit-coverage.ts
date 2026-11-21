export type CoverageContext = { strategy_version_id: string; asset_id: string; timeframe: string };

export type CoverageWindow = CoverageContext & {
  first_open: string;
  last_close: string;
  target_years: number;
  bars: number;
  reduced: boolean;
};

type ClosedStatus = "DATA_NOT_VERIFIED" | "PROFILE_NOT_OFFERED" | "MULTI_CONTEXT_REVIEW_REQUIRED";
type WindowStatus = "CONFIRM_EXACT_REDUCED_WINDOW" | "PRIVATE_QUOTE_POSSIBLE" | "RESET_UNEXPECTED_CONFIRMATION";
export type CoverageState = { status: "ABSENT" | "INVALID" | "EXPIRED" | ClosedStatus }
  | { status: WindowStatus; receipt: string; expiresAt: number; window: CoverageWindow };

const sha = /^[0-9a-f]{64}$/;
const steps: Record<string, number> = { "15m": 900_000, "1h": 3_600_000, "4h": 14_400_000,
  "1d": 86_400_000, "1w": 604_800_000 };
const historyYears: Record<string, number> = { ESSENTIAL:2, PREMIUM:8, STANDARD:8, ROBUSTNESS:8, CUSTOM:10 };

// Explicit Spot identities, not a suffix heuristic or a data availability claim.
const auditAssets: Record<string,string> = {
  BTCUSDT:"BINANCE:BTCUSDT", ETHUSDT:"BINANCE:ETHUSDT", SOLUSDT:"BINANCE:SOLUSDT",
  XRPUSDT:"BINANCE:XRPUSDT", BNBUSDT:"BINANCE:BNBUSDT", ADAUSDT:"BINANCE:ADAUSDT",
  DOGEUSDT:"BINANCE:DOGEUSDT", AVAXUSDT:"BINANCE:AVAXUSDT", LINKUSDT:"BINANCE:LINKUSDT",
  LTCUSDT:"BINANCE:LTCUSDT",
};

export function auditAssetId(product: string, asset: string): string {
  return product === "AUDIT" && Object.hasOwn(auditAssets,asset) ? auditAssets[asset] : asset;
}

export type AuditCapacity = { status: "FITS_STATIC_COUNT_ONLY" | "HISTORY_EXCEEDS_L1_CAPACITY"
  | "CAPACITY_UNVERIFIED" | "MULTI_CONTEXT_REVIEW_REQUIRED"; minBars?: number; maxBars?: number; years?: number };

export function readAuditCapacity(depth: unknown, contexts: CoverageContext[], strategyCount=1): AuditCapacity {
  if (!Array.isArray(contexts) || !Number.isSafeInteger(strategyCount) || strategyCount < 1
    || contexts.length === 0) return {status:"CAPACITY_UNVERIFIED"};
  if (contexts.length !== 1 || strategyCount !== 1) return {status:"MULTI_CONTEXT_REVIEW_REQUIRED"};
  const context=contexts[0];
  if (!record(context) || typeof depth !== "string" || !Object.hasOwn(historyYears,depth)
    || typeof context.asset_id !== "string" || !/^BINANCE:[A-Z0-9]{1,64}$/.test(context.asset_id)
    || typeof context.timeframe !== "string" || !Object.hasOwn(steps,context.timeframe)) return {status:"CAPACITY_UNVERIFIED"};
  const years=historyYears[depth], step=steps[context.timeframe];
  // Bounds for any Gregorian year and grid phase; not an exact candle count.
  // No wall-clock dependency: stable SSR and immediate recalculation on selection.
  const minBars=Math.floor(365*years*86_400_000/step);
  const maxBars=Math.ceil(366*years*86_400_000/step)+1;
  if (!Number.isSafeInteger(minBars) || !Number.isSafeInteger(maxBars)) return {status:"CAPACITY_UNVERIFIED"};
  return {status:minBars>100_000 ? "HISTORY_EXCEEDS_L1_CAPACITY"
    : maxBars<=100_000 ? "FITS_STATIC_COUNT_ONLY" : "CAPACITY_UNVERIFIED", minBars,maxBars,years};
}

export function auditCapacityMessage(capacity: AuditCapacity, locale: string): string {
  if (capacity.status === "FITS_STATIC_COUNT_ONLY") return "";
  if (capacity.status === "HISTORY_EXCEEDS_L1_CAPACITY") return locale === "fr"
    ? "Cette durée et cette unité de temps dépassent la capacité actuelle du moteur. Choisissez une profondeur plus courte ou une unité de temps supérieure. La période ne sera pas réduite automatiquement."
    : "This history and timeframe exceed the current engine capacity. Select a shorter depth or a higher timeframe. The period will not be silently reduced.";
  if (capacity.status === "MULTI_CONTEXT_REVIEW_REQUIRED") return locale === "fr"
    ? "L'achat automatique est actuellement limité à une stratégie et un contexte. Le prix estimé reste affiché, sans ouverture de paiement."
    : "Automatic checkout is currently limited to one strategy and one context. The estimated price remains visible without opening a payment.";
  return locale === "fr"
    ? "Le calendrier ou la capacité de cette sélection n'est pas encore qualifié pour l'achat automatique. Aucun paiement ne sera ouvert."
    : "The calendar or capacity of this selection is not yet qualified for automatic checkout. No payment will be opened.";
}

function yearCutoff(end: number, years: number): number | undefined {
  const date = new Date(end), year = date.getUTCFullYear()-years, month = date.getUTCMonth();
  if (year < 1) return;
  const last = new Date(end);
  last.setUTCFullYear(year, month+1, 0);
  date.setUTCFullYear(year, month, Math.min(date.getUTCDate(),last.getUTCDate()));
  return date.getTime();
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utcMillis(value: unknown): number | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(value)) return;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 19) !== value.slice(0, 19)) return;
  return ms;
}

export function hasPrivateAuditCoverage(preview: object): boolean {
  return Object.hasOwn(preview, "audit_pre_admission");
}

export function readAuditCoverage(preview: { scope_fingerprint: string; audit_pre_admission?: unknown; technical_estimate?: unknown },
  contexts: CoverageContext[], now: number): CoverageState {
  if (!hasPrivateAuditCoverage(preview)) return { status: "ABSENT" };
  const v = preview.audit_pre_admission;
  if (!record(v) || v.schema !== "stratverity.audit-private-pre-admission@1" || v.authorization !== false
    || !sha.test(preview.scope_fingerprint) || v.scope_fingerprint !== preview.scope_fingerprint
    || !Array.isArray(v.contexts)) return { status: "INVALID" };
  if (v.status === "PROFILE_NOT_OFFERED" || v.status === "DATA_NOT_VERIFIED" || v.status === "MULTI_CONTEXT_REVIEW_REQUIRED") {
    const expectedProfile = v.status === "PROFILE_NOT_OFFERED" ? "LONG" : "L1";
    return v.profile === expectedProfile && v.contexts.length === 0 ? { status: v.status } : { status: "INVALID" };
  }
  if ((v.status !== "CONFIRM_EXACT_REDUCED_WINDOW" && v.status !== "PRIVATE_QUOTE_POSSIBLE" && v.status !== "RESET_UNEXPECTED_CONFIRMATION")
    || v.profile !== "L1" || v.contexts.length !== 1 || !Array.isArray(contexts) || contexts.length !== 1
    || !record(contexts[0])
    || typeof v.receipt_sha256 !== "string" || !sha.test(v.receipt_sha256)) return { status: "INVALID" };
  const w = v.contexts[0];
  if (!record(w) || w.asset_id !== contexts[0].asset_id || w.strategy_version_id !== contexts[0].strategy_version_id
    || w.timeframe !== contexts[0].timeframe || typeof w.timeframe !== "string" || !Object.hasOwn(steps,w.timeframe)
    || typeof w.bars !== "number" || !Number.isSafeInteger(w.bars) || w.bars < 2 || w.bars > 100_000
    || typeof w.target_years !== "number" || !Number.isSafeInteger(w.target_years) || w.target_years < 1 || w.target_years > 20
    || typeof w.reduced !== "boolean" || w.reduced !== v.requires_confirmation
    || (v.status === "CONFIRM_EXACT_REDUCED_WINDOW" && !w.reduced)
    || (v.status === "RESET_UNEXPECTED_CONFIRMATION" && w.reduced)) return { status: "INVALID" };
  const start = utcMillis(w.first_open), end = utcMillis(w.last_close), expiresAt = utcMillis(v.expires_at);
  if (start === undefined || end === undefined || expiresAt === undefined || !Number.isFinite(now)
    || end-start !== steps[w.timeframe]*w.bars || end > now || expiresAt < end) return { status: "INVALID" };
  const estimate=preview.technical_estimate;
  const drivers=record(estimate) ? estimate.cost_drivers : undefined;
  const depth=record(drivers) ? drivers.depth : undefined;
  const anchor=w.timeframe==="1w" ? 4*86_400_000 : 0;
  const nonzeroFraction=(value: unknown) => typeof value === "string" && /\.[0-9]*[1-9][0-9]*(?:Z|\+00:00)$/.test(value);
  const hardCutoff=yearCutoff(end,20), targetCutoff=yearCutoff(end,w.target_years);
  if (typeof w.asset_id !== "string" || !/^BINANCE:[A-Z0-9]{1,64}$/.test(w.asset_id)
    || typeof depth !== "string" || !Object.hasOwn(historyYears,depth) || w.target_years !== historyYears[depth]
    || nonzeroFraction(w.first_open) || nonzeroFraction(w.last_close)
    || (start-anchor)%steps[w.timeframe] !== 0 || (end-anchor)%steps[w.timeframe] !== 0
    || hardCutoff === undefined || targetCutoff === undefined || start < hardCutoff
    || w.reduced !== (start > targetCutoff)) return { status:"INVALID" };
  if (expiresAt <= now) return { status: "EXPIRED" };
  return { status: v.status, receipt: v.receipt_sha256, expiresAt, window: {
    ...contexts[0], first_open: String(w.first_open), last_close: String(w.last_close),
    bars:w.bars, target_years:w.target_years, reduced:w.reduced,
  } };
}
