const API = "/api/alive/";
let authClientPromise;
let enrollmentAuthClientPromise;
let enrollmentToken = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("enroll") || "";
if (enrollmentToken) history.replaceState(null, "", window.location.pathname + window.location.search);

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
let toastTimer;

function notify(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

function createAuthClient(includeEnrollmentToken = false) {
  return Promise.all([
    import("https://esm.sh/better-auth@1.7.23/client"),
    import("https://esm.sh/@better-auth/passkey@1.7.23/client")
  ]).then(([core, passkeys]) => core.createAuthClient({
    baseURL: window.location.origin + "/api/alive/auth",
    plugins: [passkeys.passkeyClient()],
    fetchOptions: {
      headers: includeEnrollmentToken && enrollmentToken
        ? { "x-alive-owner-enrollment-token": enrollmentToken }
        : {}
    }
  }));
}

function getAuthClient() {
  if (!authClientPromise) authClientPromise = createAuthClient();
  return authClientPromise;
}

function getEnrollmentAuthClient() {
  if (!enrollmentToken) throw new Error("A private founder invitation is required.");
  if (!enrollmentAuthClientPromise) enrollmentAuthClientPromise = createAuthClient(true);
  return enrollmentAuthClientPromise;
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
    $("workspace").hidden = true;
    $("auth-panel").hidden = false;
    throw new Error("Your ALIVE owner session has expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload.error || "ALIVE request failed (" + response.status + ").");
  return payload;
}

function createFounderCredential() {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function enterWorkspace() {
  $("auth-panel").hidden = true;
  $("workspace").hidden = false;
  await refreshAll();
}

async function activateFounder() {
  const email = $("owner-email").value.trim().toLowerCase();
  if (!email) throw new Error("Enter your owner email.");
  const password = createFounderCredential();
  const auth = await getEnrollmentAuthClient();
  const result = await auth.signUp.email({ email, password, name: "ALIVE Owner" });
  if (result.error) throw new Error(result.error.message || "Owner activation failed.");
  enrollmentToken = "";
  enrollmentAuthClientPromise = null;
  const session = await (await getAuthClient()).getSession();
  if (!session.data?.user) throw new Error("The account was created but the secure session did not start. Keep this page open and contact support.");
  await enterWorkspace();
  try {
    await registerPasskey();
  } catch {
    notify("Your owner account is active. Tap Secure this iPad to finish Face ID / Touch ID setup.");
  }
}

async function registerPasskey() {
  const button = $("register-passkey-button");
  button.disabled = true;
  try {
    const result = await (await getAuthClient()).passkey.addPasskey({
      name: "ALIVE founder iPad",
      authenticatorAttachment: "platform"
    });
    if (result.error) throw new Error(result.error.message || "Passkey registration failed.");
    button.textContent = "Passkey secured";
    button.disabled = true;
    notify("This iPad is secured. If iCloud Keychain is enabled, your passkey may sync to your other Apple devices.");
  } finally {
    if (!button.textContent.includes("secured")) button.disabled = false;
  }
}

async function signInWithPasskey() {
  const auth = await getAuthClient();
  const result = await auth.signIn.passkey();
  if (result.error) throw new Error(result.error.message || "Passkey sign-in failed.");
  const session = await auth.getSession();
  if (!session.data?.user) throw new Error("Passkey sign-in did not create a secure session.");
  await enterWorkspace();
  notify("Welcome back to ALIVE.");
}

function renderStatus(data) {
  $("system-title").textContent = "Owner-controlled ALIVE";
  $("system-description").textContent = "Connected to the private development database. Directions are converted into contract-checked tasks.";
  const cells = [
    ["DATABASE", data.databaseConfigured ? "CONNECTED" : "NOT CONFIGURED"],
    ["TASK STORAGE", data.persistentTaskStorage ? "PERSISTENT" : "NOT READY"],
    ["AI PROVIDER", data.aiProviderConfigured ? "KEY PRESENT" : "NOT CONNECTED"],
    ["AI EXECUTION", data.aiExecutionEnabled ? "ENABLED" : "NOT ENABLED"],
    ["SANDBOX", data.isolatedSandboxEnabled ? "ENABLED" : "NOT ENABLED"],
    ["AUTO DEPLOY", data.autonomousProductionDeployment ? "ENABLED" : "NOT ENABLED"]
  ];
  $("status-grid").innerHTML = cells.map(([label, value]) =>
    '<div class="status-cell"><span>' + escapeHTML(label) + '</span><strong>' + escapeHTML(value) + '</strong></div>'
  ).join("");
  $("status-pill").textContent = data.persistentTaskStorage ? "CONNECTED" : "CHECK SETUP";
  $("intent-feedback").textContent = data.aiExecutionEnabled
    ? "ALIVE can prepare isolated proposals. Every release still follows its Living Contract and evidence gates."
    : "The task queue is connected. AI proposal generation and isolated execution are the next connection; no source code or production deployment is changed by this console yet.";
}

function renderTasks(tasks) {
  const root = $("tasks-list");
  $("task-count").textContent = (tasks?.length || 0) + " TASKS";
  if (!Array.isArray(tasks) || tasks.length === 0) {
    root.innerHTML = '<p class="muted">No tasks yet. Give ALIVE its first direction above.</p>';
    return;
  }
  root.innerHTML = tasks.map(task => {
    const files = Array.isArray(task.relatedFiles) ? task.relatedFiles : [];
    const deps = Array.isArray(task.dependencies) ? task.dependencies : [];
    return '<article class="item"><div class="item-head"><div><h3>' +
      escapeHTML(task.title || "Untitled task") +
      '</h3><div class="meta">' + escapeHTML(task.id) + ' · ' + escapeHTML(task.contractId || task.area || "ALIVE") +
      '</div></div><span class="pill">' + escapeHTML(task.status || "unknown") +
      '</span></div><p>' + escapeHTML(task.description || "") +
      '</p>' + (files.length ? '<div class="task-deps">TARGETS: ' + files.map(escapeHTML).join(" · ") + '</div>' : "") +
      (deps.length ? '<div class="task-deps">DEPENDENCIES: ' + deps.map(escapeHTML).join(" · ") + '</div>' : "") +
      '</article>';
  }).join("");
}

function renderReviews(reviews) {
  const root = $("reviews-list");
  if (!Array.isArray(reviews) || reviews.length === 0) {
    root.innerHTML = '<p class="muted">No proposals are awaiting owner review.</p>';
    return;
  }
  root.innerHTML = reviews.map(review =>
    '<article class="item"><div class="item-head"><div><h3>' + escapeHTML(review.taskTitle || "Development proposal") +
    '</h3><div class="meta">' + escapeHTML(review.id) + '</div></div><span class="pill">' +
    escapeHTML(review.status) + '</span></div><p>' + escapeHTML(review.changes?.summary || "A tested proposal is ready for inspection.") +
    '</p></article>'
  ).join("");
}

async function refreshAll() {
  const [status, tasks, reviews] = await Promise.all([
    request("status"),
    request("tasks"),
    request("reviews")
  ]);
  renderStatus(status);
  renderTasks(tasks.tasks);
  renderReviews(reviews.reviews);
}

$("owner-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!enrollmentToken) return;
  const button = $("activate-button");
  button.disabled = true;
  try {
    await activateFounder();
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
});

$("register-passkey-button").addEventListener("click", async () => {
  try { await registerPasskey(); }
  catch (error) { notify(error.message); }
});

$("passkey-button").addEventListener("click", async () => {
  const button = $("passkey-button");
  button.disabled = true;
  try {
    await signInWithPasskey();
  } catch (error) {
    notify(error.message);
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
  try { await (await getAuthClient()).signOut(); } catch {}
  $("workspace").hidden = true;
  $("auth-panel").hidden = false;
  $("passkey-button").hidden = !enrollmentToken;
  notify("Signed out of ALIVE.");
});

$("intent-form").addEventListener("submit", async event => {
  event.preventDefault();
  const input = $("intent");
  const button = $("submit-intent");
  const intent = input.value.trim();
  if (!intent) return;
  button.disabled = true;
  try {
    const response = await request("tasks", { method: "POST", body: { intent } });
    const result = response.result;
    if (result.status === "submitted") {
      notify(result.total + " contract-checked task(s) added to ALIVE.");
      input.value = "";
    } else {
      notify(result.reason || "ALIVE needs a clearer direction before creating tasks.");
    }
    await refreshAll();
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
});

async function initialize() {
  if (enrollmentToken) {
    $("auth-title").textContent = "Activate your ALIVE owner access";
    $("auth-description").textContent = "This private one-time invitation activates your founder account. ALIVE will secure this iPad with Face ID or Touch ID.";
    $("activate-button").hidden = false;
    $("passkey-button").hidden = true;
    $("auth-note").textContent = "Enter the owner email already assigned to this private invitation. The invitation is removed from the address bar immediately.";
    return;
  }
  $("auth-title").textContent = "Sign in to ALIVE";
  $("auth-description").textContent = "Use the passkey saved to your iPad or iCloud Keychain. Your ALIVE owner account is separate from player accounts.";
  $("activate-button").hidden = true;
  $("passkey-button").hidden = false;
  $("owner-email").hidden = true;
  $("owner-form").hidden = true;
  $("auth-note").textContent = "If this is your first visit, use the private founder invitation to activate your owner access.";
  try {
    const session = await (await getAuthClient()).getSession();
    if (session.data?.user) await enterWorkspace();
  } catch {}
}

initialize();
