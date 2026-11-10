import { readFile } from "node:fs/promises";
import { validateWorkerChangedFiles } from "../development/automation/specialistWorkerPolicy.js";

const [workerId, fileListPath] = process.argv.slice(2);
if (!workerId || !fileListPath) {
  throw new Error("Usage: node scripts/validate-alive-worker-diff.mjs <worker-id> <changed-files.txt>");
}
const contents = await readFile(fileListPath, "utf8");
const paths = contents.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
const accepted = validateWorkerChangedFiles(workerId, paths);
console.log("ALIVE worker path gate passed for " + workerId + " (" + accepted.length + " files).");
