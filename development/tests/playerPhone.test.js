import assert from "node:assert/strict";
import test from "node:test";
import PlayerPhone from "../../playerPhone.js";

test("player phone stores, deduplicates, and marks messages read", () => {
  const previousWindow = globalThis.window;
  const storage = new Map();
  const events = [];
  globalThis.window = {
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); }
    },
    addEventListener() {},
    dispatchEvent(event) { events.push(event); return true; }
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
    PlayerPhone.markAllRead();
    assert.equal(PlayerPhone.getMessages()[0].unread, false);
    assert.ok(storage.has("lambocity-player-phone-v1"));
    assert.ok(events.some(event => event.type === "lc-phone-messages-update"));
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
