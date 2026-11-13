# LAMBO CITY — Master Blueprint (Draft v1)

**Status:** Draft for owner review — not an approved replacement for existing owner-authored blueprints  
**Authority:** Owner-authored North Star and Master City Blueprint remain primary source documents  
**Generated from:** Blueprint Discovery + source-linked Reconciliation register  
**Rule:** A source file or keyword match is evidence to inspect, not proof that a player-facing capability is complete.

## 1. Purpose and hierarchy

LAMBO CITY is a cinematic, luxury coastal digital destination built around music, entertainment, vehicles, waterfront life, the Yacht Club, Records HQ and memorable visitor experiences. The goal is to make the existing world feel coherent, finished and alive—not to rebuild working systems or add features for their own sake.

This Master Blueprint establishes shared direction and boundaries. Ten independent Department Blueprints own their own implementation inventories, roadmaps, dependencies and acceptance criteria:

1. Water & Environment
2. Jumbotron & Events
3. LAMBO CITY Radio
4. Studio & Music
5. Convention Center
6. World & Districts
7. Vehicles & Yachts
8. People & Experiences
9. Performance & Quality (cross-cutting)
10. Security & Release (cross-cutting)

Departments may progress independently through stable interfaces. Cross-department dependencies must be explicit. A department may not silently take ownership of another department's systems.

## 2. Source authority and conflict handling

Preserve, do not overwrite, the existing owner-authored sources:
- `LAMBO_CITY_NORTHSTAR.md` — creative vision, current priorities, protected landmarks, performance philosophy and Version 1 definition.
- `LAMBO_CITY_MASTER_BLUEPRINT.md` — city spatial plan, protected anchors, street/shoreline rules and district module contract.
- `LAMBO_CITY_WORLD_PLAN.md` — current single-player world scope and non-goals.
- Existing specialist blueprints such as `CONFERENCE_CENTER_COMPLETION_BLUEPRINT.md`, `LAMBO_CITY_DAW_ARCHITECTURE.md`, and `FLOOR2_STUDIO_EXPERIENCE.md`.

When sources disagree, record both sources, describe the exact ambiguity, and mark the item `owner-decision-required`. Do not silently choose the newest file, infer consent, or turn a discovery match into a requirement.

## 3. Shared non-negotiable rules

### Preserve before extending
1. Inspect the current implementation, assets, registration and runtime behavior before proposing a change.
2. Preserve approved landmarks, layouts, interfaces and working behavior.
3. Prefer the smallest modular change that completes or connects existing work.
4. Do not duplicate an existing system merely to make a new department easier to implement.
5. Do not move protected landmarks to solve a surrounding circulation problem; fix the surrounding map first.

### Technology and modularity
- Preserve the existing Three.js 0.160.0 and modular JavaScript approach for the world.
- Do not introduce React, TypeScript, a bundler or a new world framework without explicit owner approval.
- Keep feature ownership clear and expose narrow interfaces between departments.
- Load heavyweight experiences only when needed; avoid unnecessary real-time lights, particles, duplicate geometry and always-on processing.
- The standalone Studio and Floor 2 Studio must share one production core and project format, not become separate DAWs.

### Device and experience quality
- Desktop, iPad Safari and mobile touch are first-class targets.
- Maintain clear navigation, safe interactions, readable controls and accessible alternatives where practical.
- Performance, cleanup and regression testing are part of each feature—not a final optional polish pass.

## 4. Protected world anchors

Treat these as protected unless the owner explicitly authorizes a change:
- Records HQ and its established floor layouts
- Existing yacht, Yacht Club, marina and dock
- Boardwalk and existing stores
- Grand Stage and existing Jumbotron/stage systems
- Existing street/map foundation and established district geometry

The North Star's journey—city, boardwalk/stores, marina, Yacht Club/dock, yacht/waterfront, VIP areas, water activity, Grand Stage and HERO performance—is a circulation guideline, not a requirement to force the world into a straight line.

## 5. Visitor-facing scope and ALIVE boundary

**Draft boundary requiring owner confirmation:** the visitor-facing Version 1 world remains a single-player experience and must not require ALIVE, an AI provider, a hosted worker, a database, commerce, payments, accounts, multiplayer or online persistence to load and explore.

ALIVE is a separate development and maintenance system. It may inspect source, prepare proposals, run permitted tests and present review packages. It must remain optional to the live game. The source plans contain different statements about game backend exclusions and hosted ALIVE infrastructure; this boundary is therefore retained as an explicit owner-review item rather than treated as already approved.

## 6. Business and future expansion guardrails

- Commerce planning does not authorize live checkout, payment credentials or real transactions.
- Digital real estate is a future concept, not a live ownership, rental, transfer or presale product. Customer rights and legal/operating model require separate decisions.
- Accounts, multiplayer, persistent shared-world services, crypto and an in-game economy remain outside the current single-player phase unless separately approved.
- No paid provider, hosting upgrade, production release, domain/DNS change, billing action or security-secret change may be made without explicit approval.

## 7. ALIVE blueprint and task authority

Every blueprint record must distinguish:
- **Implementation:** present, partial, planned, future, blocked or conflict.
- **Verification:** source-reviewed, automated-tests-passed, runtime-not-verified, owner-decision-required or not-started.
- **Confidence:** high, medium or low, supported by cited source paths and locators.

A blueprint draft is not a task authorization. ALIVE must not auto-submit work from draft records. Only owner-approved roadmap items may enter the Vision Intake Planner / Development Director flow, and every implementation proposal remains subject to the established review and release gates.

## 8. Shared department contract

Each department owns:
- A defined mission and explicit non-goals.
- A current-state inventory with source path and locator.
- A clear distinction between implemented, partial, planned, future and unknown.
- Modular ownership boundaries and public integration points.
- Upstream/downstream dependencies.
- A phased roadmap with prerequisites.
- Testable acceptance criteria and device/performance checks.
- Open decisions and owner approval gates.

Cross-cutting departments publish standards and validation services; they do not take over feature ownership.

## 9. Master-level open decisions

1. Confirm the explicit separation between the visitor-facing single-player game and ALIVE development infrastructure.
2. Confirm no additional business transactions or digital-property rights are introduced without separate approval.
3. Resolve source conflicts only through explicit owner decisions, preserving original source documents.
4. Approve each Department Blueprint independently before it becomes authoritative.

## 10. Version 1 success

A visitor can enter, understand and explore LAMBO CITY; move naturally between major destinations; discover the waterfront, Yacht Club, Records HQ and Grand Stage; and experience a coherent digital destination. The existing world feels complete and intentional. The goal is cohesion, not feature count.

**Final North Star:** protect the foundation, connect the world, finish the landmarks, make the journey make sense, and do not build for the sake of building.
