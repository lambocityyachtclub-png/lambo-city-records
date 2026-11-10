const PUBLIC_OWNER = "lambocityyachtclub-png";
const PUBLIC_REPOSITORY = "lambo-city-records";
const OWNER_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/;
const BRANCH_PATTERN = /^integration\/lc-alive-agentic-worker-[a-z0-9-]+$/;

export function privateQueueEnvironmentReady(env = process.env) {
  return env.ALIVE_PRIVATE_QUEUE_WORKFLOW_READY === "true" &&
    typeof env.ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN === "string" &&
    env.ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN.trim().length > 0 &&
    typeof env.ALIVE_PRIVATE_QUEUE_OWNER === "string" &&
    OWNER_PATTERN.test(env.ALIVE_PRIVATE_QUEUE_OWNER) &&
    typeof env.ALIVE_PRIVATE_QUEUE_REPO === "string" &&
    REPOSITORY_PATTERN.test(env.ALIVE_PRIVATE_QUEUE_REPO) &&
    !(env.ALIVE_PRIVATE_QUEUE_OWNER === PUBLIC_OWNER &&
      env.ALIVE_PRIVATE_QUEUE_REPO.toLowerCase() === PUBLIC_REPOSITORY) &&
    typeof env.ALIVE_PRIVATE_QUEUE_BRANCH === "string" &&
    BRANCH_PATTERN.test(env.ALIVE_PRIVATE_QUEUE_BRANCH);
}

export async function verifyPrivateQueue(env = process.env, fetchImpl = fetch) {
  if (!privateQueueEnvironmentReady(env)) {
    return { ok: false, reason: "setup_required" };
  }
  const { ALIVE_PRIVATE_QUEUE_OWNER: owner, ALIVE_PRIVATE_QUEUE_REPO: repo,
    ALIVE_PRIVATE_QUEUE_BRANCH: branch, ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN: token } = env;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28"
  };
  try {
    const root = "https://api.github.com/repos/" + owner + "/" + repo;
    const repositoryResponse = await fetchImpl(root, { headers });
    if (!repositoryResponse.ok) return { ok: false, reason: "repository_unavailable" };
    const repository = await repositoryResponse.json();
    if (repository.private !== true || repository.archived === true || repository.disabled === true) {
      return { ok: false, reason: "repository_must_be_private" };
    }
    const workflowUrl = root + "/contents/.github/workflows/alive-private-queue.yml?ref=" +
      encodeURIComponent(repository.default_branch || "main");
    const workflowResponse = await fetchImpl(workflowUrl, { headers });
    if (!workflowResponse.ok) return { ok: false, reason: "private_workflow_missing" };
    const workflow = await workflowResponse.json();
    if (workflow?.type !== "file" || workflow?.name !== "alive-private-queue.yml") {
      return { ok: false, reason: "private_workflow_missing" };
    }
    return { ok: true, owner, repo, branch, token };
  } catch {
    return { ok: false, reason: "private_queue_unavailable" };
  }
}
