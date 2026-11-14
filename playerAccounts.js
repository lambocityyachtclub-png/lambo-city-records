const AUTH_CLIENT_URL = "https://esm.sh/better-auth@1.7.23/client";
const PASSKEY_CLIENT_URL = "https://esm.sh/@better-auth/passkey@1.7.22/client";
const EMAIL_OTP_CLIENT_URL = "https://esm.sh/better-auth@1.7.23/client/plugins";

let authClientPromise;
let modal;
let statusNode;
let activeUser = null;

async function getAuthClient() {
  if (!authClientPromise) {
    authClientPromise = Promise.all([
      import(AUTH_CLIENT_URL),
      import(PASSKEY_CLIENT_URL),
      import(EMAIL_OTP_CLIENT_URL)
    ]).then(([core, passkey, email]) => core.createAuthClient({
      baseURL: window.location.origin,
      plugins: [passkey.passkeyClient(), email.emailOTPClient()]
    }));
  }
  return authClientPromise;
}

function setStatus(message, isError = false) {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#ff9b9b" : "#d8c28e";
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong. Please try again.");
  return payload;
}

function makeButton(label, action, primary = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.cssText = `
    width:100%;min-height:44px;border-radius:10px;padding:11px 14px;
    border:1px solid ${primary ? "rgba(224,190,112,.85)" : "rgba(255,255,255,.16)"};
    background:${primary ? "linear-gradient(135deg,#8b6a2e,#d9b66f)" : "rgba(255,255,255,.06)"};
    color:${primary ? "#09070b" : "#f6f0e4"};font:700 11px Arial,sans-serif;
    letter-spacing:1.1px;cursor:pointer;touch-action:manipulation;
  `;
  button.addEventListener("click", action);
  return button;
}

function makeInput(placeholder, type = "text", value = "") {
  const input = document.createElement("input");
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  input.autocomplete = type === "email" ? "email" : "off";
  input.style.cssText = "width:100%;box-sizing:border-box;background:#100d18;border:1px solid rgba(218,190,130,.3);border-radius:9px;color:#fff;padding:13px 12px;font:14px Arial,sans-serif;outline:none;";
  return input;
}

function closeModal() {
  modal?.remove();
  modal = null;
  statusNode = null;
}

async function showSignedIn(user) {
  activeUser = user;
  const profileData = await api("/api/player/profile").catch(() => null);
  const profile = profileData?.profile;
  const panel = modal?.querySelector("[data-account-content]");
  if (!panel) return;

  panel.replaceChildren();
  const heading = document.createElement("div");
  heading.textContent = "WELCOME TO YOUR CITY";
  heading.style.cssText = "color:#e4c47f;font-size:11px;letter-spacing:2px;margin-bottom:8px;";
  const identity = document.createElement("div");
  identity.textContent = profile?.username || user.name || user.email;
  identity.style.cssText = "font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;overflow-wrap:anywhere;";
  const email = document.createElement("div");
  email.textContent = user.email || "";
  email.style.cssText = "font-size:12px;color:#aaa;margin-bottom:16px;";
  const description = document.createElement("p");
  description.textContent = "Your LAMBO CITY identity is connected. Your account can carry your profile and messages across supported devices.";
  description.style.cssText = "font-size:12px;line-height:1.6;color:#c6c0b4;margin:0 0 16px;";
  const signOut = makeButton("SIGN OUT", async () => {
    try {
      const client = await getAuthClient();
      await client.signOut();
      activeUser = null;
      renderSignIn();
    } catch (error) {
      setStatus(error.message, true);
    }
  });
  panel.append(heading, identity, email, description, signOut);
  setStatus("ACCOUNT CONNECTED");
}

function renderSignIn() {
  const panel = modal?.querySelector("[data-account-content]");
  if (!panel) return;
  panel.replaceChildren();

  const intro = document.createElement("p");
  intro.textContent = "Create your LAMBO CITY identity with your email and a device passkey. No traditional password is needed.";
  intro.style.cssText = "font-size:12px;line-height:1.6;color:#c6c0b4;margin:0 0 14px;";

  const username = makeInput("Choose a username (3–20 characters)");
  const email = makeInput("Your email address", "email");
  const code = makeInput("6-digit email code");
  code.inputMode = "numeric";
  code.maxLength = 6;
  code.style.display = "none";

  const sendCode = makeButton("SEND EMAIL CODE", async () => {
    const cleanEmail = email.value.trim().toLowerCase();
    const cleanName = username.value.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanName)) {
      setStatus("Choose a username with 3–20 letters, numbers, or underscores.", true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatus("Enter a valid email address.", true);
      return;
    }
    try {
      setStatus("SENDING YOUR SECURE CODE...");
      const client = await getAuthClient();
      const result = await client.emailOtp.sendVerificationOtp({
        email: cleanEmail,
        type: "sign-in"
      });
      if (result.error) throw new Error(result.error.message || "The email code could not be sent.");
      code.style.display = "block";
      verifyCode.style.display = "block";
      setStatus("Check your email. The code expires in five minutes.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }, true);

  const verifyCode = makeButton("VERIFY EMAIL & CREATE PASSKEY", async () => {
    const cleanEmail = email.value.trim().toLowerCase();
    const cleanName = username.value.trim();
    const otp = code.value.trim();
    if (!/^\d{6}$/.test(otp)) {
      setStatus("Enter the 6-digit code from your email.", true);
      return;
    }
    try {
      setStatus("VERIFYING YOUR EMAIL...");
      const client = await getAuthClient();
      const result = await client.signIn.emailOtp({
        email: cleanEmail,
        otp,
        name: cleanName
      });
      if (result.error) throw new Error(result.error.message || "Email verification failed.");

      setStatus("NOW CREATE YOUR DEVICE PASSKEY...");
      const passkeyResult = await client.passkey.addPasskey({
        name: "LAMBO CITY Passkey"
      });
      if (passkeyResult.error) {
        throw new Error(passkeyResult.error.message || "Passkey setup was not completed.");
      }

      await api("/api/player/profile", {
        method: "PUT",
        body: JSON.stringify({ username: cleanName, avatarImages: [], bio: "" })
      });
      const session = await client.getSession();
      await showSignedIn(session.data?.user || result.data?.user || { name: cleanName, email: cleanEmail });
    } catch (error) {
      setStatus(error.message, true);
    }
  }, true);
  verifyCode.style.display = "none";

  const divider = document.createElement("div");
  divider.textContent = "ALREADY HAVE AN ACCOUNT?";
  divider.style.cssText = "text-align:center;color:#8e887e;font-size:9px;letter-spacing:1.5px;margin:18px 0 10px;";

  const passkeySignIn = makeButton("SIGN IN WITH PASSKEY", async () => {
    try {
      setStatus("FOLLOW THE PASSKEY PROMPT ON YOUR DEVICE...");
      const client = await getAuthClient();
      const result = await client.signIn.passkey();
      if (result.error) throw new Error(result.error.message || "Passkey sign-in failed.");
      const session = await client.getSession();
      if (!session.data?.user) throw new Error("Your passkey was accepted, but the account session could not be loaded.");
      await showSignedIn(session.data.user);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  panel.append(intro, username, email, sendCode, code, verifyCode, divider, passkeySignIn);
}

function openModal() {
  if (modal) return;
  modal = document.createElement("div");
  modal.id = "lambo-player-account-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:10000;background:rgba(3,2,8,.82);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Arial,sans-serif;backdrop-filter:blur(8px);";
  const card = document.createElement("div");
  card.style.cssText = "width:min(420px,100%);max-height:90vh;overflow:auto;background:linear-gradient(160deg,#171020,#08060d);border:1px solid rgba(218,190,130,.55);border-radius:20px;padding:22px;box-shadow:0 20px 80px rgba(0,0,0,.6);box-sizing:border-box;";
  const header = document.createElement("div");
  header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;";
  const brand = document.createElement("div");
  brand.innerHTML = '<div style="color:#e4c47f;font-size:10px;letter-spacing:3px">LAMBO CITY RECORDS</div><div style="color:#fff;font-size:20px;font-weight:700;margin-top:5px">PLAYER ACCOUNT</div>';
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "✕";
  close.style.cssText = "border:0;background:transparent;color:#bfb7aa;font-size:22px;padding:6px;cursor:pointer;";
  close.addEventListener("click", closeModal);
  header.append(brand, close);
  const content = document.createElement("div");
  content.dataset.accountContent = "true";
  statusNode = document.createElement("div");
  statusNode.style.cssText = "min-height:18px;margin-top:16px;font-size:11px;line-height:1.5;color:#d8c28e;";
  card.append(header, content, statusNode);
  modal.appendChild(card);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });
  document.body.appendChild(modal);

  getAuthClient()
    .then(client => client.getSession())
    .then(result => {
      if (result.data?.user) showSignedIn(result.data.user);
      else renderSignIn();
    })
    .catch(() => renderSignIn());
}

export default {
  init() {
    window.addEventListener("lc-open-player-account", openModal);
    window.addEventListener("keydown", event => {
      if (event.key === "Escape") closeModal();
    });
  }
};
