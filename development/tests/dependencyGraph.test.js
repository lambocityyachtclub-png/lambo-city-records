import test from "node:test";
import assert from "node:assert/strict";
import { buildStaticDependencyGraph } from "../blueprints/dependencyGraph.mjs";

test("resolves literal local imports and records reverse callers", () => {
  const graph = buildStaticDependencyGraph([
    { path: "main.js", content: 'import { start } from "./engine.js";\nexport { value } from "./shared/value.js";' },
    { path: "engine.js", content: 'import("./lazy/feature.js");' },
    { path: "shared/value.js", content: "export const value = 1;" },
    { path: "lazy/feature.js", content: "export default true;" }
  ]);
  assert.equal(graph.summary.resolvedEdges, 3);
  assert.equal(graph.summary.unresolvedLocalEdges, 0);
  assert.deepEqual(graph.incoming.find(item => item.path === "engine.js").callers, ["main.js"]);
});

test("marks unresolved local references without inventing a target", () => {
  const graph = buildStaticDependencyGraph([
    { path: "main.js", content: 'import "./missing-feature.js";' }
  ]);
  assert.equal(graph.summary.unresolvedLocalEdges, 1);
  assert.equal(graph.edges[0].to, null);
  assert.equal(graph.edges[0].status, "unresolved-local");
});

test("separates external CDN references and ignores bare package imports", () => {
  const graph = buildStaticDependencyGraph([
    { path: "main.js", content: 'import * as THREE from "three";\nimport "https://cdn.example.test/module.js";' }
  ]);
  assert.equal(graph.edges.length, 0);
  assert.equal(graph.externalReferences.length, 1);
  assert.equal(graph.externalReferences[0].specifier, "https://cdn.example.test/module.js");
});

test("discovers HTML script and stylesheet references", () => {
  const graph = buildStaticDependencyGraph([
    { path: "index.html", content: '<script src="./main.js"></script><link href="./site.css" rel="stylesheet">' },
    { path: "main.js", content: "" },
    { path: "site.css", content: "" }
  ]);
  assert.equal(graph.summary.resolvedEdges, 2);
});

test("computes conservative reachability from visitor and standalone entrypoints", () => {
  const graph = buildStaticDependencyGraph([
    { path: "index.html", content: '<script type="module" src="./main.js"></script>' },
    { path: "main.js", content: 'import "./engine.js";' },
    { path: "engine.js", content: 'import "./world.js";' },
    { path: "world.js", content: "export const world = true;" },
    { path: "studio.html", content: '<script type="module" src="./studio.js"></script>' },
    { path: "studio.js", content: "export const studio = true;" },
    { path: "unused.js", content: "export const unused = true;" }
  ]);
  assert.deepEqual(graph.rootEntrypoints, ["index.html", "main.js", "studio.html"]);
  assert.ok(graph.reachableFiles.includes("world.js"));
  assert.ok(graph.reachableFiles.includes("studio.js"));
  assert.ok(!graph.reachableFiles.includes("unused.js"));
});
