import { readFile, writeFile } from "node:fs/promises";

const runtimePath = new URL(
  "../.amplify-hosting/compute/default/index.mjs",
  import.meta.url,
);

const httpImportOriginal = 'import { Server } from "node:http";';
const httpImportReplacement = `import { Server, STATUS_CODES } from "node:http";
import { Readable } from "node:stream";`;

const original =
  "new Server(toNodeHandler(nitroApp.fetch)).listen(3e3, (err) => {";
const replacement = `const AMPLIFY_HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "vary",
]);

const amplifyNodeHandler = async (nodeRequest, nodeResponse) => {
  try {
    const method = (nodeRequest.method || "GET").toUpperCase();
    const requestHeaders = new Headers();
    for (const [name, value] of Object.entries(nodeRequest.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) requestHeaders.append(name, item);
      } else if (value !== undefined) {
        requestHeaders.set(name, value);
      }
    }

    const requestInit = { method, headers: requestHeaders };
    if (method !== "GET" && method !== "HEAD") {
      requestInit.body = Readable.toWeb(nodeRequest);
      requestInit.duplex = "half";
    }

    const siteOrigin =
      process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://www.stratverity.com";
    const requestUrl = new URL(nodeRequest.url || "/", siteOrigin);
    const response = await nitroApp.fetch(new Request(requestUrl, requestInit));
    const body = response.body
      ? Buffer.from(await response.arrayBuffer())
      : Buffer.alloc(0);

    nodeResponse.statusCode = response.status;
    nodeResponse.statusMessage =
      response.statusText || STATUS_CODES[response.status] || "Unknown";

    for (const [name, value] of response.headers) {
      if (
        name !== "set-cookie" &&
        !AMPLIFY_HOP_BY_HOP_HEADERS.has(name.toLowerCase())
      ) {
        nodeResponse.setHeader(name, value);
      }
    }
    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) nodeResponse.setHeader("set-cookie", setCookies);

    const hasNoBody =
      method === "HEAD" ||
      response.status === 204 ||
      response.status === 205 ||
      response.status === 304;
    nodeResponse.setHeader("content-length", hasNoBody ? "0" : String(body.length));
    nodeResponse.end(hasNoBody ? undefined : body);
  } catch (error) {
    console.error("Amplify request adapter failed", error);
    if (!nodeResponse.headersSent) {
      nodeResponse.statusCode = 500;
      nodeResponse.statusMessage = "Internal Server Error";
      nodeResponse.setHeader("content-length", "0");
    }
    nodeResponse.end();
  }
};

new Server((request, response) => {
  void amplifyNodeHandler(request, response);
}).listen(3e3, "0.0.0.0", (err) => {`;

const source = await readFile(runtimePath, "utf8");
const importMatches = source.split(httpImportOriginal).length - 1;
const entrypointMatches = source.split(original).length - 1;

if (importMatches !== 1) {
  throw new Error(
    `Expected exactly one Node HTTP import, found ${importMatches}.`,
  );
}
if (entrypointMatches !== 1) {
  throw new Error(
    `Expected exactly one Nitro Amplify entrypoint, found ${entrypointMatches}.`,
  );
}

const patchedSource = source
  .replace(httpImportOriginal, httpImportReplacement)
  .replace(original, replacement);
await writeFile(runtimePath, patchedSource, "utf8");
console.log("Patched Amplify runtime with a buffered Node HTTP adapter.");
