import test from "node:test";
import assert from "node:assert/strict";
import { createProposalProjectContext } from "../blueprints/projectContext.mjs";

test("project proposal context keeps the whole-project map compact and discovery-only", () => {
  const report = {
    generatedAt: "2026-11-20T00:00:00.000Z",
    summary: { filesScanned: 1000, sourceFiles: 700, documentationFiles: 200, configurationFiles: 100, departmentCount: 2 },
    master: { title: "LAMBO CITY", purpose: "Preserve the established world.", status: "discovery-draft", discoveredSourceFiles: ["main.js"] },
    dependencyGraph: {
      summary: { filesAnalyzed: 700, resolvedEdges: 600, unresolvedLocalEdges: 2, unresolvedTestFixtures: 3, externalReferences: 40, staticallyReachableFiles: 500 },
      rootEntrypoints: ["index.html", "main.js"],
      reachableFiles: ["main.js", "engine.js"],
      edges: [
        { from: "main.js", specifier: "./missing.js", status: "unresolved-local" },
        { from: "tests/example.test.js", specifier: "./fixture.js", status: "unresolved-test-fixture" }
      ]
    },
    departments: [{
      id: "world",
      title: "World",
      purpose: "World development and preservation.",
      status: "discovery-draft",
      sourceFiles: ["main.js"],
      testFiles: ["development/tests/world.test.js"],
      documentationFiles: ["docs/world.md"],
      configurationFiles: [],
      runtimeConnectedSourceFiles: ["main.js"],
      notStaticallyReachableSourceFiles: []
    }],
    inventory: [{ path: "secret.txt", content: "must not be forwarded" }]
  };
  const context = createProposalProjectContext(report);
  assert.equal(context.status, "discovery-only");
  assert.equal(context.ownerApproved, false);
  assert.deepEqual(context.master.sourceFiles, ["main.js"]);
  assert.deepEqual(context.dependencyGraph.unresolvedLocalReferences, [{ from: "main.js", specifier: "./missing.js" }]);
  assert.equal(JSON.stringify(context).includes("must not be forwarded"), false);
  assert.equal("inventory" in context, false);
});

test("project proposal context fails safely when discovery metadata is unavailable", () => {
  const context = createProposalProjectContext(null);
  assert.equal(context.status, "unavailable");
  assert.ok(context.notes.length > 0);
});
