import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { validateWorkerChangedEntries } from "../development/automation/specialistWorkerPolicy.js";

const [workerId, fileListPath] = process.argv.slice(2);
if (!workerId || !fileListPath) {
  throw new Error("Usage: node scripts/validate-alive-worker-diff.mjs <worker-id> <changed-files.txt>");
}

const contents = await readFile(fileListPath, "utf8");
const expectedPaths = contents.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
const rawDiff = execFileSync("git", ["diff", "--raw", "--no-abbrev", "HEAD"], {
  encoding: "utf8"
});
const entries = rawDiff.split(/\r?\n/).filter(Boolean).map(line => {
  const tab = line.indexOf("\t");
  if (tab < 0) throw new Error("Could not parse Git change metadata.");
  const metadata = line.slice(0, tab);
  const match = metadata.match(/^:(\d{6}) (\d{6}) [0-9a-f]{40} [0-9a-f]{40} [A-Z][0-9]*$/i);
  if (!match) throw new Error("Could not parse Git file modes for a proposed change.");
  const pathFields = line.slice(tab + 1).split("\t");
  return {
    previousMode: match[1],
    mode: match[2],
    path: pathFields[pathFields.length - 1]
  };
});

const accepted = validateWorkerChangedEntries(workerId, entries);
const expected = [...expectedPaths].sort();
const actual = [...accepted].sort();
if (expected.length !== actual.length || expected.some((path, index) => path !== actual[index])) {
  throw new Error("The Git change metadata does not match the proposed changed-file list.");
}

console.log("ALIVE worker path and file-type gate passed for " + workerId + " (" + accepted.length + " files).");
