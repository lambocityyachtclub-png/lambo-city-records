import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createVercelSandboxTestRunner } from "../execution/vercelSandboxTestRunner.js";

async function createWorkspace() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "alive-sandbox-runner-"));
  await fs.mkdir(path.join(directory, "development", "tests"), { recursive: true });
  await fs.writeFile(path.join(directory, "package.json"), JSON.stringify({ type: "module" }));
  await fs.writeFile(path.join(directory, "src.js"), "export const value = 1;");
  await fs.writeFile(path.join(directory, "development", "tests", "sample.test.js"), "import test from 'node:test'; test('sample', () => {});");
  return { directory, allowedPaths: ["package.json", "src.js", "development/tests"] };
}

test("Vercel Sandbox runner copies only approved paths and runs syntax plus test checks", async () => {
  const workspace = await createWorkspace();
  const state = { config: null, files: [], commands: [], stopped: false };
  const runner = createVercelSandboxTestRunner({
    enabled: true,
    testFiles: ["development/tests/sample.test.js"],
    sandboxFactory: async config => {
      state.config = config;
      return {
        async writeFiles(files) { state.files = files; },
        async runCommand(command) {
          state.commands.push(command);
          return { exitCode: 0, stdout: "ok", stderr: "" };
        },
        async stop() { state.stopped = true; }
      };
    }
  });

  const result = await runner.runTests({ workspace, changedFiles: ["src.js"] });
  assert.equal(result.passed, true);
  assert.equal(result.networkPolicy, "deny-all");
  assert.equal(result.runner, "vercel-sandbox-node24");
  assert.equal(state.config.runtime, "node24");
  assert.equal(state.config.networkPolicy, "deny-all");
  assert.ok(state.files.some(file => file.path === "src.js"));
  assert.equal(state.commands.length, 2);
  assert.deepEqual(state.commands[0].args, ["--check", "src.js"]);
  assert.deepEqual(state.commands[1].args, ["--test", "development/tests/sample.test.js"]);
  assert.equal(state.stopped, true);
  await fs.rm(workspace.directory, { recursive: true, force: true });
});

test("Vercel Sandbox runner fails closed when disabled or when a changed file is not allowlisted", async () => {
  const disabled = createVercelSandboxTestRunner({ enabled: false });
  await assert.rejects(() => disabled.runTests({}), /disabled/);

  const workspace = await createWorkspace();
  let sandboxCreated = false;
  const runner = createVercelSandboxTestRunner({
    enabled: true,
    sandboxFactory: async () => {
      sandboxCreated = true;
      throw new Error("Must not create sandbox.");
    }
  });
  await assert.rejects(
    () => runner.runTests({ workspace, changedFiles: ["../../secrets.env"] }),
    /Unsafe sandbox path/
  );
  assert.equal(sandboxCreated, false);
  await fs.rm(workspace.directory, { recursive: true, force: true });
});

test("Vercel Sandbox runner stops the microVM when unit tests fail", async () => {
  const workspace = await createWorkspace();
  const state = { stopped: false, commandCount: 0 };
  const runner = createVercelSandboxTestRunner({
    enabled: true,
    testFiles: ["development/tests/sample.test.js"],
    sandboxFactory: async () => ({
      async writeFiles() {},
      async runCommand() {
        state.commandCount++;
        return state.commandCount === 1
          ? { exitCode: 0, stdout: "", stderr: "" }
          : { exitCode: 1, stdout: "failed", stderr: "assertion failed" };
      },
      async stop() { state.stopped = true; }
    })
  });

  const result = await runner.runTests({ workspace, changedFiles: ["src.js"] });
  assert.equal(result.passed, false);
  assert.equal(result.exitCode, 1);
  assert.equal(result.stderr, "assertion failed");
  assert.equal(state.stopped, true);
  await fs.rm(workspace.directory, { recursive: true, force: true });
});
