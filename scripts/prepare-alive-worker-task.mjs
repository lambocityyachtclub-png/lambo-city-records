import { readFile, writeFile } from "node:fs/promises";
import { buildSpecialistPrompt, validateWorkerTask } from "../development/automation/specialistWorkerPolicy.js";

const [taskPath, promptPath, metadataPath] = process.argv.slice(2);
if (!taskPath || !promptPath || !metadataPath) {
  throw new Error("Usage: node scripts/prepare-alive-worker-task.mjs <task.json> <prompt.md> <metadata.json>");
}
const source = await readFile(taskPath, "utf8");
if (Buffer.byteLength(source, "utf8") > 20000) {
  throw new Error("Queued task file exceeds the 20 KB limit.");
}
const task = validateWorkerTask(JSON.parse(source));
await writeFile(promptPath, buildSpecialistPrompt(task), "utf8");
await writeFile(metadataPath, JSON.stringify({
  id: task.id,
  workerId: task.workerId,
  workerName: task.workerName,
  title: task.title,
  priority: task.priority
}, null, 2) + "\n", "utf8");
console.log("Validated ALIVE task " + task.id + " for " + task.workerName + ".");
