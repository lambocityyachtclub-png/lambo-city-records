import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("ALIVE owner console is private and exposes a read-only project scan", async () => {
  const html = await fs.readFile(new URL("../../alive/index.html", import.meta.url), "utf8");
  const script = await fs.readFile(new URL("../../alive/owner.js", import.meta.url), "utf8");
  const css = await fs.readFile(new URL("../../alive/owner.css", import.meta.url), "utf8");

  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(html, /id="scan-project-button"/);
  assert.match(html, /id="discovery-result"/);
  assert.match(script, /request\("discovery"\)/);
  assert.match(script, /function renderDiscovery/);
  assert.match(script, /credentials:\s*"same-origin"/);
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
  assert.doesNotMatch(script, /request\("run"/);
  assert.match(css, /\.discovery-result/);
});

test("ALIVE owner console reports that AI execution and deployment remain separate permissions", async () => {
  const html = await fs.readFile(new URL("../../alive/index.html", import.meta.url), "utf8");
  const script = await fs.readFile(new URL("../../alive/owner.js", import.meta.url), "utf8");
  assert.match(html, /isolated sandbox testing/);
  assert.match(script, /aiExecutionEnabled/);
  assert.match(script, /autonomousProductionDeployment/);
});
