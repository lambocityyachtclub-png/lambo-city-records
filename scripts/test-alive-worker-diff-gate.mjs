import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const validator = resolve(root, "scripts/validate-alive-worker-diff.mjs");
const temporaryRepo = await mkdtemp(join(tmpdir(), "lc-alive-worker-gate-"));
const runGit = args => execFileSync("git", args, { cwd: temporaryRepo, stdio: "pipe" });
const runValidator = fileListPath => spawnSync(
  process.execPath,
  ["--experimental-default-type=module", validator, "vision-planning", fileListPath],
  { cwd: temporaryRepo, encoding: "utf8" }
);

try {
  runGit(["init"]);
  runGit(["config", "user.name", "ALIVE gate test"]);
  runGit(["config", "user.email", "alive-gate-test@example.invalid"]);
  await mkdir(join(temporaryRepo, "development/planning"), { recursive: true });
  await writeFile(join(temporaryRepo, "development/planning/plan.json"), "{}\n");
  runGit(["add", "."]);
  runGit(["commit", "-m", "baseline"]);

  await writeFile(join(temporaryRepo, "development/planning/plan.json"), "{\"approved\":true}\n");
  const regularList = join(temporaryRepo, "regular-files.txt");
  await writeFile(regularList, "development/planning/plan.json\n");
  const accepted = runValidator(regularList);
  assert.equal(accepted.status, 0, accepted.stderr || accepted.stdout);

  runGit(["checkout", "--", "development/planning/plan.json"]);
  await symlink("../../.github/workflows/deploy.yml",
    join(temporaryRepo, "development/planning/escape"));
  runGit(["add", "-N", "--", "development/planning/escape"]);
  const symlinkList = join(temporaryRepo, "symlink-files.txt");
  await writeFile(symlinkList, "development/planning/escape\n");
  const rejected = runValidator(symlinkList);
  assert.notEqual(rejected.status, 0, "a symlink proposal must be rejected");
  assert.match(rejected.stderr + rejected.stdout, /symbolic links or submodules/);

  await rm(join(temporaryRepo, "development/planning/escape"), { force: true });
  runGit(["reset", "--", "development/planning/escape"]);
  runGit(["mv", "world.js", "development/planning/moved-world.js"]);
  const renameList = join(temporaryRepo, "rename-files.txt");
  const renamedPaths = execFileSync("git", ["diff", "--no-renames", "--name-only", "HEAD"], {
    cwd: temporaryRepo,
    encoding: "utf8"
  });
  await writeFile(renameList, renamedPaths);
  const renamed = runValidator(renameList);
  assert.notEqual(renamed.status, 0, "renaming an out-of-scope file into an allowed folder must be rejected");
  assert.match(renamed.stderr + renamed.stdout, /outside its scope/);
} finally {
  await rm(temporaryRepo, { recursive: true, force: true });
}

console.log("ALIVE worker diff gate checks passed: regular scoped files are accepted; symlinks are rejected.");
