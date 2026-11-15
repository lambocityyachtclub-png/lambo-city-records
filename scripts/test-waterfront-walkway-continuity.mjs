import assert from "node:assert/strict";
import { isOutsideSafeWaterfrontSurface } from "../collision.js";

const playerRadius = 0.6;

// The center lane must remain continuously walkable from the dock,
// across the existing ground transition, and onto the marina boardwalk.
for (let z = 33.8; z <= 39.2; z += 0.2) {
  assert.equal(
    isOutsideSafeWaterfrontSurface(0, Number(z.toFixed(2)), playerRadius),
    false,
    "The dock-to-boardwalk center lane must stay connected at z=" + z.toFixed(2)
  );
}

// The connector is deliberately narrow; it must not open the water edge.
assert.equal(
  isOutsideSafeWaterfrontSurface(7.0, 36.0, playerRadius),
  true,
  "The transition must not make the area beside the dock walkable"
);

// Existing boardwalk and main dock walking surfaces remain valid.
assert.equal(isOutsideSafeWaterfrontSurface(0, 42, playerRadius), false);
assert.equal(isOutsideSafeWaterfrontSurface(0, 20, playerRadius), false);

console.log("Waterfront continuity passed: central dock connects to the existing marina boardwalk without widening the safe walking area.");
