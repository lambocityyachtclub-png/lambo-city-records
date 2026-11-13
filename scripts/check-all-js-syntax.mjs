import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const excluded = new Set([".git", ".vercel", "node_modules", "dist", "build", "coverage"]);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) await walk(path.join(directory, entry.name));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.join(directory, entry.name));
    }
  }
}

await walk(process.cwd());
files.sort();

const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    timeout: 15000
  });
  if (result.status !== 0) {
    failures.push({
      file: path.relative(process.cwd(), file),
      output: (result.stderr || result.stdout || "node --check failed").trim()
    });
  }
}

if (failures.length) {
  for (const failure of failures) {
    console.error("\nFAIL: " + failure.file + "\n" + failure.output);
  }
  process.exitCode = 1;
} else {
  console.log("PASS: syntax checked " + files.length + " JavaScript modules");
}
