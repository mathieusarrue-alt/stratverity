/** Loopback-only development bridge; no checkout or payment operation. */
const actions = new Set(["source", "freeze", "coverage", "quote"]);
const ACTION_LIMIT = 64 * 1024;
const SOURCE_LIMIT = 6 * 2 * 1024 * 1024 + ACTION_LIMIT;
const RESPONSE_LIMIT = 128 * 1024;
const ATTEMPT = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const BEARER = /^[A-Za-z0-9._~+/-]{1,4096}={0,2}$/;
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

type BridgeConfig = {
  development: boolean;
  enabled: boolean;
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

export async function proxyPrivateAudit(request: Request, attempt: string, operation: string, config: BridgeConfig) {
  if (!config.development || !config.enabled) return failure(404);
  const site = localOrigin(config.site);
  const upstream = localOrigin(config.upstream);
  if (!site || !upstream || site === upstream || !ATTEMPT.test(attempt) || !actions.has(operation)) return failure(404);
  if (request.method !== "POST") return failure(405);
  if (request.headers.get("origin") !== site || new URL(request.url).origin !== site) return failure(403);
  if (!isJson(request.headers) || ![null, "identity"].includes(request.headers.get("content-encoding"))) return failure(415);
  try {
    const token = await config.readToken();
    if (!token || !BEARER.test(token)) return failure(401);
    let body: Uint8Array<ArrayBuffer>;
    try { body = await readBounded(request, operation === "source" ? SOURCE_LIMIT : ACTION_LIMIT); }
    catch (error) { return failure(error instanceof InvalidBody ? error.status : 400); }
    const response = await (config.send ?? fetch)(
      `${upstream}/v1/private-audit/intakes/${encodeURIComponent(attempt)}/${operation}`,
      { method: "POST", body, headers: { Authorization: `Bearer ${token}`, Origin: site, "Content-Type": "application/json" },
        redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(20_000) },
    );
    if (response.status !== 200 || !isJson(response.headers)) {
      void response.body?.cancel().catch(() => undefined);
      return failure([400, 401, 403, 404, 409, 413, 415, 429].includes(response.status) ? response.status : 503);
    }
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await readBounded(response, RESPONSE_LIMIT)));
    if (!data || typeof data !== "object" || Array.isArray(data) || data.authorization !== false) return failure(503);
    const fields = operation === "source" ? ["source_sha256"] : operation === "quote"
      ? ["scope_fingerprint", "expires_at", "pricing_version", "price", "quote_sha256"]
      : ["schema", "scope_fingerprint", "profile", "contexts", "status", "receipt_sha256", "expires_at", "requires_confirmation"];
    return Response.json({ ...Object.fromEntries(fields.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]])),
      authorization: false }, { headers });
  } catch { return failure(503); }
}
