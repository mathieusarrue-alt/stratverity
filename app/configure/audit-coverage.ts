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

export function readAuditCoverage(preview: { scope_fingerprint: string; audit_pre_admission?: unknown },
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
  if (expiresAt <= now) return { status: "EXPIRED" };
  return { status: v.status, receipt: v.receipt_sha256, expiresAt, window: {
    ...contexts[0], first_open: String(w.first_open), last_close: String(w.last_close),
    bars:w.bars, target_years:w.target_years, reduced:w.reduced,
  } };
}
