import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Amplify build emits buffered Node HTTP responses", async () => {
  const runtime = await readFile(
    new URL("../.amplify-hosting/compute/default/index.mjs", import.meta.url),
    "utf8",
  );

  assert.match(runtime, /Server, STATUS_CODES/);
  assert.match(runtime, /Readable\.toWeb\(nodeRequest\)/);
  assert.match(runtime, /requestInit\.duplex = "half"/);
  assert.match(runtime, /nitroApp\.fetch\(new Request/);
  assert.match(runtime, /response\.arrayBuffer\(\)/);
  assert.match(runtime, /response\.headers\.getSetCookie\(\)/);
  assert.match(runtime, /AMPLIFY_RESPONSE_HEADERS/);
  assert.match(runtime, /nodeResponse\.end\(hasNoBody \? undefined : body\)/);
  assert.match(runtime, /listen\(3e3, "0\.0\.0\.0"/);
  assert.doesNotMatch(runtime, /__amplify-probe/);
});
