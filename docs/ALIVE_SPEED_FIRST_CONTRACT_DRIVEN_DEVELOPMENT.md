# ALIVE Speed-First, Contract-Driven Development Charter

**Status:** Founder direction — governing product and engineering principle  
**Date:** 2026-11-25  
**Applies to:** ALIVE core, LAMBO CITY adapters, Three.js world systems, Studio systems, future VR environments, and future third-party developer integrations.

## 1. The central objective

ALIVE is intended to change how software and digital environments are created, connected, maintained, and expanded. It is not merely a code-generation assistant and must not reproduce a slow, conventional feature-by-feature development process.

**Development speed is a core product requirement and competitive advantage.** ALIVE should reduce the time and coordination normally required to understand a project, locate the correct systems, coordinate dependencies, implement related changes, verify behavior, and preserve working results.

The product hypothesis is that reusable, machine-readable Living Contracts can make development faster and safer across existing tools and platforms, including Three.js projects, GitHub repositories, and AI-assisted coding workflows. This is a design objective to validate through working demonstrations, not a claim that the advantage has already been proven.

## 2. Living Contracts are the coordination mechanism

A Living Contract should describe, in machine-readable form where practical:

- **Intent:** what a component or change is meant to accomplish.
- **Ownership and identity:** which project, subsystem, asset, or capability it belongs to.
- **Scope:** what may be inspected or changed.
- **Dependencies:** what it uses, what depends on it, and required execution order.
- **Invariants:** behavior, geometry, interfaces, performance budgets, and user-approved details that must remain intact.
- **Permissions:** what can happen automatically and what requires owner approval.
- **Acceptance criteria:** observable conditions that establish success.
- **Verification:** tests, checks, and evidence required before review.
- **Recovery:** version, rollback, and restoration instructions.
- **Learning/change history:** approved decisions and reusable outcomes, with provenance.

Contracts should be composable and reusable. A project should be able to describe a system once and use that contract to coordinate work across its related components, instead of rebuilding separate processes for each feature.

## 3. The fast development loop

The intended ALIVE workflow is:

1. **Receive intent** in ordinary language or a structured request.
2. **Inspect the project** and resolve the request against existing contracts and actual source files.
3. **Build the dependency graph** and identify protected invariants, affected components, and independent work.
4. **Plan a coordinated batch** rather than treating every file or subsystem as a separate project.
5. **Execute the safe work together** where dependencies permit; parallelize only independent tasks.
6. **Verify automatically** against tests, contracts, performance constraints, and preservation rules.
7. **Present a concise result** with changed files, test evidence, unresolved risks, and owner decisions.
8. **Retain approved learning** so later requests can reuse the verified result.

The loop should be resumable and incremental. ALIVE should reuse existing project knowledge and completed work rather than repeatedly rediscovering or rebuilding it.

## 4. Speed-first engineering rules

- Prefer a small, complete, working vertical slice over a long architecture-only phase.
- Work directly in the repository when authorized; inspect the current source and dependencies first.
- Combine related changes into coherent batches when this reduces integration overhead.
- Reuse existing modules, contracts, assets, tests, and infrastructure before creating replacements.
- Generate plans and implementation artifacts from contracts where feasible.
- Avoid unnecessary meetings, repeated confirmations, duplicate documentation, and manually repeated steps.
- Run the narrowest meaningful checks early, then broader regression checks before integration.
- Surface blockers immediately and continue with independent safe work rather than stopping the entire effort.
- Do not invent multi-day or multi-week schedules as a substitute for beginning implementation. Estimate only after inspecting the actual remaining work; report completed work and evidence, not aspirational timelines.
- A fast path must never silently weaken security, correctness, preservation, or owner control.

## 5. Provider-independent and no-paid-AI baseline

The core ALIVE development workflow must be useful without paid AI inference or paid sandbox services.

**Founder direction: do not activate paid AI services or paid sandbox execution.** Keep those integrations disabled unless the founder separately authorizes a future change.

The baseline should prioritize:

- Deterministic contract parsing, validation, dependency analysis, policy checks, task routing, and state transitions.
- Repository inspection, file indexing, static analysis, test orchestration, and structured reporting using available tools.
- Reusable templates, generators, codemods, and rule-based transformations for well-defined changes.
- Existing free or already-authorized development and CI capabilities, subject to their usage limits.
- Optional provider adapters that can be absent without disabling core contract, inspection, planning, verification, and review functions.
- Local or open-source model adapters only when compatible hardware, licensing, security, and operating costs are understood; they are optional, not a prerequisite.

Do not claim that an unconfigured provider, local model, background worker, or sandbox is operational. Clearly distinguish deterministic automation from model-generated creative reasoning.

## 6. Safe autonomy and owner control

ALIVE should automate the maximum safe amount of work while preserving explicit owner authority.

- Read-only inspection and deterministic checks may run without approval when the host grants access.
- Changes must remain inside declared scopes and permitted workspaces.
- Protected systems, approved landmarks, production settings, credentials, billing, and deployments remain protected.
- Generated changes must be tested and presented with evidence.
- Owner review decisions such as **PERFECT** and **CHANGE** should become structured, traceable feedback.
- No automatic production publishing, merge, deployment, paid service activation, or protected-layout modification without the required authorization.
- Prefer versioned changes, isolated workspaces or branches, backups, and tested rollback paths.
- A Git branch or worktree is a version-control boundary; it must not be described as a hardened security sandbox.

The goal is not uncontrolled self-modification. It is fast, contract-governed development that remains inspectable, reversible, and owner-directed.

## 7. LAMBO CITY is the first proving ground

ALIVE should be designed as a reusable, platform-neutral core with LAMBO CITY as its first host environment. The same contract-driven engine should eventually support:

- Three.js environments and interactive digital worlds.
- Water, waterfronts, roads, sidewalks, architecture, landscaping, lighting, props, and performance systems.
- LAMBO CITY Studio and its modular production interfaces.
- Future VR-ready environments and additional districts.
- External developers' repositories and projects through documented adapters.

For LAMBO CITY, approved geography, object positions, camera behavior, navigation, walking paths, controls, and working sequences are invariants unless the founder explicitly authorizes a change. Improve existing assets and systems before replacing them. Preserve approved HERO performance and other founder-designated perfect features.

## 8. First proof, not a long preliminary program

The next meaningful milestone is a small end-to-end demonstration using the current repository and existing ALIVE foundations:

- Submit one bounded development intent.
- Resolve it to actual contracts, files, dependencies, and protected invariants.
- Produce one coordinated change batch (more than one component when the dependency graph supports it).
- Run available automated checks.
- Show the exact diff, test results, and remaining owner decisions.
- Demonstrate that a failed or rejected proposal does not damage the working project.

Choose a low-risk, non-production example. Do not use a live world landmark or a protected production system merely to demonstrate automation.

Deliver this proof as soon as the current code and available free infrastructure allow. Expand from measured results, not from a fixed multi-week phase plan.

## 9. Measure the speed advantage

ALIVE should collect evidence for:

- Time from intent to verified proposal.
- Number of manual file-navigation and coordination steps avoided.
- Number of components safely coordinated per request.
- Test and regression pass rates.
- Rework caused by missed dependencies or misunderstood contracts.
- Time to recover from a failed proposal.
- Percentage of work completed without paid AI or paid sandbox services.

Compare the contract-driven workflow with a clearly defined manual baseline. Do not advertise speed multipliers until measured.

## 10. Invention and IP record

Maintain dated technical records of the actual mechanisms, including contract schemas, dependency resolution, permission and invariant enforcement, coordinated execution, verification, reversible change handling, and feedback-based reuse.

Preserve design decisions, implementation history, diagrams, test evidence, and authorship/provenance. Treat patentability as an open legal question requiring a qualified prior-art and claim review. This charter records product direction; it does not establish novelty, ownership, patent rights, or a granted patent.

## 11. Definition of progress

Progress is demonstrated by working capabilities in the repository, passing tests, reproducible results, and reduced development time—not by the number of planning documents or the length of a roadmap.

**Founder principle:** Build faster than traditional workflows by making the contracts do the coordination. Build the capability once, reuse it across the platform, preserve what already works, and keep the creator in control.
