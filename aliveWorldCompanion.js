import { loadGuestIdentity, saveGuestIdentity, saveGuestCompanion, exportGuestIdentity, importGuestIdentity } from "./alive/identity/guestIdentity.js";

let panel = null;
let keyHandler = null;
let restorePreview = null;
let accountModuleInitialized = false;
let accountConnectedHandler = null;
let accountDisconnectedHandler = null;

async function syncCompanionIdentity(identity) {
  if (!identity?.companion) return false;
  const companion = identity.companion;
  const response = await fetch("/api/alive/identity", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identityId: identity.guestId,
      displayName: companion.displayName,
      characterForm: companion.characterForm,
      appearanceProfile: companion.appearanceProfile,
      personality: companion.personality
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.__aliveAccountConnected = false;
    return false;
  }
  if (!response.ok) throw new Error(payload.error || "Your Companion could not be synced.");
  window.__aliveCloudSyncStatus = "Your Companion is backed up to your LAMBO CITY account.";
  return true;
}

async function reconcileCloudIdentity(statusNode, onRestore) {
  const response = await fetch("/api/alive/identity", {
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  });
  if (response.status === 401) {
    window.__aliveAccountConnected = false;
    return;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Your saved Companion could not be restored.");
  window.__aliveAccountConnected = true;
  const cloud = payload.identity;
  const local = loadGuestIdentity();
  if (cloud?.record) {
    const record = cloud.record;
    const cloudTime = new Date(cloud.updatedAt || record.updatedAt || 0).getTime();
    const localTime = new Date(local?.updatedAt || 0).getTime();
    if (local?.companion && Number.isFinite(localTime) && localTime > cloudTime) {
      const claimed = { ...local, guestId: cloud.identityId, updatedAt: local.updatedAt };
      const normalized = saveGuestIdentity(claimed);
      await syncCompanionIdentity(normalized);
      window.__lamboCityApplyCompanionAppearance?.(normalized.companion);
      onRestore?.(normalized.companion);
    } else {
      const companion = {
        displayName: record.displayName,
        characterForm: record.character?.form || "digital-human",
        appearanceProfile: record.character?.appearanceProfile || {},
        personality: record.personality || { summary: "", traits: [] }
      };
      const restored = saveGuestIdentity({
        schema: "alive-guest-identity",
        schemaVersion: 1,
        guestId: cloud.identityId,
        createdAt: record.createdAt || local?.createdAt || new Date().toISOString(),
        updatedAt: cloud.updatedAt || record.updatedAt || new Date().toISOString(),
        companion
      });
      window.__lamboCityApplyCompanionAppearance?.(restored.companion);
      onRestore?.(restored.companion);
      window.__aliveCloudSyncStatus = "Your Companion has been restored from your account.";
    }
  } else if (local?.companion) {
    await syncCompanionIdentity(local);
  }
  if (statusNode && window.__aliveCloudSyncStatus) {
    statusNode.textContent = window.__aliveCloudSyncStatus;
    statusNode.style.color = "#c8d9ae";
  }
}

async function openPlayerAccount() {
  const module = await import("./playerAccounts.js");
  if (!accountModuleInitialized) {
    module.default.init();
    accountModuleInitialized = true;
  }
  window.dispatchEvent(new Event("lc-open-player-account"));
}

const TRAITS = ["curious","creative","thoughtful","playful","calm","confident","supportive","adventurous","witty","focused"];

const OPTIONS = {
  characterForm: [["digital-human", "Digital human"], ["stylized", "Stylized character"]],
  skinTone: [["porcelain", "Porcelain"], ["light", "Light"], ["medium", "Medium"], ["tan", "Tan"], ["deep", "Deep"]],
  hairStyle: [["short", "Short"], ["curly", "Curly"], ["long", "Long"], ["braids", "Braids"], ["buzz", "Buzz"], ["none", "None"]],
  hairColor: [["black", "Black"], ["brown", "Brown"], ["blonde", "Blonde"], ["auburn", "Auburn"], ["silver", "Silver"]],
  eyeColor: [["brown", "Brown"], ["blue", "Blue"], ["green", "Green"], ["hazel", "Hazel"], ["gray", "Gray"]],
  outfit: [["streetwear", "Streetwear"], ["classic", "Classic"], ["minimal", "Minimal"], ["creative", "Creative"]],
  accentColor: [["gold", "Gold"], ["blue", "Blue"], ["violet", "Violet"], ["silver", "Silver"]]
};

function make(tag, text, parent) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

function close({ restore = true } = {}) {
  if (restore) restorePreview?.();
  restorePreview = null;
  if (panel) panel.remove();
  panel = null;
  window.__aliveCompanionPanelOpen = false;
  if (keyHandler) window.removeEventListener("keydown", keyHandler, true);
  keyHandler = null;
  if (accountConnectedHandler) window.removeEventListener("lc-player-account-connected", accountConnectedHandler);
  if (accountDisconnectedHandler) window.removeEventListener("lc-player-account-disconnected", accountDisconnectedHandler);
  accountConnectedHandler = null;
  accountDisconnectedHandler = null;
}

function addField(parent, labelText, id, options, selected) {
  const label = make("label", labelText, parent);
  label.htmlFor = id;
  label.style.cssText = "display:block;color:#d9d2c5;font-size:10px;letter-spacing:.6px;margin:12px 0 6px;";
  const select = make("select", null, parent);
  select.id = id;
  select.style.cssText = "display:block;width:100%;min-height:42px;box-sizing:border-box;padding:10px 12px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#101117;color:#fff;font:13px Arial,sans-serif;";
  for (const [value, title] of options) {
    const option = make("option", title);
    option.value = value;
    option.selected = value === selected;
    select.appendChild(option);
  }
  return select;
}

function open() {
  if (panel) return;
  let saved = null;
  try { saved = loadGuestIdentity()?.companion || null; } catch {}
  const baseline = saved || {
    displayName: "Companion", characterForm: "digital-human",
    appearanceProfile: { skinTone: "medium", hairStyle: "short", hairColor: "black", eyeColor: "brown", outfit: "streetwear", accentColor: "gold" },
    personality: { summary: "", traits: [] }
  };
  restorePreview = () => {
    const current = loadGuestIdentity()?.companion || baseline;
    window.__lamboCityApplyCompanionAppearance?.(current);
  };

  panel = make("div", null, document.body);
  panel.id = "alive-companion-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "ALIVE Companion profile");
  panel.style.cssText = "position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(3,5,10,.68);backdrop-filter:blur(9px);font-family:Arial,sans-serif;";

  const card = make("section", null, panel);
  card.style.cssText = "width:min(540px,100%);max-height:88vh;overflow:auto;box-sizing:border-box;padding:24px;border:1px solid rgba(220,190,125,.5);border-radius:18px;background:linear-gradient(145deg,#211d18,#080b11);box-shadow:0 24px 90px rgba(0,0,0,.68);color:#f5f0e8;";

  const top = make("div", null, card);
  top.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:14px;";
  const brand = make("div", "LAMBO CITY  /  ALIVE", top);
  brand.style.cssText = "font-size:10px;font-weight:700;letter-spacing:2px;color:#d8b475;";
  const closeButton = make("button", "CLOSE", top);
  closeButton.type = "button";
  closeButton.style.cssText = "min-height:38px;padding:8px 14px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:#111318;color:#fff;font-size:10px;font-weight:700;letter-spacing:1px;";
  closeButton.addEventListener("click", close);

  const title = make("h2", "YOUR ALIVE COMPANION", card);
  title.style.cssText = "margin:24px 0 7px;font-size:25px;letter-spacing:.3px;color:#fff;";
  const intro = make("p", "Create your personal Companion inside LAMBO CITY. Appearance changes preview on your character as you make them.", card);
  intro.style.cssText = "margin:0 0 16px;color:#c5c0c8;font-size:13px;line-height:1.6;";

  const form = make("form", null, card);
  let formTouched = false;
  form.addEventListener("input", () => { formTouched = true; }, { once: true });
  const nameLabel = make("label", "COMPANION NAME", form);
  nameLabel.htmlFor = "alive-companion-name";
  nameLabel.style.cssText = "display:block;margin:12px 0 6px;color:#d9d2c5;font-size:10px;letter-spacing:1px;";
  const name = make("input", null, form);
  name.id = "alive-companion-name";
  name.type = "text";
  name.maxLength = 40;
  name.required = true;
  name.minLength = 2;
  name.autocomplete = "off";
  name.placeholder = "Give your Companion a name";
  name.value = saved?.displayName || "";
  name.style.cssText = "width:100%;min-height:44px;box-sizing:border-box;padding:11px 12px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#101117;color:#fff;font:14px Arial,sans-serif;";

  const grid = make("div", null, form);
  grid.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px;";
  const appearance = saved?.appearanceProfile || {};
  const characterForm = addField(grid, "CHARACTER FORM", "alive-character-form", OPTIONS.characterForm, saved?.characterForm || "digital-human");
  const skinTone = addField(grid, "SKIN TONE", "alive-skin-tone", OPTIONS.skinTone, appearance.skinTone || "medium");
  const hairStyle = addField(grid, "HAIR STYLE", "alive-hair-style", OPTIONS.hairStyle, appearance.hairStyle || "short");
  const hairColor = addField(grid, "HAIR COLOR", "alive-hair-color", OPTIONS.hairColor, appearance.hairColor || "black");
  const eyeColor = addField(grid, "EYE COLOR", "alive-eye-color", OPTIONS.eyeColor, appearance.eyeColor || "brown");
  const outfit = addField(grid, "STYLE DIRECTION", "alive-outfit", OPTIONS.outfit, appearance.outfit || "streetwear");
  const accentColor = addField(grid, "ACCENT COLOR", "alive-accent-color", OPTIONS.accentColor, appearance.accentColor || "gold");

  const personalityLabel = make("label", "PERSONALITY (OPTIONAL)", form);
  personalityLabel.htmlFor = "alive-companion-personality";
  personalityLabel.style.cssText = "display:block;margin:14px 0 6px;color:#d9d2c5;font-size:10px;letter-spacing:1px;";
  const personality = make("textarea", null, form);
  personality.id = "alive-companion-personality";
  personality.maxLength = 240;
  personality.rows = 2;
  personality.value = saved?.personality?.summary || "";
  personality.placeholder = "A few words about your Companion";
  personality.style.cssText = "width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#101117;color:#fff;font:13px Arial,sans-serif;resize:vertical;";

  const traitLabel = make("p", "PERSONALITY TRAITS  ·  CHOOSE UP TO FIVE", form);
  traitLabel.style.cssText = "margin:14px 0 8px;color:#d9d2c5;font-size:10px;letter-spacing:1px;";
  const traitGrid = make("div", null, form);
  traitGrid.style.cssText = "display:flex;flex-wrap:wrap;gap:7px;";
  const selectedTraits = new Set(saved?.personality?.traits || []);
  const traitButtons = new Map();
  const updateTraitButton = (trait, button) => {
    const active = selectedTraits.has(trait);
    button.setAttribute("aria-pressed", String(active));
    button.style.background = active ? "rgba(216,180,117,.22)" : "#101117";
    button.style.borderColor = active ? "#d8b475" : "rgba(255,255,255,.16)";
    button.style.color = active ? "#f0d6a2" : "#d6d2d0";
  };
  for (const trait of TRAITS) {
    const button = make("button", trait, traitGrid);
    button.type = "button";
    button.style.cssText = "min-height:34px;padding:7px 11px;border:1px solid rgba(255,255,255,.16);border-radius:999px;font-size:11px;cursor:pointer;";
    button.addEventListener("click", () => {
      if (selectedTraits.has(trait)) selectedTraits.delete(trait);
      else if (selectedTraits.size < 5) selectedTraits.add(trait);
      else {
        status.textContent = "Choose up to five personality traits.";
        status.style.color = "#e6c98f";
        return;
      }
      updateTraitButton(trait, button);
      status.textContent = "Personality choices update when you save your Companion.";
      status.style.color = "#c8b98f";
    });
    traitButtons.set(trait, button);
    updateTraitButton(trait, button);
  }

  const status = make("p", window.__aliveCloudSyncStatus || "Saved on this device. Connect an account whenever you want secure cross-device Companion sync.", card);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.cssText = "margin:16px 0;color:#c8b98f;font-size:11px;line-height:1.55;";

  const connectAccount = make("button", "CONNECT ACCOUNT  /  SYNC COMPANION", card);
  connectAccount.type = "button";
  connectAccount.style.cssText = "width:100%;min-height:42px;margin:0 0 10px;border:1px solid rgba(220,190,125,.55);border-radius:999px;background:rgba(216,180,117,.12);color:#f0d6a2;font-size:10px;font-weight:700;letter-spacing:.9px;cursor:pointer;";
  connectAccount.addEventListener("click", async () => {
    if (formTouched) {
      status.textContent = "Save or close your Companion edits before connecting your account.";
      status.style.color = "#e6c98f";
      return;
    }
    try {
      await openPlayerAccount();
    } catch (error) {
      status.textContent = error.message || "The account panel could not be opened.";
      status.style.color = "#ffaaaa";
    }
  });

  const backupRow = make("div", null, card);
  backupRow.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0 4px;";
  const exportButton = make("button", "EXPORT PROFILE", backupRow);
  exportButton.type = "button";
  exportButton.style.cssText = "min-height:40px;border:1px solid rgba(220,190,125,.5);border-radius:999px;background:#111318;color:#e7d2a5;font-size:10px;font-weight:700;letter-spacing:.8px;cursor:pointer;";
  const importButton = make("button", "IMPORT BACKUP", backupRow);
  importButton.type = "button";
  importButton.style.cssText = exportButton.style.cssText;
  const importFile = make("input", null, card);
  importFile.type = "file";
  importFile.accept = "application/json,.json";
  importFile.hidden = true;
  exportButton.addEventListener("click", () => {
    try {
      const contents = exportGuestIdentity();
      const blob = new Blob([contents], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = make("a");
      link.href = url;
      link.download = "alive-companion-backup.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      status.textContent = "Your Companion backup has been exported to this device.";
      status.style.color = "#c8d9ae";
    } catch (error) {
      status.textContent = error.message || "Your Companion backup could not be exported.";
      status.style.color = "#ffaaaa";
    }
  });
  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    if (file.size > 24000) {
      status.textContent = "That backup file is too large to import.";
      status.style.color = "#ffaaaa";
      importFile.value = "";
      return;
    }
    if (!window.confirm("Import this ALIVE Companion backup and replace the profile saved on this device?")) {
      importFile.value = "";
      return;
    }
    try {
      const contents = await file.text();
      importGuestIdentity(contents);
      close({ restore: false });
      open();
    } catch (error) {
      status.textContent = error.message || "That Companion backup could not be imported.";
      status.style.color = "#ffaaaa";
    } finally {
      importFile.value = "";
    }
  });

  const preview = () => {
    const draft = {
      displayName: name.value.trim().slice(0, 40) || "Companion",
      characterForm: characterForm.value,
      appearanceProfile: {
        skinTone: skinTone.value, hairStyle: hairStyle.value, hairColor: hairColor.value,
        eyeColor: eyeColor.value, outfit: outfit.value, accentColor: accentColor.value
      },
      personality: { summary: personality.value.slice(0, 240), traits: [...selectedTraits] }
    };
    window.__lamboCityApplyCompanionAppearance?.(draft);
  };
  [characterForm, skinTone, hairStyle, hairColor, eyeColor, outfit, accentColor].forEach(control => {
    control.addEventListener("change", preview);
  });

  const save = make("button", saved ? "SAVE COMPANION CHANGES" : "CREATE MY COMPANION", form);
  save.type = "submit";
  save.style.cssText = "width:100%;min-height:46px;margin-top:8px;border:1px solid #d8b475;border-radius:999px;background:linear-gradient(135deg,#ead39a,#c9a55e);color:#17130b;font-size:10px;font-weight:700;letter-spacing:1.3px;cursor:pointer;";

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const identity = saveGuestCompanion({
        displayName: name.value,
        characterForm: characterForm.value,
        appearanceProfile: {
          skinTone: skinTone.value,
          hairStyle: hairStyle.value,
          hairColor: hairColor.value,
          eyeColor: eyeColor.value,
          outfit: outfit.value,
          accentColor: accentColor.value
        },
        personality: { summary: personality.value, traits: [...selectedTraits] }
      });
      window.__lamboCityApplyCompanionAppearance?.(identity.companion);
      status.textContent = "Your Companion is saved and its supported appearance is applied to your character.";
      status.style.color = "#c8d9ae";
      save.textContent = "SAVE COMPANION CHANGES";
      if (window.__aliveAccountConnected) {
        syncCompanionIdentity(identity).catch(error => {
          window.__aliveCloudSyncStatus = "Saved on this device. Account sync needs another try: " + (error.message || "connection unavailable");
        });
      }
      close({ restore: false });
    } catch (error) {
      status.textContent = error.message || "Your Companion could not be saved in this browser.";
      status.style.color = "#ffaaaa";
    }
  });

  panel.addEventListener("click", event => {
    if (event.target === panel) close();
  });

  const applyRestoredCompanion = companion => {
    if (formTouched) return;
    name.value = companion.displayName;
    characterForm.value = companion.characterForm;
    skinTone.value = companion.appearanceProfile?.skinTone || "medium";
    hairStyle.value = companion.appearanceProfile?.hairStyle || "short";
    hairColor.value = companion.appearanceProfile?.hairColor || "black";
    eyeColor.value = companion.appearanceProfile?.eyeColor || "brown";
    outfit.value = companion.appearanceProfile?.outfit || "streetwear";
    accentColor.value = companion.appearanceProfile?.accentColor || "gold";
    personality.value = companion.personality?.summary || "";
    selectedTraits.clear();
    for (const trait of companion.personality?.traits || []) selectedTraits.add(trait);
    for (const [trait, button] of traitButtons) updateTraitButton(trait, button);
  };
  accountConnectedHandler = () => {
    reconcileCloudIdentity(status, applyRestoredCompanion).catch(error => {
      status.textContent = error.message || "Your Companion could not be synced.";
      status.style.color = "#ffaaaa";
    });
  };
  accountDisconnectedHandler = () => {
    window.__aliveAccountConnected = false;
    status.textContent = "Your Companion remains saved on this device. Connect your account to sync it again.";
    status.style.color = "#c8b98f";
  };
  window.addEventListener("lc-player-account-connected", accountConnectedHandler);
  window.addEventListener("lc-player-account-disconnected", accountDisconnectedHandler);

  window.__aliveCompanionPanelOpen = true;
  const input = window.__lamboCityInput;
  if (input?.keys) {
    input.keys.w = input.keys.a = input.keys.s = input.keys.d = false;
    input.keys.shift = false;
  }
  keyHandler = event => {
    if (event.key === "Escape" && panel) close();
  };
  window.addEventListener("keydown", keyHandler, true);
  name.focus();
}

export default { open, close };
