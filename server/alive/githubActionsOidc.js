import { createPublicKey, verify as verifySignature } from "node:crypto";

const ISSUER = "https://token.actions.githubusercontent.com";
const AUDIENCE = "https://alive-preview.lambocityrecords.com/api/alive/private-task";
const OWNER = "lambocityyachtclub-png";
const PUBLIC_REPOSITORY = "lambo-city-records";
const PUBLIC_REPOSITORY_ID = "1227528136";
const WORKER_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const WORKFLOW = OWNER + "/" + PUBLIC_REPOSITORY +
  "/.github/workflows/development-engine-tests.yml@refs/heads/" + WORKER_BRANCH;
const PRIVATE_REPOSITORY = "lambo-city-alive-control";
const PRIVATE_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const TASK_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;

function decodePart(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

export async function verifyGitHubActionsIdentity(token, {
  fetchImpl = fetch,
  nowSeconds = Math.floor(Date.now() / 1000)
} = {}) {
  if (typeof token !== "string" || token.length > 12000) {
    throw new Error("A valid GitHub Actions identity token is required.");
  }
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid GitHub Actions identity token.");
  let header, claims;
  try {
    header = decodePart(parts[0]);
    claims = decodePart(parts[1]);
  } catch {
    throw new Error("Invalid GitHub Actions identity token.");
  }
  if (header?.alg !== "RS256" || typeof header.kid !== "string" ||
      claims?.iss !== ISSUER || claims?.aud !== AUDIENCE ||
      !Number.isInteger(claims.exp) || claims.exp <= nowSeconds ||
      !Number.isInteger(claims.iat) || claims.iat > nowSeconds + 60 ||
      (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > nowSeconds + 60))) {
    throw new Error("GitHub Actions identity claims were not accepted.");
  }
  if (claims.repository !== OWNER + "/" + PUBLIC_REPOSITORY ||
      String(claims.repository_id) !== PUBLIC_REPOSITORY_ID ||
      claims.ref !== "refs/heads/" + WORKER_BRANCH ||
      claims.workflow_ref !== WORKFLOW ||
      claims.event_name !== "push" ||
      typeof claims.sha !== "string" || !/^[a-f0-9]{40}$/i.test(claims.sha)) {
    throw new Error("This GitHub Actions workflow is not authorized to retrieve ALIVE tasks.");
  }

  const jwksResponse = await fetchImpl(ISSUER + "/.well-known/jwks", {
    headers: { Accept: "application/json" }
  });
  if (!jwksResponse.ok) throw new Error("GitHub identity verification is temporarily unavailable.");
  const jwks = await jwksResponse.json();
  const jwk = Array.isArray(jwks?.keys) ? jwks.keys.find(key =>
    key?.kid === header.kid && key?.kty === "RSA" && key?.use === "sig"
  ) : null;
  if (!jwk) throw new Error("GitHub identity signing key was not recognized.");
  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const signingInput = parts[0] + "." + parts[1];
  const signature = Buffer.from(parts[2], "base64url");
  if (!verifySignature("RSA-SHA256", Buffer.from(signingInput), publicKey, signature)) {
    throw new Error("GitHub Actions identity signature is invalid.");
  }
  return claims;
}

function validatePointer(pointer, taskId) {
  const queue = pointer?.privateQueue;
  return pointer && typeof pointer === "object" && !Array.isArray(pointer) &&
    Object.keys(pointer).sort().join(",") === "id,privateQueue" &&
    pointer.id === taskId && queue && typeof queue === "object" &&
    !Array.isArray(queue) &&
    queue.owner === OWNER && queue.repo === PRIVATE_REPOSITORY &&
    queue.branch === PRIVATE_BRANCH &&
    queue.path === "development/queue/incoming/" + taskId + ".json";
}

export async function resolveAuthorizedPrivateTask(taskId, claims, token, fetchImpl = fetch) {
  if (typeof taskId !== "string" || !TASK_ID.test(taskId)) {
    throw new Error("Invalid ALIVE task ID.");
  }
  if (!claims || claims.repository !== OWNER + "/" + PUBLIC_REPOSITORY ||
      claims.ref !== "refs/heads/" + WORKER_BRANCH ||
      claims.workflow_ref !== WORKFLOW || typeof claims.sha !== "string") {
    throw new Error("GitHub Actions identity is not authorized.");
  }
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("The private ALIVE queue is not connected.");
  }

  const pointerUrl = "https://raw.githubusercontent.com/" + OWNER + "/" +
    PUBLIC_REPOSITORY + "/" + claims.sha + "/development/queue/incoming/" + taskId + ".json";
  const pointerResponse = await fetchImpl(pointerUrl, { redirect: "error" });
  if (!pointerResponse.ok) throw new Error("The ALIVE task pointer was not found in this workflow commit.");
  let pointer;
  try { pointer = await pointerResponse.json(); }
  catch { throw new Error("The ALIVE task pointer is invalid."); }
  if (!validatePointer(pointer, taskId)) {
    throw new Error("The ALIVE task pointer is outside the approved private queue.");
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token.trim(),
    "X-GitHub-Api-Version": "2022-11-28"
  };
  const root = "https://api.github.com/repos/" + OWNER + "/" + PRIVATE_REPOSITORY;
  const repoResponse = await fetchImpl(root, { headers });
  if (!repoResponse.ok) throw new Error("The private ALIVE queue repository could not be verified.");
  const repository = await repoResponse.json();
  if (repository.private !== true || repository.archived === true || repository.disabled === true) {
    throw new Error("ALIVE owner tasks must remain in a private repository.");
  }
  const branchResponse = await fetchImpl(root + "/branches/" + encodeURIComponent(PRIVATE_BRANCH), { headers });
  if (!branchResponse.ok) throw new Error("The private ALIVE queue branch is unavailable.");

  const path = pointer.privateQueue.path.split("/").map(encodeURIComponent).join("/");
  const fileResponse = await fetchImpl(root + "/contents/" + path +
    "?ref=" + encodeURIComponent(PRIVATE_BRANCH), { headers });
  if (!fileResponse.ok) throw new Error("The private ALIVE task could not be retrieved.");
  const file = await fileResponse.json();
  if (file?.type !== "file" || file?.encoding !== "base64" || typeof file?.content !== "string") {
    throw new Error("The private ALIVE task file has an unsupported format.");
  }
  let task;
  try {
    task = JSON.parse(Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf8"));
  } catch {
    throw new Error("The private ALIVE task file is not valid JSON.");
  }
  if (task?.id !== taskId || task?.workerId !== "vision-planning") {
    throw new Error("The private ALIVE task does not match its public pointer.");
  }
  return task;
}
