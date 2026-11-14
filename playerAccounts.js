const AUTH_URL = "https://esm.sh/better-auth@1.7.23/client";
const PASSKEY_URL = "https://esm.sh/@better-auth/passkey@1.7.22/client";
const EMAIL_OTP_URL = "https://esm.sh/better-auth@1.7.23/client/plugins";

let clientPromise;
let overlay;
let statusLine;

function status(message, error = false) {
  if (!statusLine) return;
  statusLine.textContent = message;
  statusLine.style.color = error ? "#ff9b9b" : "#ddc78f";
}

async function client() {
  if (!clientPromise) {
    clientPromise = Promise.all([
      import(AUTH_URL),
      import(PASSKEY_URL),
      import(EMAIL_OTP_URL)
    ]).then(([core, passkeys, email]) => core.createAuthClient({
      baseURL: window.location.origin,
      plugins: [passkeys.passkeyClient(), email.emailOTPClient()]
    }));
  }
  return clientPromise;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}

async function syncHeroInvitation() {
  let invitation;
  try {
    const raw = window.localStorage.getItem("lambocity-hero-hq-invitation-v1");
    invitation = raw ? JSON.parse(raw) : null;
  } catch {
    return;
  }
  if (!invitation || invitation.delivered === false) return;

  const auth = await client();
  const session = await auth.getSession();
  if (!session.data?.user) return;

  const body = String(invitation.body || "").trim() ||
    "What's up! I saw you out there. Welcome to LAMBO CITY. I want to see you at LAMBO CITY Records headquarters. Come through. I'll show you around and help you take your next step. — HERO";
  await request("/api/player/messages", {
    method: "POST",
    body: JSON.stringify({
      sender: invitation.sender || "HERO",
      subject: invitation.subject || "HERO's invitation to LAMBO CITY Records HQ",
      body,
      messageType: "hero-invitation",
      externalId: "hero-hq-invitation-v1"
    })
  });
}

function button(label, handler, primary = false) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.style.cssText = `width:100%;min-height:44px;border-radius:10px;padding:11px 14px;border:1px solid ${primary ? "rgba(224,190,112,.85)" : "rgba(255,255,255,.16)"};background:${primary ? "linear-gradient(135deg,#8b6a2e,#d9b66f)" : "rgba(255,255,255,.06)"};color:${primary ? "#09070b" : "#f6f0e4"};font:700 11px Arial,sans-serif;letter-spacing:1.1px;cursor:pointer;touch-action:manipulation;`;
  element.addEventListener("click", handler);
  return element;
}

function input(placeholder, type = "text") {
  const element = document.createElement("input");
  element.type = type;
  element.placeholder = placeholder;
  element.autocomplete = type === "email" ? "email" : "off";
  element.style.cssText = "width:100%;box-sizing:border-box;background:#100d18;border:1px solid rgba(218,190,130,.3);border-radius:9px;color:#fff;padding:13px 12px;font:14px Arial,sans-serif;outline:none;";
  return element;
}

function close() {
  overlay?.remove();
  overlay = null;
  statusLine = null;
}

async function showInbox() {
  const panel = overlay?.querySelector("[data-account-content]");
  if (!panel) return;
  panel.replaceChildren();
  const title = document.createElement("div");
  title.textContent = "LAMBO CITY INBOX";
  title.style.cssText = "color:#e4c47f;font-size:11px;letter-spacing:2px;margin-bottom:14px;";
  panel.appendChild(title);
  try {
    const result = await request("/api/player/messages");
    if (!result.messages?.length) {
      const empty = document.createElement("p");
      empty.textContent = "Your city messages and invitations will appear here.";
      empty.style.cssText = "color:#c6c0b4;font-size:12px;line-height:1.6;";
      panel.appendChild(empty);
    } else {
      for (const message of result.messages) {
        const item = document.createElement("article");
        item.style.cssText = "padding:12px;margin:0 0 10px;border:1px solid rgba(218,190,130,.22);border-radius:10px;background:rgba(255,255,255,.035);";
        const sender = document.createElement("div");
        sender.textContent = message.sender || "LAMBO CITY";
        sender.style.cssText = "color:#d8bd7d;font-size:9px;letter-spacing:1.5px;margin-bottom:5px;";
        const subject = document.createElement("div");
        subject.textContent = message.subject;
        subject.style.cssText = "color:#fff;font-size:13px;font-weight:700;margin-bottom:6px;";
        const body = document.createElement("div");
        body.textContent = message.body;
        body.style.cssText = "color:#c6c0b4;font-size:12px;line-height:1.55;white-space:pre-wrap;";
        item.append(sender, subject, body);
        panel.appendChild(item);
      }
    }
  } catch (error) {
    const errorText = document.createElement("p");
    errorText.textContent = error.message;
    errorText.style.cssText = "color:#ff9b9b;font-size:12px;";
    panel.appendChild(errorText);
  }
  panel.appendChild(button("BACK TO ACCOUNT", async () => {
    const auth = await client();
    const session = await auth.getSession();
    if (session.data?.user) showSignedIn(session.data.user);
  }));
}

function showRecoveryCodes(codes, user) {
  const panel = overlay?.querySelector("[data-account-content]");
  if (!panel) return;
  panel.replaceChildren();

  const title = document.createElement("div");
  title.textContent = "SAVE YOUR BACKUP CODES";
  title.style.cssText = "color:#e4c47f;font-size:11px;letter-spacing:2px;margin-bottom:10px;";
  const note = document.createElement("p");
  note.textContent = "These one-time codes are your emergency way back into LAMBO CITY if you lose access to your passkey. Save them somewhere private. Each code works once, and this is the only time this set will be shown.";
  note.style.cssText = "color:#c6c0b4;font-size:12px;line-height:1.6;margin:0 0 12px;";
  const list = document.createElement("pre");
  list.textContent = codes.join("\n");
  list.style.cssText = "white-space:pre-wrap;word-break:break-all;background:#09070d;border:1px solid rgba(218,190,130,.3);border-radius:10px;padding:14px;color:#f1d99a;font:700 13px/1.9 monospace;letter-spacing:1px;";
  const copy = button("COPY BACKUP CODES", async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      status("BACKUP CODES COPIED — STORE THEM SAFELY");
    } catch {
      status("Select and copy the codes above, then store them safely.", true);
    }
  });
  const done = button("I SAVED MY BACKUP CODES", () => showSignedIn(user), true);
  panel.append(title, note, list, copy, done);
  status("SAVE THESE CODES BEFORE CONTINUING");
}

function showSignedIn(user) {
  syncHeroInvitation().catch(() => {});
  const panel = overlay?.querySelector("[data-account-content]");
  if (!panel) return;
  panel.replaceChildren();

  const heading = document.createElement("div");
  heading.textContent = "YOUR LAMBO CITY IDENTITY";
  heading.style.cssText = "color:#e4c47f;font-size:10px;letter-spacing:2px;margin-bottom:10px;";
  const name = document.createElement("div");
  name.textContent = user.name || user.email || "LAMBO CITY PLAYER";
  name.style.cssText = "font-size:22px;font-weight:700;color:#fff;margin-bottom:5px;overflow-wrap:anywhere;";
  const email = document.createElement("div");
  email.textContent = user.email || "";
  email.style.cssText = "font-size:12px;color:#aaa;margin-bottom:18px;";
  const note = document.createElement("p");
  note.textContent = "Your account is connected. Your player identity and inbox are being prepared to follow you across supported devices.";
  note.style.cssText = "font-size:12px;line-height:1.6;color:#c6c0b4;margin:0 0 16px;";
  const signOut = button("SIGN OUT", async () => {
    try {
      const auth = await client();
      await auth.signOut();
      renderSignIn();
      status("SIGNED OUT");
    } catch (error) {
      status(error.message, true);
    }
  });
  const recovery = button("CREATE / REPLACE BACKUP CODES", async () => {
    try {
      status("CREATING SECURE BACKUP CODES...");
      const result = await request("/api/player/recovery-codes", { method: "POST", body: "{}" });
      showRecoveryCodes(result.codes, user);
    } catch (error) {
      status(error.message, true);
    }
  });
  const inbox = button("OPEN MY CITY INBOX", showInbox);
  panel.append(heading, name, email, note, recovery, inbox, signOut);
  status("ACCOUNT CONNECTED");
}

function renderSignIn() {
  const panel = overlay?.querySelector("[data-account-content]");
  if (!panel) return;
  panel.replaceChildren();

  const intro = document.createElement("p");
  intro.textContent = "Create your LAMBO CITY identity with your email and a passkey saved by your device. No traditional password is required.";
  intro.style.cssText = "font-size:12px;line-height:1.6;color:#c6c0b4;margin:0 0 14px;";

  const username = input("Choose a username (3–20 characters)");
  const email = input("Your email address", "email");
  const code = input("6-digit email code");
  code.inputMode = "numeric";
  code.maxLength = 6;
  code.style.display = "none";

  const verify = button("VERIFY EMAIL & CREATE PASSKEY", async () => {
    const cleanName = username.value.trim();
    const cleanEmail = email.value.trim().toLowerCase();
    const otp = code.value.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanName)) {
      status("Choose a username with 3–20 letters, numbers, or underscores.", true);
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      status("Enter the 6-digit code from your email.", true);
      return;
    }
    try {
      status("VERIFYING YOUR EMAIL...");
      const auth = await client();
      const signedIn = await auth.signIn.emailOtp({ email: cleanEmail, otp, name: cleanName });
      if (signedIn.error) throw new Error(signedIn.error.message || "Email verification failed.");

      status("FOLLOW THE PASSKEY PROMPT ON YOUR DEVICE...");
      const registered = await auth.passkey.addPasskey({ name: "LAMBO CITY Passkey" });
      if (registered.error) throw new Error(registered.error.message || "Passkey setup was not completed.");

      await request("/api/player/profile", {
        method: "PUT",
        body: JSON.stringify({ username: cleanName, avatarImages: [], bio: "" })
      });
      const session = await auth.getSession();
      const currentUser = session.data?.user || signedIn.data?.user || { name: cleanName, email: cleanEmail };
      const recovery = await request("/api/player/recovery-codes", { method: "POST", body: "{}" });
      showRecoveryCodes(recovery.codes, currentUser);
    } catch (error) {
      status(error.message, true);
    }
  }, true);
  verify.style.display = "none";

  const send = button("SEND EMAIL CODE", async () => {
    const cleanName = username.value.trim();
    const cleanEmail = email.value.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanName)) {
      status("Choose a username with 3–20 letters, numbers, or underscores.", true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      status("Enter a valid email address.", true);
      return;
    }
    try {
      status("SENDING YOUR SECURE CODE...");
      const auth = await client();
      const sent = await auth.emailOtp.sendVerificationOtp({ email: cleanEmail, type: "sign-in" });
      if (sent.error) throw new Error(sent.error.message || "The email code could not be sent.");
      code.style.display = "block";
      verify.style.display = "block";
      status("Check your email. Your code is valid for five minutes.");
    } catch (error) {
      status(error.message, true);
    }
  }, true);

  const recoveryDivider = document.createElement("div");
  recoveryDivider.textContent = "LOST ACCESS TO YOUR PASSKEY?";
  recoveryDivider.style.cssText = "text-align:center;color:#8e887e;font-size:9px;letter-spacing:1.5px;margin:18px 0 10px;";
  const recoveryEmail = input("Account email for recovery", "email");
  const recoveryCode = input("12-character backup code");
  recoveryCode.maxLength = 12;
  const recoverButton = button("RECOVER ACCOUNT & ADD NEW PASSKEY", async () => {
    const cleanEmail = recoveryEmail.value.trim().toLowerCase();
    const cleanCode = recoveryCode.value.trim().toUpperCase();
    if (!cleanEmail || !/^[A-F0-9]{12}$/.test(cleanCode)) {
      status("Enter your account email and one unused 12-character backup code.", true);
      return;
    }
    try {
      status("VERIFYING YOUR BACKUP CODE...");
      const recovery = await request("/api/player/recover", {
        method: "POST",
        body: JSON.stringify({ email: cleanEmail, code: cleanCode })
      });
      const auth = await client();
      status("CREATE A NEW PASSKEY ON THIS DEVICE...");
      const registered = await auth.passkey.addPasskey({
        name: "Recovered LAMBO CITY Passkey",
        context: recovery.context,
        createSession: true
      });
      if (registered.error) throw new Error(registered.error.message || "A new passkey could not be created.");
      const session = await auth.getSession();
      if (!session.data?.user) throw new Error("The new passkey was created, but your account session could not be restored.");
      const newCodes = await request("/api/player/recovery-codes", { method: "POST", body: "{}" });
      showRecoveryCodes(newCodes.codes, session.data.user);
    } catch (error) {
      status(error.message, true);
    }
  });

  const divider = document.createElement("div");
  divider.textContent = "ALREADY HAVE AN ACCOUNT?";
  divider.style.cssText = "text-align:center;color:#8e887e;font-size:9px;letter-spacing:1.5px;margin:18px 0 10px;";

  const passkeyLogin = button("SIGN IN WITH PASSKEY", async () => {
    try {
      status("FOLLOW THE PASSKEY PROMPT ON YOUR DEVICE...");
      const auth = await client();
      const result = await auth.signIn.passkey();
      if (result.error) throw new Error(result.error.message || "Passkey sign-in failed.");
      const session = await auth.getSession();
      if (!session.data?.user) throw new Error("Your account session could not be loaded.");
      showSignedIn(session.data.user);
    } catch (error) {
      status(error.message, true);
    }
  });

  panel.append(intro, username, email, send, code, verify, divider, passkeyLogin, recoveryDivider, recoveryEmail, recoveryCode, recoverButton);
}

function open() {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.id = "lambo-player-account-modal";
  overlay.style.cssText = "position:fixed;inset:0;z-index:10000;background:rgba(3,2,8,.82);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Arial,sans-serif;backdrop-filter:blur(8px);";

  const card = document.createElement("div");
  card.style.cssText = "width:min(420px,100%);max-height:90vh;overflow:auto;background:linear-gradient(160deg,#171020,#08060d);border:1px solid rgba(218,190,130,.55);border-radius:20px;padding:22px;box-shadow:0 20px 80px rgba(0,0,0,.6);box-sizing:border-box;";
  const header = document.createElement("div");
  header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;";
  const brand = document.createElement("div");
  brand.innerHTML = '<div style="color:#e4c47f;font-size:10px;letter-spacing:3px">LAMBO CITY RECORDS</div><div style="color:#fff;font-size:20px;font-weight:700;margin-top:5px">PLAYER ACCOUNT</div>';
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.style.cssText = "border:0;background:transparent;color:#bfb7aa;font-size:24px;padding:6px;cursor:pointer;";
  closeButton.addEventListener("click", close);
  header.append(brand, closeButton);

  const panel = document.createElement("div");
  panel.dataset.accountContent = "true";
  statusLine = document.createElement("div");
  statusLine.style.cssText = "min-height:18px;margin-top:16px;font-size:11px;line-height:1.5;color:#ddc78f;";
  card.append(header, panel, statusLine);
  overlay.appendChild(card);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) close();
  });
  document.body.appendChild(overlay);

  client()
    .then(auth => auth.getSession())
    .then(result => result.data?.user ? showSignedIn(result.data.user) : renderSignIn())
    .catch(() => renderSignIn());
}

export default {
  init() {
    window.addEventListener("lc-open-player-account", open);
    window.addEventListener("lc-hero-invitation-updated", () => {
      syncHeroInvitation().catch(() => {});
    });
    window.addEventListener("keydown", event => {
      if (event.key === "Escape") close();
    });
  }
};
