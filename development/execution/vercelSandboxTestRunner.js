/**
 * ALIVE — isolated Vercel Sandbox test runner.
 *
 * Copies only the task workspace allowlist into a network-denied microVM,
 * syntax-checks changed JavaScript files, then runs the approved test suite.
 * It never writes to the source repository or production environment.
 */
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_TEST_EXCLUSIONS = new Set(["hostedAliveRoutes.test.js"]);
const DEFAULT_TIMEOUT_MS = 180000;
const DEFAULT_MAX_FILES = 2000;
const DEFAULT_MAX_FILE_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 32 * 1024 * 1024;

function safeRelative(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Sandbox path is required.");
  const normalized = value.replace(/\\/g, "/").replace(/^\.\//, "");
  if (
    normalized.startsWith("/") ||
    normalized.includes(String.fromCharCode(0)) ||
    normalized.split("/").some(part => !part || part === "." || part === ".." ||
      [".git", ".vercel", "node_modules", "dist", "build", ".next"].includes(part))
  ) {
    throw new Error("Unsafe sandbox path: " + value);
  }
  return normalized;
}

async function collectAllowedFiles(rootDirectory, allowedPaths, limits) {
  const root = path.resolve(rootDirectory);
  const collected = [];
  let totalBytes = 0;
  const seen = new Set();

  async function addFile(relativePath) {
    const safePath = safeRelative(relativePath);
    if (seen.has(safePath)) return;
    const absolutePath = path.resolve(root, safePath);
    if (!absolutePath.startsWith(root + path.sep)) throw new Error("Sandbox path escaped the workspace.");
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink()) throw new Error("Symbolic links are not allowed in the sandbox workspace.");
    if (stat.isDirectory()) {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        await addFile(safePath + "/" + entry.name);
      }
      return;
    }
    if (!stat.isFile()) return;
    if (stat.size > limits.maxFileBytes) throw new Error("Sandbox file exceeds the size limit: " + safePath);
    totalBytes += stat.size;
    if (totalBytes > limits.maxTotalBytes) throw new Error("Sandbox workspace exceeds the total size limit.");
    if (collected.length >= limits.maxFiles) throw new Error("Sandbox workspace exceeds the file-count limit.");
    const content = await fs.readFile(absolutePath);
    collected.push({ path: safePath, content });
    seen.add(safePath);
  }

  for (const allowedPath of allowedPaths) await addFile(allowedPath);
  if (collected.length === 0) throw new Error("The sandbox workspace contains no approved files.");
  return collected;
}

async function discoverTestFiles(rootDirectory, exclusions, explicitTestFiles) {
  if (Array.isArray(explicitTestFiles)) return explicitTestFiles.map(safeRelative);
  const testDirectory = path.join(rootDirectory, "development", "tests");
  const entries = await fs.readdir(testDirectory, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".test.js") && !exclusions.has(entry.name))
    .map(entry => "development/tests/" + entry.name)
    .sort();
}

async function createVercelSandbox(options) {
  const sdk = await import("@vercel/sandbox");
  const Sandbox = sdk.Sandbox || sdk.default?.Sandbox || sdk.default;
  if (!Sandbox || typeof Sandbox.create !== "function") {
    throw new Error("The Vercel Sandbox SDK is unavailable.");
  }
  return Sandbox.create(options);
}

export function createVercelSandboxTestRunner(options = {}) {
  const enabled = options.enabled ?? process.env.ALIVE_SANDBOX_ENABLED === "true";
  const sandboxFactory = options.sandboxFactory || createVercelSandbox;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
  const maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;
  const excludedTestFiles = new Set(options.excludedTestFiles || DEFAULT_TEST_EXCLUSIONS);
  const explicitTestFiles = options.testFiles;

  async function runTests(input = {}) {
    if (!enabled) throw new Error("Vercel Sandbox execution is disabled.");
    const workspace = input.workspace;
    if (!workspace || typeof workspace.directory !== "string" || !Array.isArray(workspace.allowedPaths)) {
      throw new Error("A bounded isolated workspace is required for sandbox testing.");
    }

    const limits = { maxFiles, maxFileBytes, maxTotalBytes };
    const files = await collectAllowedFiles(workspace.directory, workspace.allowedPaths, limits);
    const includedPaths = new Set(files.map(file => file.path));
    const changedFiles = (input.changedFiles || []).map(safeRelative);
    for (const filePath of changedFiles) {
      if (!includedPaths.has(filePath)) throw new Error("Changed file is missing from the sandbox workspace: " + filePath);
    }

    const testFiles = await discoverTestFiles(workspace.directory, excludedTestFiles, explicitTestFiles);
    if (!testFiles.length) throw new Error("No approved sandbox test files were found.");
    for (const filePath of testFiles) {
      if (!includedPaths.has(filePath)) throw new Error("Approved sandbox test file is missing: " + filePath);
    }

    const startedAt = Date.now();
    const sandbox = await sandboxFactory({
      runtime: "node24",
      timeout: timeoutMs,
      networkPolicy: "deny-all"
    });

    let syntaxResults = [];
    let testResult = null;
    let failure = null;
    try {
      await sandbox.writeFiles(files);
      for (const filePath of changedFiles.filter(file => file.endsWith(".js") || file.endsWith(".mjs") || file.endsWith(".cjs"))) {
        const result = await sandbox.runCommand({
          cmd: "node",
          args: ["--check", filePath],
          cwd: "/vercel/sandbox"
        });
        syntaxResults.push({ file: filePath, exitCode: result.exitCode });
        if (result.exitCode !== 0) {
          failure = result;
          break;
        }
      }

      if (!failure) {
        testResult = await sandbox.runCommand({
          cmd: "node",
          args: ["--test", ...testFiles],
          cwd: "/vercel/sandbox"
        });
        if (testResult.exitCode !== 0) failure = testResult;
      }
    } finally {
      await sandbox.stop();
    }

    const output = failure || testResult || {};
    const stdout = typeof output.stdout === "function" ? await output.stdout() : output.stdout;
    const stderr = typeof output.stderr === "function" ? await output.stderr() : output.stderr;
    return Object.freeze({
      passed: !failure,
      runner: "vercel-sandbox-node24",
      networkPolicy: "deny-all",
      durationMs: Date.now() - startedAt,
      copiedFiles: files.length,
      changedFiles: [...changedFiles],
      syntaxChecks: syntaxResults,
      testFiles,
      stdout: String(stdout || "").slice(-20000),
      stderr: String(stderr || "").slice(-12000),
      exitCode: failure?.exitCode ?? testResult?.exitCode ?? 0
    });
  }

  return Object.freeze({
    version: "1.0.0",
    getSnapshot() {
      return Object.freeze({
        enabled,
        runtime: "node24",
        networkPolicy: "deny-all",
        maxFiles,
        maxFileBytes,
        maxTotalBytes,
        timeoutMs
      });
    },
    runTests
  });
}
