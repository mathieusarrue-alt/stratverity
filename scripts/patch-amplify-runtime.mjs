import { readFile, writeFile } from "node:fs/promises";

const runtimePath = new URL(
  "../.amplify-hosting/compute/default/index.mjs",
  import.meta.url,
);

const httpImportOriginal = 'import { Server } from "node:http";';
const httpImportReplacement =
  'import { Server, STATUS_CODES } from "node:http";';

const original =
  "new Server(toNodeHandler(nitroApp.fetch)).listen(3e3, (err) => {";
const replacement = `const amplifyBufferedFetch = async (request) => {
  const response = await nitroApp.fetch(request);
  if (!response.body) return response;

  // Amplify Hosting Compute does not support Next.js streaming responses.
  // Buffer the body and provide a deterministic length before crossing its
  // CloudFront-to-compute proxy. This changes transport only, not app logic.
  const body = await response.arrayBuffer();
  const headers = new Headers(response.headers);
  headers.delete("transfer-encoding");
  headers.set("content-length", String(body.byteLength));

  return new Response(body, {
    status: response.status,
    statusText: response.statusText || STATUS_CODES[response.status] || "Unknown",
    headers,
  });
};
const amplifyNodeHandler = toNodeHandler(amplifyBufferedFetch);
const amplifyServer = new Server((request, response) => {
  if (request.url === "/__amplify-probe") {
    response.statusCode = 200;
    response.setHeader("content-type", "text/plain; charset=utf-8");
    response.setHeader("content-length", "2");
    response.end("ok");
    return;
  }
  amplifyNodeHandler(request, response);
});
amplifyServer.listen(3e3, "0.0.0.0", (err) => {`;

const source = await readFile(runtimePath, "utf8");
const httpImportMatches = source.split(httpImportOriginal).length - 1;
const matches = source.split(original).length - 1;

if (httpImportMatches !== 1) {
  throw new Error(
    `Expected exactly one Node HTTP import, found ${httpImportMatches}.`,
  );
}

if (matches !== 1) {
  throw new Error(
    `Expected exactly one Nitro Amplify server entrypoint, found ${matches}.`,
  );
}

const patchedSource = source
  .replace(httpImportOriginal, httpImportReplacement)
  .replace(original, replacement);
await writeFile(runtimePath, patchedSource, "utf8");
console.log("Patched Amplify runtime for CloudFront HTTP compatibility.");
