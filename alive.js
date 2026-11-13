import { createLocalAliveControlPlane } from "./development/runtime/createLocalAliveControlPlane.js";

const $ = selector => document.querySelector(selector);
const setupPanel = $("#setup-panel");
const loginPanel = $("#login-panel");
const workspace = $("#workspace");
const setupMessage = $("#setup-message");
const loginMessage = $("#login-message");
const visionMessage = $("#vision-message");
let lastTask = null;
let localCore = null;

function message(element, text, error = false) {
  element.textContent = text || "";
  element.classList.toggle("error", !!error);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  let data = {};
  try { data = await response.json(); } catch { /* invalid response handled below */ }
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function show(section) {
  setupPanel.classList.toggle("hidden", section !== "setup");
  loginPanel.classList.toggle("hidden", section !== "login");
  workspace.classList.toggle("hidden", section !== "workspace");
}

function saveLastTask(task) {
  lastTask = task;
  try { localStorage.setItem("lc-alive-last-task", JSON.stringify(task)); } catch { /* status remains visible for this session */ }
}

function readLastTask() {
  try {
    const value = JSON.parse(localStorage.getItem("lc-alive-last-task") || "null");
    const validTaskId = typeof value?.taskId === "string" && /^[a-z0-9][a-z0-9-]{2,63}$/.test(value.taskId);
    const validVisionId = typeof value?.visionId === "string" && /^vision-[a-f0-9-]{16,64}$/i.test(value.visionId);
    if (validTaskId || validVisionId) lastTask = value;
  } catch { lastTask = null; }
}

async function updateLocalCoreSummary() {
  if (!localCore) return;
  const snapshot = localCore.getSnapshot();
  const visions = await localCore.visionStore.listVisions();
  $("#local-core-status").textContent = "Ready";
  $("#local-core-summary").textContent =
    (snapshot.workers?.length || 0) + " specialists · " +
    (snapshot.director?.totalTasks || 0) + " local tasks · " +
    visions.length + " saved directions";
}

function renderLocalVision(vision) {
  $("#task-empty").classList.add("hidden");
  $("#task-details").classList.remove("hidden");
  $("#task-state").textContent = vision.remoteStatus === "submitted"
    ? "SAVED LOCALLY · SUBMITTED"
    : vision.remoteStatus === "unavailable"
      ? "SAVED LOCALLY · LOCAL ONLY"
      : "SAVED LOCALLY";
  $("#task-id").textContent = vision.id;
  $("#task-description").textContent = vision.remoteStatus === "submitted"
    ? "Your direction is saved in this browser and was also submitted to the separate hosted specialist queue. Any resulting proposal remains draft-only."
    : "Your direction is saved in this browser. It has not been sent to a hosted worker, model provider, or code executor.";
  const list = $("#check-list");
  list.replaceChildren();
  const localItem = document.createElement("li");
  localItem.textContent = "Local copy: saved on this device";
  list.append(localItem);
  const remoteItem = document.createElement("li");
  remoteItem.textContent = vision.remoteStatus === "submitted"
    ? "Hosted queue: accepted as " + vision.remoteTaskId
    : vision.remoteStatus === "unavailable"
      ? "Hosted queue: unavailable; local copy retained"
      : "Hosted queue: not submitted";
  list.append(remoteItem);
  const link = $("#proposal-link");
  link.removeAttribute("href");
  link.classList.add("hidden");
}

async function startLocalCore() {
  if (localCore) return;
  const status = $("#local-core-status");
  const summary = $("#local-core-summary");
  try {
    localCore = await createLocalAliveControlPlane();
    await updateLocalCoreSummary();
    $("#queue-status").textContent = "Off by default";
    if (lastTask?.visionId) {
      const saved = await localCore.visionStore.getVision(lastTask.visionId);
      if (saved) renderLocalVision(saved);
    } else {
      const savedVisions = await localCore.visionStore.listVisions();
      if (savedVisions.length) {
        saveLastTask({ visionId: savedVisions[0].id, taskId: savedVisions[0].remoteTaskId || undefined });
        renderLocalVision(savedVisions[0]);
      }
    }
  } catch {
    localCore = null;
    status.textContent = "Unavailable";
    summary.textContent = "This browser could not open local task storage. The separate hosted queue remains independent.";
  }
}

async function stopLocalCore() {
  if (!localCore) return;
  try { await localCore.close(); } catch { /* local view can still close */ }
  localCore = null;
}

function renderTask(data) {
  $("#task-empty").classList.add("hidden");
  $("#task-details").classList.remove("hidden");
  $("#task-state").textContent = (data.state || "queued").replaceAll("_", " ").toUpperCase();
  $("#task-id").textContent = data.task?.taskId || lastTask?.taskId || "";
  $("#task-description").textContent = data.state === "proposal_ready"
    ? "A specialist proposal is ready for your review. It has not been merged or deployed."
    : data.state === "needs_attention"
      ? "An automated check needs attention. No production change has occurred."
      : data.state === "working"
        ? "ALIVE is preparing and validating the specialist proposal."
        : "Your direction is safely queued for the isolated specialist workflow.";
  const list = $("#check-list");
  list.replaceChildren();
  for (const check of data.task?.checks || []) {
    const item = document.createElement("li");
    item.textContent = check.name + ": " + (check.conclusion || check.status);
    list.append(item);
  }
  const link = $("#proposal-link");
  const url = data.task?.pullRequest?.url;
  if (typeof url === "string" && url.startsWith("https://github.com/lambocityyachtclub-png/lambo-city-records/")) {
    link.href = url;
    link.classList.remove("hidden");
  } else {
    link.removeAttribute("href");
    link.classList.add("hidden");
  }
}

async function refreshStatus() {
  let localVision = null;
  if (localCore && lastTask?.visionId) {
    try {
      localVision = await localCore.visionStore.getVision(lastTask.visionId);
      if (localVision) renderLocalVision(localVision);
    } catch { /* local record remains unchanged */ }
  }

  if (!lastTask?.taskId) {
    $("#queue-status").textContent = "Off by default";
    if (localVision) {
      message(visionMessage, "Your direction is saved locally on this device. No hosted worker or model has been started.");
    } else {
      message(visionMessage, "Local ALIVE is ready. Hosted specialist execution remains off by default.");
    }
    return;
  }

  try {
    const query = new URLSearchParams({ taskId: lastTask.taskId });
    const status = await api("/api/alive/status?" + query.toString());
    $("#queue-status").textContent = status.connected ? "Available · opt-in" : "Off by default";
    if (status.task) renderTask(status);
    else if (localVision) renderLocalVision(localVision);
  } catch {
    $("#queue-status").textContent = "Status unavailable";
    if (localVision) {
      message(visionMessage, "Your direction is safely saved locally. The separate hosted status service is unavailable.");
      return;
    }
    message(visionMessage, "The hosted status service is unavailable. No new hosted work has been started.", true);
  }
}
async function start() {
  readLastTask();
  try {
    const session = await api("/api/alive/session");
    if (!session.configured) {
      show("setup");
      setupMessage.textContent = "Private access is closed until the server-side owner password hash and session secret are configured. No password or GitHub token is accepted in the browser until that setup is complete.";
      return;
    }
    if (!session.authenticated) {
      show("login");
      return;
    }
    show("workspace");
    await startLocalCore();
    await refreshStatus();
    if (lastTask && !lastTask.visionId) {
      $("#task-empty").classList.add("hidden");
      $("#task-details").classList.remove("hidden");
      $("#task-state").textContent = "SAVED REQUEST";
      $("#task-id").textContent = lastTask.taskId;
      $("#task-description").textContent = "Refresh status to check the latest specialist activity.";
    }
  } catch (error) {
    show("setup");
    setupMessage.textContent = error.message;
  }
}

$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = event.submitter;
  if (button) button.disabled = true;
  message(loginMessage, "Signing in…");
  try {
    await api("/api/alive/session", {
      method: "POST",
      body: JSON.stringify({ password: $("#owner-password").value })
    });
    $("#owner-password").value = "";
    show("workspace");
    await startLocalCore();
    await refreshStatus();
  } catch (error) {
    message(loginMessage, error.message, true);
  } finally {
    if (button) button.disabled = false;
  }
});

$("#vision-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("#submit-vision");
  const visionText = $("#vision").value.trim();
  if (!visionText) return;
  button.disabled = true;
  message(visionMessage, "Saving your direction locally…");

  try {
    if (!localCore) {
      throw new Error("Local ALIVE storage is unavailable. Your direction has not been sent or processed.");
    }
    const localVision = await localCore.visionStore.createVision({ vision: visionText });
    saveLastTask({ visionId: localVision.id });
    renderLocalVision(localVision);
    $("#vision").value = "";
    await updateLocalCoreSummary();
    $("#queue-status").textContent = "Off by default";
    message(visionMessage, "Your direction is saved locally on this device. No hosted worker, model call, or code execution has been started.");
  } catch (error) {
    message(visionMessage, error.message, true);
  } finally {
    button.disabled = false;
  }
});
$("#refresh-status").addEventListener("click", refreshStatus);
$("#logout").addEventListener("click", async () => {
  try { await api("/api/alive/session", { method: "DELETE" }); } catch { /* local view still closes */ }
  await stopLocalCore();
  lastTask = null;
  try { localStorage.removeItem("lc-alive-last-task"); } catch { /* ignore storage denial */ }
  show("login");
});
start();
