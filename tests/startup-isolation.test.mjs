import test from "node:test";
import assert from "node:assert/strict";
import Engine from "../engine.js";

test("one feature init failure does not block later systems or the render loop", () => {
  globalThis.window = {};
  globalThis.requestAnimationFrame = () => 1;

  let healthyInit = 0;
  let renders = 0;
  const engine = new Engine();

  engine.registerSystems({
    scene: { init: () => ({}) },
    camera: { init: () => ({}) },
    renderer: { init: () => ({ render: () => { renders += 1; } }) },
    world: { init() { throw new Error("expected init failure"); } },
    healthyFeature: { init() { healthyInit += 1; } }
  });

  engine.init();

  assert.equal(healthyInit, 1);
  assert.equal(renders, 1);
  assert.equal(window.__lamboCityStartupErrors.length, 1);
  assert.equal(window.__lamboCityStartupErrors[0].system, "world");
  assert.equal(window.__lamboCityStartupErrors[0].phase, "init");
});

test("one feature update failure does not block other updates or later frames", () => {
  globalThis.window = {};
  globalThis.requestAnimationFrame = () => 1;

  let healthyUpdates = 0;
  const engine = new Engine();

  engine.registerSystems({
    scene: { init: () => ({}) },
    camera: { init: () => ({}) },
    renderer: { init: () => ({ render() {} }) },
    brokenFeature: { update() { throw new Error("expected update failure"); } },
    healthyFeature: { update() { healthyUpdates += 1; } }
  });

  engine.scene = {};
  engine.camera = {};
  engine.renderer = { render() {} };
  engine.update(0.016);
  engine.update(0.016);

  assert.equal(healthyUpdates, 2);
  assert.equal(
    window.__lamboCityStartupErrors.filter(error => error.system === "brokenFeature").length,
    1
  );
});
