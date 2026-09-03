export type TboCheckoutRecord = {
  version: 1;
  fingerprint: string;
  key: string;
};

const ACTIVE_CHECKOUT_STORAGE_KEY = "stratverity:tbo-checkout:active";
const IDEMPOTENCY_KEY_RE = /^\S{16,255}$/;
let volatileRecord: TboCheckoutRecord | null = null;

function isCheckoutRecord(value: unknown): value is TboCheckoutRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<TboCheckoutRecord>;
  return (
    record.version === 1 &&
    typeof record.fingerprint === "string" &&
    record.fingerprint.length > 0 &&
    typeof record.key === "string" &&
    IDEMPOTENCY_KEY_RE.test(record.key)
  );
}

function readStoredRecord(): TboCheckoutRecord | null {
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_CHECKOUT_STORAGE_KEY);
    if (!raw) return volatileRecord;
    const parsed: unknown = JSON.parse(raw);
    return isCheckoutRecord(parsed) ? parsed : volatileRecord;
  } catch {
    return volatileRecord;
  }
}

function persistRecord(record: TboCheckoutRecord): void {
  volatileRecord = record;
  try {
    window.sessionStorage.setItem(
      ACTIVE_CHECKOUT_STORAGE_KEY,
      JSON.stringify(record),
    );
  } catch {
    // Safari/private storage can reject writes. The volatile record preserves
    // idempotence for retries during the current page lifecycle.
  }
}

export function tboCheckoutFingerprint(sku: string, username: string): string {
  return `${sku}:\u0000:${username.trim()}`;
}

export function getOrRotateTboCheckoutKey(
  sku: string,
  username: string,
): string {
  const fingerprint = tboCheckoutFingerprint(sku, username);
  const active = readStoredRecord();
  if (active?.fingerprint === fingerprint) {
    volatileRecord = active;
    return active.key;
  }

  const next: TboCheckoutRecord = {
    version: 1,
    fingerprint,
    key: `tbo_${crypto.randomUUID()}`,
  };
  persistRecord(next);
  return next.key;
}

export function clearActiveTboCheckout(): void {
  volatileRecord = null;
  try {
    window.sessionStorage.removeItem(ACTIVE_CHECKOUT_STORAGE_KEY);
  } catch {
    // The volatile record is already cleared; storage failure remains safe.
  }
}
