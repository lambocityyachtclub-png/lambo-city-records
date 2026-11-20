import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { getAliveOwnerOriginConfig, isSameOriginRequest } from "../../alive/server/originPolicy.js";

test("Preview auth uses the Vercel branch alias and trusts exact deployment origins", () => {
  const config = getAliveOwnerOriginConfig({
    VERCEL_ENV: "preview",
    VERCEL_BRANCH_URL: "lambo-city-records-git-feature-team.vercel.app",
    VERCEL_URL: "lambo-city-records-abc123-team.vercel.app",
    ALIVE_OWNER_AUTH_URL: "https://lambocityrecords.com"
  });
  assert.equal(config.baseURL, "https://lambo-city-records-git-feature-team.vercel.app");
  assert.ok(config.trustedOrigins.includes("https://lambo-city-records-abc123-team.vercel.app"));
  assert.ok(!config.trustedOrigins.includes("https://lambocityrecords.com"));
});

test("Production auth uses the configured canonical origin and rejects Preview and cross-site writes", () => {
  const env = {
    VERCEL_ENV: "production",
    VERCEL_BRANCH_URL: "preview.example.vercel.app",
    VERCEL_URL: "prod-deployment.vercel.app",
    ALIVE_OWNER_AUTH_URL: "https://lambocityrecords.com"
  };
  const config = getAliveOwnerOriginConfig(env);
  assert.equal(config.baseURL, "https://lambocityrecords.com");
  assert.equal(isSameOriginRequest({ headers: { origin: "https://lambocityrecords.com", "sec-fetch-site": "same-origin" } }, env), true);
  assert.equal(isSameOriginRequest({ headers: { origin: "https://preview.example.vercel.app", "sec-fetch-site": "same-origin" } }, env), false);
  assert.equal(isSameOriginRequest({ headers: { origin: "https://attacker.example", "sec-fetch-site": "same-origin" } }, env), false);
  assert.equal(isSameOriginRequest({ headers: { origin: "https://lambocityrecords.com", "sec-fetch-site": "cross-site" } }, env), false);
});

test("origin parsing rejects malformed and non-HTTPS configured origins", () => {
  const config = getAliveOwnerOriginConfig({ VERCEL_ENV: "preview", ALIVE_OWNER_AUTH_URL: "http://evil.example/path" });
  assert.equal(config.baseURL, "https://lambocityrecords.com");
  assert.ok(!config.trustedOrigins.includes("http://evil.example"));
});


test("personal and owner task APIs share the same Preview-aware origin policy", async () => {
  const personalApi = await fs.readFile(new URL("../../api/alive/personal/[action].js", import.meta.url), "utf8");
  const ownerApi = await fs.readFile(new URL("../../development/runtime/aliveApi.js", import.meta.url), "utf8");
  assert.match(personalApi, /isSameOriginRequest\(req\)/);
  assert.match(ownerApi, /isSameOriginRequest\(req, env\)/);
  assert.match(ownerApi, /originPolicy\.js/);
});
