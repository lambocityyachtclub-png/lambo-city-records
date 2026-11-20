/**
 * Compact, read-only project map passed to ALIVE's proposal provider.
 * Discovery metadata is useful context, never an owner-approved blueprint.
 * Raw file contents and the full inventory are deliberately excluded.
 */
function boundedStrings(value, limit = 100) {
  return Array.isArray(value)
    ? value.filter(item => typeof item === "string").slice(0, limit)
    : [];
}

export function createProposalProjectContext(report) {
  if (!report || typeof report !== "object" || !report.dependencyGraph || !report.summary) {
    return Object.freeze({
      status: "unavailable",
      notes: ["Project discovery metadata was unavailable; use only the isolated allowlisted workspace context."]
    });
  }

  const departments = Array.isArray(report.departments)
    ? report.departments.slice(0, 100).map(department => ({
        id: String(department.id || ""),
        title: String(department.title || ""),
        purpose: String(department.purpose || "").slice(0, 1200),
        status: String(department.status || "discovery-draft"),
        sourceFiles: boundedStrings(department.sourceFiles, 100),
        testFiles: boundedStrings(department.testFiles, 60),
        documentationFiles: boundedStrings(department.documentationFiles, 40),
        configurationFiles: boundedStrings(department.configurationFiles, 40),
        runtimeConnectedSourceFiles: boundedStrings(department.runtimeConnectedSourceFiles, 100),
        notStaticallyReachableSourceFiles: boundedStrings(department.notStaticallyReachableSourceFiles, 100)
      }))
    : [];

  const graph = report.dependencyGraph;
  const unresolvedLocalReferences = Array.isArray(graph.edges)
    ? graph.edges
        .filter(edge => edge?.status === "unresolved-local")
        .slice(0, 80)
        .map(edge => ({
          from: String(edge.from || ""),
          specifier: String(edge.specifier || "")
        }))
    : [];

  const context = {
    status: "discovery-only",
    generatedAt: typeof report.generatedAt === "string" ? report.generatedAt : null,
    ownerApproved: false,
    interpretation: [
      "This is static discovery metadata, not proof of runtime behavior.",
      "Do not infer that a department is complete from path or keyword matches.",
      "Preserve existing entrypoints, object positions, navigation, and working systems unless an owner-approved task explicitly authorizes a change.",
      "Only propose edits inside the separate allowedPaths list."
    ],
    summary: {
      filesScanned: Number(report.summary.filesScanned || 0),
      sourceFiles: Number(report.summary.sourceFiles || 0),
      documentationFiles: Number(report.summary.documentationFiles || 0),
      configurationFiles: Number(report.summary.configurationFiles || 0),
      departmentCount: Number(report.summary.departmentCount || departments.length)
    },
    master: {
      title: String(report.master?.title || "LAMBO CITY"),
      purpose: String(report.master?.purpose || "").slice(0, 1600),
      status: String(report.master?.status || "discovery-draft"),
      sourceFiles: boundedStrings(report.master?.discoveredSourceFiles, 100)
    },
    dependencyGraph: {
      summary: {
        filesAnalyzed: Number(graph.summary?.filesAnalyzed || 0),
        resolvedEdges: Number(graph.summary?.resolvedEdges || 0),
        unresolvedLocalEdges: Number(graph.summary?.unresolvedLocalEdges || 0),
        unresolvedTestFixtures: Number(graph.summary?.unresolvedTestFixtures || 0),
        externalReferences: Number(graph.summary?.externalReferences || 0),
        staticallyReachableFiles: Number(graph.summary?.staticallyReachableFiles || 0)
      },
      rootEntrypoints: boundedStrings(graph.rootEntrypoints, 40),
      reachableFiles: boundedStrings(graph.reachableFiles, 300),
      unresolvedLocalReferences
    },
    departments
  };

  const serialized = JSON.stringify(context);
  if (serialized.length > 160_000) {
    throw new Error("Compact ALIVE project context exceeds its 160 KB safety limit.");
  }
  return Object.freeze(context);
}
