import {
  hasAliveOwnerSession,
  readAliveJsonBody,
  requireSameOrigin,
  sendAliveJson
} from "../../server/alive/security.js";
import { createOwnerVisionTask } from "../../server/alive/visionTask.js";
import { verifyPrivateQueue } from "../../server/alive/privateQueue.js";

async function writePublicQueuePointer(queue, task, privatePath) {
  const pointerPath = "development/queue/incoming/" + task.id + ".json";
  const pointer = {
    id: task.id,
    privateQueue: {
      owner: queue.owner,
      repo: queue.repo,
      branch: queue.branch,
      path: privatePath
    }
  };
  const encodedPath = pointerPath.split("/").map(encodeURIComponent).join("/");
  const url = "https://api.github.com/repos/" + queue.publicOwner + "/" +
    queue.publicRepo + "/contents/" + encodedPath;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + queue.token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "ALIVE private vision pointer: " + task.id,
      content: Buffer.from(JSON.stringify(pointer, null, 2) + "\n", "utf8").toString("base64"),
      branch: queue.publicBranch
    })
  });
  if (!response?.ok) throw new Error("Public worker pointer write failed.");
  const result = await response.json();
  if (typeof result?.commit?.sha !== "string") {
    throw new Error("Public worker did not confirm the private task pointer.");
  }
  return { path: pointerPath, commitSha: result.commit.sha };
}

async function rollbackPrivateTask(queue, result) {
  if (!result?.contentSha) return;
  const encodedPath = result.path.split("/").map(encodeURIComponent).join("/");
  const url = "https://api.github.com/repos/" + queue.owner + "/" + queue.repo + "/contents/" + encodedPath;
  try {
    await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + queue.token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Rollback incomplete ALIVE private queue submission",
        sha: result.contentSha,
        branch: queue.branch
      })
    });
  } catch { /* an orphaned task remains private and cannot run without its public pointer */ }
}

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
    const error = privateQueue.reason === "repository_must_be_private"
      ? "The configured ALIVE queue repository is not private. Submission has been blocked."
      : "The private ALIVE queue is not connected yet. Your vision will not be sent to the public code repository.";
    return sendAliveJson(res, 503, {
      error,
      setup: "Create the private lambo-city-alive-control repository and configure its server-only access before submitting owner direction."
    });
  }

  let body;
  try { body = await readAliveJsonBody(req, 10000); }
  catch (error) { return sendAliveJson(res, 400, { error: error.message }); }
  if (Object.keys(body).some(key => key !== "vision")) {
    return sendAliveJson(res, 400, { error: "Only the owner vision field is accepted." });
  }

  let privateTaskResult = null;
  try {
    const task = createOwnerVisionTask(body.vision);
    const { createGitHubTaskQueueClient } =
      await import("../../development/execution/githubTaskQueueClient.js");
    const queueClient = createGitHubTaskQueueClient({
      owner: privateQueue.owner,
      repo: privateQueue.repo,
      token: privateQueue.token,
      branch: privateQueue.branch
    });
    const privatePath = "development/queue/incoming/" + task.id + ".json";
    privateTaskResult = await queueClient.createTaskFile({
      path: privatePath,
      branch: privateQueue.branch,
      content: JSON.stringify(task, null, 2) + "\n",
      commitMessage: "ALIVE private owner vision: " + task.id
    });

    const publicPointer = await writePublicQueuePointer(privateQueue, task, privatePath);
    return sendAliveJson(res, 202, {
      accepted: true,
      taskId: task.id,
      queueCommitSha: publicPointer.commitSha,
      branch: privateQueue.publicBranch,
      path: publicPointer.path,
      state: "queued"
    });
  } catch (error) {
    if (privateTaskResult) await rollbackPrivateTask(privateQueue, privateTaskResult);
    const message = String(error?.message || "");
    const status = /required|too long|invalid|must contain|unsupported|restricted|limit/i.test(message) ? 400 : 502;
    return sendAliveJson(res, status, {
      error: status === 400 ? message : "ALIVE could not safely queue this vision. Any incomplete private task was rolled back."
    });
  }
}
