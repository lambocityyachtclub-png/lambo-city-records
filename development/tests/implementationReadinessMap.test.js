import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("implementation readiness map covers all ten departments and keeps evidence states distinct", async () => {
  const file = await fs.readFile(path.join(root, "development/blueprints/IMPLEMENTATION_READINESS_MAP_DRAFT.md"), "utf8");
  const set = JSON.parse(await fs.readFile(path.join(root, "development/blueprints/blueprintSet.json"), "utf8"));
  for (const department of set.departments) {
    assert.ok(file.includes(department.title), "Missing department: " + department.id);
  }
  assert.match(file, /not owner-approved/);
  assert.match(file, /does not prove correct behavior/);
  assert.match(file, /No Development Director tasks are created or submitted/);
  assert.match(file, /66 registered or separately hosted runtime roots/);
  assert.match(file, /Phase B — prioritize Floor 2 Studio/);
  assert.match(file, /dependency-cycle resolution proposal/i);
  assert.match(file, /actual approved stage-performance MP3/);
});

test("implementation readiness map preserves the modular safety boundaries", async () => {
  const file = await fs.readFile(path.join(root, "development/blueprints/IMPLEMENTATION_READINESS_MAP_DRAFT.md"), "utf8");
  assert.match(file, /Keep the approved MPC and Edit visual designs intact/);
  assert.match(file, /Do not activate cars.js/);
  assert.match(file, /AI, hosted execution and paid adapters optional/);
  assert.match(file, /requires separate explicit approval/);
  assert.match(file, /not an owner-approved change/);
});
