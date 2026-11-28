import test from "node:test";
import assert from "node:assert/strict";
import { getAliveDatabaseUrl, getPlayerDatabaseUrl } from "../../server/databaseTargets.js";

test("player accounts prefer their isolated player database", () => {
  assert.equal(getPlayerDatabaseUrl({
    DATABASE_URL: "postgres://legacy",
    PLAYER_DATABASE_URL: "postgres://players"
  }), "postgres://players");
});

test("ALIVE owner control plane prefers its isolated ALIVE database", () => {
  assert.equal(getAliveDatabaseUrl({
    DATABASE_URL: "postgres://legacy",
    ALIVE_DATABASE_URL: "postgres://alive"
  }), "postgres://alive");
});

test("legacy single-database preview configuration remains compatible", () => {
  const env = { DATABASE_URL: "postgres://legacy" };
  assert.equal(getPlayerDatabaseUrl(env), "postgres://legacy");
  assert.equal(getAliveDatabaseUrl(env), "postgres://legacy");
});
