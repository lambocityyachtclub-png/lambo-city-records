const API = "/api/alive/";
let authClientPromise;
let enrollmentMode = false;
let ownerAuthenticated = false;
let statusSnapshot = null;
let toastTimer = null;

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

function notify(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 3400);
}

function setAuthMode(enrolling) {
  enrollmentMode = enrolling;
  $("auth-heading").textContent = enrolling ? "Activate your ALIVE owner account" : "Sign in to ALIVE";
  $("auth-description").textContent = enrolling
    ? "Use the private Preview invitation, your owner email, and a strong password. Safari can save the password for you."
    : "Use your private ALIVE owner account. Safari can save your password in the iPad Passwords app.";
  $("password-confirm-wrap").hidden = !enrolling;
  $("enrollment-token-wrap").hidden = !enrolling;
  $("password-signin-button").hidden = enrolling;
  $("create-owner-account-button").hidden = !enrolling;
  $("toggle-enrollment-button").hidden = enrolling;
  $("cancel-enrollment-button").hidden = !enrolling;
  $("passkey-signin-button").hidden = enrolling;
  $("owner-password").autocomplete = enrolling ? "new-password" : "current-password";
  $("owner-password-confirm").required = enrolling;
  $("owner-enrollment-token").required = enrolling;
  $("auth-message").textContent = "";
}

async function createAuthClient(enrollmentToken = "") {
  const [core, passkeys] = await Promise.all([
    import("https://esm.sh/better-auth@1.7.23/client"),
    import("https://esm.sh/@better-auth/passkey@1.7.23/client")
  ]);
  const headers = enrollmentToken
    ? { "x-alive-owner-enrollment-token": enrollmentToken }
    : {};
  return core.createAuthClient({
    baseURL: window.location.origin + "/api/alive/auth",
    plugins: [passkeys.passkeyClient()],
    fetchOptions: { headers }
  });
}

function getAuthClient() {
  if (!authClientPromise) authClientPromise = createAuthClient();
  return authClientPromise;
}

async function request(action, options = {}) {
  const response = await fetch(API + action, {
    method: options.method || "GET",
    credentials: "same-origin",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });
  let payload = {};
  try { payload = await response.json(); } catch {}
  if (response.status === 401) {
    ownerAuthenticated = false;
    disconnect();
    throw new Error("Your ALIVE owner session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload.error || "Request failed (" + response.status + ").");
  return payload;
}

function renderStatus(data) {
  statusSnapshot = data;
  $("system-mode").textContent = "Owner-controlled development";
  $("system-summary").textContent = data.databaseConfigured
    ? "Connected to the hosted ALIVE control plane. Code generation and production deployment remain separate permissions."
    : "Owner session is active, but hosted storage is not configured.";
  const values = [
    ["DATABASE", data.databaseConfigured ? "CONNECTED" : "NOT CONFIGURED"],
    ["TASK STORAGE", data.persistentTaskStorage ? "PERSISTENT" : "NOT READY"],
    ["AI GATEWAY", data.aiProposalProviderConfigured ? "CONFIGURED" : "NOT CONFIGURED"],
    ["AI SPEND", data.aiProposalGenerationEnabled ? "OWNER ENABLED" : "DISABLED"],
    ["CODE EXECUTION", data.aiExecutionEnabled ? "ENABLED" : "DISABLED"],
    ["ISOLATED SANDBOX", data.isolatedSandboxEnabled ? "ENABLED" : "NOT CONNECTED"],
    ["PRODUCTION DEPLOY", data.autonomousProductionDeployment ? "ENABLED" : "DISABLED"]
  ];
  $("status-grid").innerHTML = values.map(([label, value]) =>
    '<div class="status-cell"><span>' + escapeHTML(label) + '</span><strong>' + escapeHTML(value) + '</strong></div>'
  ).join("");
  $("system-next-step").textContent = data.nextMilestone || "ALIVE is ready to receive directions and map them to its project contracts.";
}

function renderPlan(result) {
  const root = $("plan-result");
  root.hidden = false;
  if (result.status === "submitted") {
    root.innerHTML = '<div class="plan-head"><span class="pill good">DIRECTION ACCEPTED</span><strong>' +
      escapeHTML(result.total) + ' contract task(s) queued</strong></div>' +
      (result.submitted || []).map(item =>
        '<article class="plan-task"><strong>' + escapeHTML(item.livingContractId) +
        '</strong><span>' + escapeHTML(item.projectContractId) + '</span><small>' +
        escapeHTML((item.relatedFiles || []).join(", ")) + '</small></article>'
      ).join("") +
      '<p class="muted">No code was changed or deployed. Tasks are waiting for the next authorized execution stage.</p>';
    return;
  }
  const warning = result.status === "owner_approval_required";
  root.innerHTML = '<div class="plan-head"><span class="pill ' + (warning ? "warn" : "neutral") + '">' +
    escapeHTML(result.status.replaceAll("_", " ").toUpperCase()) + '</span></div>' +
    '<p>' + escapeHTML(result.reason || "ALIVE needs a more specific instruction.") + '</p>' +
    (result.protectedContracts?.length
      ? '<p class="meta">Protected contracts: ' + escapeHTML(result.protectedContracts.join(", ")) + '</p>'
      : "");
}

function renderTasks(tasks) {
  const root = $("tasks-list");
  if (!Array.isArray(tasks) || tasks.length === 0) {
    root.innerHTML = '<p class="muted">No tasks yet. Give ALIVE a direction above to begin.</p>';
    return;
  }
  root.innerHTML = tasks.map(task => {
    const files = Array.isArray(task.relatedFiles) ? task.relatedFiles : [];
    const criteria = Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [];
    return '<article class="item"><div class="item-head"><div><h3>' +
      escapeHTML(task.title || "Untitled task") + '</h3><div class="meta">' +
      escapeHTML(task.id) + ' · ' + escapeHTML(task.area || task.runner || "world") +
      '</div></div><span class="pill neutral">' + escapeHTML(task.status || "unknown") +
      '</span></div><p>' + escapeHTML(task.description || "") + '</p>' +
      '<div class="meta"><strong>Contract:</strong> ' + escapeHTML(task.contractId || "not assigned") +
      ' · v' + escapeHTML(task.contractVersion || "—") + '</div>' +
      '<div class="meta"><strong>Exact source targets:</strong> ' +
      escapeHTML(files.length ? files.join(", ") : "No source targets; execution is blocked") + '</div>' +
      (criteria.length ? '<ul class="criteria">' + criteria.map(item => '<li>' + escapeHTML(item) + '</li>').join("") + '</ul>' : "") +
      '</article>';
  }).join("");
}

function renderReviews(reviews) {
  const root = $("reviews-list");
  if (!Array.isArray(reviews) || reviews.length === 0) {
    root.innerHTML = '<p class="muted">No owner reviews are waiting. ALIVE will place a proposal here after isolated generation and testing are connected.</p>';
    return;
  }
  root.innerHTML = reviews.map(review => {
    const metrics = review.resourceMetrics || {};
    const tests = review.testResults || {};
    const changes = typeof review.changes === "string"
      ? review.changes
      : JSON.stringify(review.changes || {}, null, 2);
    const id = escapeHTML(review.id);
    return '<article class="item"><div class="item-head"><div><h3>' +
      escapeHTML(review.taskTitle || "Proposed change") + '</h3><div class="meta">Review ' +
      id + ' · Task ' + escapeHTML(review.taskId || "") + '</div></div><span class="pill warn">' +
      escapeHTML(review.status || "awaiting_owner_review") + '</span></div>' +
      '<div class="meta"><strong>Contract:</strong> ' + escapeHTML(review.contractId || "—") +
      ' · v' + escapeHTML(review.contractVersion || "—") + ' · ' + escapeHTML(review.autonomyLevel || "—") + '</div>' +
      '<div class="meta"><strong>Changed files:</strong> ' + escapeHTML((review.changedFiles || []).join(", ")) + '</div>' +
      '<div class="meta"><strong>Resource evidence:</strong> ' + escapeHTML(JSON.stringify(metrics)) + '</div>' +
      '<div class="meta"><strong>Tests:</strong> ' + escapeHTML(tests.passed === true ? "Passed" : tests.passed === false ? "Failed" : "Not reported") + '</div>' +
      '<details class="diff"><summary>Inspect proposed changes</summary><pre>' + escapeHTML(changes) + '</pre></details>' +
      (review.status === "awaiting_owner_review"
        ? '<div class="review-actions"><textarea class="review-note" rows="2" maxlength="2000" placeholder="Optional owner note"></textarea><button class="primary approve-review" data-review="' + id + '">APPROVE REVIEW</button><button class="quiet reject-review" data-review="' + id + '">REJECT REVIEW</button></div>'
        : "") +
      '</article>';
  }).join("");
  root.querySelectorAll(".approve-review").forEach(button => button.addEventListener("click", () => decideReview(button, "approved")));
  root.querySelectorAll(".reject-review").forEach(button => button.addEventListener("click", () => decideReview(button, "rejected")));
}

async function decideReview(button, decision) {
  const note = button.closest(".item").querySelector(".review-note")?.value.trim() || "";
  if (!window.confirm(decision === "approved"
    ? "Record that this proposal passed your owner review? This does not publish or deploy code."
    : "Reject this proposal? No code will be published.")) return;
  button.disabled = true;
  try {
    const result = await request("reviews", {
      method: "POST",
      body: { reviewId: button.dataset.review, decision, ownerNote: note }
    });
    notify(result.productionChangesMade === false
      ? "Owner decision recorded. No production changes were made."
      : "Owner decision recorded.");
    await refreshAll();
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
}

async function refreshAll() {
  if (!ownerAuthenticated) return;
  const [status, tasks, reviews] = await Promise.all([
    request("status"),
    request("tasks"),
    request("reviews")
  ]);
  renderStatus(status);
  renderTasks(tasks.tasks || []);
  renderReviews(reviews.reviews || []);
}

function disconnect() {
  ownerAuthenticated = false;
  statusSnapshot = null;
  $("workspace").hidden = true;
  $("auth-panel").hidden = false;
}

async function enterOwnerConsole() {
  ownerAuthenticated = true;
  $("auth-panel").hidden = true;
  $("workspace").hidden = false;
  try {
    await refreshAll();
    notify("Secure ALIVE owner session connected.");
  } catch (error) {
    disconnect();
    notify(error.message);
  }
}

$("owner-auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  const email = $("owner-email").value.trim().toLowerCase();
  const password = $("owner-password").value;
  const button = enrollmentMode ? $("create-owner-account-button") : $("password-signin-button");
  if (!email || !password) {
    $("auth-message").textContent = "Enter your owner email and password.";
    return;
  }
  if (enrollmentMode) {
    if (password.length < 12) {
      $("auth-message").textContent = "Choose a password with at least 12 characters.";
      return;
    }
    if (password !== $("owner-password-confirm").value) {
      $("auth-message").textContent = "The passwords do not match.";
      return;
    }
    if (!$("owner-enrollment-token").value.trim()) {
      $("auth-message").textContent = "Enter the private one-time founder invitation.";
      return;
    }
  }
  button.disabled = true;
  $("auth-message").textContent = enrollmentMode ? "Activating your owner account…" : "Signing in…";
  try {
    const auth = enrollmentMode
      ? await createAuthClient($("owner-enrollment-token").value.trim())
      : await getAuthClient();
    const result = enrollmentMode
      ? await auth.signUp.email({ email, password, name: "ALIVE Owner" })
      : await auth.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message || "ALIVE owner authentication failed.");
    $("owner-password").value = "";
    $("owner-password-confirm").value = "";
    $("owner-enrollment-token").value = "";
    setAuthMode(false);
    const session = await (await getAuthClient()).getSession();
    if (!session.data?.user) throw new Error("Authentication succeeded, but the owner session could not be confirmed.");
    await enterOwnerConsole();
  } catch (error) {
    $("auth-message").textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$("toggle-enrollment-button").addEventListener("click", () => setAuthMode(true));
$("cancel-enrollment-button").addEventListener("click", () => setAuthMode(false));

$("passkey-signin-button").addEventListener("click", async () => {
  const button = $("passkey-signin-button");
  button.disabled = true;
  try {
    const auth = await getAuthClient();
    const result = await auth.signIn.passkey();
    if (result.error) throw new Error(result.error.message || "Passkey sign-in failed.");
    const session = await auth.getSession();
    if (!session.data?.user) throw new Error("Passkey sign-in did not create an owner session.");
    await enterOwnerConsole();
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
});

$("register-passkey-button").addEventListener("click", async () => {
  const button = $("register-passkey-button");
  button.disabled = true;
  try {
    const auth = await getAuthClient();
    const result = await auth.passkey.addPasskey({
      name: "ALIVE owner iPad",
      authenticatorAttachment: "platform"
    });
    if (result.error) throw new Error(result.error.message || "Passkey registration failed.");
    notify("This iPad is registered for secure ALIVE sign-in.");
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
});

$("intent-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("submit-intent-button");
  const intent = $("intent").value.trim();
  if (!intent) return;
  button.disabled = true;
  $("intent-message").textContent = "ALIVE is mapping your direction to the project contracts…";
  $("plan-result").hidden = true;
  try {
    const response = await request("tasks", { method: "POST", body: { intent } });
    renderPlan(response.result || {});
    $("intent-message").textContent = "Direction processed. No code was changed or deployed.";
    $("intent").value = "";
    await refreshAll();
  } catch (error) {
    $("intent-message").textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$("refresh-button").addEventListener("click", async () => {
  const button = $("refresh-button");
  button.disabled = true;
  try {
    await refreshAll();
    notify("ALIVE status refreshed.");
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
});

$("signout-button").addEventListener("click", async () => {
  try {
    const auth = await getAuthClient();
    await auth.signOut();
  } catch {}
  disconnect();
  notify("Owner session signed out.");
});

getAuthClient()
  .then(auth => auth.getSession())
  .then(result => {
    if (result.data?.user) enterOwnerConsole();
  })
  .catch(() => {});
