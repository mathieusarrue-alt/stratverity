const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const sha = /^[a-f0-9]{64}$/;
const attemptId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const idempotency = /^[A-Za-z0-9._:-]{16,255}$/;
const sessionId = /^cs_[A-Za-z0-9_]{1,252}$/;
const checkoutId = /^checkout-[a-f0-9]{32}$/;
const operations = new Set(["source","freeze","quote","checkout","status"]);
const record = (value: unknown): value is Record<string,unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const cents = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const checkoutStates = new Set(["RESERVED","CHECKOUT_CREATED","PAYMENT_PENDING","PAID_PENDING_PROVISIONING",
  "REVIEW_REQUIRED","PAYMENT_FAILED","EXPIRED"]);
const jobStates = new Set(["QUEUED","RUNNING","SUCCEEDED","RETRYABLE","DEAD_LETTER"]);

export type PrivateAuditQuote = Readonly<{
  scope_fingerprint: string; quote_sha256: string; pricing_version: "launch-v0.3"; expires_at: string;
  price: Readonly<{currency:"eur";cadence:"ONE_TIME";due_today_ex_vat_cents:number}>; authorization:false;
}>;

function validQuote(value: unknown): value is PrivateAuditQuote {
  return record(value) && value.authorization === false && typeof value.scope_fingerprint === "string"
    && sha.test(value.scope_fingerprint) && typeof value.quote_sha256 === "string" && sha.test(value.quote_sha256)
    && value.pricing_version === "launch-v0.3" && typeof value.expires_at === "string"
    && /(?:Z|\+00:00)$/.test(value.expires_at) && Number.isFinite(Date.parse(value.expires_at))
    && record(value.price) && value.price.currency === "eur" && value.price.cadence === "ONE_TIME"
    && cents(value.price.due_today_ex_vat_cents);
}

export function privateAuditCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 4096 || /[\s\\\x00-\x1f\x7f]/.test(value)) return false;
  const authority = /^https:\/\/([^/?#]*)/i.exec(value)?.[1];
  if (!authority || !/^[A-Za-z0-9.-]+(?::[0-9]+)?$/.test(authority) || authority.endsWith(":")) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"))
      && url.hostname.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
      && !url.username && !url.password && (!url.port || url.port === "443");
  } catch { return false; }
}

export function privateAuditLocalMode() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_LOCAL === "1";
}

export function localAuditScope<T extends { contexts: { asset_id: string; timeframe: string }[] }>(scope: T): T {
  if (scope.contexts.length !== 1) throw new Error("Single context required");
  const context = scope.contexts[0];
  const allowed: Record<string,string> = { BTCUSDT:"BINANCE:BTCUSDT", ETHUSDT:"BINANCE:ETHUSDT",
    "BINANCE:BTCUSDT":"BINANCE:BTCUSDT", "BINANCE:ETHUSDT":"BINANCE:ETHUSDT" };
  const asset = Object.hasOwn(allowed,context.asset_id) ? allowed[context.asset_id] : undefined;
  const timeframe = context.timeframe.toLowerCase();
  if (typeof asset !== "string" || !["15m","1h","4h","1d","1w"].includes(timeframe)) {
    throw new Error("Local Audit market is not supported");
  }
  return { ...scope, contexts: [{ ...context, asset_id: asset, timeframe }] };
}

export async function privateAuditPost(attempt: string, operation: "source" | "freeze" | "quote" | "checkout" | "status",
  body: object, send: typeof fetch = fetch, idempotencyKey?: string) {
  if (!operations.has(operation) || !attemptId.test(attempt) || (operation === "checkout" ? typeof idempotencyKey !== "string"
      || !idempotency.test(idempotencyKey) : idempotencyKey !== undefined)) throw new Error("Invalid private Audit request");
  const result = await send(`/api/private-audit/${encodeURIComponent(attempt)}/${operation}`, {
    method: "POST", headers: { "Content-Type": "application/json",
      ...(operation === "checkout" ? {"Idempotency-Key":idempotencyKey!} : {}) }, body: JSON.stringify(body),
    credentials: "same-origin", redirect: "error", cache: "no-store",
  });
  if (result.status !== (operation === "checkout" ? 201 : 200)) throw new Error("Private Audit unavailable");
  const data = await result.json();
  if (!data || data.authorization !== false) throw new Error("Unexpected private Audit response");
  return data;
}

export async function freezePrivateAudit(attempt: string, scope: object, file: Blob, expectedHash: string,
  send: typeof fetch = fetch) {
  if (file.size < 1 || file.size > MAX_SOURCE_BYTES || !sha.test(expectedHash)) throw new Error("Invalid source");
  const source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(await file.arrayBuffer());
  const uploaded = await privateAuditPost(attempt, "source", { scope, source }, send);
  if (uploaded.source_sha256 !== expectedHash) throw new Error("Source changed");
  return privateAuditPost(attempt, "freeze", { scope }, send);
}

export async function reserveLocalAudit(attempt: string, scope: object, expected: {
  scopeHash: string; expiresAt: number; cents: number; receipt?: string;
}, send: typeof fetch = fetch, now = Date.now) {
  if (!sha.test(expected.scopeHash) || !cents(expected.cents) || !Number.isFinite(expected.expiresAt)
    || !Number.isFinite(now()) || expected.expiresAt <= now() || (expected.receipt !== undefined && !sha.test(expected.receipt))) {
    throw new Error("Invalid Audit selection");
  }
  const quote = await privateAuditPost(attempt, "quote", {
    scope, ...(expected.receipt ? { accepted_reduced_receipt_sha256: expected.receipt } : {}),
  }, send);
  if (!validQuote(quote) || quote.scope_fingerprint !== expected.scopeHash
    || Date.parse(quote.expires_at) !== expected.expiresAt || expected.expiresAt <= now()
    || quote.price?.currency !== "eur" || quote.price?.cadence !== "ONE_TIME"
    || quote.price?.due_today_ex_vat_cents !== expected.cents) throw new Error("Unexpected quote");
  return Object.freeze({authorization:false,scope_fingerprint:quote.scope_fingerprint,
    quote_sha256:quote.quote_sha256,pricing_version:quote.pricing_version,expires_at:quote.expires_at,
    price:Object.freeze({currency:quote.price.currency,cadence:quote.price.cadence,
      due_today_ex_vat_cents:quote.price.due_today_ex_vat_cents})}) satisfies PrivateAuditQuote;
}

/** Transport only. A retry option is not a server authorization or TTL bypass. */
export async function checkoutPrivateAudit(attempt: string, scope: object, quote: PrivateAuditQuote,
  contractAcceptance: object, idempotencyKey: string, send: typeof fetch = fetch,
  now = Date.now, options: {allowExpiredRetry?: boolean} = {}) {
  if (!validQuote(quote) || !record(contractAcceptance) || !Number.isFinite(now())
    || (options.allowExpiredRetry !== undefined && typeof options.allowExpiredRetry !== "boolean")
    || (!options.allowExpiredRetry && Date.parse(quote.expires_at) <= now())) throw new Error("Invalid private Audit checkout");
  const data = await privateAuditPost(attempt,"checkout",{scope,quote_sha256:quote.quote_sha256,
    pricing_version:quote.pricing_version,contract_acceptance:contractAcceptance},send,idempotencyKey);
  if (!record(data) || typeof data.checkout_attempt_id !== "string" || !checkoutId.test(data.checkout_attempt_id)
    || typeof data.checkout_session_id !== "string" || !sessionId.test(data.checkout_session_id)
    || !privateAuditCheckoutUrl(data.checkout_url) || data.scope_fingerprint !== quote.scope_fingerprint
    || data.quote_sha256 !== quote.quote_sha256 || !checkoutStates.has(String(data.status)) || !record(data.pricing)) {
    throw new Error("Unexpected private Audit checkout");
  }
  const price = data.pricing;
  if (price.currency !== quote.price.currency || price.cadence !== quote.price.cadence
    || price.due_today_ex_vat_cents !== quote.price.due_today_ex_vat_cents
    || !cents(price.subtotal_ex_vat_cents) || !cents(price.activation_ex_vat_cents)
    || price.subtotal_ex_vat_cents+price.activation_ex_vat_cents !== price.due_today_ex_vat_cents
    || price.tax_calculation !== "STRIPE_AUTOMATIC_TAX_AT_CHECKOUT") throw new Error("Unexpected private Audit price");
  return Object.freeze({authorization:false,checkout_attempt_id:data.checkout_attempt_id,
    checkout_session_id:data.checkout_session_id,checkout_url:data.checkout_url,
    scope_fingerprint:quote.scope_fingerprint,quote_sha256:quote.quote_sha256,status:String(data.status),
    pricing:Object.freeze({currency:price.currency,cadence:price.cadence,subtotal_ex_vat_cents:price.subtotal_ex_vat_cents,
      activation_ex_vat_cents:price.activation_ex_vat_cents,due_today_ex_vat_cents:price.due_today_ex_vat_cents,
      tax_calculation:price.tax_calculation})});
}

export async function statusPrivateAudit(attempt: string, scope: object, checkoutSessionId: string, send: typeof fetch = fetch) {
  if (!sessionId.test(checkoutSessionId)) throw new Error("Invalid private Audit session");
  const data = await privateAuditPost(attempt,"status",{scope,checkout_session_id:checkoutSessionId},send);
  if (!record(data) || !checkoutStates.has(String(data.checkout_status))
    || !(data.job_status === null || typeof data.job_status === "string" && jobStates.has(data.job_status))
    || ![null,"DELIVERED","NOT_READY"].includes(data.delivery_status as string | null)
    || typeof data.report_ready !== "boolean"
    || (data.report_ready && (data.checkout_status !== "PAID_PENDING_PROVISIONING" || data.delivery_status !== "DELIVERED"))) {
    throw new Error("Unexpected private Audit status");
  }
  return Object.freeze({authorization:false,checkout_status:String(data.checkout_status),job_status:data.job_status,
    delivery_status:data.delivery_status,report_ready:data.report_ready});
}
