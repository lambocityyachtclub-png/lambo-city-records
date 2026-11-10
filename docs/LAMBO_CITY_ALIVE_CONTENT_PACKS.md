# LAMBO CITY ALIVE — Shared Content Packs and Host Integration

## Purpose

This layer provides a runtime-independent, versioned content-pack contract for Studio and World content. It complements the existing Studio audio asset database and World System district recipe/schema. It does not replace either subsystem or load assets at startup.

## What is implemented

- Versioned manifests with stable asset IDs, supported categories, source/license metadata, compatibility bounds, dependency ranges, byte budgets, cache keys, lazy/eager loading strategy, and optional fallback assets.
- Dependency ordering and validation for missing, incompatible, and cyclic pack dependencies.
- Globally unique asset cache keys; duplicate keys are rejected within a pack or across registered packs.
- Loaded-byte budget enforcement for buffers, native Blob/File values (brand-checked), Studio audio records, JSON recipes, and non-JSON host objects with explicit measured `sizeBytes`; custom file-like objects cannot spoof `size`, recursive wrapper cycles are rejected, JSON measurement is bounded by the declared asset budget and a 16 MiB hard cap, and unsupported payloads fail closed.
- On-demand loading, successful-value caching, concurrent-load deduplication, retry after failure, and declared fallback behavior.
- Studio adapter: resolves `asset:<id>` through the existing injected `StudioAudioAssetStore.get(id)` and returns the original recorded audio record. It does not create or replace the Studio audio database.
- World adapter: resolves `recipe:<id>` through an injected World recipe resolver and requires the existing district validator to return `valid: true` before returning the recipe.
- Verified remote delivery: HTTPS origin allowlist, rejection of embedded URL credentials, manifest SHA-256 integrity, byte-size limit, verification of cached and newly resolved bytes, corrupt-cache eviction, and non-fatal cache errors.
- Separate IndexedDB persistence adapter: lazy open, copied binary records, per-entry limits, quota/error reporting, close behavior, and no access to the Studio audio database.
- Explicit `createContentPackRuntime(options)` composition root connects the catalog to the Studio, World, and remote host adapters when the application host injects those services. Construction itself does not open storage, make network requests, or initialize Three.js.
- Runtime `dispose()` / `close()` clears the catalog cache and closes only an IndexedDB cache instance that the runtime itself created; injected cache instances remain owned by the caller. Disposal is idempotent, public catalog mutation/loading is guarded, and in-flight results are rejected and removed from cache if disposal wins the race.
- Development System exposes guarded views for the Director, Studio runner, worker roster, and specialist execution. Disabling blocks new calls through every exposed task-submission and execution entry point. It does not forcibly abort an operation that was already in flight; any such specialist work remains isolated and cannot merge or deploy automatically.
- Vocal Booth count-in uses a serialized cancellation coordinator: cancellation clears the pending beat timer, a replacement attempt waits for the old attempt to finish cleanup, and Booth/module disposal cancels a pending start.

## Browser validation

The dedicated GitHub Actions workflow `ALIVE Browser Content Cache Checks` runs Playwright against real Chromium and WebKit browser engines, including a WebKit run with an iPad-sized 1024×1366 touch-emulated viewport. The browser test verifies:

- verified bytes are downloaded once and reused from IndexedDB;
- persisted bytes survive closing and reopening the database;
- corrupt cached bytes are detected and replaced;
- oversized-entry rejection does not block delivery of verified content.

The integrated branch browser workflow passed in Chromium, desktop WebKit, and WebKit with the iPad-sized touch-emulated viewport. The World System workflow also passed its full Three.js preview and district-composer checks on desktop and iPad-sized touch-emulated viewports. Browser runs test persistent IndexedDB behavior and oversized-entry rejection; a separate unit test injects a `QuotaExceededError` to verify verified content still returns when a cache write fails. This is not a real device quota measurement. This is automated WebKit coverage, not a physical iPad or the shipping iOS Safari browser. Actual device storage quotas, Safari lifecycle behavior, microphone permission, and GPU/performance characteristics still require a real iPad Safari session.

## Runtime integration boundary

The adapters and composition root are implemented and tested with injected host services. They are not yet wired into the production game startup path. This is intentional: Studio's current store and World System host remain authoritative, and the content catalog must be explicitly opted into by a feature host after compatibility checks. No content pack is automatically downloaded or installed, and no new content is activated merely because the catalog exists.

A safe next integration step is feature-level opt-in:
1. Studio passes its existing `StudioAudioAssetStore` instance to the content runtime only when a Studio content feature requests catalog-backed assets.
2. World passes a resolver for an explicitly registered district recipe plus the existing district validation function; the recipe is not registered or built until the World host requests it.
3. Remote delivery remains disabled unless the host supplies a real SHA-256 implementation, authenticated resolver, explicit HTTPS origin allowlist, and cache policy.
4. Every loaded scene resource remains owned and disposed by the feature module that requested it.

## Current boundaries and outstanding work

- No production runtime wiring or production deployment is included.
- No production CDN, signed asset publisher, marketplace, automatic updater, or sample content pack is configured.
- Authentication, request cancellation/timeouts, and trusted URL resolution remain responsibilities of the host service.
- The IndexedDB browser tests use Playwright WebKit, not the actual iPad Safari app/browser.
- Browser quota tests simulate constrained capacity; they do not predict device-specific quota limits.
- The content catalog is not a substitute for the existing Studio project/session format or World System recipe compiler.
- The module registry remains an isolated prototype and is not yet wired into `engine.js` or `main.js`.

## Validation on this branch

- Development Engine Tests: 127 passed, 0 failed on the integrated branch, including Studio + World composition, cache-key collision rejection, loaded-byte budgets, runtime disposal/abort, disabled-system API guards, spoofed file-like size rejection, cyclic-wrapper rejection, and remote resolver abort.
- Floor 2 Studio Checks: passed, including pitch correction, Vocal Booth/Voice Notes integration, Booth disposal cancellation, recording resource cleanup, and cancel/restart serialization.
- ALIVE Browser Content Cache Checks: Chromium, desktop WebKit, and iPad-sized touch-emulated WebKit passed on the integrated branch.
- World System Checks passed on the unchanged underlying development checkpoint, including full Three.js preview assertions in Chromium. The integrated ALIVE changes do not alter World runtime entrypoints.

## AI-assisted development review

A read-only GitHub Copilot CLI review workflow is included on the isolated ALIVE integration branch. It pins Copilot CLI `1.0.108`, verifies the installed version, receives only `contents: read` and `copilot-requests: write`, and is restricted to this integration branch or a manual dispatch. It runs from the runner temp directory with an explicit empty tool allowlist plus tool denials, streams a bounded prompt through standard input, and publishes a review artifact. It has no repository write, merge, or deployment permission. It requires an active Copilot entitlement for the repository owner; GitHub Actions supplies a short-lived token and no long-lived secret is stored. This is a read-only AI review connection, not autonomous code generation or task execution. The exact npm version is pinned, but its registry integrity digest is not separately locked; this remains a supply-chain hardening follow-up.

## Release policy

This work is a development integration candidate only. Keep the current production deployment and rollback candidate unchanged. Do not merge to `main`, promote a deployment, or enable autonomous code execution until the integrated branch passes its complete CI/browser checks and a human-reviewed release candidate is approved.
