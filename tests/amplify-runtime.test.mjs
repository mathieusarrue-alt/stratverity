import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Amplify build emits non-streaming SSR responses", async () => {
  const runtime = await readFile(
    new URL("../.amplify-hosting/compute/default/index.mjs", import.meta.url),
    "utf8",
  );

  assert.match(runtime, /const amplifyBufferedFetch = async/);
  assert.match(runtime, /response\.arrayBuffer\(\)/);
  assert.match(runtime, /new NodeResponse\(new Uint8Array\(body\)/);
  assert.match(runtime, /headers\.set\("content-length"/);
  assert.match(runtime, /toNodeHandler\(amplifyBufferedFetch\)/);
  assert.match(runtime, /request\.url === "\/__amplify-probe"/);
  assert.match(runtime, /listen\(3e3, "0\.0\.0\.0"/);
});
