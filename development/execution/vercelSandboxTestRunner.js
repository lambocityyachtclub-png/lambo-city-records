/**
 * LAMBO CITY ALIVE — Vercel Sandbox test runner.
 *
 * Copies only the isolated workspace's allowlisted files into a fresh
 * network-denied microVM, runs Node's test runner, then stops the VM.
 * Sandbox creation is disabled unless ALIVE_SANDBOX_ENABLED=true.
 */
import fs from "node:fs/promises";
import path from "node:path";

const BLOCKED = new Set([".git", ".vercel", "node_modules", "dist", "build"]);

function safeRelative(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.isAbsolute(value)
  ) {
    throw new Error("Unsafe sandbox workspace path.");
  }
  const parts = value.split("/");
  if (parts.some(part => !part || part === "." || part === ".." || BLOCKED.has(part))) {
    throw new Error("Unsafe sandbox workspace path: " + value);
  }
  return parts.join("/");
}

async function collectAllowedFiles(root, allowedPaths, limits) {
  const files = [];
  let totalBytes = 0;

  async function walk(source, relative) {
    const info = await fs.lstat(source);
    if (info.isSymbolicLink()) {
      throw new Error("Symbolic links are not allowed in sandbox input: " + relative);
    }
    if (info.isDirectory()) {
      const entries = await fs.readdir(source, { withFileTypes: true });
      for (const entry of entries) {
        if (BLOCKED.has(entry.name)) continue;
        await walk(path.join(source, entry.name), relative + "/" + entry.name);
      }
      return;
    }
    if (!info.isFile()) {
      throw new Error("Unsupported sandbox input type: " + relative);
    }
    const content = await fs.readFile(source);
    if (content.byteLength > limits.maxFileBytes) {
      throw new Error("Sandbox input file exceeds size limit: " + relative);
    }
    totalBytes += content.byteLength;
    if (totalBytes > limits.maxTotalBytes) {
      throw new Error("Sandbox input exceeds total size limit.");
    }
    files.push({ path: relative, content });
    if (files.length > limits.maxFiles) {
      throw new Error("Sandbox input exceeds file-count limit.");
    }
  }

  for (const allowedPath of allowedPaths) {
    const relative = safeRelative(allowedPath);
    await walk(path.join(root, ...relative.split("/")), relative);
  }
  return files;
}

function truncate(value, max = 24000) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function createVercelSandboxTestRunner(options = {}) {
  const sandboxFactory = options.sandboxFactory;
  const enabled = options.enabled === true ||
    process.env.ALIVE_SANDBOX_ENABLED === "true";
  const timeoutMs = options.timeoutMs ?? 180000;
  const limits = {
    maxFiles: options.maxFiles ?? 1200,
    maxFileBytes: options.maxFileBytes ?? 2 * 1024 * 1024,
    maxTotalBytes: options.maxTotalBytes ?? 24 * 1024 * 1024
  };

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) {
    throw new Error("Sandbox timeoutMs must be between 1000 and 600000.");
  }

  async function runTests(input = {}) {
    if (!enabled) {
      throw new Error("Sandbox test execution is disabled. Enable ALIVE_SANDBOX_ENABLED only after approving sandbox usage.");
    }

    const workspace = input.workspace || {};
    if (!workspace.isolated || typeof workspace.directory !== "string") {
      throw new Error("An isolated workspace directory is required.");
    }
    if (!Array.isArray(workspace.allowedPaths) || workspace.allowedPaths.length === 0) {
      throw new Error("An explicit sandbox path allowlist is required.");
    }

    const files = await collectAllowedFiles(
      workspace.directory,
      workspace.allowedPaths,
      limits
    );
    if (files.length === 0) {
      throw new Error("No allowlisted files were available for sandbox testing.");
    }

    let createSandbox = sandboxFactory;
    if (typeof createSandbox !== "function") {
      const sdk = await import("@vercel/sandbox");
      createSandbox = sdk.Sandbox?.create;
    }
    if (typeof createSandbox !== "function") {
      throw new Error("Vercel Sandbox SDK is unavailable.");
    }

    const sandbox = await createSandbox({
      image: "vercel/sandbox/node:22",
      timeout: timeoutMs,
      persistent: false,
      networkPolicy: "deny-all",
      region: "sfo1",
      tags: { app: "lambo-city-alive", purpose: "isolated-tests" }
    });

    let commandResult;
    let cleanupError = null;
    try {
      await sandbox.writeFiles(files);
      commandResult = await sandbox.runCommand({
        cmd: "node",
        args: ["--experimental-default-type=module", "--test"],
        cwd: sandbox.cwd,
        timeoutMs
      });
    } finally {
      try {
        await sandbox.stop();
      } catch (error) {
        cleanupError = error;
      }
    }

    if (cleanupError) {
      throw new Error("Sandbox cleanup failed: " + cleanupError.message);
    }

    const stdout = truncate(await commandResult.stdout());
    const stderr = truncate(await commandResult.stderr());
    return {
      passed: commandResult.exitCode === 0,
      exitCode: commandResult.exitCode,
      stdout,
      stderr,
      filesUploaded: files.length,
      runner: "vercel-sandbox",
      networkAccess: "denied",
      sandboxStopped: true
    };
  }

  return Object.freeze({ runTests });
}
