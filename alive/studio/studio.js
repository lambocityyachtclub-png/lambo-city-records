const AUTH_URL = "https://esm.sh/better-auth@1.7.23/client";
const PASSKEY_URL = "https://esm.sh/@better-auth/passkey@1.7.23/client";
const PLUGINS_URL = "https://esm.sh/better-auth@1.7.23/client/plugins";
let authPromise;
let pendingUser = null;
let savedCompanion = null;
const $ = id => document.getElementById(id);

function setStatus(id, message, error = false) {
  const node = $(id);
  if (!node) return;
  node.textContent = message || "";
  node.classList.toggle("error", error);
}

async function authClient() {
  if (!authPromise) {
    authPromise = Promise.all([import(AUTH_URL), import(PASSKEY_URL), import(PLUGINS_URL)]).then(([core, passkeys, plugins]) =>
      core.createAuthClient({ baseURL: window.location.origin, plugins: [passkeys.passkeyClient(), plugins.emailOTPClient()] })
    );
  }
  return authPromise;
}

async function request(path, options = {}) {
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(payload.error || "The request could not be completed."); error.status = response.status; throw error; }
  return payload;
}

function usernameValue() { return $("account-name").value.trim(); }
function validUsername(value) { return /^[a-zA-Z0-9_]{3,20}$/.test(value); }

async function ensurePlayerProfile(user) {
  const current = await request("/api/player/profile");
  if (current.profile?.username) return current.profile;
  const username = usernameValue();
  if (!validUsername(username)) throw new Error("Choose a username with 3–20 letters, numbers, or underscores to continue.");
  return (await request("/api/player/profile", { method: "PUT", body: JSON.stringify({ username, bio: "", avatarImages: [] }) })).profile;
}

async function finishAccount(user) {
  if (!user?.id || user.emailVerified !== true) throw new Error("Verify your email before entering ALIVE Studio.");
  pendingUser = user;
  try {
    await ensurePlayerProfile(user);
  } catch (error) {
    $("continue-account").hidden = false;
    setStatus("auth-status", error.message, true);
    return;
  }
  $("auth-panel").style.display = "none";
  $("studio").style.display = "block";
  setStatus("studio-status", "Your verified account is connected. Your Companion profile is private.");
  await loadCompanion();
}

async function sendEmailCode() {
  const email = $("account-email").value.trim().toLowerCase();
  const username = usernameValue();
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return setStatus("auth-status", "Enter a valid email address.", true);
  if (!validUsername(username)) return setStatus("auth-status", "Choose a username with 3–20 letters, numbers, or underscores.", true);
  $("send-code").disabled = true;
  try {
    const auth = await authClient();
    const result = await auth.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    if (result.error) throw new Error(result.error.message || "The email code could not be sent.");
    $("code-area").hidden = false;
    $("email-code").focus();
    setStatus("auth-status", "Check your email. Your six-digit code is valid for five minutes.");
  } catch (error) { setStatus("auth-status", error.message, true); }
  finally { $("send-code").disabled = false; }
}

async function verifyEmailCode() {
  const email = $("account-email").value.trim().toLowerCase();
  const otp = $("email-code").value.trim();
  if (!/^\\d{6}$/.test(otp)) return setStatus("auth-status", "Enter the six-digit code from your email.", true);
  $("verify-code").disabled = true;
  try {
    const auth = await authClient();
    const result = await auth.signIn.emailOtp({ email, otp, name: usernameValue() });
    if (result.error) throw new Error(result.error.message || "Email verification failed.");
    let session = await auth.getSession();
    let user = session.data?.user || result.data?.user;
    if (!user?.emailVerified) throw new Error("Your email verification has not completed. Please try again.");
    try {
      await auth.passkey.addPasskey({ name: "ALIVE Studio Passkey" });
      session = await auth.getSession();
      user = session.data?.user || user;
      setStatus("auth-status", "Email verified and passkey added. Opening your Companion Studio.");
    } catch { setStatus("auth-status", "Email verified. You can add a passkey later from a supported device."); }
    await finishAccount(user);
  } catch (error) { setStatus("auth-status", error.message, true); }
  finally { $("verify-code").disabled = false; }
}

async function signInWithPasskey() {
  $("passkey-login").disabled = true;
  try {
    const auth = await authClient();
    const result = await auth.signIn.passkey();
    if (result.error) throw new Error(result.error.message || "Passkey sign-in failed.");
    const session = await auth.getSession();
    if (!session.data?.user) throw new Error("Your account session could not be loaded.");
    await finishAccount(session.data.user);
  } catch (error) { setStatus("auth-status", error.message, true); }
  finally { $("passkey-login").disabled = false; }
}

async function continueAccount() {
  if (!pendingUser) return;
  $("continue-account").disabled = true;
  try { await ensurePlayerProfile(pendingUser); await finishAccount(pendingUser); }
  catch (error) { setStatus("auth-status", error.message, true); }
  finally { $("continue-account").disabled = false; }
}

function appearanceFromForm() {
  return { skinTone: $("skin-tone").value, hairStyle: $("hair-style").value, hairColor: $("hair-color").value, eyeColor: $("eye-color").value, outfit: $("outfit").value, accentColor: $("accent-color").value };
}

function personalityFromForm() {
  return { summary: $("personality-summary").value.trim(), traits: [...document.querySelectorAll(".traits input:checked")].slice(0, 5).map(input => input.value) };
}

function updatePreview() {
  const avatar = $("avatar-preview");
  avatar.dataset.tone = $("skin-tone").value;
  avatar.dataset.hair = $("hair-color").value;
  avatar.dataset.style = $("character-form").value;
  $("preview-name").textContent = $("companion-name").value.trim() || "Your Companion";
  const form = $("character-form").value === "stylized" ? "Stylized character" : "Digital human";
  $("preview-meta").textContent = form + " · Private identity";
}

function applyCompanion(companion) {
  if (!companion) {
    $("companion-name").value = "";
    $("character-form").value = "digital-human";
    $("skin-tone").value = "medium";
    $("hair-style").value = "short";
    $("hair-color").value = "black";
    $("eye-color").value = "brown";
    $("outfit").value = "streetwear";
    $("accent-color").value = "gold";
    $("personality-summary").value = "";
    document.querySelectorAll(".traits input").forEach(input => { input.checked = false; });
    savedCompanion = null;
  } else {
    $("companion-name").value = companion.displayName || "";
    $("character-form").value = companion.characterForm || "digital-human";
    for (const [key, id] of Object.entries({ skinTone: "skin-tone", hairStyle: "hair-style", hairColor: "hair-color", eyeColor: "eye-color", outfit: "outfit", accentColor: "accent-color" })) {
      if (companion.appearanceProfile?.[key]) $(id).value = companion.appearanceProfile[key];
    }
    $("personality-summary").value = companion.personality?.summary || "";
    const selected = new Set(companion.personality?.traits || []);
    document.querySelectorAll(".traits input").forEach(input => { input.checked = selected.has(input.value); });
    savedCompanion = companion;
  }
  updatePreview();
}

async function loadCompanion() {
  try {
    const result = await request("/api/alive/public/companion");
    applyCompanion(result.companion);
    setStatus("studio-status", result.companion ? "Your saved Companion has been restored." : "Create your first Companion. It will be saved privately to this account.");
  } catch (error) {
    applyCompanion(null);
    setStatus("studio-status", error.message + " The database setup may still be pending.", true);
  }
}

async function saveCompanion() {
  const payload = { displayName: $("companion-name").value.trim(), characterForm: $("character-form").value, appearanceProfile: appearanceFromForm(), personality: personalityFromForm() };
  $("save-companion").disabled = true;
  try {
    const result = await request("/api/alive/public/companion", { method: "PUT", body: JSON.stringify(payload) });
    applyCompanion(result.companion);
    setStatus("studio-status", "Your Companion is saved. Sign in again on a supported device to return to this identity.");
  } catch (error) { setStatus("studio-status", error.message, true); }
  finally { $("save-companion").disabled = false; }
}

async function signOut() {
  try { const auth = await authClient(); await auth.signOut(); } catch {}
  pendingUser = null;
  $("studio").style.display = "none";
  $("auth-panel").style.display = "block";
  $("continue-account").hidden = true;
  $("code-area").hidden = true;
  setStatus("auth-status", "You have signed out.");
}

async function initialize() {
  $("send-code").addEventListener("click", sendEmailCode);
  $("verify-code").addEventListener("click", verifyEmailCode);
  $("passkey-login").addEventListener("click", signInWithPasskey);
  $("continue-account").addEventListener("click", continueAccount);
  $("save-companion").addEventListener("click", saveCompanion);
  $("signout-studio").addEventListener("click", signOut);
  $("signout-auth").addEventListener("click", signOut);
  for (const id of ["companion-name", "character-form", "skin-tone", "hair-style", "hair-color", "eye-color", "outfit", "accent-color"]) $(id).addEventListener("input", updatePreview);
  document.querySelectorAll(".traits input").forEach(input => input.addEventListener("change", () => {
    const selected = document.querySelectorAll(".traits input:checked");
    if (selected.length > 5) input.checked = false;
    setStatus("studio-status", selected.length > 5 ? "Choose up to five personality traits." : "");
  }));
  try {
    const auth = await authClient();
    const session = await auth.getSession();
    if (session.data?.user?.emailVerified === true) await finishAccount(session.data.user);
  } catch { setStatus("auth-status", "Sign in with your email code or passkey to continue."); }
}

initialize();
