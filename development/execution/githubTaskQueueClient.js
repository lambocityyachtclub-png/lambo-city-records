/**
 * LAMBO CITY ALIVE — server-side GitHub Contents API queue client.
 *
 * Keep the token in a trusted server environment. Never construct this
 * client in browser code or expose its token to the Development System UI.
 */
import { validateWorkerTask } from "../automation/specialistWorkerPolicy.js";
import { validateAliveWorkerBranch, DEFAULT_ALIVE_WORKER_BRANCH } from "./hostedSpecialistQueueAdapter.js";

export const GITHUB_TASK_QUEUE_CLIENT_VERSION = "1.0.0";

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(field + " is required.");
  }
  return value.trim();
}

function validatePath(path, taskId) {
  const value = requireText(path, "Queue file path");
  if (
    value.includes("\\") ||
    value.startsWith("/") ||
    value.split("/").some(part => !part || part === "." || part === "..") ||
    !/^development\/queue\/incoming\/[a-z0-9][a-z0-9-]{2,63}\.json$/.test(value)
  ) {
    throw new Error("Queue writes are restricted to development/queue/incoming/<task-id>.json.");
  }
  if (!value.endsWith("/" + taskId + ".json")) {
    throw new Error("Queue filename must match the validated task ID.");
  }
  return value;
}

export function createGitHubTaskQueueClient(options = {}) {
  const owner = requireText(options.owner, "GitHub repository owner");
  const repo = requireText(options.repo, "GitHub repository name");
  const token = requireText(options.token, "Server-side GitHub token");
  const branch = validateAliveWorkerBranch(
    options.branch || DEFAULT_ALIVE_WORKER_BRANCH
  );
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error("GitHub repository owner and name contain unsupported characters.");
  }

  async function createTaskFile(input = {}) {
    const requestedBranch = validateAliveWorkerBranch(input.branch || branch);
    if (requestedBranch !== branch) {
      throw new Error("Queue client cannot write outside its configured integration branch.");
    }

    const parsed = JSON.parse(requireText(input.content, "Queue task content"));
    const task = validateWorkerTask(parsed);
    const path = validatePath(input.path, task.id);
    const commitMessage = requireText(input.commitMessage, "Queue commit message");
    if (commitMessage.length > 140) {
      throw new Error("Queue commit message exceeds 140 characters.");
    }
    if (Buffer.byteLength(input.content, "utf8") > 20000) {
      throw new Error("Queue task content exceeds the 20 KB limit.");
    }

    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + encodedPath;
    const response = await fetchImpl(url, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(input.content, "utf8").toString("base64"),
        branch
      })
    });

    if (!response || response.ok !== true || typeof response.json !== "function") {
      const status = response && Number.isFinite(response.status) ? response.status : "unknown";
      throw new Error("GitHub queue write failed (HTTP " + status + ").");
    }

    const payload = await response.json();
    const commitSha = payload?.commit?.sha;
    const contentSha = payload?.content?.sha;
    if (typeof commitSha !== "string" || !commitSha.trim()) {
      throw new Error("GitHub did not return a commit SHA for the queued task.");
    }

    return Object.freeze({
      commitSha,
      contentSha: typeof contentSha === "string" ? contentSha : null,
      path,
      branch
    });
  }

  return Object.freeze({
    version: GITHUB_TASK_QUEUE_CLIENT_VERSION,
    createTaskFile,
    getSnapshot() {
      return Object.freeze({
        version: GITHUB_TASK_QUEUE_CLIENT_VERSION,
        owner,
        repo,
        branch,
        connected: true
      });
    }
  });
}
