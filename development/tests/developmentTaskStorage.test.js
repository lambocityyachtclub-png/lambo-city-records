
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development Task Storage Tests
 *
 * These tests use temporary folders.
 * They do not modify LAMBO CITY game files.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";

import os from "node:os";
import path from "node:path";

import {
  createDevelopmentTaskStorage
} from "../storage/developmentTaskStorage.js";


async function createTestStorage() {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "lambocity-storage-test-")
  );

  const filePath = path.join(
    directory,
    "data",
    "development-tasks.json"
  );

  return {
    directory,
    storage: createDevelopmentTaskStorage({
      filePath
    })
  };
}


test("Storage requires a valid file path", () => {
  assert.throws(
    () => createDevelopmentTaskStorage(),
    /filePath is required/
  );

  assert.throws(
    () => createDevelopmentTaskStorage({
      filePath: ""
    }),
    /filePath is required/
  );
});


test("Storage returns an empty list when no file exists", async () => {
  const context = await createTestStorage();

  try {
    const tasks = await context.storage.load();

    assert.deepEqual(tasks, []);

  } finally {
    await rm(context.directory, {
      recursive: true,
      force: true
    });
  }
});


test("Storage saves and loads development tasks", async () => {
  const context = await createTestStorage();

  try {
    const tasks = [
      {
        id: "task-001",
        title: "Test Studio development",
        status: "queued"
      },
      {
        id: "task-002",
        title: "Test storage",
        status: "completed"
      }
    ];

    await context.storage.save(tasks);

    const loadedTasks = await context.storage.load();

    assert.deepEqual(loadedTasks, tasks);

  } finally {
    await rm(context.directory, {
      recursive: true,
      force: true
    });
  }
});


test("Storage rejects values that are not arrays", async () => {
  const context = await createTestStorage();

  try {
    await assert.rejects(
      context.storage.save({
        id: "invalid-task"
      }),
      /must be an array/
    );

  } finally {
    await rm(context.directory, {
      recursive: true,
      force: true
    });
  }
});


test("Storage rejects malformed JSON", async () => {
  const context = await createTestStorage();

  try {
    const filePath = path.join(
      context.directory,
      "data",
      "development-tasks.json"
    );

    await import("node:fs/promises").then(
      ({ mkdir }) => mkdir(
        path.dirname(filePath),
        { recursive: true }
      )
    );

    await writeFile(
      filePath,
      "{ invalid json",
      "utf8"
    );

    await assert.rejects(
      context.storage.load(),
      SyntaxError
    );

  } finally {
    await rm(context.directory, {
      recursive: true,
      force: true
    });
  }
});


test("Storage rejects JSON that does not contain an array", async () => {
  const context = await createTestStorage();

  try {
    const filePath = path.join(
      context.directory,
      "data",
      "development-tasks.json"
    );

    const { mkdir } = await import("node:fs/promises");

    await mkdir(path.dirname(filePath), {
      recursive: true
    });

    await writeFile(
      filePath,
      JSON.stringify({
        tasks: []
      }),
      "utf8"
    );

    await assert.rejects(
      context.storage.load(),
      /must contain an array/
    );

  } finally {
    await rm(context.directory, {
      recursive: true,
      force: true
    });
  }
});


test("Storage processes concurrent saves in order", async () => {
  const context = await createTestStorage();

  try {
    const firstSave = context.storage.save([
      {
        id: "task-first"
      }
    ]);

    const secondSave = context.storage.save([
      {
        id: "task-second"
      }
    ]);

    await Promise.all([
      firstSave,
      secondSave
    ]);

    const loadedTasks = await context.storage.load();

    assert.deepEqual(loadedTasks, [
      {
        id: "task-second"
      }
    ]);

  } finally {
    await rm(context.directory, {
      recursive: true,
      force: true
    });
  }
});


test("Storage returns independent copies of loaded tasks", async () => {
  const context = await createTestStorage();

  try {
    await context.storage.save([
      {
        id: "task-001",
        title: "Original title"
      }
    ]);

    const firstLoad = await context.storage.load();

    firstLoad[0].title = "Changed title";

    const secondLoad = await context.storage.load();

    assert.equal(
      secondLoad[0].title,
      "Original title"
    );

  } finally {
    await rm(context.directory, {
      recursive: true,
      force: true
    });
  }
});
