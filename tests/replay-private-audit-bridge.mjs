// One loopback-only request from the Python rehearsal. Never use real tokens.
import { readFileSync } from "node:fs";
import { proxyPrivateAudit } from "../app/api/private-audit/bridge.ts";

const { site, upstream, token, attempt, operation, payload } = JSON.parse(readFileSync(0, "utf8"));
if (!["fixture-intake", "fixture-refreshed"].includes(token)) throw new Error("Fixture token required");
const request = new Request(site + "/api/private-audit/" + attempt + "/" + operation, {
  method: "POST", headers: { Origin: site, "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const response = await proxyPrivateAudit(request, attempt, operation, {
  development: true, enabled: true, site, upstream, readToken: async () => token,
});
process.stdout.write(JSON.stringify({ status: response.status, body: await response.json() }));
