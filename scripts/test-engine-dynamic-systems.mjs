import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Engine from "../engine.js";

const engineSource = await readFile(new URL("../engine.js", import.meta.url), "utf8");
assert.match(engineSource, /const delta = Math\.min\([\s\S]*?0\.1\s*\)/,
  "The world simulation must not be capped to 33ms frames, which causes slow motion on slower devices.");

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

const explicitArgSystem = {
  init(scene, context) {
    assert.equal(scene, engine.scene, "systems initialized with an explicit scene still receive it first");
    assert.equal(context, engine.context, "systems initialized with an explicit scene must also receive shared context");
    return "explicit-args-ready";
  }
};
engine.registerSystems({ explicitArgSystem });
assert.equal(engine.initSystem("explicitArgSystem", engine.scene), "explicit-args-ready",
  "an explicit scene argument must not suppress the shared context");

assert.equal(await engine.initSystem("lateSystem"), "late-ready");
await engine.initSystem("lateSystem");
assert.equal(lateInitCount, 1, "a streamed system must initialize only once");

engine.update(1 / 60);
assert.equal(coreUpdateCount, 1, "the original world must keep updating after late registration");
assert.equal(lateUpdateCount, 1, "the newly loaded system must join the live update loop");

let finishAsyncInit;
let asyncUpdateCount = 0;
const asyncSystem = {
  init() {
    return new Promise(resolve => { finishAsyncInit = resolve; });
  },
  update() {
    asyncUpdateCount++;
  }
};
engine.registerSystems({ asyncSystem });
const asyncInit = engine.initSystem("asyncSystem", engine.scene);
engine.update(1 / 60);
assert.equal(asyncUpdateCount, 0, "a streamed system must not update before async initialization finishes");
finishAsyncInit("async-ready");
assert.equal(await asyncInit, "async-ready");
engine.update(1 / 60);
assert.equal(asyncUpdateCount, 1, "a streamed system must join updates after async initialization finishes");

let failedUpdateCount = 0;
engine.registerSystems({
  failedInitSystem: {
    init() { throw new Error("expected init failure"); },
    update() { failedUpdateCount++; }
  }
});
engine.initSystem("failedInitSystem", engine.scene);
engine.update(1 / 60);
assert.equal(failedUpdateCount, 0, "a system whose init failed must never receive updates");
assert.ok(engine.failedSystems.has("failedInitSystem"), "init failures must be recorded by the engine");

console.log("PASS: dynamic registry merge, shared context, async init gating, and live update loop");
