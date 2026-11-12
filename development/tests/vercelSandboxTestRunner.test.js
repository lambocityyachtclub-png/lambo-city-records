import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createVercelSandboxTestRunner } from "../execution/vercelSandboxTestRunner.js";

async function temporaryWorkspace() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "alive-sandbox-test-"));
  await fs.mkdir(path.join(directory, "development", "tests"), { recursive: true });
  await fs.writeFile(
    path.join(directory, "development", "tests", "example.test.js"),
    "import test from 'node:test'; import assert from 'node:assert/strict'; test('example', () => assert.equal(1, 1));"
  );
  return directory;
}

test("sandbox runner stays disabled unless explicitly enabled", async () => {
  let created = false;
  const runner = createVercelSandboxTestRunner({
    sandboxFactory: async () => { created = true; return {}; }
  });
  await assert.rejects(
    runner.runTests({
      workspace: { isolated: true, directory: "/tmp", allowedPaths: ["development"] }
    }),
    /disabled/
  );
  assert.equal(created, false);
});

test("sandbox runner uploads only allowlisted files and runs in a network-denied ephemeral VM", async () => {
  const directory = await temporaryWorkspace();
  let createOptions;
  let uploaded;
  let command;
  let stopped = false;
  const runner = createVercelSandboxTestRunner({
    enabled: true,
    sandboxFactory: async options => {
      createOptions = options;
      return {
        cwd: "/workspace",
        writeFiles: async files => { uploaded = files; },
        runCommand: async options => {
          command = options;
          return {
            exitCode: 0,
            stdout: async () => "tests passed",
            stderr: async () => ""
          };
        },
        stop: async () => { stopped = true; }
      };
    }
  });

  try {
    const result = await runner.runTests({
      task: { id: "task-1" },
      workspace: {
        isolated: true,
        directory,
        allowedPaths: ["development"]
      },
      changedFiles: ["development/tests/example.test.js"]
    });

    assert.equal(createOptions.networkPolicy, "deny-all");
    assert.equal(createOptions.persistent, false);
    assert.equal(uploaded.length, 1);
    assert.equal(uploaded[0].path, "development/tests/example.test.js");
    assert.equal(command.cmd, "node");
    assert.equal(command.args.includes("--test"), true);
    assert.equal(result.passed, true);
    assert.equal(result.networkAccess, "denied");
    assert.equal(stopped, true);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("sandbox runner rejects symlinked workspace files before creating a sandbox", async () => {
  const directory = await temporaryWorkspace();
  const outside = path.join(directory, "outside.js");
  await fs.writeFile(outside, "secret");
  await fs.symlink(outside, path.join(directory, "development", "tests", "linked.js"));
  let created = false;
  const runner = createVercelSandboxTestRunner({
    enabled: true,
    sandboxFactory: async () => { created = true; return {}; }
  });
  try {
    await assert.rejects(
      runner.runTests({
        workspace: { isolated: true, directory, allowedPaths: ["development"] }
      }),
      /Symbolic links/
    );
    assert.equal(created, false);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("sandbox runner stops the sandbox when test command throws", async () => {
  const directory = await temporaryWorkspace();
  let stopped = false;
  const runner = createVercelSandboxTestRunner({
    enabled: true,
    sandboxFactory: async () => ({
      cwd: "/workspace",
      writeFiles: async () => {},
      runCommand: async () => { throw new Error("command failed"); },
      stop: async () => { stopped = true; }
    })
  });
  try {
    await assert.rejects(
      runner.runTests({
        workspace: { isolated: true, directory, allowedPaths: ["development"] }
      }),
      /command failed/
    );
    assert.equal(stopped, true);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
