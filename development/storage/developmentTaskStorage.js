
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development Task Storage
 *
 * Purpose:
 * - Persist development tasks between restarts.
 * - Load previously saved development tasks.
 * - Save task data safely using atomic file replacement.
 *
 * IMPORTANT:
 * - This is server-side Node.js infrastructure.
 * - It does not modify game files.
 * - It does not execute development tasks.
 * - It does not deploy changes.
 */

import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile
} from "node:fs/promises";

import path from "node:path";

import {
  randomUUID
} from "node:crypto";


export const DEVELOPMENT_STORAGE_VERSION = "1.0.0";


function clone(value) {
  return JSON.parse(JSON.stringify(value));
}


export function createDevelopmentTaskStorage(options = {}) {
  const filePath = options.filePath;

  if (
    typeof filePath !== "string" ||
    !filePath.trim()
  ) {
    throw new Error(
      "A valid development task storage filePath is required."
    );
  }

  const resolvedPath = path.resolve(filePath);

  const directoryPath = path.dirname(resolvedPath);

  let writeQueue = Promise.resolve();


  /**
   * Load saved development tasks.
   *
   * A missing storage file means
   * the system starts with an empty task list.
   */
  async function load() {
    await writeQueue;

    try {
      const content = await readFile(
        resolvedPath,
        "utf8"
      );

      const tasks = JSON.parse(content);

      if (!Array.isArray(tasks)) {
        throw new Error(
          "Development task storage must contain an array."
        );
      }

      return clone(tasks);

    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }


  /**
   * Save development tasks.
   *
   * Writes to a temporary file first,
   * then replaces the existing storage file.
   */
  async function save(tasks) {
    if (!Array.isArray(tasks)) {
      throw new Error(
        "Development tasks must be an array."
      );
    }

    const snapshot = clone(tasks);

    const operation = writeQueue.then(async () => {
      await mkdir(directoryPath, {
        recursive: true
      });

      const temporaryPath =
        `${resolvedPath}.${randomUUID()}.tmp`;

      try {
        await writeFile(
          temporaryPath,
          JSON.stringify(snapshot, null, 2) + "\n",
          "utf8"
        );

        await rename(
          temporaryPath,
          resolvedPath
        );

      } catch (error) {
        await rm(temporaryPath, {
          force: true
        }).catch(() => {});

        throw error;
      }
    });

    writeQueue = operation.catch(() => {});

    return operation;
  }


  return Object.freeze({
    version: DEVELOPMENT_STORAGE_VERSION,
    load,
    save
  });
}
