import { loadGuestIdentity, saveGuestCompanion } from "./alive/identity/guestIdentity.js";

let panel = null;
let keyHandler = null;

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

function close() {
  if (panel) panel.remove();
  panel = null;
  window.__aliveCompanionPanelOpen = false;
  if (keyHandler) window.removeEventListener("keydown", keyHandler, true);
  keyHandler = null;
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

  panel = make("div", null, document.body);
  panel.id = "alive-companion-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "ALIVE Companion profile");
  panel.style.cssText = "position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(3,5,10,.82);backdrop-filter:blur(9px);font-family:Arial,sans-serif;";

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
  const intro = make("p", "Create and save your personal Companion profile from inside LAMBO CITY.", card);
  intro.style.cssText = "margin:0 0 16px;color:#c5c0c8;font-size:13px;line-height:1.6;";

  const form = make("form", null, card);
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

  const status = make("p", "Saved profiles stay on this device. Cloud accounts and cross-device sync are not connected in this step.", card);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.cssText = "margin:16px 0;color:#c8b98f;font-size:11px;line-height:1.55;";

  const save = make("button", saved ? "SAVE COMPANION CHANGES" : "CREATE MY COMPANION", form);
  save.type = "submit";
  save.style.cssText = "width:100%;min-height:46px;margin-top:8px;border:1px solid #d8b475;border-radius:999px;background:linear-gradient(135deg,#ead39a,#c9a55e);color:#17130b;font-size:10px;font-weight:700;letter-spacing:1.3px;cursor:pointer;";

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      saveGuestCompanion({
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
        personality: { summary: personality.value, traits: saved?.personality?.traits || [] }
      });
      status.textContent = "Your Companion is saved on this device and is now part of your ALIVE profile.";
      status.style.color = "#c8d9ae";
      save.textContent = "SAVE COMPANION CHANGES";
      close();
    } catch (error) {
      status.textContent = error.message || "Your Companion could not be saved in this browser.";
      status.style.color = "#ffaaaa";
    }
  });

  panel.addEventListener("click", event => {
    if (event.target === panel) close();
  });

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
