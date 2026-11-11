const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const sha = /^[a-f0-9]{64}$/;

export function privateAuditLocalMode() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_LOCAL === "1";
}

export function localAuditScope<T extends { contexts: { asset_id: string; timeframe: string }[] }>(scope: T): T {
  if (scope.contexts.length !== 1) throw new Error("Single context required");
  const context = scope.contexts[0];
  const asset = { BTCUSDT:"BINANCE:BTCUSDT", ETHUSDT:"BINANCE:ETHUSDT" }[context.asset_id as "BTCUSDT" | "ETHUSDT"];
  const timeframe = context.timeframe.toLowerCase();
  if (typeof asset !== "string" || !["15m","1h","4h","1d","1w"].includes(timeframe)) {
    throw new Error("Local Audit market is not supported");
  }
  return { ...scope, contexts: [{ ...context, asset_id: asset, timeframe }] };
}

export async function privateAuditPost(attempt: string, operation: "source" | "freeze" | "quote",
  body: object, send: typeof fetch = fetch) {
  const result = await send(`/api/private-audit/${encodeURIComponent(attempt)}/${operation}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    credentials: "same-origin", redirect: "error", cache: "no-store",
  });
  if (!result.ok) throw new Error("Private Audit unavailable");
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
  if (expected.expiresAt <= now() || (expected.receipt !== undefined && !sha.test(expected.receipt))) {
    throw new Error("Invalid Audit selection");
  }
  const quote = await privateAuditPost(attempt, "quote", {
    scope, ...(expected.receipt ? { accepted_reduced_receipt_sha256: expected.receipt } : {}),
  }, send);
  if (quote.scope_fingerprint !== expected.scopeHash || typeof quote.quote_sha256 !== "string"
    || !sha.test(quote.quote_sha256) || quote.pricing_version !== "launch-v0.3"
    || Date.parse(quote.expires_at) !== expected.expiresAt || expected.expiresAt <= now()
    || quote.price?.currency !== "eur" || quote.price?.cadence !== "ONE_TIME"
    || quote.price?.due_today_ex_vat_cents !== expected.cents) throw new Error("Unexpected quote");
}
