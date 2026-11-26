import test from "node:test";
import assert from "node:assert/strict";
import aliveAction from "../../api/alive/[action].js";
import authHandler from "../../api/alive/auth/[...all].js";

test("Hosted ALIVE API and authentication routes load as server-side handlers", () => {
  assert.equal(typeof aliveAction, "function");
  assert.equal(typeof authHandler, "function");
});
