const STORAGE_KEY = "lambocity-player-phone-v1";
const MAX_MESSAGES = 100;

let messages = [];
let initialized = false;
let invitationHandler = null;
let progressionHandler = null;

function dispatch(name, detail) {
  const target = globalThis.window;
  if (!target?.dispatchEvent) return;
  const event = typeof CustomEvent === "function"
    ? new CustomEvent(name, { detail })
    : { type: name, detail };
  target.dispatchEvent(event);
}

function loadMessages() {
  try {
    const raw = globalThis.window?.localStorage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && typeof item.id === "string" && typeof item.body === "string")
      .slice(-MAX_MESSAGES)
      .map(item => ({ ...item, unread: item.unread === true }));
  } catch {
    return [];
  }
}

function saveMessages() {
  try {
    globalThis.window?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Keep the inbox usable for this session if browser storage is unavailable.
  }
}

function unreadCount() {
  return messages.reduce((count, message) => count + (message.unread ? 1 : 0), 0);
}

function publish() {
  const snapshot = getMessages();
  if (globalThis.window) {
    globalThis.window.__lamboCityPhoneUnreadCount = unreadCount();
  }
  dispatch("lc-phone-messages-update", Object.freeze({
    count: snapshot.length,
    unread: unreadCount(),
    messages: snapshot
  }));
}

function getMessages() {
  return messages.map(message => ({ ...message }));
}

function addMessage(input = {}) {
  const id = String(input.id || "").trim();
  const body = String(input.body || "").trim();
  if (!id || !body || messages.some(message => message.id === id)) return false;

  messages.push({
    id,
    from: String(input.from || "LAMBO CITY").slice(0, 48),
    title: String(input.title || "New message").slice(0, 90),
    body: body.slice(0, 1200),
    category: String(input.category || "message").slice(0, 32),
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : Date.now(),
    unread: true
  });

  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(-MAX_MESSAGES);
  }

  saveMessages();
  publish();
  showNotification(messages[messages.length - 1]);
  return true;
}

function markAllRead() {
  let changed = false;
  messages = messages.map(message => {
    if (!message.unread) return message;
    changed = true;
    return { ...message, unread: false };
  });
  if (changed) {
    saveMessages();
    publish();
  }
}

function showNotification(message) {
  if (typeof document === "undefined" || !document.body) return;

  const old = document.getElementById("lc-phone-notification");
  if (old) old.remove();

  const toast = document.createElement("button");
  toast.id = "lc-phone-notification";
  toast.type = "button";
  toast.setAttribute("aria-label", "Open new message from " + message.from);
  toast.style.cssText = "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9000;width:min(360px,calc(100vw - 28px));padding:12px 15px;border:1px solid rgba(230,187,105,.65);border-radius:14px;background:linear-gradient(135deg,rgba(12,10,18,.97),rgba(35,19,48,.97));color:#fff;text-align:left;font:12px Arial,sans-serif;box-shadow:0 12px 38px rgba(0,0,0,.45);cursor:pointer;pointer-events:auto;";
  const label = document.createElement("span");
  label.textContent = "LAMBO CITY PHONE  ·  NEW MESSAGE";
  label.style.cssText = "display:block;color:#e6bb69;font-size:9px;letter-spacing:1.5px;margin-bottom:5px;";
  const sender = document.createElement("strong");
  sender.textContent = message.from + ": " + message.title;
  sender.style.cssText = "display:block;font-size:12px;margin-bottom:3px;";
  const preview = document.createElement("span");
  preview.textContent = message.body;
  preview.style.cssText = "display:block;color:#d4d0d8;line-height:1.45;";
  toast.append(label, sender, preview);
  toast.addEventListener("click", () => {
    const phone = document.getElementById("phone-ui");
    if (phone) openInbox(phone);
    else globalThis.window?.__lamboCityInput?._togglePhone?.();
    toast.remove();
  });
  document.body.appendChild(toast);

  if (typeof globalThis.navigator?.vibrate === "function") {
    try { globalThis.navigator.vibrate(70); } catch {}
  }

  globalThis.setTimeout?.(() => {
    if (toast.isConnected) toast.remove();
  }, 6500);
}

function updatePhoneBadge(phone) {
  const tile = phone?.querySelector?.("#lambo-phone-messages");
  if (!tile) return;
  const badge = tile.querySelector("[data-phone-unread]");
  const count = unreadCount();
  if (badge) {
    badge.textContent = count > 0 ? String(count) : "";
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }
}

function openInbox(phone) {
  if (!phone) return;
  const existing = phone.querySelector("#lambo-phone-inbox");
  if (existing) return;

  phone.querySelectorAll('div[style*="grid-template-columns"]').forEach(grid => {
    grid.style.display = "none";
  });

  const panel = document.createElement("section");
  panel.id = "lambo-phone-inbox";
  panel.style.cssText = "margin:10px 14px 14px;padding:12px;border:1px solid rgba(230,187,105,.35);border-radius:14px;background:rgba(4,5,12,.96);max-height:310px;overflow:auto;color:#fff;font-family:Arial,sans-serif;";

  const top = document.createElement("div");
  top.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;";
  const heading = document.createElement("strong");
  heading.textContent = "MESSAGES";
  heading.style.cssText = "color:#e6bb69;font-size:11px;letter-spacing:2px;";
  const back = document.createElement("button");
  back.type = "button";
  back.textContent = "BACK";
  back.style.cssText = "border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07);color:#fff;padding:5px 12px;font-size:9px;letter-spacing:1px;";
  back.addEventListener("click", () => {
    panel.remove();
    phone.querySelectorAll('div[style*="grid-template-columns"]').forEach(grid => {
      grid.style.display = "grid";
    });
    updatePhoneBadge(phone);
  });
  top.append(heading, back);
  panel.appendChild(top);

  if (messages.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your LAMBO CITY messages will show up here.";
    empty.style.cssText = "padding:18px 8px;color:#aaa;font-size:11px;line-height:1.5;text-align:center;";
    panel.appendChild(empty);
  } else {
    [...messages].reverse().forEach(message => {
      const card = document.createElement("article");
      card.style.cssText = "padding:10px;margin:0 0 8px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.035);";
      const sender = document.createElement("div");
      sender.textContent = message.from + (message.unread ? "  ·  NEW" : "");
      sender.style.cssText = "color:#e6bb69;font-size:9px;letter-spacing:1px;margin-bottom:5px;";
      const title = document.createElement("strong");
      title.textContent = message.title;
      title.style.cssText = "display:block;font-size:12px;margin-bottom:5px;";
      const body = document.createElement("p");
      body.textContent = message.body;
      body.style.cssText = "color:#d0ccd4;font-size:11px;line-height:1.55;white-space:pre-wrap;";
      const date = document.createElement("div");
      date.textContent = new Date(message.createdAt).toLocaleString();
      date.style.cssText = "color:#777;font-size:8px;margin-top:8px;";
      card.append(sender, title, body, date);
      panel.appendChild(card);
    });
  }

  const footer = phone.querySelector("#lambo-phone-close")?.parentElement;
  phone.insertBefore(panel, footer || null);
  markAllRead();
  updatePhoneBadge(phone);
}

function mount(phone) {
  if (!phone || phone.querySelector("#lambo-phone-messages")) return;

  const grids = [...phone.querySelectorAll('div[style*="grid-template-columns"]')];
  const appGrid = grids[grids.length - 1];
  if (!appGrid) return;

  const tile = document.createElement("button");
  tile.id = "lambo-phone-messages";
  tile.type = "button";
  tile.style.cssText = "position:relative;min-height:68px;border:1px solid rgba(230,187,105,.55);border-radius:14px;background:linear-gradient(145deg,rgba(230,187,105,.16),rgba(153,0,255,.12));color:#fff;text-align:center;cursor:pointer;padding:10px 6px;font:700 9px Arial,sans-serif;letter-spacing:1px;";
  const glyph = document.createElement("span");
  glyph.textContent = "✉";
  glyph.style.cssText = "display:block;font-size:22px;margin-bottom:5px;";
  const name = document.createElement("span");
  name.textContent = "MESSAGES";
  const badge = document.createElement("span");
  badge.dataset.phoneUnread = "true";
  badge.style.cssText = "position:absolute;top:5px;right:7px;min-width:16px;height:16px;display:none;align-items:center;justify-content:center;padding:0 4px;border-radius:10px;background:#e6bb69;color:#151018;font-size:9px;";
  tile.append(glyph, name, badge);
  tile.addEventListener("click", () => openInbox(phone));
  appGrid.appendChild(tile);
  updatePhoneBadge(phone);
}

const PlayerPhone = {
  init() {
    if (initialized) return;
    initialized = true;
    messages = loadMessages();

    invitationHandler = () => {
      addMessage({
        id: "hero-studio-invitation-v1",
        from: "HERO",
        title: "You got my attention",
        category: "milestone",
        body: "What's up? You caught the show. Whenever you're ready, come find me at Records HQ. Take the elevator up to Floor Two and check out the Studio. I'll see you up there."
      });
    };

    progressionHandler = event => {
      if (event.detail?.studioInvitationUnlocked === true) invitationHandler();
    };

    globalThis.window?.addEventListener?.("lc-studio-invitation-unlocked", invitationHandler);
    globalThis.window?.addEventListener?.("lc-progression-update", progressionHandler);

    if (globalThis.window?.__lamboCityProgressionState?.studioInvitationUnlocked) {
      invitationHandler();
    }

    globalThis.window.__lamboCityPlayerPhone = {
      getMessages,
      addMessage,
      sendMessage: addMessage,
      markAllRead,
      mount,
      openInbox: () => openInbox(document.getElementById("phone-ui"))
    };

    publish();
  },

  getMessages,
  addMessage,
  sendMessage: addMessage,
  markAllRead,
  mount,
  openInbox: () => openInbox(document.getElementById("phone-ui")),
  update() {}
};

export default PlayerPhone;
