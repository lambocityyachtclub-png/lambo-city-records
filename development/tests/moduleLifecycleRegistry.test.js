import test from "node:test";
import assert from "node:assert/strict";
import { createEngineModuleRegistry } from "../engine/moduleLifecycleRegistry.js";

test("registry initializes modules in dependency order", async () => {
  const events = [];
  const registry = createEngineModuleRegistry();
  registry.register({ id: "studio", dependencies: ["audio"], module: { init: () => events.push("studio:init") } });
  registry.register({ id: "audio", module: { init: () => events.push("audio:init") } });
  assert.deepEqual(registry.resolveOrder(), ["audio", "studio"]);
  await registry.initializeAll({});
  assert.deepEqual(events, ["audio:init", "studio:init"]);
});

test("registry updates initialized modules and disposes in reverse order", async () => {
  const events = [];
  const registry = createEngineModuleRegistry();
  registry.register({ id: "core", module: {
    init: () => events.push("core:init"),
    update: () => events.push("core:update"),
    dispose: () => events.push("core:dispose")
  }});
  registry.register({ id: "feature", dependencies: ["core"], module: {
    init: () => events.push("feature:init"),
    update: () => events.push("feature:update"),
    dispose: () => events.push("feature:dispose")
  }});
  await registry.initializeAll({});
  await registry.updateAll(0.016, {});
  await registry.disposeAll({});
  assert.deepEqual(events, ["core:init", "feature:init", "core:update", "feature:update", "feature:dispose", "core:dispose"]);
  assert.equal(registry.getSnapshot().state, "idle");
});

test("registry rejects missing dependencies before initialization", async () => {
  let initialized = false;
  const registry = createEngineModuleRegistry();
  registry.register({ id: "feature", dependencies: ["missing"], module: { init: () => { initialized = true; } } });
  await assert.rejects(registry.initializeAll({}), /unavailable/);
  assert.equal(initialized, false);
});

test("registry rejects dependency cycles", () => {
  const registry = createEngineModuleRegistry();
  registry.register({ id: "a", dependencies: ["b"], module: { init() {} } });
  registry.register({ id: "b", dependencies: ["a"], module: { init() {} } });
  assert.throws(() => registry.resolveOrder(), /cycle/);
});

test("registry rolls back initialized modules when a later init fails", async () => {
  const events = [];
  const registry = createEngineModuleRegistry();
  registry.register({ id: "first", module: { init: () => events.push("first:init"), dispose: () => events.push("first:dispose") } });
  registry.register({ id: "second", dependencies: ["first"], module: { init: () => { throw new Error("init failed"); } } });
  await assert.rejects(registry.initializeAll({}), /init failed/);
  assert.deepEqual(events, ["first:init", "first:dispose"]);
  assert.equal(registry.getSnapshot().state, "idle");
});

test("registry rejects duplicate IDs and registration after initialization", async () => {
  const registry = createEngineModuleRegistry();
  const module = { init() {} };
  registry.register({ id: "same", module });
  assert.throws(() => registry.register({ id: "same", module }), /already registered/);
  await registry.initializeAll({});
  assert.throws(() => registry.register({ id: "late", module }), /before initialization/);
});
