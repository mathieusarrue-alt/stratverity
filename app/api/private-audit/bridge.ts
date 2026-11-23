/** Loopback-only development bridge; private checkout/status require an additional opt-in. */
const actions = new Set(["source", "freeze", "coverage", "quote"]);
const ACTION_LIMIT = 64 * 1024;
const SOURCE_LIMIT = 6 * 2 * 1024 * 1024 + ACTION_LIMIT;
const RESPONSE_LIMIT = 128 * 1024;
const REPORT_LIMIT = 8 * 1024 * 1024;
const ATTEMPT = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const BEARER = /^[A-Za-z0-9._~+/-]{1,4096}={0,2}$/;
const IDEMPOTENCY = /^[A-Za-z0-9._:-]{16,255}$/;
const SHA = /^[a-f0-9]{64}$/;
const SESSION = /^cs_[A-Za-z0-9_]{1,252}$/;
const CHECKOUT = /^checkout-[a-f0-9]{32}$/;
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

type BridgeConfig = {
  development: boolean;
  enabled: boolean;
  checkoutEnabled?: boolean;
  reportEnabled?: boolean;
  site?: string;
  upstream?: string;
  readToken: () => Promise<string | undefined>;
  send?: typeof fetch;
};

class InvalidBody extends Error {
  readonly status: number;
  constructor(status: number) { super("Invalid body"); this.status = status; }
}

function localOrigin(raw?: string): string | null {
  if (!raw || !/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(raw)) return null;
  try {
    const parsed = new URL(raw);
    return parsed.origin === raw ? raw : null;
  } catch { return null; }
}

function failure(status: number) {
  return Response.json({ error: status === 503 ? "PRIVATE_AUDIT_UNAVAILABLE" : "PRIVATE_AUDIT_REQUEST_REFUSED" },
    { status, headers });
}

async function readBounded(message: Request | Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const length = message.headers.get("content-length");
  if (length !== null && (!/^[0-9]{1,20}$/.test(length) || message.headers.has("transfer-encoding"))) {
    throw new InvalidBody(400);
  }
  if (length !== null && Number(length) > limit) throw new InvalidBody(413);
  const reader = message.body?.getReader();
  if (!reader) throw new InvalidBody(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        void reader.cancel().catch(() => undefined);
        throw new InvalidBody(413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size || (length !== null && Number(length) !== size)) throw new InvalidBody(400);
  const body = new Uint8Array(size);
  let cursor = 0;
  for (const chunk of chunks) { body.set(chunk, cursor); cursor += chunk.byteLength; }
  return body;
}

const isJson = (h: Headers) => h.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
const record = (value: unknown): value is Record<string,unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isCents = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const CHECKOUT_STATES = new Set(["RESERVED","CHECKOUT_CREATED","PAYMENT_PENDING","PAID_PENDING_PROVISIONING",
  "REVIEW_REQUIRED","PAYMENT_FAILED","EXPIRED"]);
const JOB_STATES = new Set(["QUEUED","RUNNING","SUCCEEDED","RETRYABLE","DEAD_LETTER"]);

function checkoutUrl(value: unknown) {
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

function checkoutProjection(data: Record<string,unknown>) {
  if (typeof data.checkout_attempt_id !== "string" || !CHECKOUT.test(data.checkout_attempt_id)
    || typeof data.checkout_session_id !== "string" || !SESSION.test(data.checkout_session_id)
    || !checkoutUrl(data.checkout_url) || typeof data.scope_fingerprint !== "string" || !SHA.test(data.scope_fingerprint)
    || typeof data.quote_sha256 !== "string" || !SHA.test(data.quote_sha256)
    || typeof data.status !== "string" || !CHECKOUT_STATES.has(data.status) || !record(data.pricing)) return null;
  const price=data.pricing;
  if (price.currency !== "eur" || price.cadence !== "ONE_TIME" || !isCents(price.subtotal_ex_vat_cents)
    || !isCents(price.activation_ex_vat_cents) || !isCents(price.due_today_ex_vat_cents)
    || Number(price.subtotal_ex_vat_cents)+Number(price.activation_ex_vat_cents) !== price.due_today_ex_vat_cents
    || price.tax_calculation !== "STRIPE_AUTOMATIC_TAX_AT_CHECKOUT") return null;
  return {checkout_attempt_id:data.checkout_attempt_id,checkout_session_id:data.checkout_session_id,
    checkout_url:data.checkout_url,scope_fingerprint:data.scope_fingerprint,quote_sha256:data.quote_sha256,status:data.status,
    pricing:{currency:price.currency,cadence:price.cadence,subtotal_ex_vat_cents:price.subtotal_ex_vat_cents,
      activation_ex_vat_cents:price.activation_ex_vat_cents,due_today_ex_vat_cents:price.due_today_ex_vat_cents,
      tax_calculation:price.tax_calculation},authorization:false};
}

function statusProjection(data: Record<string,unknown>) {
  if (typeof data.checkout_status !== "string" || !CHECKOUT_STATES.has(data.checkout_status)
    || !(data.job_status === null || typeof data.job_status === "string" && JOB_STATES.has(data.job_status))
    || ![null,"DELIVERED","NOT_READY"].includes(data.delivery_status as string | null)
    || typeof data.report_ready !== "boolean"
    || (data.report_ready && (data.checkout_status !== "PAID_PENDING_PROVISIONING" || data.delivery_status !== "DELIVERED" || data.job_status !== "SUCCEEDED"))) return null;
  return {checkout_status:data.checkout_status,job_status:data.job_status,delivery_status:data.delivery_status,
    report_ready:data.report_ready,authorization:false};
}

export async function proxyPrivateAudit(request: Request, attempt: string, operation: string, config: BridgeConfig) {
  if (config.development !== true || config.enabled !== true
    || (config.checkoutEnabled !== undefined && typeof config.checkoutEnabled !== "boolean")
    || (config.reportEnabled !== undefined && typeof config.reportEnabled !== "boolean")
    || config.reportEnabled === true && config.checkoutEnabled !== true) return failure(404);
  const privateOperation = operation === "checkout" || operation === "status";
  const reportOperation = operation === "report" && config.reportEnabled === true && config.checkoutEnabled === true;
  const site = localOrigin(config.site);
  const upstream = localOrigin(config.upstream);
  if (!site || !upstream || site === upstream || !ATTEMPT.test(attempt)
    || !(actions.has(operation) || privateOperation && config.checkoutEnabled === true || reportOperation)) return failure(404);
  if (request.method !== "POST") return failure(405);
  if (request.headers.get("origin") !== site || new URL(request.url).origin !== site) return failure(403);
  if (!isJson(request.headers) || ![null, "identity"].includes(request.headers.get("content-encoding"))) return failure(415);
  const key=request.headers.get("idempotency-key");
  if (operation === "checkout" && (key === null || !IDEMPOTENCY.test(key))) return failure(400);
  try {
    const token = await config.readToken();
    if (!token || !BEARER.test(token)) return failure(401);
    let body: Uint8Array<ArrayBuffer>;
    try { body = await readBounded(request, operation === "source" ? SOURCE_LIMIT : ACTION_LIMIT); }
    catch (error) { return failure(error instanceof InvalidBody ? error.status : 400); }
    const response = await (config.send ?? fetch)(
      `${upstream}/v1/private-audit/intakes/${encodeURIComponent(attempt)}/${operation}`,
      { method: "POST", body, headers: { Authorization: `Bearer ${token}`, Origin: site, "Content-Type": "application/json",
        ...(operation === "checkout" ? {"Idempotency-Key":key!} : {}) },
        redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(20_000) },
    );
    if (reportOperation && response.status === 200) {
      if (response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/octet-stream"
        || ![null,"identity"].includes(response.headers.get("content-encoding"))) {
        void response.body?.cancel().catch(() => undefined);return failure(503);
      }
      let bytes:Uint8Array<ArrayBuffer>;
      try{bytes=await readBounded(response,REPORT_LIMIT);}catch{
        void response.body?.cancel().catch(()=>undefined);return failure(503);
      }
      return new Response(bytes,{status:200,headers:{...headers,"Content-Type":"application/octet-stream",
        "Content-Disposition":'attachment; filename="stratverity-audit.html"',"X-Robots-Tag":"noindex, nofollow",
        "Content-Security-Policy":"default-src 'none'; sandbox; base-uri 'none'; frame-ancestors 'none'"}});
    }
    const expectedStatus=operation === "checkout" ? 201 : 200;
    if (response.status !== expectedStatus || !isJson(response.headers)) {
      void response.body?.cancel().catch(() => undefined);
      return failure([400, 401, 403, 404, 409, 413, 415, 429].includes(response.status) ? response.status : 503);
    }
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await readBounded(response, RESPONSE_LIMIT)));
    if (!data || typeof data !== "object" || Array.isArray(data) || data.authorization !== false) return failure(503);
    if (privateOperation) {
      const projected=operation === "checkout" ? checkoutProjection(data) : statusProjection(data);
      return projected ? Response.json(projected,{status:expectedStatus,headers}) : failure(503);
    }
    const fields = operation === "source" ? ["source_sha256"] : operation === "quote"
      ? ["scope_fingerprint", "expires_at", "pricing_version", "price", "quote_sha256"]
      : ["schema", "scope_fingerprint", "profile", "contexts", "status", "receipt_sha256", "expires_at", "requires_confirmation"];
    return Response.json({ ...Object.fromEntries(fields.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]])),
      authorization: false }, { headers });
  } catch { return failure(503); }
}
