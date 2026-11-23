import assert from "node:assert/strict";
import test from "node:test";
import PlayerProgression from "../../playerProgression.js";

test("HERO's invitation unlocks when the performance begins, without requiring the player to stay for the full show", () => {
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
      systems: { heroPerformance: { getState: () => "WAITING_FOR_AUDIO" } }
    });
    assert.equal(PlayerProgression.isStudioInvitationUnlocked(), false);

    PlayerProgression.update(0, {
      systems: { heroPerformance: { getState: () => "ENTERING" } }
    });

    assert.equal(PlayerProgression.isStudioInvitationUnlocked(), true);
    assert.equal(PlayerProgression.getSnapshot().title, "CHECK YOUR CITY PHONE");
    assert.equal(globalThis.window.__lamboCityStudioInvitationUnlocked, true);
    assert.equal(globalThis.window.__lamboCityProgressionState.heroPerformanceComplete, false);
    assert.ok(events.some(event => event.type === "lc-studio-invitation-unlocked"));
    assert.ok(storage.has("lambocity-player-progression-v1"));

    PlayerProgression.update(0, {
      systems: { heroPerformance: { getState: () => "COMPLETE" } }
    });
    assert.equal(globalThis.window.__lamboCityProgressionState.heroPerformanceComplete, true);

    PlayerProgression.init();
    assert.equal(PlayerProgression.isStudioInvitationUnlocked(), true);
    assert.equal(PlayerProgression.getSnapshot().stage, "studio-invitation");
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
