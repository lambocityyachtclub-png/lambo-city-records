import { createLocalAliveControlPlane } from "./development/runtime/createLocalAliveControlPlane.js";

const $ = selector => document.querySelector(selector);
let localCore = null;
let closing = false;

function setMessage(text, error = false) {
  const target = $("#vision-message");
  target.textContent = text || "";
  target.classList.toggle("error", !!error);
}

function makeCard(text, state, timestamp) {
  const card = document.createElement("article");
  card.className = "record-card";
  const body = document.createElement("p");
  body.textContent = text;
  card.append(body);
  const meta = document.createElement("div");
  meta.className = "record-meta";
  const stateNode = document.createElement("span");
  stateNode.className = "record-state";
  stateNode.textContent = state;
  const dateNode = document.createElement("time");
  dateNode.textContent = timestamp ? new Date(timestamp).toLocaleString() : "";
  if (timestamp) dateNode.dateTime = timestamp;
  meta.append(stateNode, dateNode);
  card.append(meta);
  return card;
}

function renderList(selector, emptySelector, records, toCard) {
  const list = $(selector);
  list.replaceChildren();
  $(emptySelector).classList.toggle("hidden", records.length > 0);
  for (const record of records) list.append(toCard(record));
}

async function refreshWorkspace() {
  if (!localCore) return;
  const snapshot = localCore.getSnapshot();
  const visions = await localCore.visionStore.listVisions();
  const tasks = localCore.system.director.listTasks();
  const reviews = await localCore.reviewStore.listReviews();

  $("#workspace-status").textContent = "Ready · local only";
  $("#module-count").textContent = String(snapshot.registry.totalModules);
  $("#vision-count").textContent = String(visions.length);
  $("#task-review-count").textContent = tasks.length + " / " + reviews.length;

  renderList("#visions-list", "#visions-empty", visions, vision =>
    makeCard(vision.vision, vision.remoteStatus === "not_submitted" ? "Saved locally" : "Local record", vision.createdAt)
  );
  renderList("#tasks-list", "#tasks-empty", tasks, task =>
    makeCard(task.title + (task.description ? "\n" + task.description : ""), task.status.replaceAll("_", " "), task.createdAt)
  );
  renderList("#reviews-list", "#reviews-empty", reviews, review =>
    makeCard(review.taskTitle, review.status.replaceAll("_", " "), review.createdAt)
  );
}

async function startWorkspace() {
  $("#workspace-status").textContent = "Opening local storage…";
  try {
    localCore = await createLocalAliveControlPlane();
    await refreshWorkspace();
    setMessage("ALIVE is ready. Your directions remain on this device; no remote service has been contacted.");
  } catch (error) {
    localCore = null;
    $("#workspace-status").textContent = "Unavailable";
    setMessage(error.message || "This browser could not open local storage.", true);
  }
}

$("#vision-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!localCore) {
    setMessage("Local storage is unavailable. Nothing has been submitted.", true);
    return;
  }
  const button = $("#save-vision");
  const text = $("#vision").value.trim();
  if (!text) return;
  button.disabled = true;
  setMessage("Saving direction on this device…");
  try {
    await localCore.visionStore.createVision({ vision: text });
    $("#vision").value = "";
    await refreshWorkspace();
    setMessage("Saved locally. No task, hosted worker, model call or code execution was started.");
  } catch (error) {
    setMessage(error.message || "The direction could not be saved.", true);
  } finally {
    button.disabled = false;
  }
});

$("#refresh-workspace").addEventListener("click", async () => {
  try {
    await refreshWorkspace();
    setMessage("Local records refreshed.");
  } catch (error) {
    setMessage(error.message || "Could not refresh local records.", true);
  }
});

window.addEventListener("pagehide", () => {
  if (closing || !localCore) return;
  closing = true;
  void localCore.close();
});

void startWorkspace();
