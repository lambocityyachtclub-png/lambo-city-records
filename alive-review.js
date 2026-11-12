const PAGE_SIZE = 20;
let ownerToken = "";
let offset = 0;
let currentStatus = "awaiting_owner_review";

const $ = id => document.getElementById(id);
const loginPanel = $("login-panel");
const app = $("review-app");
const list = $("review-list");

function api(path, options = {}) {
  return fetch("/api/alive/reviews" + path, {
    ...options,
    headers: {
      "Authorization": "Bearer " + ownerToken,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    },
    cache: "no-store"
  }).then(async response => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    return payload;
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function renderReview(review) {
  const card = element("article", "review-card");
  const title = element("h3", "", review.taskTitle || "Untitled proposal");
  card.append(title);
  const meta = element("div", "meta");
  meta.append(element("span", "status " + (review.status === "rejected" ? "rejected" : ""), review.status.replaceAll("_", " ")));
  meta.append(element("span", "", "Created " + formatDate(review.createdAt)));
  meta.append(element("span", "", "Task " + (review.taskId || "unknown")));
  if (review.area) meta.append(element("span", "", "Area " + review.area));
  card.append(meta);

  const filesHeading = element("p", "eyebrow", "FILES CHANGED");
  card.append(filesHeading);
  const files = element("ul", "files");
  for (const file of review.changedFiles || []) files.append(element("li", "", file));
  if (!files.children.length) files.append(element("li", "", "No file list supplied"));
  card.append(files);

  const test = review.testResults || {};
  const testLine = element("p", "summary", "Automated tests: " + (test.passed === true ? "PASSED" : "Not confirmed") +
    (test.summary ? "\n" + test.summary : ""));
  card.append(testLine);

  if (review.changes) {
    const changes = typeof review.changes === "string" ? review.changes : JSON.stringify(review.changes, null, 2);
    const details = element("details");
    const summary = element("summary", "", "Proposal details");
    const pre = element("pre", "summary", changes);
    pre.style.whiteSpace = "pre-wrap";
    pre.style.overflowWrap = "anywhere";
    pre.style.maxHeight = "320px";
    pre.style.overflow = "auto";
    details.append(summary, pre);
    card.append(details);
  }

  if (review.decision) {
    card.append(element("p", "decision-note", "Decision: " + review.decision.status +
      (review.decision.ownerNote ? " — " + review.decision.ownerNote : "")));
  }

  if (review.status === "awaiting_owner_review") {
    const actions = element("div", "card-actions");
    const note = document.createElement("textarea");
    note.placeholder = "Optional note for this decision";
    note.setAttribute("aria-label", "Optional owner note");
    const reject = element("button", "reject", "Reject proposal");
    const approve = element("button", "approve", "Approve proposal");
    reject.addEventListener("click", () => decide(review.id, "rejected", note, reject, approve));
    approve.addEventListener("click", () => decide(review.id, "approved", note, approve, reject));
    actions.append(note, reject, approve);
    card.append(actions);
  }
  return card;
}

async function decide(reviewId, decision, note, activeButton, otherButton) {
  const verb = decision === "approved" ? "approve" : "reject";
  if (!window.confirm("Are you sure you want to " + verb + " this proposal? This records an owner decision only; it does not change production.")) return;
  activeButton.disabled = true;
  otherButton.disabled = true;
  try {
    await api("", { method: "POST", body: JSON.stringify({
      reviewId, decision, ownerNote: note.value.trim() || null
    })});
    await loadReviews();
  } catch (error) {
    $("queue-message").textContent = error.message;
    activeButton.disabled = false;
    otherButton.disabled = false;
  }
}

async function loadReviews() {
  $("queue-message").textContent = "Loading proposals…";
  list.replaceChildren();
  try {
    const query = new URLSearchParams({ status: currentStatus, limit: String(PAGE_SIZE), offset: String(offset) });
    const result = await api("?" + query.toString());
    for (const review of result.reviews) list.append(renderReview(review));
    $("queue-message").textContent = result.reviews.length
      ? result.reviews.length + " proposal(s) on this page."
      : "No proposals in this queue.";
    $("page-label").textContent = "Page " + (Math.floor(offset / PAGE_SIZE) + 1);
    $("previous-button").disabled = offset === 0;
    $("next-button").disabled = result.reviews.length < PAGE_SIZE;
  } catch (error) {
    $("queue-message").textContent = error.message;
    if (/authentication|required/i.test(error.message)) lock();
  }
}

function lock() {
  ownerToken = "";
  $("owner-token").value = "";
  loginPanel.hidden = false;
  app.hidden = true;
  $("login-error").textContent = "";
}

async function connect() {
  ownerToken = $("owner-token").value.trim();
  if (!ownerToken) {
    $("login-error").textContent = "Enter your owner access token.";
    return;
  }
  $("connect-button").disabled = true;
  try {
    loginPanel.hidden = true;
    app.hidden = false;
    offset = 0;
    await loadReviews();
    if ($("queue-message").textContent.includes("Owner authentication")) {
      lock();
      $("login-error").textContent = "That token was not accepted.";
    }
  } catch (error) {
    lock();
    $("login-error").textContent = error.message;
  } finally {
    $("connect-button").disabled = false;
  }
}

$("connect-button").addEventListener("click", connect);
$("owner-token").addEventListener("keydown", event => { if (event.key === "Enter") connect(); });
$("refresh-button").addEventListener("click", loadReviews);
$("lock-button").addEventListener("click", lock);
$("status-filter").addEventListener("change", event => {
  currentStatus = event.target.value;
  $("queue-title").textContent = currentStatus === "awaiting_owner_review" ? "Awaiting your review"
    : currentStatus === "approved" ? "Approved proposals" : "Rejected proposals";
  offset = 0;
  loadReviews();
});
$("previous-button").addEventListener("click", () => { offset = Math.max(0, offset - PAGE_SIZE); loadReviews(); });
$("next-button").addEventListener("click", () => { offset += PAGE_SIZE; loadReviews(); });
