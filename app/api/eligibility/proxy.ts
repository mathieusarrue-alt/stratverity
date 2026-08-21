const DEFAULT_API_ORIGIN = "https://api.stratverity.com";
const DEFAULT_SITE_ORIGIN = "https://www.stratverity.com";
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

const ALLOWED_PATHS = new Set([
  "/v1/eligibility/session",
  "/v1/eligibility/email/request",
  "/v1/eligibility/email/confirm",
  "/v1/eligibility/evaluate",
  "/v1/health-check",
]);

function bareOrigin(raw: string, label: string): string {
  const parsed = new URL(raw);
  if (
    !["https:", "http:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${label} must be a bare HTTP(S) origin.`);
  }
  if (parsed.protocol === "http:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    throw new Error(`${label} must use HTTPS outside local development.`);
  }
  return parsed.origin;
}

function securityHeaders(contentType = "application/json"): Headers {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
}

export async function proxyEligibility(
  request: Request,
  backendPath: string,
): Promise<Response> {
  if (!ALLOWED_PATHS.has(backendPath)) {
    return new Response('{"error":"NOT_FOUND"}', {
      status: 404,
      headers: securityHeaders(),
    });
  }

  const siteOrigin = bareOrigin(
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN,
    "NEXT_PUBLIC_SITE_ORIGIN",
  );
  const incomingOrigin = request.headers.get("origin");
  if (request.method !== "GET" && incomingOrigin !== siteOrigin) {
    return new Response('{"error":"ORIGIN_NOT_ALLOWED"}', {
      status: 403,
      headers: securityHeaders(),
    });
  }

  const apiOrigin = bareOrigin(
    process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ?? DEFAULT_API_ORIGIN,
    "NEXT_PUBLIC_BACKTESTPROOF_API_URL",
  );
  const incomingUrl = new URL(request.url);
  const target = new URL(backendPath, apiOrigin);
  if (request.method === "GET") target.search = incomingUrl.search;

  const outgoingHeaders = new Headers({ Origin: siteOrigin });
  const cookie = request.headers.get("cookie");
  if (cookie) outgoingHeaders.set("Cookie", cookie);
  for (const name of [
    "content-type",
    "x-audit-request-id",
    "x-audit-id",
    "x-source-language",
  ]) {
    const value = request.headers.get(name);
    if (value) outgoingHeaders.set(name, value);
  }

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return new Response('{"error":"REQUEST_TOO_LARGE"}', {
        status: 413,
        headers: securityHeaders(),
      });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: outgoingHeaders,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });
    const headers = securityHeaders(
      upstream.headers.get("content-type") ?? "application/json",
    );
    for (const name of ["location", "set-cookie"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers,
    });
  } catch {
    return new Response('{"error":"ELIGIBILITY_UPSTREAM_UNAVAILABLE"}', {
      status: 503,
      headers: securityHeaders(),
    });
  } finally {
    clearTimeout(timeout);
  }
}