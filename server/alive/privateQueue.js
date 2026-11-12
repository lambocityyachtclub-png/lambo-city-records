const PRIVATE_OWNER = "lambocityyachtclub-png";
const PRIVATE_REPOSITORY = "lambo-city-alive-control";
const PRIVATE_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const PUBLIC_OWNER = "lambocityyachtclub-png";
const PUBLIC_REPOSITORY = "lambo-city-records";
const PUBLIC_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const PUBLIC_WORKFLOW = "development-engine-tests.yml";

export function privateQueueEnvironmentReady(env = process.env) {
  return typeof env.ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN === "string" &&
    env.ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN.trim().length > 0;
}

export async function verifyPrivateQueue(env = process.env, fetchImpl = fetch) {
  if (!privateQueueEnvironmentReady(env)) {
    return { ok: false, reason: "setup_required" };
  }
  const token = env.ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN.trim();
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28"
  };
  try {
    const privateRoot = "https://api.github.com/repos/" + PRIVATE_OWNER + "/" + PRIVATE_REPOSITORY;
    const privateResponse = await fetchImpl(privateRoot, { headers });
    if (!privateResponse.ok) return { ok: false, reason: "private_repository_unavailable" };
    const privateRepo = await privateResponse.json();
    if (privateRepo.private !== true || privateRepo.archived === true || privateRepo.disabled === true) {
      return { ok: false, reason: "repository_must_be_private" };
    }

    const privateBranchUrl = privateRoot + "/branches/" + encodeURIComponent(PRIVATE_BRANCH);
    let privateBranchResponse = await fetchImpl(privateBranchUrl, { headers });
    if (!privateBranchResponse.ok) {
      const defaultBranch = typeof privateRepo.default_branch === "string"
        ? privateRepo.default_branch : "main";
      const defaultRefUrl = privateRoot + "/git/ref/heads/" + encodeURIComponent(defaultBranch);
      const defaultRefResponse = await fetchImpl(defaultRefUrl, { headers });
      if (!defaultRefResponse.ok) return { ok: false, reason: "private_queue_default_branch_missing" };
      const defaultRef = await defaultRefResponse.json();
      const sourceSha = defaultRef?.object?.sha;
      if (typeof sourceSha !== "string" || !/^[a-f0-9]{40}$/i.test(sourceSha)) {
        return { ok: false, reason: "private_queue_default_branch_invalid" };
      }
      const createBranchResponse = await fetchImpl(privateRoot + "/git/refs", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: "refs/heads/" + PRIVATE_BRANCH,
          sha: sourceSha
        })
      });
      if (!createBranchResponse.ok) {
        privateBranchResponse = await fetchImpl(privateBranchUrl, { headers });
        if (!privateBranchResponse.ok) return { ok: false, reason: "private_queue_branch_missing" };
      } else {
        privateBranchResponse = await fetchImpl(privateBranchUrl, { headers });
        if (!privateBranchResponse.ok) return { ok: false, reason: "private_queue_branch_missing" };
      }
    }

    const publicRoot = "https://api.github.com/repos/" + PUBLIC_OWNER + "/" + PUBLIC_REPOSITORY;
    const publicBranchUrl = publicRoot + "/branches/" + encodeURIComponent(PUBLIC_BRANCH);
    const publicBranchResponse = await fetchImpl(publicBranchUrl, { headers });
    if (!publicBranchResponse.ok) return { ok: false, reason: "public_worker_branch_unavailable" };

    const workflowUrl = publicRoot + "/contents/.github/workflows/" + PUBLIC_WORKFLOW +
      "?ref=" + encodeURIComponent(PUBLIC_BRANCH);
    const workflowResponse = await fetchImpl(workflowUrl, { headers });
    if (!workflowResponse.ok) return { ok: false, reason: "public_worker_workflow_missing" };
    const workflow = await workflowResponse.json();
    if (workflow?.type !== "file" || workflow?.name !== PUBLIC_WORKFLOW) {
      return { ok: false, reason: "public_worker_workflow_missing" };
    }

    return {
      ok: true,
      owner: PRIVATE_OWNER,
      repo: PRIVATE_REPOSITORY,
      branch: PRIVATE_BRANCH,
      token,
      publicOwner: PUBLIC_OWNER,
      publicRepo: PUBLIC_REPOSITORY,
      publicBranch: PUBLIC_BRANCH
    };
  } catch {
    return { ok: false, reason: "private_queue_unavailable" };
  }
}
