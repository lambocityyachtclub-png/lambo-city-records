# LAMBO CITY ALIVE — Shared Content Packs and Host Integration

## Purpose

This layer provides a runtime-independent, versioned content-pack contract for Studio and World content. It complements the existing Studio audio asset database and World System district recipe/schema. It does not replace either subsystem or load assets at startup.

## What is implemented

- Versioned manifests with stable asset IDs, supported categories, source/license metadata, compatibility bounds, dependency ranges, byte budgets, cache keys, lazy/eager loading strategy, and optional fallback assets.
- Dependency ordering and validation for missing, incompatible, and cyclic pack dependencies.
- On-demand loading, successful-value caching, concurrent-load deduplication, retry after failure, and declared fallback behavior.
- Studio adapter: resolves `asset:<id>` through the existing injected `StudioAudioAssetStore.get(id)` and returns the original recorded audio record. It does not create or replace the Studio audio database.
- World adapter: resolves `recipe:<id>` through an injected World recipe resolver and requires the existing district validator to return `valid: true` before returning the recipe.
- Verified remote delivery: HTTPS origin allowlist, manifest SHA-256 integrity, byte-size limit, verification of cached and newly resolved bytes, corrupt-cache eviction, and non-fatal cache errors.
- Separate IndexedDB persistence adapter: lazy open, copied binary records, per-entry limits, quota/error reporting, close behavior, and no access to the Studio audio database.
- Explicit `createContentPackRuntime(options)` composition root connects the catalog to the Studio, World, and remote host adapters when the application host injects those services. Construction itself does not open storage, make network requests, or initialize Three.js.
- Runtime `dispose()` / `close()` clears the catalog cache and closes only an IndexedDB cache instance that the runtime itself created; injected cache instances remain owned by the caller. Disposal is idempotent and later registration/loading is rejected.

## Browser validation

The dedicated GitHub Actions workflow `ALIVE Browser Content Cache Checks` runs Playwright against real Chromium and WebKit browser engines, including a WebKit run with an iPad-sized 1024×1366 touch-emulated viewport. The browser test verifies:

- verified bytes are downloaded once and reused from IndexedDB;
- persisted bytes survive closing and reopening the database;
- corrupt cached bytes are detected and replaced;
- a cache-capacity failure does not block delivery of verified content.

The integrated branch browser workflow passed in Chromium, desktop WebKit, and WebKit with the iPad-sized 1024×1366 touch-emulated viewport. Browser runs test persistent IndexedDB behavior and oversized-entry rejection; a separate unit test injects a `QuotaExceededError` to verify verified content still returns when a cache write fails. This is automated WebKit coverage, not a physical iPad or the shipping iOS Safari browser. Actual device storage quotas, Safari lifecycle behavior, microphone permission, and GPU/performance characteristics still require a real iPad Safari session.

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

- Development Engine Tests: 120 passed, 0 failed, including one combined runtime test proving Studio audio and validated World recipes can be loaded through the same opt-in catalog runtime.
- ALIVE Browser Content Cache Checks: Chromium, WebKit desktop, and WebKit iPad-sized touch-emulated viewport passed on the integrated branch.
- The browser checks ran on the content-catalog branch before this documentation-only integration-validation branch was created.
- A fresh combined integration run is required on the new branch before considering the ALIVE foundation chain ready for the development branch.

## AI-assisted development review

A read-only GitHub Copilot CLI review workflow is included on the isolated ALIVE integration branch. It receives only `contents: read` and `copilot-requests: write`, is restricted to this integration branch or a manual dispatch, and streams its bounded review prompt through standard input and publishes a review artifact. The prompt treats source diffs as untrusted data and does not grant shell, file-edit, repository-write, merge, or deployment tools. It requires an active Copilot entitlement for the repository owner; GitHub Actions supplies a short-lived token and no long-lived secret is stored. This is an AI review connection, not autonomous code generation or task execution.

## Release policy

This work is a development integration candidate only. Keep the current production deployment and rollback candidate unchanged. Do not merge to `main`, promote a deployment, or enable autonomous code execution until the integrated branch passes its complete CI/browser checks and a human-reviewed release candidate is approved.
