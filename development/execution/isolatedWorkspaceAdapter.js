
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const BLOCKED_SEGMENTS = new Set([
  ".git",
  ".vercel",
  "node_modules",
  "dist",
  "build"
]);

function validateRelativePath(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.isAbsolute(value)
  ) {
    throw new Error(`Unsafe workspace path: ${value}`);
  }

  const segments = value.split("/");

  if (
    segments.some(segment =>
      !segment ||
      segment === "." ||
      segment === ".." ||
      BLOCKED_SEGMENTS.has(segment)
    )
  ) {
    throw new Error(`Unsafe workspace path: ${value}`);
  }

  return segments.join("/");
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);

  return (
    relative === "" ||
    (
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative)
    )
  );
}

function hashBuffer(buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

async function assertNoSymlinks(root, target) {
  if (!isInside(root, target)) {
    throw new Error("Workspace path escapes its root.");
  }

  const relative = path.relative(root, target);
  const segments = relative
    ? relative.split(path.sep)
    : [];

  let current = root;

  for (const segment of segments) {
    current = path.join(current, segment);

    try {
      const info = await fs.lstat(current);

      if (info.isSymbolicLink()) {
        throw new Error(
          `Symbolic links are not allowed: ${current}`
        );
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        continue;
      }

      throw error;
    }
  }
}

async function collectFiles(directory, relative = "") {
  const files = new Map();

  let entries;

  try {
    entries = await fs.readdir(directory, {
      withFileTypes: true
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return files;
    }

    throw error;
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    const relativePath = relative
      ? `${relative}/${entry.name}`
      : entry.name;

    const info = await fs.lstat(entryPath);

    if (info.isSymbolicLink()) {
      throw new Error(
        `Symbolic links are not allowed: ${relativePath}`
      );
    }

    if (info.isDirectory()) {
      const nested = await collectFiles(
        entryPath,
        relativePath
      );

      for (const [name, hash] of nested) {
        files.set(name, hash);
      }

      continue;
    }

    if (!info.isFile()) {
      throw new Error(
        `Unsupported file type: ${relativePath}`
      );
    }

    const content = await fs.readFile(entryPath);

    files.set(relativePath, hashBuffer(content));
  }

  return files;
}

export function createIsolatedWorkspaceAdapter(options = {}) {
  const {
    projectRoot,
    allowedPaths,
    workspaceRoot = os.tmpdir()
  } = options;

  if (
    typeof projectRoot !== "string" ||
    !projectRoot.trim()
  ) {
    throw new Error("A projectRoot directory is required.");
  }

  if (
    !Array.isArray(allowedPaths) ||
    allowedPaths.length === 0
  ) {
    throw new Error("An explicit allowedPaths list is required.");
  }

  const normalizedPaths = [
    ...new Set(allowedPaths.map(validateRelativePath))
  ];

  const workspaces = new Map();

  let resolvedProjectRoot;
  let resolvedWorkspaceRoot;

  async function initializeRoots() {
    if (resolvedProjectRoot && resolvedWorkspaceRoot) {
      return;
    }

    resolvedProjectRoot = await fs.realpath(projectRoot);

    await fs.mkdir(workspaceRoot, {
      recursive: true
    });

    resolvedWorkspaceRoot = await fs.realpath(workspaceRoot);

    if (
      isInside(
        resolvedProjectRoot,
        resolvedWorkspaceRoot
      )
    ) {
      throw new Error(
        "Workspace storage must be outside the project directory."
      );
    }
  }

  async function copyAllowedPath(source, destination) {
    const info = await fs.lstat(source);

    if (info.isSymbolicLink()) {
      throw new Error(
        `Source symbolic links are not allowed: ${source}`
      );
    }

    if (info.isDirectory()) {
      await fs.mkdir(destination, {
        recursive: true
      });

      const entries = await fs.readdir(source, {
        withFileTypes: true
      });

      for (const entry of entries) {
        if (BLOCKED_SEGMENTS.has(entry.name)) {
          continue;
        }

        await copyAllowedPath(
          path.join(source, entry.name),
          path.join(destination, entry.name)
        );
      }

      return;
    }

    if (!info.isFile()) {
      throw new Error(
        `Unsupported source file type: ${source}`
      );
    }

    await fs.mkdir(path.dirname(destination), {
      recursive: true
    });

    await fs.copyFile(source, destination);
  }

  function getWorkspace(workspaceId) {
    const workspace = workspaces.get(workspaceId);

    if (!workspace) {
      throw new Error(
        `Workspace not found: ${workspaceId}`
      );
    }

    return workspace;
  }

  async function resolveWorkspaceFile(workspace, filePath) {
    const safePath = validateRelativePath(filePath);

    const allowed = normalizedPaths.some(prefix =>
      safePath === prefix ||
      safePath.startsWith(`${prefix}/`)
    );

    if (!allowed) {
      throw new Error(
        `Path is outside the workspace allowlist: ${safePath}`
      );
    }

    const target = path.resolve(
      workspace.directory,
      ...safePath.split("/")
    );

    if (!isInside(workspace.directory, target)) {
      throw new Error("Workspace path escapes its root.");
    }

    await assertNoSymlinks(
      workspace.directory,
      target
    );

    return {
      safePath,
      target
    };
  }

  async function createWorkspace(input = {}) {
    await initializeRoots();

    const taskId = String(input.taskId || "").trim();

    if (!taskId) {
      throw new Error("A taskId is required.");
    }

    const directory = await fs.mkdtemp(
      path.join(resolvedWorkspaceRoot, "lambo-city-task-")
    );

    const workspaceId = path.basename(directory);

    try {
      for (const allowedPath of normalizedPaths) {
        const source = path.resolve(
          resolvedProjectRoot,
          ...allowedPath.split("/")
        );

        if (!isInside(resolvedProjectRoot, source)) {
          throw new Error(
            `Source path escapes project root: ${allowedPath}`
          );
        }

        await assertNoSymlinks(
          resolvedProjectRoot,
          source
        );

        await copyAllowedPath(
          source,
          path.join(directory, ...allowedPath.split("/"))
        );
      }

      const baseline = new Map();

      for (const allowedPath of normalizedPaths) {
        const copiedPath = path.join(
          directory,
          ...allowedPath.split("/")
        );

        const files = await collectFiles(
          copiedPath,
          allowedPath
        );

        for (const [name, hash] of files) {
          baseline.set(name, hash);
        }
      }

      workspaces.set(workspaceId, {
        workspaceId,
        taskId,
        directory,
        baseline
      });

      return {
        workspaceId,
        taskId,
        isolated: true,
        directory
      };
    } catch (error) {
      await fs.rm(directory, {
        recursive: true,
        force: true
      });

      throw error;
    }
  }

  async function readFile(input = {}) {
    const workspace = getWorkspace(input.workspaceId);

    const { target } = await resolveWorkspaceFile(
      workspace,
      input.filePath
    );

    const info = await fs.lstat(target);

    if (!info.isFile() || info.isSymbolicLink()) {
      throw new Error("Requested path is not a regular file.");
    }

    return fs.readFile(target, "utf8");
  }

  async function writeFile(input = {}) {
    const workspace = getWorkspace(input.workspaceId);

    const { target } = await resolveWorkspaceFile(
      workspace,
      input.filePath
    );

    if (typeof input.content !== "string") {
      throw new Error("File content must be a string.");
    }

    await fs.mkdir(path.dirname(target), {
      recursive: true
    });

    await assertNoSymlinks(
      workspace.directory,
      target
    );

    await fs.writeFile(target, input.content, {
      encoding: "utf8",
      flag: "w"
    });

    return {
      written: true,
      filePath: input.filePath
    };
  }

  async function listChangedFiles(input = {}) {
    const workspace = getWorkspace(input.workspaceId);
    const current = new Map();

    for (const allowedPath of normalizedPaths) {
      const directory = path.join(
        workspace.directory,
        ...allowedPath.split("/")
      );

      const files = await collectFiles(
        directory,
        allowedPath
      );

      for (const [name, hash] of files) {
        current.set(name, hash);
      }
    }

    const allPaths = new Set([
      ...workspace.baseline.keys(),
      ...current.keys()
    ]);

    const changedFiles = [];

    for (const filePath of allPaths) {
      if (
        workspace.baseline.get(filePath) !==
        current.get(filePath)
      ) {
        changedFiles.push(filePath);
      }
    }

    return changedFiles.sort();
  }

  async function getWorkspaceInfo(workspaceId) {
    const workspace = getWorkspace(workspaceId);

    return {
      workspaceId: workspace.workspaceId,
      taskId: workspace.taskId,
      directory: workspace.directory,
      isolated: true,
      allowedPaths: [...normalizedPaths]
    };
  }

  async function destroyWorkspace(workspaceId) {
    const workspace = getWorkspace(workspaceId);

    await fs.rm(workspace.directory, {
      recursive: true,
      force: true
    });

    workspaces.delete(workspaceId);

    return {
      destroyed: true,
      workspaceId
    };
  }

  return Object.freeze({
    createWorkspace,
    readFile,
    writeFile,
    listChangedFiles,
    getWorkspaceInfo,
    destroyWorkspace,
    getAllowedPaths() {
      return [...normalizedPaths];
    }
  });
}
