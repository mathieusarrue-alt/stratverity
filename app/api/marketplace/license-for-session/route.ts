import { proxyMarketplace } from "../proxy";

const SESSION_ID_RE = /^cs_(?:test|live)_[A-Za-z0-9_]{8,240}$/;

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!SESSION_ID_RE.test(sessionId)) {
    return Response.json({ error: "INVALID_SESSION_ID" }, { status: 400 });
  }
  return proxyMarketplace(request, "/v1/marketplace/license-for-session", {
    queryKeys: ["session_id"],
    requireAuth: true,
  });
}
