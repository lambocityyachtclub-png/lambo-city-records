# LAMBO CITY ALIVE — Shared Content Pack Contract

This layer is a runtime-independent metadata catalog. It complements, rather than replaces, the existing Studio IndexedDB audio asset store and World System district recipe/schema. It does not change either subsystem or load assets at startup.

## Pack manifest

A pack declares:

- `id`, semantic `version`, and a supported `category`;
- optional pack dependencies with semantic version ranges;
- app compatibility bounds;
- source publisher/license/attribution;
- performance budgets;
- assets with stable IDs, category, byte size, loading strategy, source locator, license, cache key, and optional fallback.

Supported categories include audio, instrument, effect, preset, building, environment, vehicle, yacht, water, material, animation, NPC, venue, recipe, and other.

## Loading and safety

`createContentPackCatalog({ appVersion, loader })` registers and validates metadata. Registration performs no downloads. `loadAsset(packId, assetId)` is the only operation that invokes the injected host loader. Successful values are cached by cache key; concurrent requests share one in-flight load; failed loads are retryable. A declared fallback can be attempted if the primary host loader fails.

The loader is a host capability. Remote URL assets must declare a SHA-256 digest in the manifest. The supplied host adapter rejects non-HTTPS or non-allowlisted origins and requires an injected integrity verifier to approve the resolved bytes before returning them. The resolver must also enforce authentication, storage permissions, and cancellation policy. The catalog intentionally does not fetch URLs itself, open IndexedDB, access the filesystem, or create Three.js objects.

## Existing system adapters

- Studio audio: a future host adapter can resolve `studio-audio-store` locators through the existing `StudioAudioAssetStore.get(assetId)`. The store remains authoritative for recorded beat/vocal/mix blobs and project ownership.
- World System: a future host adapter can resolve `world-recipe` locators against existing district recipe definitions and continue using `validateDistrict` before any district is registered or built.
- Three.js runtime: a future feature-specific loader can create scene resources only after the relevant district/interface is requested, and must dispose those resources with its owning module.

These adapters are intentionally not connected in this prototype. No existing recording, project-file, district, or engine behavior changes.

## Current limits

This is a tested manifest/catalog contract and injected loading seam, not a hosted CDN, asset marketplace, remote content manager, signed pack installer, or automatic updater. It has no production asset URLs or bundled sample packs. It must be integrated behind explicit owner review after real host adapters and asset integrity checks exist.

## Host adapter proof

`development/content/contentPackHostAdapters.js` adds an explicit dispatcher for the existing systems:

- `studio-audio-store` resolves `asset:<id>` through an injected `StudioAudioAssetStore.get(id)` and returns the existing stored audio record. It does not create another IndexedDB database.
- `world-recipe` resolves `recipe:<id>` through an injected recipe resolver and requires the existing district validator to return `valid: true` before returning the recipe.
- `url` and `host` sources require separately injected resolvers. The adapter intentionally does not fetch arbitrary URLs; the trusted URL resolver must enforce origin allowlists and integrity verification.

These are adapter contract proofs with injected services, not a connection to production Studio or World runtime. The host chooses when to construct and pass the adapter to the catalog.

## Verified delivery and persistent cache service

`createVerifiedRemoteContentLoader` is a separate host service that can be injected as the URL resolver for the catalog adapter. It requires:

- an explicit HTTPS origin allowlist;
- a resolver that returns bytes;
- a SHA-256 provider that computes a digest from those bytes;
- optionally, a persistent cache implementing `get(key)`, `set(key, bytes)`, and `delete(key)`.

The service verifies every cache hit before reuse, evicts corrupt cache entries, enforces a maximum byte size, verifies downloaded bytes against the manifest digest before caching, and never writes unverified bytes to persistence. The cache interface is intentionally storage-agnostic: a browser host may later implement it with IndexedDB or Cache Storage, while tests use an in-memory adapter. This prototype does not create a database or choose a storage quota policy.

The resolver and digest provider are trusted host dependencies. A production resolver must handle authentication, request cancellation, network timeouts, and approved CDN configuration; the digest provider must calculate real SHA-256 over the returned bytes. The service itself does not assume browser globals or perform network requests.

## Composing the verified loader with the catalog host adapter

The verified remote loader can be supplied as the URL resolver in `createContentPackHostLoader`. The host adapter's integrity callback should call the same trusted SHA-256 provider against the returned byte array and expected manifest digest. This intentionally keeps policy layers explicit: the verified loader owns allowlisted resolution and persistent-cache verification; the catalog adapter remains the common source-kind dispatcher. The host must supply the real digest implementation and persistent cache implementation, and must not substitute a callback that simply returns `true`.

A browser implementation can provide a persistent cache backed by IndexedDB or Cache Storage, but that concrete storage choice is deliberately outside this runtime-independent module. The existing Studio audio asset database remains separate and is not repurposed as a general CDN cache.

## Validation update

The verified delivery/cache service is covered by the development CI suite. Latest completed run: 107 tests passed, 0 failed. This includes composition through the catalog host adapter, persistent cache hits, corrupt-cache eviction, origin allowlisting, byte-size enforcement, and tamper rejection. The cache is still an injected interface; no browser database or production CDN integration has been created.

## Explicit runtime composition

`createContentPackRuntime(options)` is the opt-in composition root. It connects the catalog to the existing host adapter and, when both are supplied, the verified remote loader. It exposes catalog operations and a service-capability snapshot. Constructing it does not open a database, make a network request, or initialize a Three.js scene. Studio, World, remote delivery, persistent cache, and generic host capabilities are supplied independently by the application host. The service snapshot makes missing adapters visible instead of silently substituting fake implementations.
