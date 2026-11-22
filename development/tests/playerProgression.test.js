import assert from "node:assert/strict";
import test from "node:test";
import PlayerProgression from "../../playerProgression.js";

test("first-visit progression unlocks and persists the Studio invitation after HERO completes the existing performance", () => {
  const previousWindow = globalThis.window;
  const storage = new Map();
  const events = [];

  globalThis.window = {
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); }
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    }
  };

  try {
    PlayerProgression.init();
    assert.equal(PlayerProgression.getSnapshot().stage, "reach-stage");

    PlayerProgression.update(0, {
      systems: { heroPerformance: { getState: () => "PERFORMING" } }
    });
    assert.equal(PlayerProgression.getSnapshot().stage, "hero-performance");

    PlayerProgression.update(0, {
      systems: { heroPerformance: { getState: () => "COMPLETE" } }
    });

    assert.equal(PlayerProgression.isStudioInvitationUnlocked(), true);
    assert.equal(PlayerProgression.getSnapshot().stage, "studio-invitation");
    assert.equal(globalThis.window.__lamboCityStudioInvitationUnlocked, true);
    assert.equal(globalThis.window.__lamboCityProgressionState.heroPerformanceComplete, true);
    assert.ok(events.some(event => event.type === "lc-studio-invitation-unlocked"));
    assert.ok(storage.has("lambocity-player-progression-v1"));

    PlayerProgression.init();
    assert.equal(PlayerProgression.getSnapshot().stage, "studio-invitation");
    assert.equal(PlayerProgression.isStudioInvitationUnlocked(), true);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
