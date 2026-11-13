import assert from "node:assert/strict";
import Engine from "../engine.js";

const engine = new Engine();
let coreInitCount = 0;
let coreUpdateCount = 0;
let lateInitCount = 0;
let lateUpdateCount = 0;

const coreSystem = {
  init() {
    coreInitCount++;
    return "core-ready";
  },
  update() {
    coreUpdateCount++;
  }
};

engine.registerSystems({ coreSystem });
engine.scene = { id: "live-scene" };
engine.context.scene = engine.scene;
engine.context.systems = engine.systems;

assert.equal(engine.initSystem("coreSystem"), "core-ready");
assert.equal(coreInitCount, 1);

const lateSystem = {
  init(scene, context) {
    lateInitCount++;
    assert.equal(scene, engine.scene, "late systems receive the live scene");
    assert.equal(context, engine.context, "late systems receive the live context");
    assert.ok(context.systems.coreSystem, "late registration must preserve existing systems");
    return "late-ready";
  },
  update() {
    lateUpdateCount++;
  }
};

engine.registerSystems({ lateSystem });

assert.ok(engine.systems.coreSystem, "registerSystems must merge instead of replacing the world registry");
assert.ok(engine.systems.lateSystem, "late systems must be added to the live registry");
assert.equal(engine.context.systems, engine.systems,
  "the live context must retain the current registry object");

assert.equal(await engine.initSystem("lateSystem"), "late-ready");
await engine.initSystem("lateSystem");
assert.equal(lateInitCount, 1, "a streamed system must initialize only once");

engine.update(1 / 60);
assert.equal(coreUpdateCount, 1, "the original world must keep updating after late registration");
assert.equal(lateUpdateCount, 1, "the newly loaded system must join the live update loop");

console.log("PASS: engine registry merge, one-time dynamic initialization, and live update loop");
