import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = path.join(ROOT, "development/planning/department-source-verification");
const ENTRYPOINTS = [
  "main.js",
  "engine.js",
  "worldSystemHost.js",
  "worldSystemRuntime.js",
  "floor2StudioNavigation.js",
  "floor2StudioSession.js"
];

function lineHits(source, predicate) {
  if (!source) return [];
  return source.split(/\r?\n/).flatMap((line, index) =>
    predicate(line) ? [{ line: index + 1, excerpt: line.trim().slice(0, 180) }] : []
  );
}

function sourceInventory(document) {
  const section = document.split("## 3. Current source inventory")[1]?.split("## 4. Non-goals")[0];
  if (!section) throw new Error("Department document is missing its source inventory.");
  return [...section.matchAll(/- \x60([^\x60]+)\x60/g)].map(match => match[1]);
}

function runtimeEvidenceFor(sourcePath, entrypointSources) {
  const basename = path.basename(sourcePath);
  const main = entrypointSources["main.js"] || "";
  const engine = entrypointSources["engine.js"] || "";
  const evidence = [];
  const lines = main.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const staticImport = line.match(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+["']\.\/([^"']+)["']/);
    if (staticImport && path.basename(staticImport[2]) === basename) {
      evidence.push({ file: "main.js", line: index + 1, kind: "static-import", symbol: staticImport[1] });
      const registration = lines.flatMap((candidate, candidateIndex) => {
        const match = candidate.match(new RegExp("^\\s*(\\w+)\\s*:\\s*" + staticImport[1] + "\\s*,?\\s*$"));
        return match ? [{ key: match[1], line: candidateIndex + 1 }] : [];
      })[0];
      if (registration) {
        evidence.push({ file: "main.js", line: registration.line, kind: "registerSystems-entry", key: registration.key });
        const engineHit = lineHits(engine, candidate => candidate.includes('initialize("' + registration.key + '"'))[0];
        if (engineHit) evidence.push({ file: "engine.js", line: engineHit.line, kind: "engine-initialize", key: registration.key });
      }
    }
    const dynamicImport = line.includes('import("./' + basename + '")') ||
      line.includes("import('./" + basename + "')");
    if (dynamicImport) {
      evidence.push({ file: "main.js", line: index + 1, kind: "lazy-import" });
      const key = basename.replace(/\.[^.]+$/, "");
      const systemMapping = lineHits(main, candidate => new RegExp("^\\s*" + key + "\\s*:").test(candidate))[0];
      const initOrder = lineHits(main, candidate => candidate.includes('["' + key + '"'))[0];
      if (systemMapping) evidence.push({ file: "main.js", line: systemMapping.line, kind: "lazy-system-mapping", key });
      if (initOrder) evidence.push({ file: "main.js", line: initOrder.line, kind: "lazy-initialization-order", key });
    }
  }
  return evidence;
}

function capabilityStatus(sourcePresent, runtimeRefs, testRefs) {
  const connected = runtimeRefs.some(ref =>
    ref.kind === "engine-initialize" ||
    (ref.kind === "lazy-system-mapping" && runtimeRefs.some(item => item.kind === "lazy-initialization-order"))
  );
  if (!sourcePresent) return "planned";
  if (connected && testRefs.length) return "tested";
  if (connected) return "connected";
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
      const runtimeReferences = runtimeEvidenceFor(sourcePath, entrypointSources);
      const testReferences = [];
      if (source) {
        for (const testRoot of ["tests", "scripts", "development/tests"]) {
          const directory = path.join(root, testRoot);
          let entries = [];
          try {
            entries = await fs.readdir(directory, { withFileTypes: true });
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
          }
          for (const entry of entries) {
            if (!entry.isFile() || !(/\.(test|spec)\.(mjs|js)$/i.test(entry.name) || /^test-.*\.mjs$/i.test(entry.name))) continue;
            const testPath = path.posix.join(testRoot, entry.name);
            const testSource = await fs.readFile(path.join(root, testPath), "utf8");
            const hits = lineHits(testSource, line => line.includes(basename));
            if (hits.length) testReferences.push({ file: testPath, lines: hits.slice(0, 4).map(hit => hit.line) });
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
        confidence: status === "tested" ? "medium" : "low"
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
    lines.push("## " + department.title + " (" + department.id + ")", "");
    lines.push("- Blueprint status: " + department.blueprintStatus);
    lines.push("- Owner approved: " + department.ownerApproved);
    lines.push("- Inspected source references: " + department.sourceCountInspected + "/" + department.sourceCountDeclared);
    lines.push("- Capability counts: " + Object.entries(department.counts).map(([key, value]) => key + "=" + value).join(", "), "");
    lines.push("| Source | Present | Runtime registration evidence | Direct test reference | Classification |");
    lines.push("|---|---:|---:|---:|---|");
    for (const item of department.capabilities) {
      const runtime = item.runtimeReferences.map(ref => ref.file + ":" + ref.line + " (" + ref.kind + ")").join(", ") || "—";
      const tests = item.testReferences.map(ref => ref.file + ":" + ref.lines.join(",")).join(", ") || "—";
      lines.push("| \x60" + item.path + "\x60 | " + (item.sourcePresent ? "yes" : "no") + " | " + runtime + " | " + tests + " | " + item.status + " |");
    }
    lines.push("");
  }
  lines.push("## Interpretation rules", "");
  lines.push("- \x60source-only\x60: source exists but no complete registration path was found.");
  lines.push("- \x60connected\x60: an inspected entrypoint import and registration/initialization path was found; this does not prove it runs correctly.");
  lines.push("- \x60tested\x60: a direct test-source reference and registration path were found; passing test results are not inferred.");
  lines.push("- \x60planned\x60: cited source path is absent.");
  lines.push("- \x60runtime-verified\x60 is never assigned by this static scanner.");
  lines.push("- Test file presence is not evidence that a test passed; CI results must be read separately.");
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
