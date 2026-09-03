import { getSupabaseServerClient } from "../../supabase/server";

const API_ORIGIN = process.env.NEXT_PUBLIC_BACKTESTPROOF_API_URL ?? "https://api.stratverity.com";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://www.stratverity.com";
const MAX_BYTES = 64 * 1024;
const IDEMPOTENCY_KEY_RE = /^\S{16,255}$/;

const PATHS = new Set([
  "/v1/marketplace/listings",
  "/v1/marketplace/ownership-claims",
  "/v1/marketplace/connect/account-links",
  "/v1/marketplace/connect/status",
  "/v1/marketplace/checkout-sessions",
  "/v1/marketplace/download-links",
  "/v1/marketplace/sell",
  "/v1/marketplace/sell/listings",
  "/v1/marketplace/sell/dashboard",
  "/v1/marketplace/licenses",
  "/v1/marketplace/favorites",
  "/v1/marketplace/grants",
  "/v1/marketplace/operator-listings",
  "/v1/marketplace/license-for-session",
]);

type ProxyMarketplaceOptions = {
  queryKeys?: readonly string[];
  requireAuth?: boolean;
  forwardIdempotencyKey?: boolean;
};

function safeOrigin(raw: string): string {
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/") {
    throw new Error("Invalid Marketplace origin");
  }
  return parsed.origin;
}

export async function proxyMarketplace(
  request: Request,
  path: string,
  options: ProxyMarketplaceOptions = {},
): Promise<Response> {
  if (!PATHS.has(path)) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  const siteOrigin = safeOrigin(SITE_ORIGIN);
  if (request.method !== "GET" && request.headers.get("origin") !== siteOrigin) {
    return Response.json({ error: "ORIGIN_NOT_ALLOWED" }, { status: 403 });
  }
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if ((request.method !== "GET" || options.requireAuth) && !accessToken) {
    return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
  if (options.forwardIdempotencyKey && !IDEMPOTENCY_KEY_RE.test(idempotencyKey)) {
    return Response.json({ error: "INVALID_IDEMPOTENCY_KEY" }, { status: 400 });
  }
  const body = request.method === "GET" ? undefined : await request.arrayBuffer();
  if (body && body.byteLength > MAX_BYTES) {
    return Response.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const headers = new Headers({ Origin: siteOrigin });
    if (body) headers.set("Content-Type", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (options.forwardIdempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
    const upstreamUrl = new URL(path, safeOrigin(API_ORIGIN));
    const requestUrl = new URL(request.url);
    for (const key of options.queryKeys ?? []) {
      const value = requestUrl.searchParams.get(key);
      if (value !== null) upstreamUrl.searchParams.set(key, value);
    }
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "MARKETPLACE_UPSTREAM_UNAVAILABLE" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
