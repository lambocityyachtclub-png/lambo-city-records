/**
 * ALIVE — LOCAL OWNER HOST STARTER
 *
 * Starts the local owner host from environment configuration. No remote
 * provider is loaded. Proposals must be supplied as task-matched JSON files
 * in the configured local proposal queue.
 */
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createLocalProposalQueueProvider } from "../execution/localProposalQueueProvider.js";
import { createLocalAliveHost } from "./localAliveHost.js";

function requiredEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parseAllowedPaths(value) {
  const paths = value.split(",").map(item => item.trim()).filter(Boolean);
  if (!paths.length) throw new Error("ALIVE_ALLOWED_PATHS must contain at least one explicit project path.");
  return [...new Set(paths)];
}

const repositoryRoot = requiredEnv("ALIVE_REPOSITORY_ROOT");
const reviewDirectory = requiredEnv("ALIVE_REVIEW_DIRECTORY");
const proposalDirectory = requiredEnv("ALIVE_PROPOSAL_DIRECTORY");
const ownerToken = requiredEnv("ALIVE_OWNER_TOKEN");
const ownerId = requiredEnv("ALIVE_OWNER_ID");
const allowedPaths = parseAllowedPaths(requiredEnv("ALIVE_ALLOWED_PATHS"));
const port = process.env.ALIVE_PORT ? Number(process.env.ALIVE_PORT) : 4317;

if (ownerToken.length < 32) throw new Error("ALIVE_OWNER_TOKEN must contain at least 32 characters.");
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("ALIVE_PORT must be an integer from 1 to 65535.");

const proposalProvider = createLocalProposalQueueProvider({
  directory: proposalDirectory,
  repositoryRoot
});

const testCommands = [{
  command: "node",
  args: ["--experimental-default-type=module", "--test", "development/tests/*.test.js"]
}];

const system = await createDevelopmentSystem({
  workerEnabled: true,
  workerRunnerIds: ["world"],
  maxTasksPerRun: 1,
  localExecutionOptions: {
    repositoryRoot,
    reviewDirectory,
    baseRef: "HEAD",
    allowedPaths,
    proposalProvider,
    testCommands
  },
  approvedReviewPublisherOptions: {
    repositoryRoot,
    baseRef: "HEAD",
    allowedPaths,
    testCommands
  }
});

const host = createLocalAliveHost({
  system,
  ownerToken,
  ownerId,
  host: "127.0.0.1",
  port
});

const address = await host.listen();
process.stdout.write(`ALIVE local owner host listening at http://127.0.0.1:${address.port}\n`);
process.stdout.write("Only loopback requests are accepted. Worker execution is one-shot and owner-triggered.\n");

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await host.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
