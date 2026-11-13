import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStaticDependencyGraph } from "./dependencyGraph.mjs";

const DEFAULT_IGNORES = new Set([
  ".git", "node_modules", "vendor", "dist", "build", "coverage",
  ".vercel", ".next", ".cache", ".turbo", "playwright-report",
  "test-results", "blueprint-discovery"
]);
const ALLOWED_EXTENSIONS = new Set([
  ".md", ".mdx", ".txt", ".js", ".mjs", ".cjs", ".html", ".css", ".json", ".yml", ".yaml"
]);
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES = 20000;
const MARKER_PATTERN = /\b(TODO|FIXME|TBD|WIP|INCOMPLETE|PLANNED|FUTURE|DEPRECATED)\b/gi;
const HEADING_PATTERN = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const SECRET_PATH_PATTERN = /(^|\/)\.env(?:\.|$)|(^|\/)(?:secrets?|credentials?)(?:\/|$)|(^|\/)queue(?:\/|$)|private[-_]?queue|token[-_]?store/i;
const SECRET_LINE_PATTERN = /(api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|authorization)\s*[:=]\s*[^,;]+/i;

function normalizeRelativePath(value) {
  return value.split(path.sep).join("/");
}

function isIgnored(relativePath, entryName) {
  if (DEFAULT_IGNORES.has(entryName)) return true;
  if (SECRET_PATH_PATTERN.test(relativePath)) return true;
  if (relativePath.split("/").some(part => part.startsWith(".") && part !== ".github")) return true;
  return false;
}

function pathTokens(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function pathMatchesHint(relativePath, hint) {
  const fileTokens = pathTokens(relativePath);
  const hintTokens = pathTokens(hint);
  if (!hintTokens.length || hintTokens.length > fileTokens.length) return false;
  for (let start = 0; start <= fileTokens.length - hintTokens.length; start += 1) {
    if (hintTokens.every((token, index) => fileTokens[start + index] === token)) return true;
  }
  return false;
}

function isTestPath(relativePath) {
  return /(^|\\/)(?:tests?|__tests__)\\//i.test(relativePath) ||
    /^test-[^/]+\\.(?:mjs|cjs|js)$/i.test(path.posix.basename(relativePath));
}

function classifyFile(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) return null;
  return extension === ".md" || extension === ".mdx" || extension === ".txt"
    ? "documentation"
    : extension === ".json" || extension === ".yml" || extension === ".yaml"
      ? "configuration"
      : "source";
}

function redactLine(line) {
  return line
    .replace(SECRET_LINE_PATTERN, "[REDACTED SENSITIVE VALUE]")
    .replace(/(?:ghp_|github_pat_|sk-)[A-Za-z0-9_-]{12,}/g, "[REDACTED TOKEN]")
    .slice(0, 240);
}

function keywordExpression(keyword) {
  const escaped = [...keyword].map(char => "\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char).join("");
  return new RegExp(escaped, "i");
}

async function walk(rootDir, currentDir = rootDir, output = []) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const absolute = path.join(currentDir, entry.name);
    const relative = normalizeRelativePath(path.relative(rootDir, absolute));
    if (isIgnored(relative, entry.name)) continue;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      await walk(rootDir, absolute, output);
      continue;
    }
    if (!entry.isFile() || !classifyFile(relative)) continue;
    const stat = await fs.stat(absolute);
    if (stat.size > MAX_FILE_BYTES) continue;
    output.push({ absolute, path: relative, bytes: stat.size, kind: classifyFile(relative) });
    if (output.length > MAX_FILES) throw new Error("Repository scan exceeded the 20,000-file safety limit.");
  }
  return output;
}

function analyzeFile(file, content, catalog) {
  const lines = content.split(/\r?\n/);
  const headings = [];
  const markers = [];
  const departmentEvidence = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const heading = rawLine.match(HEADING_PATTERN);
    if (heading && headings.length < 40) {
      headings.push({ level: heading[1].length, title: heading[2].trim().slice(0, 160), line: index + 1 });
    }
    MARKER_PATTERN.lastIndex = 0;
    const markerMatches = [...rawLine.matchAll(MARKER_PATTERN)].map(match => match[1].toUpperCase());
    if (markerMatches.length && markers.length < 30) {
      markers.push({ markers: [...new Set(markerMatches)], line: index + 1, text: redactLine(rawLine.trim()) });
    }
    for (const department of catalog.departments) {
      const matched = department.keywords.some(keyword => keywordExpression(keyword).test(rawLine));
      if (!matched) continue;
      const evidence = departmentEvidence.get(department.id) || [];
      if (evidence.length < 5) {
        evidence.push({ line: index + 1, text: redactLine(rawLine.trim()) });
        departmentEvidence.set(department.id, evidence);
      }
    }
  }

  return {
    path: file.path,
    kind: file.kind,
    bytes: file.bytes,
    headings,
    markers,
    departments: [...departmentEvidence.entries()].map(([id, evidence]) => ({ id, evidence }))
  };
}

export async function discoverBlueprints(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const catalog = options.catalog;
  if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.departments)) {
    throw new Error("A valid version 1 department blueprint catalog is required.");
  }
  const files = await walk(rootDir);
  const inventory = [];
  const dependencyFiles = [];
  for (const file of files) {
    const content = await fs.readFile(file.absolute, "utf8");
    inventory.push(analyzeFile(file, content, catalog));
    dependencyFiles.push({ path: file.path, content });
  }
  const dependencyGraph = buildStaticDependencyGraph(dependencyFiles);

  const departments = catalog.departments.map(department => {
    const evidence = inventory
      .filter(file => file.departments.some(match => match.id === department.id))
      .map(file => ({
        path: file.path,
        kind: file.kind,
        evidence: file.departments.find(match => match.id === department.id).evidence
      }));
    const hintedFiles = inventory
      .filter(file => department.sourceHints.some(hint => pathMatchesHint(file.path, hint)));
    const pathMatchedFiles = [...new Set(hintedFiles.map(file => file.path))].sort();
    const sourcePaths = hintedFiles
      .filter(file => file.kind === "source" && !isTestPath(file.path))
      .map(file => file.path)
      .sort();
    const testPaths = hintedFiles
      .filter(file => isTestPath(file.path))
      .map(file => file.path)
      .sort();
    const documentationPaths = hintedFiles
      .filter(file => file.kind === "documentation")
      .map(file => file.path)
      .sort();
    const configurationPaths = hintedFiles
      .filter(file => file.kind === "configuration")
      .map(file => file.path)
      .sort();
    const keywordEvidenceFiles = [...new Set(evidence.map(item => item.path))].sort();
    const staticallyReachable = new Set(dependencyGraph.reachableFiles);
    const runtimeConnectedSourceFiles = sourcePaths.filter(filePath => staticallyReachable.has(filePath));
    const notStaticallyReachableSourceFiles = sourcePaths.filter(filePath => !staticallyReachable.has(filePath));
    return {
      id: department.id,
      title: department.title,
      purpose: department.purpose,
      specialistIds: [...department.specialistIds],
      status: "discovery-draft",
      sourceFiles: sourcePaths,
      testFiles: testPaths,
      documentationFiles: documentationPaths,
      configurationFiles: configurationPaths,
      pathMatchedFiles,
      keywordEvidenceFiles,
      runtimeConnectedSourceFiles,
      notStaticallyReachableSourceFiles,
      evidence,
      notes: [
        "This is an automatically assembled discovery draft, not an owner-approved specification.",
        "Keyword matches are clues for review, not proof that a feature is implemented or complete.",
        "Cross-department dependencies and implementation status require validation before tasks are created."
      ]
    };
  });

  const masterSources = new Set(catalog.master.sourceFiles);
  const discoveredMasterFiles = inventory
    .filter(file => masterSources.has(file.path))
    .map(file => file.path);
  const totalMatches = departments.reduce((sum, department) => sum + department.evidence.length, 0);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: "discovery-only",
    master: {
      ...catalog.master,
      status: "source-identified-not-yet-reconciled",
      discoveredSourceFiles: discoveredMasterFiles
    },
    dependencyGraph,
    summary: {
      filesScanned: inventory.length,
      documentationFiles: inventory.filter(file => file.kind === "documentation").length,
      sourceFiles: inventory.filter(file => file.kind === "source").length,
      configurationFiles: inventory.filter(file => file.kind === "configuration").length,
      filesWithPlanningMarkers: inventory.filter(file => file.markers.length > 0).length,
      departmentEvidenceMatches: totalMatches,
      departmentCount: departments.length
    },
    departments,
    inventory
  };
}

export function renderBlueprintReport(result) {
  const lines = [
    "# LAMBO CITY ALIVE — Blueprint Discovery Report",
    "",
    "> Automatically generated discovery draft. This report is not an owner-approved specification and does not create development tasks.",
    "",
    "## Master Blueprint",
    "",
    `- Status: ${result.master.status}`,
    `- Sources: ${result.master.discoveredSourceFiles.join(", ") || "Not found"}`,
    "",
    "## Repository Scan",
    "",
    `- Files scanned: ${result.summary.filesScanned}`,
    `- Documentation: ${result.summary.documentationFiles}`,
    `- Source files: ${result.summary.sourceFiles}`,
    `- Configuration files: ${result.summary.configurationFiles}`,
    `- Files with planning markers: ${result.summary.filesWithPlanningMarkers}`,
    "",
    "## Static Dependency Map",
    "",
    `- Source files analyzed: ${result.dependencyGraph.summary.filesAnalyzed}`,
    `- Resolved local references: ${result.dependencyGraph.summary.resolvedEdges}`,
    `- Unresolved local references (non-test sources): ${result.dependencyGraph.summary.unresolvedLocalEdges}`,
    `- Unresolved references inside test fixtures: ${result.dependencyGraph.summary.unresolvedTestFixtures}`,
    `- External references: ${result.dependencyGraph.summary.externalReferences}`,
    `- Root entrypoints: ${result.dependencyGraph.rootEntrypoints.join(", ") || "None detected"}`,
    `- Files statically reachable from those entrypoints: ${result.dependencyGraph.summary.staticallyReachableFiles}`,
    "",
    "**Unresolved local references requiring review:**",
    ...result.dependencyGraph.edges.filter(edge => edge.status === "unresolved-local").slice(0, 40).map(edge => `- ${edge.from} → ${edge.specifier}`),
    ...(result.dependencyGraph.summary.unresolvedLocalEdges ? [] : ["- None detected by static analysis."]),
    "",
    ...result.dependencyGraph.limitations.map(note => `- ${note}`),
    "",
    "## Department Blueprints",
    ""
  ];
  for (const department of result.departments) {
    lines.push(`### ${department.title}`, "", `- ID: ${department.id}`, `- Status: ${department.status}`, `- Specialist coverage: ${department.specialistIds.join(", ") || "Not assigned"}`, `- Path-matched candidate files: ${department.sourceFiles.length}`, `- Keyword-evidence files (review clues): ${department.keywordEvidenceFiles.length}`, `- Path-matched candidates statically reachable: ${department.runtimeConnectedSourceFiles.length}`, "");
    lines.push("**Purpose:** " + department.purpose, "", "**Path-matched candidate files:**");
    if (department.sourceFiles.length) department.sourceFiles.forEach(source => lines.push(`- ${source}`));
    else lines.push("- No matching files found in this scan.");
    lines.push("", "**Keyword-evidence files (not confirmed ownership):**");
    if (department.keywordEvidenceFiles.length) department.keywordEvidenceFiles.forEach(source => lines.push(`- ${source}`));
    else lines.push("- None detected.");
    lines.push("", "**Path-matched files statically reachable from entrypoints:**");
    if (department.runtimeConnectedSourceFiles.length) department.runtimeConnectedSourceFiles.forEach(source => lines.push(`- ${source}`));
    else lines.push("- None detected from the configured entrypoints.");
    lines.push("", "**Review notes:**", ...department.notes.map(note => `- ${note}`), "");
  }
  lines.push("## Safety and Interpretation", "", "- No source files were modified.", "- No development tasks were created or submitted.", "- Private queue, environment, credential, and secret-named paths are excluded.", "- Keyword evidence can produce false positives and false negatives.", "- A human must reconcile source conflicts, confirm current implementation, and approve the resulting department blueprints.", "");
  return lines.join("\n");
}

export async function writeBlueprintDiscovery(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const catalogPath = path.resolve(rootDir, options.catalogPath || "development/blueprints/departmentCatalog.json");
  const outputDir = path.resolve(rootDir, options.outputDir || "development/planning/blueprint-discovery");
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const result = await discoverBlueprints({ rootDir, catalog });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "discovery.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(outputDir, "README.md"), renderBlueprintReport(result), "utf8");
  return { result, outputDir };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const { result, outputDir } = await writeBlueprintDiscovery({
      rootDir: process.argv[2] || process.cwd(),
      outputDir: process.argv[3] || "development/planning/blueprint-discovery"
    });
    process.stdout.write(`LAMBO CITY blueprint discovery complete: ${result.summary.filesScanned} files scanned, ${result.departments.length} department drafts, output: ${outputDir}\n`);
  } catch (error) {
    process.stderr.write(`Blueprint discovery failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
