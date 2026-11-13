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
  "floor2StudioSession.js",
  "alive.html",
  "alive.js",
  "studio.html",
  ".github/workflows/development-engine-tests.yml",
  "api/alive/session.js",
  "api/alive/private-task.js",
  "api/alive/status.js",
  "api/alive/vision.js"
];

const SERVICE_ROOTS = [
  { path: "api/alive/session.js", kind: "serverless-api-root", domain: "alive-api", file: "api/alive/session.js" },
  { path: "api/alive/private-task.js", kind: "serverless-api-root", domain: "alive-api", file: "api/alive/private-task.js" },
  { path: "api/alive/status.js", kind: "serverless-api-root", domain: "alive-api", file: "api/alive/status.js" },
  { path: "api/alive/vision.js", kind: "serverless-api-root", domain: "alive-api", file: "api/alive/vision.js" }
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

async function resolveLocalModule(root, importer, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(root, path.dirname(importer), specifier);
  const candidates = [base, base + ".js", base + ".mjs", path.join(base, "index.js")];
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return path.relative(root, candidate).split(path.sep).join("/");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return null;
}

function findModuleReferences(source) {
  const found = [];
  const patterns = [
    { kind: "transitive-static-import", regex: /\bimport\s+(?:[\s\S]*?\s+from\s*)?["']([^"']+)["']/g },
    { kind: "transitive-re-export", regex: /\bexport\s+(?:[\s\S]*?\s+from\s*)["']([^"']+)["']/g },
    { kind: "transitive-lazy-import", regex: /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g },
    { kind: "worklet-or-asset-reference", regex: /new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g }
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern.regex)) {
      const before = source.slice(0, match.index);
      found.push({
        specifier: match[1],
        kind: pattern.kind,
        line: before.split(/\r?\n/).length
      });
    }
  }
  return found.sort((left, right) => left.line - right.line);
}

async function buildActiveModuleGraph(root, entrypointSources) {
  const main = entrypointSources["main.js"] || "";
  const engine = entrypointSources["engine.js"] || "";
  const roots = [];

  for (const serviceRoot of SERVICE_ROOTS) {
    try {
      const stat = await fs.stat(path.join(root, serviceRoot.path));
      if (stat.isFile()) roots.push({ ...serviceRoot, runtimeDomain: serviceRoot.domain });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  for (const htmlPath of ["alive.html", "studio.html"]) {
    const html = entrypointSources[htmlPath] || "";
    const scriptPattern = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    for (const match of html.matchAll(scriptPattern)) {
      if (!/\btype=["']module["']/i.test(match[0])) continue;
      const target = await resolveLocalModule(root, htmlPath, match[1]);
      if (!target) continue;
      roots.push({
        path: target,
        kind: "registered-html-module-root",
        file: htmlPath,
        line: html.slice(0, match.index).split(/\r?\n/).length,
        runtimeDomain: htmlPath === "studio.html" ? "studio-standalone" : "alive-owner-workspace"
      });
    }
  }

  const workflow = entrypointSources[".github/workflows/development-engine-tests.yml"] || "";
  for (const scriptPath of [
    "scripts/prepare-alive-worker-task.mjs",
    "scripts/validate-alive-worker-diff.mjs"
  ]) {
    if (!workflow.includes(scriptPath)) continue;
    try {
      const stat = await fs.stat(path.join(root, scriptPath));
      if (stat.isFile()) roots.push({
        path: scriptPath,
        kind: "workflow-invoked-script-root",
        file: ".github/workflows/development-engine-tests.yml",
        line: workflow.split(/\r?\n/).findIndex(line => line.includes(scriptPath)) + 1,
        runtimeDomain: "alive-ci-worker"
      });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  const mainLines = main.split(/\r?\n/);
  for (let index = 0; index < mainLines.length; index += 1) {
    const line = mainLines[index];
    const staticImport = line.match(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+)["']/);
    if (staticImport) {
      const keyEntry = mainLines.flatMap((candidate, candidateIndex) => {
        const match = candidate.match(new RegExp("^\\s*(\\w+)\\s*:\\s*" + staticImport[1] + "\\s*,?\\s*$"));
        return match ? [{ key: match[1], line: candidateIndex + 1 }] : [];
      })[0];
      if (keyEntry && engine.includes('initialize("' + keyEntry.key + '"')) {
        const target = await resolveLocalModule(root, "main.js", staticImport[2]);
        if (target) roots.push({
          path: target,
          kind: "registered-static-root",
          file: "main.js",
          line: index + 1,
          registrationLine: keyEntry.line,
          key: keyEntry.key,
          runtimeDomain: "visitor-world"
        });
      }
    }

    const dynamicImport = line.match(/import\(\s*["']([^"']+)["']\s*\)/);
    if (dynamicImport) {
      const target = await resolveLocalModule(root, "main.js", dynamicImport[1]);
      if (!target) continue;
      const key = path.basename(target).replace(/\.[^.]+$/, "");
      const mapped = mainLines.some(candidate => new RegExp("^\\s*" + key + "\\s*:").test(candidate));
      const initialized = main.includes('["' + key + '"');
      if (mapped && initialized) roots.push({
        path: target,
        kind: "registered-lazy-root",
        file: "main.js",
        line: index + 1,
        key,
        runtimeDomain: "visitor-world"
      });
    }
  }

  const referencesByPath = new Map();
  const queue = roots.map(rootEntry => ({ path: rootEntry.path, root: rootEntry, chain: [] }));
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    const visitKey = current.root.runtimeDomain + ":" + current.path;
    if (visited.has(visitKey)) continue;
    visited.add(visitKey);
    const refs = referencesByPath.get(current.path) || [];
    if (current.path === current.root.path) {
      refs.push({
        file: current.root.file,
        line: current.root.line,
        kind: current.root.kind,
        key: current.root.key,
        registrationLine: current.root.registrationLine,
        runtimeDomain: current.root.runtimeDomain,
        rootPath: current.root.path
      });
    }
    referencesByPath.set(current.path, refs);

    const source = await fs.readFile(path.join(root, current.path), "utf8");
    for (const reference of findModuleReferences(source)) {
      const target = await resolveLocalModule(root, current.path, reference.specifier);
      if (!target) continue;
      const targetRefs = referencesByPath.get(target) || [];
      targetRefs.push({
        file: current.path,
        line: reference.line,
        kind: reference.kind,
        viaRoot: current.root.path,
        runtimeDomain: current.root.runtimeDomain
      });
      referencesByPath.set(target, targetRefs);
      if (!visited.has(current.root.runtimeDomain + ":" + target)) {
        queue.push({
          path: target,
          root: current.root,
          chain: current.chain.concat(current.path)
        });
      }
    }
  }
  return { roots, referencesByPath };
}
function classifyReferenceType(sourcePath) {
  const normalized = sourcePath.replaceAll("\\", "/");
  const extension = path.extname(normalized).toLowerCase();
  if (normalized.startsWith("tests/") || normalized.includes("/tests/") ||
      /(^|\/)test-[^/]+\.mjs$/i.test(normalized) ||
      /\.(test|spec)\.(mjs|js)$/i.test(normalized)) return "test-source";
  if (extension === ".md" || extension === ".txt") return "documentation";
  if ([".json", ".yml", ".yaml", ".toml"].includes(extension)) return "configuration";
  if ([".js", ".mjs", ".cjs"].includes(extension)) return "code-module";
  return "asset-or-other";
}
function capabilityStatus(sourcePresent, referenceType, runtimeRefs, testRefs) {
  if (!sourcePresent) return "planned";
  if (referenceType === "documentation") return "documentation-reference";
  if (referenceType === "configuration") return "configuration-reference";
  if (referenceType === "test-source") return "test-source";
  if (referenceType !== "code-module") return "asset-or-other";
  const connected = runtimeRefs.length > 0;
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

  const activeGraph = await buildActiveModuleGraph(root, entrypointSources);
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
      const referenceType = classifyReferenceType(sourcePath);
      const runtimeReferences = activeGraph.referencesByPath.get(sourcePath) || [];
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
      const status = capabilityStatus(Boolean(source), referenceType, runtimeReferences, testReferences);
      inventory.push({
        path: sourcePath,
        referenceType,
        sourcePresent: Boolean(source),
        sourceBytes: source?.length ?? 0,
        runtimeReferences,
        runtimeDomains: [...new Set(runtimeReferences.map(ref => ref.runtimeDomain).filter(Boolean))],
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
      runtimeDomains: [...new Set(inventory.flatMap(item => item.runtimeDomains))],
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
    activeRuntimeRoots: activeGraph.roots,
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
