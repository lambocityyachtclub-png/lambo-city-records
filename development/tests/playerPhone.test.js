import assert from "node:assert/strict";
import test from "node:test";
import PlayerPhone from "../../playerPhone.js";

test("player phone stores, deduplicates, and marks messages read", () => {
  const previousWindow = globalThis.window;
  const storage = new Map();
  const events = [];
  const listeners = new Map();
  globalThis.window = {
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); }
    },
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(callback);
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    }
  };

  try {
    PlayerPhone.init();
    assert.equal(PlayerPhone.sendMessage({
      id: "test-message",
      from: "HERO",
      title: "Welcome",
      body: "Meet me at Records HQ."
    }), true);
    assert.equal(PlayerPhone.sendMessage({
      id: "test-message",
      from: "HERO",
      title: "Welcome",
      body: "Duplicate should not be stored."
    }), false);
    assert.equal(PlayerPhone.getMessages().length, 1);
    assert.equal(PlayerPhone.getMessages()[0].unread, true);

    for (const callback of listeners.get("lc-studio-invitation-unlocked") || []) {
      callback({ type: "lc-studio-invitation-unlocked", detail: { milestone: "studio-invitation" } });
    }
    const heroMessage = PlayerPhone.getMessages().find(message => message.id === "hero-studio-invitation-v1");
    assert.ok(heroMessage);
    assert.match(heroMessage.body, /Records HQ/);
    assert.equal(PlayerPhone.getMessages().length, 2);

    PlayerPhone.markAllRead();
    assert.ok(PlayerPhone.getMessages().every(message => message.unread === false));
    assert.ok(storage.has("lambocity-player-phone-v1"));
    assert.ok(events.some(event => event.type === "lc-phone-messages-update"));
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
