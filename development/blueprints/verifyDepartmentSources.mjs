import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BLUEPRINT_ROOT = path.join(ROOT, "development/blueprints");
const OUTPUT = path.join(ROOT, "development/planning/department-source-verification");
const ENTRYPOINTS = [
  "main.js",
  "engine.js",
  "worldSystemHost.js",
  "worldSystemRuntime.js",
  "floor2StudioNavigation.js",
  "floor2StudioSession.js"
];

async function readText(relativePath) {
  try {
    return await fs.readFile(path.join(ROOT, relativePath), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function lineHits(source, needle) {
  if (!source || !needle) return [];
  const lines = source.split(/\r?\n/);
  const hits = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].includes(needle)) {
      hits.push({ line: index + 1, excerpt: lines[index].trim().slice(0, 180) });
    }
  }
  return hits;
}

function sourceInventory(document) {
  const section = document.split("## 3. Current source inventory")[1]?.split("## 4. Non-goals")[0];
  if (!section) throw new Error("Department document is missing its source inventory.");
  return [...section.matchAll(/- `([^`]+)`/g)].map(match => match[1]);
}

function capabilityStatus(sourcePresent, runtimeRefs, testRefs) {
  if (!sourcePresent) return "planned";
  if (runtimeRefs.length && testRefs.length) return "tested";
  if (runtimeRefs.length) return "connected";
  return "source-only";
}

export async function buildDepartmentSourceVerification(root = ROOT) {
  const blueprintSet = JSON.parse(await fs.readFile(
    path.join(root, "development/blueprints/blueprintSet.json"), "utf8"
  ));
  const entrypointSources = {};
  for (const file of ENTRYPOINTS) {
    try {
      entrypointSources[file] = await fs.readFile(path.join(root, file), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      entrypointSources[file] = "";
    }
  }
  const allEntrypointText = Object.entries(entrypointSources)
    .map(([file, source]) => ({ file, source }));

  const departments = [];
  for (const department of blueprintSet.departments) {
    const document = await fs.readFile(path.join(root, department.path), "utf8");
    const inventory = [];
    for (const sourcePath of sourceInventory(document)) {
      let source;
      try {
        source = await fs.readFile(path.join(root, sourcePath), "utf8");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        source = null;
      }
      const basename = path.basename(sourcePath);
      const symbol = basename.replace(/\.[^.]+$/, "");
      const runtimeReferences = [];
      for (const entrypoint of allEntrypointText) {
        const hits = lineHits(entrypoint.source, basename);
        for (const hit of hits) {
          runtimeReferences.push({ file: entrypoint.file, line: hit.line, excerpt: hit.excerpt });
        }
      }
      const testReferences = [];
      if (source) {
        const testRoots = ["tests", "scripts", "development/tests"];
        for (const testRoot of testRoots) {
          const directory = path.join(root, testRoot);
          let entries = [];
          try {
            entries = await fs.readdir(directory, { withFileTypes: true });
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
          }
          for (const entry of entries) {
            if (!entry.isFile() || !/\.(?:test|spec)\.(?:mjs|js)$|^test-.*\.mjs$/i.test(entry.name)) continue;
            const testPath = path.posix.join(testRoot, entry.name);
            const testSource = await fs.readFile(path.join(root, testPath), "utf8");
            const hits = lineHits(testSource, basename);
            if (hits.length) {
              testReferences.push({
                file: testPath,
                lines: hits.slice(0, 4).map(hit => hit.line)
              });
            }
          }
        }
      }
      const status = capabilityStatus(Boolean(source), runtimeReferences, testReferences);
      inventory.push({
        path: sourcePath,
        sourcePresent: Boolean(source),
        sourceBytes: source?.length ?? 0,
        runtimeReferences,
        testReferences,
        status,
        testResult: testReferences.length ? "test-source-found-result-not-inferred" : "no-direct-test-reference-found",
        runtimeDeviceVerification: "not-verified",
        confidence: runtimeReferences.length && testReferences.length ? "medium" : "low"
      });
    }
    const counts = inventory.reduce((result, item) => {
      result[item.status] = (result[item.status] || 0) + 1;
      return result;
    }, {});
    departments.push({
      id: department.id,
      title: department.title,
      blueprintStatus: department.status,
      ownerApproved: department.ownerApproved === true,
      sourceCountDeclared: department.sourceCount,
      sourceCountInspected: inventory.length,
      counts,
      capabilities: inventory
    });
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceCommit: process.env.GITHUB_SHA || null,
    verificationPolicy: {
      sourcePresenceIsNotCompletionProof: true,
      importOrRegistrationIsNotRuntimeProof: true,
      testFilePresenceIsNotPassingTestProof: true,
      physicalDeviceValidationRequired: true,
      ownerApprovalRequiredForTaskAuthorization: true,
      runtimeDeviceVerificationDefault: "not-verified"
    },
    entrypointsInspected: ENTRYPOINTS,
    departments
  };
}

function renderMarkdown(report) {
  const lines = [
    "# LAMBO CITY Department Source Verification",
    "",
    "- Generated: " + report.generatedAt,
    "- Source commit: " + (report.sourceCommit || "local/unavailable"),
    "- Departments: " + report.departments.length,
    "- This is static source evidence, not proof of runtime/device behavior.",
    ""
  ];
  for (const department of report.departments) {
    lines.push("## " + department.title + " (" + department.id + ")");
    lines.push("");
    lines.push("- Blueprint status: " + department.blueprintStatus);
    lines.push("- Owner approved: " + department.ownerApproved);
    lines.push("- Inspected source references: " + department.sourceCountInspected + "/" + department.sourceCountDeclared);
    lines.push("- Capability counts: " + Object.entries(department.counts).map(([key, value]) => key + "=" + value).join(", "));
    lines.push("");
    lines.push("| Source | Present | Static runtime reference | Direct test reference | Classification |");
    lines.push("|---|---:|---:|---:|---|");
    for (const item of department.capabilities) {
      const runtime = item.runtimeReferences.map(ref => ref.file + ":" + ref.line).join(", ") || "—";
      const tests = item.testReferences.map(ref => ref.file + ":" + ref.lines.join(",")).join(", ") || "—";
      lines.push("| `" + item.path + "` | " + (item.sourcePresent ? "yes" : "no") + " | " + runtime + " | " + tests + " | " + item.status + " |");
    }
    lines.push("");
  }
  lines.push("## Interpretation rules", "");
  lines.push("- `source-only`: source exists but no direct entrypoint reference was found.");
  lines.push("- `connected`: source is referenced by an inspected runtime entrypoint; this does not prove it runs correctly.");
  lines.push("- `tested`: a direct test-source reference was found as well as an entrypoint reference; the test result is not inferred.");
  lines.push("- `planned`: cited source path is absent.");
  lines.push("- `runtime-verified` is never assigned by this static scanner.");
  lines.push("- Test file presence is not evidence that the test passed; CI results must be read separately.");
  return lines.join("\n") + "\n";
}

async function main() {
  const report = await buildDepartmentSourceVerification();
  await fs.mkdir(OUTPUT, { recursive: true });
  await fs.writeFile(path.join(OUTPUT, "department-source-verification.json"), JSON.stringify(report, null, 2) + "\n");
  await fs.writeFile(path.join(OUTPUT, "department-source-verification.md"), renderMarkdown(report));
  const summary = report.departments.map(department => ({
    id: department.id,
    sourceCount: department.sourceCountInspected,
    counts: department.counts
  }));
  process.stdout.write(JSON.stringify({ output: OUTPUT, departments: summary }, null, 2) + "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
