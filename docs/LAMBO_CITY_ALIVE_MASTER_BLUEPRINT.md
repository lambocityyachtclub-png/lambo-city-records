# LAMBO CITY ALIVE — Master Blueprint

**Status:** Foundational architecture plan  
**Purpose:** Make LAMBO CITY a continuously expandable game, creative platform, and digital world that grows from the owner's directions without destabilizing the experiences already approved.

## 1. Product vision

LAMBO CITY ALIVE is a living, modular world. The owner directs what should be created and improved; the development system translates those directions into isolated, reviewable modules, tests them, and prepares browser previews. New content must build on the existing world and preserve its approved visual identity and workflows.

The system may automate content creation and integration preparation, but it must never silently rewrite protected core systems or publish unverified changes.

## 2. Non-negotiable principles

- Preserve approved live experiences and designs. Do not redesign something the owner has called perfect.
- Production remains protected. Work on dedicated branches and preview deployments; merge or deploy only after automated checks and an explicit release decision.
- Every change must be reversible, traceable, and scoped.
- Prefer independent modules over edits to shared core files.
- Lazy-load locations, floors, interfaces, and expensive assets when appropriate.
- Performance is a feature: support iPad and desktop, avoid unnecessary lights, geometry, network requests, and startup work.
- Use the existing Three.js 0.160.0 CDN architecture unless a deliberate, separately approved migration is justified.
- Do not add paid infrastructure or services without approval.
- Do not invent land, shoreline, or access. Site expansion requires surveyed bounds and an approved land strategy.
- Generated content must follow LAMBO CITY's established luxury art direction and reusable design standards.

## 3. Target architecture

### A. Stable runtime core
Owns scene, camera, renderer, input, player, shared audio, collision, lifecycle, performance monitoring, and world services. Core changes are rare, reviewed, and backward-compatible where possible.

### B. Module registry and lifecycle
Evolve the current manual engine registration toward a manifest-driven registry. Each module should declare:
- Stable module ID and version.
- Dependencies and optional capabilities.
- Initialization and update lifecycle.
- Lazy-load policy and activation trigger.
- Resource ownership and disposal behavior.
- Performance tier and platform requirements.
- Tests and compatibility expectations.

A module should be independently loadable, testable, replaceable, and removable without breaking unrelated modules.

### C. Content and asset library
Create reusable, versioned libraries for architectural components, materials, water details, yachts, vegetation, lighting recipes, sound packs, instruments, effects, animation, vehicles, and environmental props. New content should compose approved assets rather than duplicate bespoke implementations.

### D. Direction-to-build workflow
Owner direction -> structured specification -> module/content generation -> isolated branch -> static and automated tests -> preview deployment -> browser review -> approved integration -> production release with rollback candidate.

No automatic production publishing. The owner remains the creative director and release authority.

### E. World and location system
Treat each district and major location as a bounded module with reusable recipes, asset manifests, interaction definitions, streaming/LOD rules, and spatial constraints. Buildings, water features, yacht experiences, and the Convention Center should be independently expandable.

## 4. Floor 2 Studio expansion

The standalone Studio and in-world Floor 2 Studio must continue sharing one production core and project format. Floor 2 interfaces should register as stations or tools rather than create separate DAWs.

Target stations and workflow:
1. Editing
2. MPC
3. Piano / City Synth
4. Vocal Booth
5. Beat Lab
6. Mix & Master

After the approved interfaces are stable, expansion should be modular:
- Instrument and sound-pack discovery.
- New synths, kits, presets, and sample libraries.
- Vocal and mix effects.
- Recording, editing, routing, and mastering tools.
- Session templates and genre workflows.
- Collaborative session capabilities with explicit permissions.

Preserve the approved MPC interface, Edit design, session transport, and existing workflows. Talkback to remote collaborators is a separate connected-session capability; local sidetone is not equivalent to shared talkback.

## 5. Living world expansion

Initial location families:
- Yacht Club, marina, docks, boardwalk, yachts, and waterfront.
- Records HQ and all floors.
- Grand Stage and event spaces.
- Convention Center and Arena District.
- Future residential, retail, recreation, sports, and motors districts.

Each location should have:
- A spatial/site specification and collision boundaries.
- Reusable building and environment recipes.
- Material, lighting, audio, and interaction definitions.
- Streaming and level-of-detail behavior.
- Device performance budgets.
- Automated structural and runtime checks.

Water and yacht improvements must respect actual terrain and shoreline. The existing visual water plane is not proof of buildable land. Do not extend land, add bridges, fill water, or create piers without a surveyed plan and owner approval.

## 6. Quality and testing gates

Every proposed module should pass relevant checks before preview:
- Syntax, import, and dependency checks.
- Module manifest and lifecycle validation.
- Duplicate ID and registration detection.
- Resource cleanup and disposal checks.
- Unit and integration tests.
- Scene attachment and collision checks where applicable.
- Asset loading and missing-file checks.
- Performance budgets and startup-work checks.
- Browser automation on representative desktop and mobile viewports where available.
- Regression checks for protected locations and workflows.

A successful build is not proof of correct browser behavior. Preview runtime and real-device limitations must be reported honestly. The owner can perform one consolidated browser review after technical validation.

## 7. Release and change control

- Production baseline and rollback candidate remain protected.
- Do not merge large overlapping branches independently.
- Separate releases by risk and product area: Studio, HERO/social, world foundation, then new districts and activities.
- Keep draft proposals separate from production-ready changes.
- Require explicit release approval before production deployment.
- Record what changed, what was tested, what remains unverified, and how to roll back.

## 8. Current architectural observations

From the inspected development checkpoint:
- `main.js` manually imports and registers a large set of modules.
- `engine.js` manually initializes systems in a long sequence.
- Floor 3 already uses dynamic imports and destination-triggered loading, providing a useful existing pattern.
- `worldSystemHost.js` exposes a district registration/build interface and is a foundation for controlled world expansion.
- `worldStreaming.js` already separates detailed visuals and far proxies for the Arena landmark.
- The next structural improvement is to formalize module manifests, lifecycle, dependency checks, and lazy activation without changing the protected live experience.

These observations are a starting audit, not a claim that the whole repository has passed a clean-code review.

## 9. Phased roadmap

1. **Foundation audit:** map modules, imports, dependencies, initialization order, shared state, asset paths, tests, and performance-sensitive code.
2. **Module lifecycle foundation:** design and test a registry/manifest in isolation; migrate a small low-risk module first.
3. **Studio expansion foundation:** validate all approved Floor 2 interfaces and shared production-core boundaries; then add content through station modules.
4. **World content foundation:** standardize recipes and manifests for buildings, water, yachts, and district assets.
5. **Location-by-location growth:** improve the Yacht Club, HQ, Convention Center, and other places in isolated increments.
6. **Creator workflow:** turn owner directions into versioned specifications, generated modules, automated validation, and previews.
7. **Scale:** add new districts, activities, collaborative experiences, and richer environmental simulation as the foundation proves stable.

## 10. Definition of done

LAMBO CITY ALIVE is ready to scale when a new interface, sound pack, building, yacht feature, or location can be added as a bounded module; discovered and loaded through the registry; tested automatically; previewed without disturbing production; and integrated without requiring unrelated changes to the engine or existing locations.

The goal is not code that changes itself without supervision. The goal is a dependable creative development system that builds from the owner's directions, protects what already works, and makes each next expansion easier than the last.
