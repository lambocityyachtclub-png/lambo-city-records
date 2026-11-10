import assert from "node:assert/strict";
import { createRecordingStartCoordinator } from "../studioRecordingStartCoordinator.js";

const timers = new Map();
let nextTimerId = 0;
const coordinator = createRecordingStartCoordinator({
  setTimeout(callback, delay) {
    const id = ++nextTimerId;
    timers.set(id, { callback, delay });
    return id;
  },
  clearTimeout(id) {
    timers.delete(id);
  }
});

const firstToken = coordinator.begin();
assert.ok(firstToken);
assert.equal(coordinator.isPending(), true);
const firstWait = coordinator.wait(firstToken, 60000);
assert.equal(timers.size, 1);

assert.equal(coordinator.cancel(firstToken), true);
assert.equal(coordinator.isCurrent(firstToken), false);
assert.equal(timers.size, 0, "cancellation must clear the pending count-in timer");
assert.equal(coordinator.begin(), null, "a replacement attempt must wait for cancelled cleanup");
assert.equal(await firstWait, false, "cancelled wait must resolve immediately as inactive");
assert.equal(coordinator.cancel(firstToken), false, "a cancelled attempt cannot be cancelled twice");
assert.equal(coordinator.finish(firstToken), true);
assert.equal(coordinator.isPending(), false);

const secondToken = coordinator.begin();
assert.ok(secondToken);
assert.notEqual(secondToken, firstToken, "a fresh attempt receives a new generation");
const secondWait = coordinator.wait(secondToken, 250);
const scheduled = [...timers.values()][0];
assert.equal(scheduled.delay, 250);
scheduled.callback();
assert.equal(await secondWait, true, "a current attempt remains active after its count-in beat");
assert.equal(coordinator.finish(secondToken), true);
assert.equal(coordinator.isPending(), false);

console.log("Studio recording start serialization and cancel/restart checks passed.");
