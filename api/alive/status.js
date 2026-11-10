import {
  hasAliveOwnerSession,
  sendAliveJson
} from "../../server/alive/security.js";
import { verifyPrivateQueue } from "../../server/alive/privateQueue.js";

const PUBLIC_OWNER = "lambocityyachtclub-png";
const PUBLIC_REPOSITORY = "lambo-city-records";
const PUBLIC_WORKER_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const TASK_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;

async function githubGet(path) {
  const response = await fetch(
    "https://api.github.com/repos/" + PUBLIC_OWNER + "/" + PUBLIC_REPOSITORY + path,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }
  );
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

  const url = new URL(req.url || "/api/alive/status", "https://owner.invalid");
  const taskId = url.searchParams.get("taskId") || "";
  if (taskId && !TASK_ID.test(taskId)) {
    return sendAliveJson(res, 400, { error: "Invalid ALIVE task ID." });
  }

  const privateQueue = await verifyPrivateQueue();
  const response = {
    connected: privateQueue.ok,
    queueBranch: privateQueue.ok ? privateQueue.publicBranch : null,
    state: privateQueue.ok ? "ready" : "private_queue_setup_required",
    task: null
  };
  if (!privateQueue.ok || !taskId) return sendAliveJson(res, 200, response);

  try {
    const query = new URLSearchParams({
      state: "all",
      head: PUBLIC_OWNER + ":alive-proposal/" + taskId,
      base: PUBLIC_WORKER_BRANCH,
      per_page: "5"
    });
    const pulls = await githubGet("/pulls?" + query.toString());
    const pullRequest = Array.isArray(pulls) ? pulls.find(item =>
      typeof item?.head?.ref === "string" &&
      item.head.ref === "alive-proposal/" + taskId
    ) || null : null;

    let checks = [];
    if (pullRequest?.head?.sha && /^[a-f0-9]{40}$/i.test(pullRequest.head.sha)) {
      const result = await githubGet("/commits/" + pullRequest.head.sha + "/check-runs?per_page=50");
      checks = Array.isArray(result.check_runs) ? result.check_runs.map(item => ({
        name: String(item.name || "Automated check"),
        status: String(item.status || "unknown"),
        conclusion: item.conclusion ? String(item.conclusion) : null,
        url: typeof item.html_url === "string" ? item.html_url : null
      })) : [];
    }

    let state = "queued";
    if (pullRequest) state = pullRequest.state === "closed" ? "proposal_closed" : "proposal_ready";
    if (checks.some(item => item.conclusion && item.conclusion !== "success" && item.conclusion !== "skipped")) {
      state = "needs_attention";
    } else if (checks.some(item => item.status === "queued" || item.status === "in_progress")) {
      state = "working";
    }

    response.state = state;
    response.task = {
      taskId,
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
