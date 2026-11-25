/**
 * ALIVE — LOCAL OWNER HOST
 *
 * Authenticated loopback HTTP boundary for the existing Development System.
 * The host accepts owner instructions, runs bounded one-shot work, exposes
 * review packages, records owner decisions, and publishes approved changes
 * to a local Git branch only.
 *
 * It deliberately binds to loopback, has no CORS support, never trusts an
 * identity supplied in a request body, and never pushes, merges, or deploys.
 */
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";

const MAX_BODY_BYTES = 64 * 1024;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(body);
}

function authorized(request, expectedToken) {
  const header = request.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7), "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  let oversized = false;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      oversized = true;
      continue;
    }
    if (!oversized) chunks.push(chunk);
  }
  if (oversized) {
    const error = new Error("Request body exceeds the 64 KiB limit.");
    error.statusCode = 413;
    throw error;
  }
  if (size === 0) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("JSON body must be an object.");
    }
    return value;
  } catch (error) {
    const invalid = new Error("Request body must be a valid JSON object.");
    invalid.statusCode = 400;
    throw invalid;
  }
}

export function createLocalAliveHost(options = {}) {
  const {
    system,
    ownerToken,
    ownerId,
    host = "127.0.0.1",
    port = 0
  } = options;

  if (!system || typeof system.getSnapshot !== "function" ||
      typeof system.submitWorldIntent !== "function" ||
      typeof system.runWorkerOnce !== "function" ||
      typeof system.approveReview !== "function" ||
      typeof system.rejectReview !== "function" ||
      typeof system.publishApprovedReview !== "function" ||
      typeof system.listReviews !== "function") {
    throw new Error("A Development System with the local owner workflow methods is required.");
  }
  const token = requireText(ownerToken, "ownerToken");
  const identity = requireText(ownerId, "ownerId");
  if (token.length < 32) throw new Error("ownerToken must contain at least 32 characters.");
  if (!LOOPBACK_HOSTS.has(host)) throw new Error("ALIVE local host may bind only to a loopback address.");
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("port must be an integer from 0 to 65535.");

  let listening = false;

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, { ok: true, mode: "local_owner_host" });
      }
      if (!url.pathname.startsWith("/v1/")) {
        return sendJson(response, 404, { error: "Not found." });
      }
      if (!authorized(request, token)) {
        return sendJson(response, 401, { error: "Owner authentication required." });
      }

      if (request.method === "GET" && url.pathname === "/v1/status") {
        return sendJson(response, 200, system.getSnapshot());
      }
      if (request.method === "GET" && url.pathname === "/v1/reviews") {
        return sendJson(response, 200, { reviews: await system.listReviews() });
      }
      if (request.method === "POST" && url.pathname === "/v1/intents") {
        const body = await readJson(request);
        const result = await system.submitWorldIntent(requireText(body.intent, "intent"));
        return sendJson(response, 200, result);
      }
      if (request.method === "POST" && url.pathname === "/v1/worker/run-once") {
        const result = await system.runWorkerOnce();
        return sendJson(response, 200, result);
      }

      const reviewMatch = url.pathname.match(/^\/v1\/reviews\/([a-zA-Z0-9_-]+)\/(approve|reject|publish)$/);
      if (request.method === "POST" && reviewMatch) {
        const [, reviewId, action] = reviewMatch;
        const body = await readJson(request);
        if (action === "approve") {
          const result = await system.approveReview({ reviewId, decidedBy: identity });
          return sendJson(response, 200, result);
        }
        if (action === "reject") {
          const result = await system.rejectReview({
            reviewId,
            decidedBy: identity,
            reason: requireText(body.reason, "reason")
          });
          return sendJson(response, 200, result);
        }
        const result = await system.publishApprovedReview({
          reviewId,
          branchName: requireText(body.branchName, "branchName")
        });
        return sendJson(response, 200, {
          ...result,
          pushed: false,
          merged: false,
          deployed: false
        });
      }
      return sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      const status = Number.isInteger(error.statusCode) ? error.statusCode : 400;
      return sendJson(response, status, { error: error.message || "Request failed." });
    }
  });

  async function listen() {
    if (listening) return getAddress();
    await new Promise((resolve, reject) => {
      const onError = error => {
        server.off("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        server.off("error", onError);
        listening = true;
        resolve();
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, host);
    });
    return getAddress();
  }

  function getAddress() {
    const address = server.address();
    if (!address || typeof address === "string") return null;
    return Object.freeze({ host: address.address, port: address.port, family: address.family });
  }

  async function close() {
    if (!listening) return;
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
    listening = false;
  }

  return Object.freeze({ listen, close, getAddress, get listening() { return listening; } });
}
