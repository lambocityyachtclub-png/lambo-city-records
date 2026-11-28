import test from "node:test";
import assert from "node:assert/strict";
import {
  FOUNDERS_WELCOME_STORAGE_KEY,
  hasCompletedFoundersWelcome,
  markFoundersWelcomeComplete
} from "../../foundersRoom.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("first visit is eligible for the welcome guide", () => {
  assert.equal(hasCompletedFoundersWelcome(memoryStorage()), false);
});

test("completed welcome guide is remembered in the same browser storage", () => {
  const storage = memoryStorage();
  assert.equal(markFoundersWelcomeComplete(storage), true);
  assert.equal(storage.getItem(FOUNDERS_WELCOME_STORAGE_KEY), "complete");
  assert.equal(hasCompletedFoundersWelcome(storage), true);
});

test("unavailable storage does not crash the welcome state helpers", () => {
  const brokenStorage = {
    getItem() { throw new Error("storage blocked"); },
    setItem() { throw new Error("storage blocked"); }
  };
  assert.equal(hasCompletedFoundersWelcome(brokenStorage), false);
  assert.equal(markFoundersWelcomeComplete(brokenStorage), false);
});
