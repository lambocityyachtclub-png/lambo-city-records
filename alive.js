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
async function startLocalCore() {
  if (localCore) return;
  const status = $("#local-core-status");
  const summary = $("#local-core-summary");
  try {
    localCore = await createLocalAliveControlPlane();
    const snapshot = localCore.getSnapshot();
    status.textContent = "Ready";
    summary.textContent =
      (snapshot.workers?.length || 0) + " specialists · " +
      (snapshot.director?.totalTasks || 0) + " local tasks · saved on this device";
  } catch {
    status.textContent = "Unavailable";
    summary.textContent = "This browser could not open local task storage. The separate hosted queue remains independent.";
  }
}
async function stopLocalCore() {
  if (!localCore) return;
  try { await localCore.close(); } catch { /* local view can still close */ }
  localCore = null;
}
function readLastTask() {
  try {
    const value = JSON.parse(localStorage.getItem("lc-alive-last-task") || "null");
    if (value && typeof value.taskId === "string" && /^[a-z0-9][a-z0-9-]{2,63}$/.test(value.taskId)) {
      lastTask = value;
    }
  } catch { lastTask = null; }
}
function saveLastTask(task) {
  lastTask = task;
  try { localStorage.setItem("lc-alive-last-task", JSON.stringify(task)); } catch { /* status remains visible for this session */ }
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
  try {
    const base = await api("/api/alive/status");
    $("#queue-status").textContent = base.connected ? "Connected" : "Setup needed";
    if (!base.connected) {
      message(visionMessage, "The private workspace is open, but its separate private ALIVE control repository and worker workflow still need to be connected. Your ideas will not be sent to the public code repository.", true);
      return;
    }
    if (!lastTask) return;
    const query = new URLSearchParams({ taskId: lastTask.taskId });
    const status = await api("/api/alive/status?" + query.toString());
    if (status.task) renderTask(status);
  } catch (error) {
    message(visionMessage, error.message, true);
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
    if (lastTask) {
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
  button.disabled = true;
  message(visionMessage, "Sending your direction to ALIVE…");
  try {
    const result = await api("/api/alive/vision", {
      method: "POST",
      body: JSON.stringify({ vision: $("#vision").value })
    });
    saveLastTask({ taskId: result.taskId });
    $("#vision").value = "";
    renderTask({ state: "queued", task: { taskId: result.taskId, checks: [] } });
    message(visionMessage, "Your vision has been added to the isolated ALIVE queue.");
    await refreshStatus();
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
