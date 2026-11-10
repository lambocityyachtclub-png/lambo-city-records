import assert from "node:assert/strict";
import { createWorldSystemHost } from "../worldSystemHost.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fakeRuntime(gate) {
  return {
    ready: false,
    disposed: false,
    async init() {
      await gate.promise;
      this.ready = true;
    },
    dispose() {
      this.disposed = true;
      this.ready = false;
    }
  };
}

const scene = { add() {} };

// A cancelled in-flight initialization must never publish a stale runtime.
{
  const gate = deferred();
  let runtime;
  const host = createWorldSystemHost({
    createRuntime() {
      runtime = fakeRuntime(gate);
      return runtime;
    }
  });
  host.init(scene);
  const pending = host.initialize();
  host.dispose();
  gate.resolve();
  await assert.rejects(pending, /initialization was cancelled/);
  assert.equal(runtime.disposed, true);
  assert.equal(host.isReady(), false);
  assert.equal(host.getRuntime(), null);
}

// A stale initialization's finally/catch handlers must not clear a newer run.
{
  const firstGate = deferred();
  const secondGate = deferred();
  const runtimes = [];
  const host = createWorldSystemHost({
    createRuntime() {
      const runtime = fakeRuntime(runtimes.length === 0 ? firstGate : secondGate);
      runtimes.push(runtime);
      return runtime;
    }
  });
  host.init(scene);
  const first = host.initialize();
  host.dispose();
  const second = host.initialize();
  assert.equal(runtimes.length, 2);
  secondGate.resolve();
  const readyRuntime = await second;
  assert.equal(host.getRuntime(), readyRuntime);
  assert.equal(host.isReady(), true);
  firstGate.resolve();
  await assert.rejects(first, /initialization was cancelled/);
  assert.equal(runtimes[0].disposed, true);
  assert.equal(host.getRuntime(), runtimes[1]);
  assert.equal(host.isReady(), true);
}

// Repeated callers share the same in-flight initialization.
{
  const gate = deferred();
  const host = createWorldSystemHost({ createRuntime: () => fakeRuntime(gate) });
  host.init(scene);
  const first = host.initialize();
  const second = host.initialize();
  assert.equal(first, second);
  gate.resolve();
  await first;
  assert.equal(host.isReady(), true);
  host.dispose();
  assert.equal(host.isReady(), false);
}


{
  let disposed = false;
  const host = createWorldSystemHost({
    createRuntime: () => ({
      init() { throw new Error("synchronous initialization failure"); },
      dispose() { disposed = true; }
    })
  });
  host.init(scene);
  await assert.rejects(host.initialize(), /synchronous initialization failure/);
  assert.equal(disposed, true);
  assert.equal(host.isReady(), false);
}

console.log("World System host lifecycle checks passed: cancellation, stale-run isolation, shared initialization, and disposal.");
