import assert from "node:assert/strict";
import { createPhoneFloorNavigator } from "../floor2PhoneNavigation.js";

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// Returning visitor: lazy-load the session, then enter the cockpit directly.
{
  let directReady = false;
  let directCalls = 0;
  const selected = [];
  const navigate = createPhoneFloorNavigator({
    isFloor2Discovered: () => true,
    hasDirectEntry: () => directReady,
    enterDirect: () => {
      directCalls += 1;
      return directReady;
    },
    getPrepareFloor: () => async floor => {
      assert.equal(floor, 2);
      await Promise.resolve();
      directReady = true;
    },
    selectFloor: floor => selected.push(floor)
  });

  assert.equal(navigate(2), true);
  await flush();
  assert.equal(directCalls, 1);
  assert.deepEqual(selected, []);
}

// A failed preload safely falls back to the normal elevator route.
{
  const selected = [];
  let reportedError = false;
  const navigate = createPhoneFloorNavigator({
    isFloor2Discovered: () => true,
    hasDirectEntry: () => false,
    getPrepareFloor: () => async () => {
      throw new Error("simulated module failure");
    },
    selectFloor: floor => selected.push(floor),
    onError: () => { reportedError = true; }
  });

  assert.equal(navigate(2), true);
  await flush();
  assert.equal(reportedError, true);
  assert.deepEqual(selected, [2]);
}

// First visit and other supported floors retain the physical elevator route.
{
  const selected = [];
  let preloadCalls = 0;
  const navigate = createPhoneFloorNavigator({
    isFloor2Discovered: () => false,
    getPrepareFloor: () => async () => { preloadCalls += 1; },
    selectFloor: floor => selected.push(floor)
  });

  assert.equal(navigate(2), true);
  assert.equal(navigate(3), true);
  assert.deepEqual(selected, [2, 3]);
  assert.equal(preloadCalls, 0);
}

// An already-loaded session uses the immediate direct-entry path.
{
  let directCalls = 0;
  const navigate = createPhoneFloorNavigator({
    isFloor2Discovered: () => true,
    hasDirectEntry: () => true,
    enterDirect: () => { directCalls += 1; return true; }
  });

  assert.equal(navigate(2), true);
  assert.equal(directCalls, 1);
}

// Busy elevator/landing state rejects navigation without side effects.
{
  let selected = false;
  const navigate = createPhoneFloorNavigator({
    isBusy: () => true,
    selectFloor: () => { selected = true; }
  });

  assert.equal(navigate(2), false);
  assert.equal(selected, false);
}

console.log("PASS: Floor 2 phone navigation regression checks");
