import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the StratVerity product page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /BacktestProof by StratVerity/i);
  assert.match(html, /STRATVERITY/);
  assert.match(html, /BACKTESTPROOF/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("connected audit form keeps the report metrics out of the browser response", async () => {
  const page = await readFile(
    new URL("../app/design-b/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /\/v1\/audits\/tradingview/);
  assert.match(page, /accept="\.pine,text\/plain"/);
  assert.match(page, /accept="\.csv,text\/csv"/);
  assert.match(page, /terms_accepted/);
  assert.match(page, /delivery_status:\s*"EMAIL_REQUIRED"/);
  assert.match(page, /setAuditTeaser/);
  assert.doesNotMatch(page, /payload\.metrics|payload\.checks/);
});

test("deployment metadata and worker output are present", async () => {
  const hosting = JSON.parse(
    await readFile(
      new URL("../.openai/hosting.json", import.meta.url),
      "utf8",
    ),
  );
  assert.match(hosting.project_id, /^appgprj_/);
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
});
