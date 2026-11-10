import {
  hasAliveOwnerSession,
  readAliveJsonBody,
  requireSameOrigin,
  sendAliveJson
} from "../../server/alive/security.js";
import { createOwnerVisionTask } from "../../server/alive/visionTask.js";
import { verifyPrivateQueue } from "../../server/alive/privateQueue.js";

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
  const privateQueue = await verifyPrivateQueue();
  if (!privateQueue.ok) {
    const reason = privateQueue.reason;
    const error = reason === "repository_must_be_private"
      ? "The configured ALIVE queue repository is not private. Submission has been blocked."
      : reason === "private_workflow_missing"
        ? "The private ALIVE worker workflow is not installed yet. Submission has been blocked."
        : "The private ALIVE queue is not connected yet. Your vision will not be sent to the public code repository.";
    return sendAliveJson(res, 503, {
      error,
      setup: "A separate private ALIVE control repository and its worker handoff must be configured before owner ideas can be submitted."
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
      owner: privateQueue.owner,
      repo: privateQueue.repo,
      token: privateQueue.token,
      branch: privateQueue.branch
    });
    const path = "development/queue/incoming/" + task.id + ".json";
    const result = await queue.createTaskFile({
      path,
      branch: privateQueue.branch,
      content: JSON.stringify(task, null, 2) + "\n",
      commitMessage: "ALIVE owner vision intake: " + task.id
    });
    return sendAliveJson(res, 202, {
      accepted: true,
      taskId: task.id,
      queueCommitSha: result.commitSha,
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
