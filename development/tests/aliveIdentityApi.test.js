import test from "node:test";
import assert from "node:assert/strict";
import { createAliveIdentityApiHandler } from "../../server/aliveIdentityApi.js";

function response() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

function makeHandler({ session = { user: { id: "account-1" } }, query = async () => ({ rows: [], rowCount: 0 }), sameOrigin = true } = {}) {
  return createAliveIdentityApiHandler({
    getSession: async () => session,
    query,
    isSameOrigin: () => sameOrigin
  });
}

test("ALIVE identity GET is owner-scoped and returns no-store data", async () => {
  let sql;
  let values;
  const handler = makeHandler({
    query: async (statement, params) => {
      sql = statement;
      values = params;
      return { rows: [{ identity_id: "guest-1", record: { identityId: "guest-1" }, version: "3", updated_at: "2026-11-28T00:00:00Z" }] };
    }
  });
  const res = response();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(values[0], "account-1");
  assert.match(sql, /WHERE owner_id = \$1/);
  assert.equal(res.payload.identity.identityId, "guest-1");
  assert.equal(res.payload.identity.version, 3);
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("ALIVE identity GET requires an authenticated account", async () => {
  let queried = false;
  const handler = makeHandler({ session: null, query: async () => { queried = true; return { rows: [] }; } });
  const res = response();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(queried, false);
});

test("ALIVE identity PUT derives ownership from the verified session", async () => {
  let values;
  const handler = makeHandler({
    query: async (_sql, params) => {
      values = params;
      return { rowCount: 1, rows: [{ identity_id: params[0], record: JSON.parse(params[2]), version: 1, updated_at: "2026-11-28T00:00:00Z" }] };
    }
  });
  const res = response();
  await handler({
    method: "PUT",
    headers: {},
    body: {
      identityId: "guest-1",
      ownerId: "attacker-controlled-owner",
      displayName: "My Companion",
      characterForm: "stylized",
      appearanceProfile: { outfit: "classic" },
      personality: { summary: "Kind", traits: ["creative"] }
    }
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(values[1], "account-1");
  assert.equal(JSON.parse(values[2]).ownerId, "account-1");
  assert.equal(JSON.parse(values[2]).privacy.memoryAccess, "owner-only");
  assert.equal(JSON.parse(values[2]).privacy.trainingUse, false);
  assert.equal(JSON.parse(values[2]).memoryPolicy.sharing, "private");
  assert.deepEqual(JSON.parse(values[2]).character.appearanceProfile, {
    skinTone: "porcelain", hairStyle: "short", hairColor: "black",
    eyeColor: "brown", outfit: "classic", accentColor: "gold"
  });
  assert.equal(res.payload.synced, true);
});

test("ALIVE identity PUT rejects cross-origin writes", async () => {
  let queried = false;
  const handler = makeHandler({ sameOrigin: false, query: async () => { queried = true; return { rowCount: 1, rows: [] }; } });
  const res = response();
  await handler({ method: "PUT", headers: {}, body: { identityId: "guest-1" } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(queried, false);
});

test("ALIVE identity PUT cannot take over an identity owned by another account", async () => {
  const handler = makeHandler({ query: async () => ({ rowCount: 0, rows: [] }) });
  const res = response();
  await handler({
    method: "PUT",
    headers: {},
    body: { identityId: "guest-1", displayName: "My Companion", characterForm: "digital-human" }
  }, res);
  assert.equal(res.statusCode, 409);
});

test("ALIVE identity API rejects unsupported character forms", async () => {
  const handler = makeHandler();
  const res = response();
  await handler({
    method: "PUT",
    headers: {},
    body: { identityId: "guest-1", displayName: "My Companion", characterForm: "unknown" }
  }, res);
  assert.equal(res.statusCode, 400);
});

test("ALIVE identity PUT rejects oversized payloads before database writes", async () => {
  let queried = false;
  const handler = makeHandler({ query: async () => { queried = true; return { rowCount: 1, rows: [] }; } });
  const res = response();
  await handler({
    method: "PUT",
    headers: {},
    body: { identityId: "guest-1", displayName: "My Companion", characterForm: "digital-human", personality: { summary: "x".repeat(17000) } }
  }, res);
  assert.equal(res.statusCode, 413);
  assert.equal(queried, false);
});

test("ALIVE identity PUT rejects malformed stable identity IDs", async () => {
  let queried = false;
  const handler = makeHandler({ query: async () => { queried = true; return { rowCount: 1, rows: [] }; } });
  const res = response();
  await handler({
    method: "PUT",
    headers: {},
    body: { identityId: "guest/foreign", displayName: "My Companion", characterForm: "digital-human" }
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(queried, false);
});
