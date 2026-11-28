import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const playerAuthUrl = new URL("../../server/auth.js", import.meta.url);
const ownerAuthUrl = new URL("../../alive/server/ownerAuth.js", import.meta.url);

test("player and ALIVE owner Better Auth sessions use distinct cookie prefixes", async () => {
  const [player, owner] = await Promise.all([
    readFile(playerAuthUrl, "utf8"),
    readFile(ownerAuthUrl, "utf8")
  ]);
  assert.match(player, /cookiePrefix:\s*"lambo-player"/);
  assert.match(owner, /cookiePrefix:\s*"alive-owner"/);
});

test("player and ALIVE owner passkey ceremonies use distinct challenge cookies", async () => {
  const [player, owner] = await Promise.all([
    readFile(playerAuthUrl, "utf8"),
    readFile(ownerAuthUrl, "utf8")
  ]);
  assert.match(player, /webAuthnChallengeCookie:\s*"lambo-player-passkey"/);
  assert.match(owner, /webAuthnChallengeCookie:\s*"alive-owner-passkey"/);
});
