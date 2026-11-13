# LAMBO CITY ALIVE — Master and Department Blueprint Discovery

## Purpose

LAMBO CITY uses one Master Blueprint with independent Department Blueprints underneath it. The Master Blueprint carries the shared vision, standards, protected decisions, architecture rules and long-term direction. Each department blueprint owns its own scope, source references, development roadmap, acceptance criteria and explicit relationships to other departments.

This is a read-only discovery foundation. It does not replace the existing North Star, city master plan, Studio blueprint, Conference Center blueprint or other owner-authored material.

## Blueprint hierarchy

### Master Blueprint

The initial master sources are:

- `LAMBO_CITY_NORTHSTAR.md` — overall creative vision, current priorities, protected landmarks, development philosophy and launch definition.
- `LAMBO_CITY_MASTER_BLUEPRINT.md` — city spatial plan, protected anchors, district standards and geometry requirements.

These documents serve different purposes and must both be preserved. If their scope or instructions appear to conflict, ALIVE should flag the conflict for owner review rather than silently choosing one.

### Department Blueprints

The version 1 catalog defines these independent departments:

1. Water & Environment
2. Jumbotron & Events
3. LAMBO CITY Radio
4. Studio & Music
5. Convention Center
6. World & Districts
7. Vehicles & Yachts
8. People & Experiences
9. Performance & Quality
10. Security & Release

Performance & Quality and Security & Release are cross-cutting departments. They establish shared standards for all other departments rather than owning a single in-world destination.

The catalog records current specialist coverage, but this is not a claim that every department already has a dedicated worker. In particular, Radio and Jumbotron & Events currently share coverage from existing specialists. Dedicated specialist roles can be considered after the department scopes and actual code boundaries are discovered.

## Read-only discovery tool

Run from the repository root with Node.js 22:

```sh
node development/blueprints/discoverBlueprints.mjs
```

Optional arguments:

```sh
node development/blueprints/discoverBlueprints.mjs <repository-root> <output-directory>
```

The tool reads the versioned catalog, scans eligible repository text files, and writes:

- `development/planning/blueprint-discovery/discovery.json` — machine-readable file inventory and department evidence.
- `development/planning/blueprint-discovery/README.md` — readable discovery summary.

The scanner uses built-in Node.js modules only. It does not call a model provider, database, GitHub API, Vercel service or external network.

## What it discovers

- Candidate documentation, source and configuration files.
- Markdown headings and planning markers such as TODO, FIXME, TBD, WIP and FUTURE.
- Department keyword evidence with source file paths and line numbers.
- Candidate source files suggested by the department catalog.
- Basic repository inventory counts.

The first pass is intentionally deterministic. It uses keywords and file paths as clues, not as a substitute for understanding the implementation. Results may contain false positives and may miss concepts described using different language.

## Safety boundaries

- Discovery never writes to source files.
- Discovery never creates or submits Development Director tasks.
- Every department result is labelled `discovery-draft`.
- Generated results are not owner-approved requirements.
- Environment files, secret/credential-named paths, private queue paths, dependency folders, build outputs and symlinks are excluded.
- File reads are limited to supported text extensions and files no larger than 1 MiB.
- Evidence lines are bounded and common credential-like assignments and token patterns are redacted.
- The scanner does not execute repository code.

## Runtime reachability review

The static dependency graph starts from the repository's visitor and standalone entrypoints when present: `index.html`, `main.js`, `studio.html`, and `alive.html`. It follows resolved literal local edges and reports which candidate department files are reachable through those edges.

A file not listed as reachable is **not** automatically unused or broken. It may be loaded by a computed path, runtime registry, script injection, worker, CDN integration, or another dynamic mechanism. The report therefore uses the wording "not statically reachable" and never treats absence from this graph as permission to remove a file.

The CI workflow publishes the generated JSON and Markdown report as a short-lived seven-day artifact so the actual findings can be reviewed without committing generated inventories or changing the application.

## Static dependency map

The discovery report also includes a conservative static dependency map for literal relative/root-relative JavaScript imports, dynamic imports, CommonJS requires, HTML `src`/`href` references, and CSS `url()`/`@import` references.

Each local edge is marked resolved only when its target is present in the scanned file inventory. Missing local targets from non-test source files are reported separately from intentionally unresolved references inside test fixtures. External CDN references are listed separately; bare package names are not treated as repository files.

Department path-matched files are split into code candidates, test candidates, documentation references, and configuration references. Path matches are still candidates for review, not authoritative ownership. Keyword matches are supporting clues only and are never counted as confirmed source ownership. Path hints use whole filename/path tokens rather than loose substrings, preventing matches such as "road" inside "roadmap". The catalog deliberately avoids treating general audio infrastructure as a dedicated Radio product implementation.

This map is an aid for review, not a complete runtime dependency graph. It cannot reliably infer computed paths, dynamic registries, script injection, Three.js scene registration, event-driven relationships, or dependencies loaded through runtime data. Those relationships still require source and runtime inspection.

## Required next steps after discovery

1. Review the generated source inventory and confirm each department's relevant files.
2. Compare existing documentation, source comments and actual implementation. Do not infer completion from a file name or keyword match.
3. Identify duplicate, overlapping or conflicting instructions and preserve their source references.
4. Record each department's current capabilities, incomplete work, future ideas, blocked decisions and explicit dependencies.
5. Draft department-specific acceptance criteria and modular boundaries.
6. Have the owner approve the Master Blueprint and each department blueprint before treating them as authoritative.
7. Only after approval, connect selected roadmap items to the existing Vision Intake Planner and Development Director.

## Completion definition for this milestone

This milestone is complete only when the discovery code and tests pass, all ten departments are represented in the catalog, and the generated report clearly distinguishes source evidence from approved direction. It does not mean the department blueprints are fully authored, every source file has been reconciled, or ALIVE can independently implement every natural-language request. Those are later milestones.
