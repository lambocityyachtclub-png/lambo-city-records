import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [input, player] = await Promise.all([
  readFile(new URL("../input.js", import.meta.url), "utf8"),
  readFile(new URL("../player.js", import.meta.url), "utf8")
]);

// Physical keyboard keys must retain the established WASD mapping.
for (const mapping of ['KeyW: "w"', 'KeyA: "a"', 'KeyS: "s"', 'KeyD: "d"']) {
  assert.ok(input.includes(mapping), "Missing keyboard mapping: " + mapping);
}

// Blur must release all movement keys instead of leaving the character walking.
for (const key of ["w", "a", "s", "d"]) {
  assert.ok(input.includes("this.keys." + key + " = false"),
    "Window blur must release " + key);
}

// Preserve the approved world-axis movement and facing convention.
for (const direction of [
  "W = world -Z",
  "S = world +Z",
  "A = world -X",
  "D = world +X",
  "dz = -1",
  "dz = 1",
  "dx = -1",
  "dx = 1"
]) {
  assert.ok(player.includes(direction), "Missing movement direction: " + direction);
}

// Keep fixed standard speed, diagonal normalization, and both collision checks.
assert.ok(player.includes("this.speed = 28"), "Standard movement speed must remain fixed at 28");
assert.ok(player.includes("dx /= length;") && player.includes("dz /= length;"),
  "Diagonal movement must be normalized");
assert.ok(player.includes("Collision.isBlocked(") &&
  player.includes("newX") && player.includes("newZ"),
  "Both movement axes must retain collision protection");
assert.ok(player.includes("this._facing = Math.PI"),
  "Initial character facing must remain aligned with forward -Z");

console.log("Player controller contract passed: W forward, S backward, A left, D right; fixed speed, diagonal normalization, blur release, and collision protection retained.");
