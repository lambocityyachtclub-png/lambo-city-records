import HeroInvitation from "./heroInvitation.js";

const ACCESS_EVENT = "lc-studio-access-updated";

function removeGate() {
  document.getElementById("lc-studio-access-gate")?.remove();
}

function createGate(onAllowed, ownerConfigured) {
  removeGate();
  const overlay = document.createElement("div");
  overlay.id = "lc-studio-access-gate";
  overlay.style.cssText = "position:fixed;inset:0;z-index:13000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.78);font-family:Arial,sans-serif;";
  overlay.innerHTML = `
    <section style="width:min(390px,100%);padding:25px;border:1px solid rgba(255,215,0,.55);border-radius:20px;background:linear-gradient(160deg,#171020,#08080d);box-shadow:0 18px 60px rgba(0,0,0,.65);color:#fff;">
      <div style="color:#ffd700;font-size:10px;letter-spacing:3px;font-weight:700;">LAMBO CITY RECORDS</div>
      <h2 style="font-size:23px;margin:10px 0 8px;">Studio access</h2>
      <p style="font-size:13px;line-height:1.6;color:#ccc;margin:0 0 18px;">Studio access opens when HERO personally invites you to Records HQ. Keep exploring LAMBO CITY until then.</p>
      <div id="lc-studio-owner-entry" style="display:none;border-top:1px solid rgba(255,255,255,.12);padding-top:15px;margin-top:12px;">
        <div style="font-size:10px;letter-spacing:2px;color:#ffd700;margin-bottom:8px;">CREATOR ACCESS</div>
        <label for="lc-studio-owner-password" style="display:block;font-size:12px;color:#ddd;margin-bottom:7px;">Private owner password</label>
        <input id="lc-studio-owner-password" type="password" autocomplete="current-password" maxlength="512" style="box-sizing:border-box;width:100%;padding:12px;border:1px solid rgba(255,215,0,.4);border-radius:9px;background:#08080c;color:#fff;font-size:15px;">
        <p id="lc-studio-owner-error" style="min-height:18px;color:#ff9b9b;font-size:11px;"></p>
        <button id="lc-studio-owner-submit" type="button" style="width:100%;padding:12px;border:0;border-radius:10px;background:linear-gradient(90deg,#b68a20,#f5d46a);color:#15110a;font-weight:700;cursor:pointer;">UNLOCK CREATOR ACCESS</button>
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;">
        <button id="lc-studio-creator-link" type="button" style="flex:1;padding:11px;border:1px solid rgba(255,215,0,.45);border-radius:10px;background:transparent;color:#f2d47b;font-size:11px;font-weight:700;cursor:pointer;">CREATOR SIGN-IN</button>
        <button id="lc-studio-gate-close" type="button" style="flex:1;padding:11px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.07);color:#fff;font-size:11px;font-weight:700;cursor:pointer;">CLOSE</button>
      </div>
      <p id="lc-studio-owner-config-note" style="display:none;color:#aaa;font-size:10px;line-height:1.5;margin:12px 0 0;">Creator sign-in is not configured on this deployment yet. Your existing project and Studio files have not been changed.</p>
    </section>`;
  document.body.appendChild(overlay);

  overlay.querySelector("#lc-studio-gate-close").addEventListener("click", removeGate);
  overlay.querySelector("#lc-studio-creator-link").addEventListener("click", () => {
    overlay.querySelector("#lc-studio-owner-entry").style.display = "block";
    overlay.querySelector("#lc-studio-owner-password").focus();
    overlay.querySelector("#lc-studio-owner-config-note").style.display = ownerConfigured ? "none" : "block";
  });
  overlay.querySelector("#lc-studio-owner-submit").addEventListener("click", async () => {
    const button = overlay.querySelector("#lc-studio-owner-submit");
    const password = overlay.querySelector("#lc-studio-owner-password").value;
    const error = overlay.querySelector("#lc-studio-owner-error");
    if (!password) {
      error.textContent = "Enter your private owner password.";
      return;
    }
    button.disabled = true;
    button.textContent = "VERIFYING…";
    error.textContent = "";
    try {
      const response = await fetch("/api/alive/session", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.authenticated !== true) {
        throw new Error(result.error || "Creator sign-in could not be verified.");
      }
      removeGate();
      window.dispatchEvent(new CustomEvent(ACCESS_EVENT, { detail: { creator: true } }));
      onAllowed?.();
    } catch (failure) {
      error.textContent = failure.message || "Creator sign-in failed. Try again.";
    } finally {
      if (document.body.contains(button)) {
        button.disabled = false;
        button.textContent = "UNLOCK CREATOR ACCESS";
      }
    }
  });
}

export default {
  async open(onAllowed) {
    let ownerConfigured = false;
    let ownerAuthenticated = false;
    try {
      const response = await fetch("/api/alive/session", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (response.ok) {
        const status = await response.json();
        ownerConfigured = status.configured === true;
        ownerAuthenticated = status.authenticated === true;
      }
    } catch {
      // Visitor invitation remains usable offline; creator can retry sign-in.
    }

    if (ownerAuthenticated || HeroInvitation.get()?.delivered === true) {
      onAllowed?.();
      return true;
    }

    createGate(onAllowed, ownerConfigured);
    return false;
  },

  hasVisitorAccess() {
    return HeroInvitation.get()?.delivered === true;
  }
};
