import {
  hasAliveOwnerSession,
  readAliveJsonBody,
  requireSameOrigin,
  sendAliveJson
} from "../../server/alive/security.js";
import { createOwnerVisionTask } from "../../server/alive/visionTask.js";

const OWNER = "lambocityyachtclub-png";
const REPOSITORY = "lambo-city-records";
const QUEUE_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";

export default async function handler(req, res) {
  if (String(req.method || "").toUpperCase() !== "POST") {
    res.setHeader("Allow", "POST");
    return sendAliveJson(res, 405, { error: "Method not allowed." });
  }
  if (!requireSameOrigin(req)) {
    return sendAliveJson(res, 403, { error: "This request did not come from the owner workspace." });
  }
  if (!hasAliveOwnerSession(req)) {
    return sendAliveJson(res, 401, { error: "Owner sign-in is required." });
  }
  const token = process.env.ALIVE_GITHUB_TOKEN;
  if (typeof token !== "string" || !token.trim()) {
    return sendAliveJson(res, 503, {
      error: "The secure GitHub queue connection is not configured yet.",
      setup: "Add ALIVE_GITHUB_TOKEN as an encrypted, server-only Vercel environment variable. Never enter it in this page."
    });
  }

  let body;
  try { body = await readAliveJsonBody(req, 10000); }
  catch (error) { return sendAliveJson(res, 400, { error: error.message }); }
  if (Object.keys(body).some(key => key !== "vision")) {
    return sendAliveJson(res, 400, { error: "Only the owner vision field is accepted." });
  }

  try {
    const task = createOwnerVisionTask(body.vision);
    const { createGitHubTaskQueueClient } =
      await import("../../development/execution/githubTaskQueueClient.js");
    const queue = createGitHubTaskQueueClient({
      owner: OWNER,
      repo: REPOSITORY,
      token,
      branch: QUEUE_BRANCH
    });
    const path = "development/queue/incoming/" + task.id + ".json";
    const result = await queue.createTaskFile({
      path,
      branch: QUEUE_BRANCH,
      content: JSON.stringify(task, null, 2) + "\n",
      commitMessage: "ALIVE owner vision intake: " + task.id
    });
    return sendAliveJson(res, 202, {
      accepted: true,
      taskId: task.id,
      commitSha: result.commitSha,
      branch: result.branch,
      path: result.path,
      state: "queued"
    });
  } catch (error) {
    const message = String(error?.message || "");
    const status = /required|too long|invalid|must contain|unsupported|restricted|limit/i.test(message) ? 400 : 502;
    return sendAliveJson(res, status, {
      error: status === 400 ? message : "ALIVE could not submit this vision to the secure GitHub queue."
    });
  }
}
