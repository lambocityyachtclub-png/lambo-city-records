import {
  hasAliveOwnerSession,
  requireSameOrigin,
  sendAliveJson
} from "../../server/alive/security.js";

const OWNER = "lambocityyachtclub-png";
const REPOSITORY = "lambo-city-records";
const QUEUE_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const TASK_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const SHA = /^[a-f0-9]{40}$/i;

async function githubGet(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  const response = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPOSITORY + path, { headers });
  if (!response.ok) throw new Error("GitHub status request failed.");
  return response.json();
}

export default async function handler(req, res) {
  if (String(req.method || "").toUpperCase() !== "GET") {
    res.setHeader("Allow", "GET");
    return sendAliveJson(res, 405, { error: "Method not allowed." });
  }
  if (!hasAliveOwnerSession(req)) {
    return sendAliveJson(res, 401, { error: "Owner sign-in is required." });
  }

  const token = typeof process.env.ALIVE_GITHUB_TOKEN === "string"
    ? process.env.ALIVE_GITHUB_TOKEN.trim() : "";
  const url = new URL(req.url || "/api/alive/status", "https://owner.invalid");
  const taskId = url.searchParams.get("taskId") || "";
  const commitSha = url.searchParams.get("commitSha") || "";

  if (taskId && !TASK_ID.test(taskId)) {
    return sendAliveJson(res, 400, { error: "Invalid ALIVE task ID." });
  }
  if (commitSha && !SHA.test(commitSha)) {
    return sendAliveJson(res, 400, { error: "Invalid task commit reference." });
  }

  const response = {
    connected: !!token,
    queueBranch: QUEUE_BRANCH,
    state: token ? "ready" : "github_setup_required",
    task: null
  };
  if (!token || (!taskId && !commitSha)) {
    return sendAliveJson(res, 200, response);
  }

  try {
    let pullRequest = null;
    if (taskId) {
      const query = new URLSearchParams({
        state: "all",
        head: OWNER + ":alive-proposal/" + taskId,
        base: QUEUE_BRANCH,
        per_page: "5"
      });
      const pulls = await githubGet("/pulls?" + query.toString());
      pullRequest = Array.isArray(pulls) ? pulls.find(item =>
        typeof item?.head?.ref === "string" &&
        item.head.ref === "alive-proposal/" + taskId
      ) || null : null;
    }

    let checks = [];
    if (commitSha) {
      const result = await githubGet("/commits/" + commitSha + "/check-runs?per_page=50");
      checks = Array.isArray(result.check_runs) ? result.check_runs.map(item => ({
        name: String(item.name || "Automated check"),
        status: String(item.status || "unknown"),
        conclusion: item.conclusion ? String(item.conclusion) : null,
        url: typeof item.html_url === "string" ? item.html_url : null
      })) : [];
    }

    let state = "queued";
    if (pullRequest) state = pullRequest.state === "closed" ? "proposal_closed" : "proposal_ready";
    else if (checks.some(item => item.conclusion && item.conclusion !== "success" && item.conclusion !== "skipped")) state = "needs_attention";
    else if (checks.some(item => item.status === "queued" || item.status === "in_progress")) state = "working";
    else if (checks.length && checks.every(item => item.status === "completed")) state = "checks_complete";

    response.state = state;
    response.task = {
      taskId: taskId || null,
      commitSha: commitSha || null,
      checks,
      pullRequest: pullRequest ? {
        title: String(pullRequest.title || "ALIVE specialist proposal"),
        url: typeof pullRequest.html_url === "string" ? pullRequest.html_url : null,
        state: String(pullRequest.state || "open"),
        draft: !!pullRequest.draft
      } : null
    };
    return sendAliveJson(res, 200, response);
  } catch {
    return sendAliveJson(res, 502, { error: "ALIVE could not retrieve the GitHub task status right now." });
  }
}
