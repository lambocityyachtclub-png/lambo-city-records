# LAMBO CITY ALIVE — Foundation Audit and Implementation Blueprint

**Status:** Architecture audit complete; implementation not yet authorized for core-engine changes  
**Audit checkpoint:** `eaadb90fb98ad2f1ba621a4177d0493ad1bb9234`  
**Protected production baseline:** `5f9d0578d4556a68d1cdd927cfcc5d4dba1d84e7`  
**Purpose:** Make LAMBO CITY clean, modular, testable, and safely expandable from the owner's creative direction.

## 1. North Star

LAMBO CITY ALIVE is a living, owner-directed platform. The owner provides creative direction; the development system organizes work, inspects the existing project, proposes focused changes, builds them in isolation, tests them, and prepares them for review.

The platform must grow across two connected product surfaces:

- **LAMBO CITY Studio:** Floor 2 interfaces, MPC sounds, instruments, effects, recording, editing, mixing, mastering, project files, and future creative tools.
- **LAMBO CITY World:** the Yacht Club, waterfront and water, yachts, Convention Center, buildings, streets, districts, interiors, NPCs, events, and future locations.

Expansion must preserve approved visuals and workflows. A new feature should be installable as a bounded module or content package, not require a risky rewrite of the entire application.

## 2. Audit findings at the development checkpoint

### Existing strengths

1. The project already has a shared engine with a consistent `init` / `update` pattern for many systems.
2. Floor 2 Studio is split into station and workflow modules; automated tests cover many critical audio and DAW behaviors.
3. Floor 3 is loaded on demand through dynamic imports and cached after first load. This is a useful precedent for lazy-loaded destinations.
4. The World System has district registration, schema validation, explicit district building, proxy geometry, streaming, route/navigation helpers, gates, and vehicle-road rules.
5. The separate development folder already contains a policy, task director, registry, Studio runner, controlled executor, isolated workspace adapter, storage adapters, and tests.
6. The development policy explicitly separates development infrastructure from the live game and reserves protected actions for owner approval.

### Gaps that prevent the project from being truly self-expanding

1. **Engine registration remains manual.** `main.js` imports and enumerates systems; `engine.js` initializes them through a long hand-maintained sequence. Adding a module still requires central-file edits.
2. **The development engine is a foundation, not an autonomous service.** `developmentSystem.js` explicitly does not start a worker, execute generated code, modify files, or deploy.
3. **Only a Studio specialist runner is registered.** World, NPC, digital-real-estate, and entertainment runners are described in the blueprint but are not yet connected as implemented specialist runners.
4. **The controlled executor has an adapter-contract gap.** It expects `createWorkspace`, `prepareChanges`, and `runTests`, while the low-level isolated workspace adapter originally exposed file operations only. PR #23 adds a separately injected composition adapter to bridge those contracts. A production-grade hosted job runner, trusted planner/test sandbox, and complete review integration are still not connected.
5. **Persistence is optional.** Without a storage adapter, director tasks remain in memory and are not durable across process restarts.
6. **World content and engine plugins are different concerns.** The World System can register district recipes, but that does not yet provide a universal lifecycle registry for every engine module, Studio station, sound pack, and environment asset.
7. **Asset/content discovery needs a shared contract.** The Studio already has an IndexedDB audio asset store for recorded beat/vocal/mix assets, and the World System has a bounded district-recipe compiler and district schema validator. These are useful domain-specific foundations, but there is not yet one versioned content-pack manifest for discovering, validating, loading, caching, and tracking compatibility of sound packs, instruments, building kits, yacht assets, materials, and environment details.

These are architecture findings from source inspection, not claims that every browser runtime behavior has been tested.

## 3. Target architecture

### A. Stable runtime core

Keep the core small and dependable:

- scene, camera, renderer, input, player, collision, audio services;
- lifecycle and module dependency coordinator;
- performance budgets and diagnostics;
- shared context and capability interfaces.

The runtime core should not contain feature-specific business logic. Avoid loading every high-cost feature at initial startup.

### B. Versioned module manifest and lifecycle registry

Each installable runtime module should declare:

- stable ID and semantic version;
- module type and entry point;
- required and optional dependencies;
- capabilities it provides;
- lifecycle methods (`init`, `update`, `dispose`);
- load policy (startup, on-demand, proximity, or user action);
- asset and performance budgets;
- compatibility range and validation metadata.

The registry must reject duplicate IDs, missing required dependencies, incompatible versions, and dependency cycles. Initialization should follow dependency order; disposal should happen in reverse order. Optional modules must fail gracefully without taking down the core.

Do not refactor the existing engine until this contract is proven in isolated tests and a preview.

### C. Content and asset catalog

Create separate, versioned catalogs for:

- Studio sounds, instruments, presets, effects, and demo packs;
- world materials, building components, facade kits, props, lighting recipes, vegetation, and water details;
- yachts, vehicles, NPC appearance/animation sets, and event assets.

Content packs should declare formats, dependencies, licensing/source, size, and compatibility. Loading should be lazy and cache-aware. The core should not preload every sound or high-detail building.

### D. World composition layer

Use the existing district schema and World System as the basis for world content composition. Districts should be made from reusable recipes and bounded parcels. Keep route networks, terrain, access gates, collision, streaming, and decorative detail independently testable.

Never assume new land exists where the current surveyed terrain does not support it. Any land extension, reclamation, bridge, pier, or water fill requires a separate spatial survey and explicit owner approval.

### E. Studio extension layer

Keep the standalone `.lcp` project format independent of Three.js. Floor 2 stations and standalone Studio must use the same production core and session model. New sounds, instruments, and effects should be discoverable through versioned manifests and installed without changing unrelated DAW workflows.

### F. Owner-directed development service

The separate development service should eventually provide:

1. project observation and architecture inventory;
2. improvement discovery and task planning;
3. specialist runners for Studio, World, NPC, Digital Real Estate, and Entertainment;
4. durable task and review storage;
5. isolated branch/workspace creation;
6. restricted file allowlists and policy checks;
7. automated test execution and evidence capture;
8. review queue and human-readable progress reports;
9. explicit owner approval for protected changes;
10. release preparation with rollback references.

This service must remain separate from the live game runtime. Do not give generated code unrestricted production credentials.

## 4. Delivery sequence

### Phase 0 — Protect and inventory
- Preserve production baseline and rollback candidate.
- Record current branch/commit relationships.
- Inventory module entry points, dependencies, assets, test coverage, and duplicate/empty files.
- Keep the existing approved experience unchanged.

### Phase 1 — Module contract proof
- Design a manifest schema and lifecycle registry in an isolated branch. **Prototype opened in PR #23** (`development/engine/moduleLifecycleRegistry.js`).
- Add unit tests for dependency order, cycles, duplicate IDs, missing dependencies, failed initialization, and reverse disposal. **Initial automated coverage passes in PR #23**; lazy-load and engine-compatibility proofs remain open.
- Prove compatibility with a small non-critical module before moving any core system.
- Do not convert all modules in one pass.

### Phase 2 — World and Studio content catalogs
- Define versioned manifests and validators.
- Register one low-risk Studio content pack and one isolated world recipe as proof cases.
- Test lazy loading, cache behavior, missing assets, and graceful fallback.

### Phase 3 — Development-service completion
- Connect durable storage, safe workspace execution, review records, and job orchestration. **PR #23 adds an injected workspace pipeline adapter and tests; it does not yet provide a hosted code-generation planner or sandboxed test runner.**
- Add specialist runners only when their scope, allowed paths, tests, and approval rules are defined.
- Add observability, retries, idempotency, and resumable task states before enabling recurring background work.

### Phase 4 — Controlled expansion
- Expand Floor 2 with new tools and sounds.
- Improve the Yacht Club, water, yachts, Convention Center, and buildings as separately scoped modules.
- Add future locations without loading them all at startup.
- Release in small previewed increments with rollback protection.

## 5. Non-negotiable safety and quality rules

- Production remains untouched during architecture experiments.
- No silent self-modification or automatic production deployment.
- No major architecture change without a separate owner-approved implementation step.
- Every code change is isolated, reviewed, and tested.
- Preserve existing approved UI and world landmarks.
- Prefer small modules and reusable content over giant files.
- Keep initial load light; use lazy loading and streaming.
- Measure performance on both iPad-class mobile hardware and desktop.
- Automated checks are necessary but do not replace browser/device acceptance.
- Do not describe a preview build as proof that the live game works.
- Keep a known-good commit and a documented rollback route for each release.

## 6. Current work queue

| Priority | Work item | Status |
|---|---|---|
| P0 | Protect production and development checkpoint | Recorded |
| P0 | Audit engine registration and development service | Complete at source-inspection level |
| P1 | Prove universal module manifest/lifecycle registry in isolation | Prototype + automated tests in PR #23; awaiting review and hardening |
| P1 | Inventory all module imports, dependencies, empty files, and load costs | In progress |
| P1 | Validate Studio PR #20 automated workflow and preview | Automated workflow passed; browser microphone acceptance pending |
| P2 | Build versioned Studio sound/instrument/effect catalog | Shared manifest/catalog and injected Studio asset-store adapter prototype in PR #25; no production connection |
| P2 | Build reusable world content/recipe catalog | Shared manifest/catalog and injected World recipe resolver + district validator adapter prototype in PR #25; no production connection |
| P2 | Add World/NPC/Real Estate/Entertainment specialist runners | Planned |
| P3 | Connect durable hosted task orchestration and review | Partial pipeline adapter prototype in PR #23; hosted orchestration and sandboxing still require design |
| P3 | Begin controlled location-by-location world expansion | Planned |

## 7. What counts as done

A milestone is not complete merely because code compiles. It must have:

- a focused change set and clear ownership;
- automated tests covering normal and failure paths;
- a successful isolated preview build;
- no unintended production changes;
- documented limitations and rollback point;
- a consolidated browser review for user-visible behavior.

The owner should only be asked to test the browser experience at meaningful consolidated milestones, not after every small code change.

---

**Latest implementation update:** PR #25 adds the shared versioned content-pack catalog and injected Studio/World host-adapter contracts. GitHub Actions passed 100 automated development tests on the latest PR #25 code, including remote content origin and SHA-256 integrity failure cases. The catalog remains metadata-only until a trusted host supplies loaders; it does not download, install, or preload content. Existing Studio IndexedDB and World district recipe/schema remain authoritative and unchanged.

**Immediate next step:** review the combined PR #23–#25 foundation, then separately design trusted asset integrity, delivery, and cache persistence. Keep the current engine and production runtime unchanged until compatibility is proven in an isolated preview.
