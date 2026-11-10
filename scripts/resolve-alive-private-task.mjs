import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "lambocityyachtclub-png";
const REPOSITORY = "lambo-city-alive-control";
const PRIVATE_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const TASK_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;

export async function resolvePrivateTaskPointer(pointer, token, fetchImpl = fetch) {
  if (!pointer || typeof pointer !== "object" || Array.isArray(pointer) ||
      Object.keys(pointer).sort().join(",") !== "id,privateQueue" ||
      typeof pointer.id !== "string" || !TASK_ID.test(pointer.id)) {
    throw new Error("Invalid private ALIVE queue pointer.");
  }
  const queue = pointer.privateQueue;
  if (!queue || typeof queue !== "object" ||
      queue.owner !== OWNER ||
      queue.repo !== REPOSITORY ||
      queue.branch !== PRIVATE_BRANCH ||
      queue.path !== "development/queue/incoming/" + pointer.id + ".json") {
    throw new Error("Private ALIVE queue pointer is outside the approved repository scope.");
  }
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("The private ALIVE queue read credential is not configured.");
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28"
  };
  const root = "https://api.github.com/repos/" + OWNER + "/" + REPOSITORY;
  const repositoryResponse = await fetchImpl(root, { headers });
  if (!repositoryResponse.ok) throw new Error("Private ALIVE queue repository could not be verified.");
  const repository = await repositoryResponse.json();
  if (repository.private !== true || repository.archived === true || repository.disabled === true) {
    throw new Error("ALIVE owner tasks must remain in a private repository.");
  }

  const branchUrl = root + "/branches/" + encodeURIComponent(PRIVATE_BRANCH);
  const branchResponse = await fetchImpl(branchUrl, { headers });
  if (!branchResponse.ok) throw new Error("Private ALIVE queue branch is unavailable.");

  const path = queue.path.split("/").map(encodeURIComponent).join("/");
  const fileUrl = root + "/contents/" + path + "?ref=" + encodeURIComponent(PRIVATE_BRANCH);
  const fileResponse = await fetchImpl(fileUrl, { headers });
  if (!fileResponse.ok) throw new Error("Private ALIVE task could not be retrieved.");
  const file = await fileResponse.json();
  if (file.type !== "file" || file.encoding !== "base64" || typeof file.content !== "string") {
    throw new Error("Private ALIVE task file has an unsupported format.");
  }

  let task;
  try {
    const raw = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf8");
    task = JSON.parse(raw);
  } catch {
    throw new Error("Private ALIVE task file is not valid JSON.");
  }
  if (task?.id !== pointer.id || task?.workerId !== "vision-planning") {
    throw new Error("Private ALIVE task does not match its public pointer.");
  }
  return task;
}

async function main() {
  const [pointerPath, outputPath] = process.argv.slice(2);
  if (!pointerPath || !outputPath || process.argv.length !== 4) {
    throw new Error("Usage: resolve-alive-private-task.mjs <pointer-file> <output-file>");
  }
  const output = resolve(outputPath);
  const tempRoot = resolve("/tmp") + sep;
  if (!isAbsolute(outputPath) || !output.startsWith(tempRoot)) {
    throw new Error("Private task output must be written under /tmp.");
  }
  const pointer = JSON.parse(await readFile(pointerPath, "utf8"));
  const task = await resolvePrivateTaskPointer(
    pointer,
    process.env.ALIVE_PRIVATE_QUEUE_READ_TOKEN
  );
  await writeFile(output, JSON.stringify(task, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  process.stdout.write("Resolved private ALIVE task " + task.id + " without logging its contents.\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(String(error?.message || "Private ALIVE task resolution failed.") + "\n");
    process.exitCode = 1;
  });
}
