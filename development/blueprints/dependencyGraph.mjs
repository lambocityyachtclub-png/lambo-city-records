import path from "node:path";

const CODE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".html", ".css"]);

function cleanSpecifier(value) {
  return value.split(/[?#]/, 1)[0].trim();
}

function isExternal(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}

function candidatePaths(fromPath, specifier) {
  const cleaned = cleanSpecifier(specifier);
  if (!cleaned || isExternal(cleaned)) return [];
  const base = cleaned.startsWith("/")
    ? path.posix.normalize(cleaned.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), cleaned));
  const candidates = [base];
  if (!path.posix.extname(base)) {
    for (const extension of [".js", ".mjs", ".cjs", ".html", ".css", ".json"]) {
      candidates.push(base + extension);
    }
    candidates.push(path.posix.join(base, "index.js"));
  }
  return [...new Set(candidates)];
}

function extractSpecifiers(file) {
  const content = file.content;
  const found = [];
  const add = (pattern, kind) => {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      found.push({ specifier: match[1], kind });
    }
  };

  if (/\.(?:js|mjs|cjs)$/.test(file.path)) {
    add(/\bimport\s+(?:[^"'();]*?\s+from\s*)?["']([^"']+)["']/g, "import");
    add(/\bexport\s+(?:\*|\{[^}]*\})\s+from\s*["']([^"']+)["']/g, "re-export");
    add(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, "dynamic-import");
    add(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, "require");
  } else if (/\.html$/.test(file.path)) {
    add(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi, "html-reference");
  } else if (/\.css$/.test(file.path)) {
    add(/url\(\s*["']?([^"')]+)["']?\s*\)/gi, "css-asset");
    add(/@import\s+["']([^"']+)["']/gi, "css-import");
  }
  return found;
}

export function buildStaticDependencyGraph(files = []) {
  const knownPaths = new Set(files.map(file => file.path));
  const edges = [];
  const externalReferences = [];

  for (const file of files) {
    if (!CODE_EXTENSIONS.has(path.posix.extname(file.path).toLowerCase())) continue;
    for (const item of extractSpecifiers(file)) {
      const specifier = cleanSpecifier(item.specifier);
      if (!specifier) continue;
      if (isExternal(specifier)) {
        externalReferences.push({ from: file.path, specifier, kind: item.kind });
        continue;
      }
      // Bare package names are managed by the host/runtime, not local file edges.
      if (!specifier.startsWith(".") && !specifier.startsWith("/")) continue;
      const candidates = candidatePaths(file.path, specifier);
      const resolved = candidates.find(candidate => knownPaths.has(candidate));
      const isTestSource = /(^|\\/)(?:tests?|__tests__)\\//i.test(file.path) || /(^|\\/)test-[^/]+\\.(?:mjs|cjs|js)$/i.test(file.path);
      edges.push({
        from: file.path,
        to: resolved || null,
        specifier,
        kind: item.kind,
        status: resolved ? "resolved" : isTestSource ? "unresolved-test-fixture" : "unresolved-local"
      });
    }
  }

  const incoming = new Map();
  const outgoing = new Map();
  for (const edge of edges) {
    if (!edge.to) continue;
    const callers = incoming.get(edge.to) || [];
    callers.push(edge.from);
    incoming.set(edge.to, callers);
    const targets = outgoing.get(edge.from) || [];
    targets.push(edge.to);
    outgoing.set(edge.from, targets);
  }

  const rootCandidates = ["index.html", "main.js", "studio.html", "alive.html"];
  const rootEntrypoints = rootCandidates.filter(filePath => knownPaths.has(filePath));
  const reachable = new Set(rootEntrypoints);
  const queue = [...rootEntrypoints];
  while (queue.length) {
    const current = queue.shift();
    for (const target of outgoing.get(current) || []) {
      if (reachable.has(target)) continue;
      reachable.add(target);
      queue.push(target);
    }
  }

  return {
    status: "static-analysis-draft",
    limitations: [
      "Only literal relative/root-relative imports and common HTML/CSS references are analyzed.",
      "Runtime registries, computed paths, CDN-injected modules, worker messaging, and implicit asset loading may not appear.",
      "An edge proves a source reference, not that the dependency is loaded successfully at runtime."
    ],
    summary: {
      filesAnalyzed: files.filter(file => CODE_EXTENSIONS.has(path.posix.extname(file.path).toLowerCase())).length,
      resolvedEdges: edges.filter(edge => edge.status === "resolved").length,
      unresolvedLocalEdges: edges.filter(edge => edge.status === "unresolved-local").length,
      unresolvedTestFixtures: edges.filter(edge => edge.status === "unresolved-test-fixture").length,
      externalReferences: externalReferences.length,
      filesWithCallers: incoming.size,
      rootEntrypoints: rootEntrypoints.length,
      staticallyReachableFiles: reachable.size
    },
    rootEntrypoints,
    reachableFiles: [...reachable].sort(),
    edges,
    externalReferences,
    incoming: [...incoming.entries()]
      .map(([path, callers]) => ({ path, callers: [...new Set(callers)].sort() }))
      .sort((a, b) => a.path.localeCompare(b.path))
  };
}
