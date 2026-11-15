import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [input, player] = await Promise.all([
  readFile(new URL("../input.js", import.meta.url), "utf8"),
  readFile(new URL("../player.js", import.meta.url), "utf8")
]);

// Physical keyboard keys must retain the established WASD mapping.
for (const [code, key] of [
  ["KeyW", "w"],
  ["KeyA", "a"],
  ["KeyS", "s"],
  ["KeyD", "d"]
]) {
  assert.match(input, new RegExp(code + ":\\s*\\"" + key + "\\""),
    code + " must map to " + key);
}

// Blur must release movement keys instead of leaving the character walking.
for (const key of ["w", "a", "s", "d"]) {
  assert.match(input, new RegExp("this\\.keys\\." + key + "\\s*=\\s*false"),
    "Window blur must release " + key);
}

// Preserve the approved world-axis movement and facing convention.
assert.match(player, /W = world -Z[\\s\\S]*S = world \\+Z[\\s\\S]*A = world -X[\\s\\S]*D = world \\+X/,
  "WASD world directions must remain W=-Z, S=+Z, A=-X, D=+X");
assert.match(player, /if \\(input\\.keys\\?\\.w\\)\\s*\\{\\s*dz = -1/s,
  "W must move forward on -Z");
assert.match(player, /if \\(input\\.keys\\?\\.s\\)\\s*\\{\\s*dz = 1/s,
  "S must move backward on +Z");
assert.match(player, /if \\(input\\.keys\\?\\.a\\)\\s*\\{\\s*dx = -1/s,
  "A must move left on -X");
assert.match(player, /if \\(input\\.keys\\?\\.d\\)\\s*\\{\\s*dx = 1/s,
  "D must move right on +X");

// Keep the fixed standard speed, diagonal normalization, and collision checks.
assert.match(player, /this\\.speed = 28/, "Standard movement speed must remain fixed at 28");
assert.match(player, /dx \\/= length;[\\s\\S]*dz \\/= length;/,
  "Diagonal movement must be normalized");
assert.match(player, /Collision\\.isBlocked\\([\\s\\S]*newX[\\s\\S]*Collision\\.isBlocked\\([\\s\\S]*newZ/,
  "Both movement axes must retain collision checks");
assert.match(player, /this\\._facing = Math\\.PI/,
  "Initial character facing must remain aligned with forward -Z");

console.log("Player controller contract passed: W forward, S backward, A left, D right; fixed speed, diagonal normalization, blur release, and collision protection retained.");
