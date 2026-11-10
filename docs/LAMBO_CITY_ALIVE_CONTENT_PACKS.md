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

The loader is a host capability and must enforce its own origin allowlist, authentication, integrity/hash verification, storage permissions, and cancellation policy. The catalog intentionally does not fetch URLs itself, open IndexedDB, access the filesystem, or create Three.js objects.

## Existing system adapters

- Studio audio: a future host adapter can resolve `studio-audio-store` locators through the existing `StudioAudioAssetStore.get(assetId)`. The store remains authoritative for recorded beat/vocal/mix blobs and project ownership.
- World System: a future host adapter can resolve `world-recipe` locators against existing district recipe definitions and continue using `validateDistrict` before any district is registered or built.
- Three.js runtime: a future feature-specific loader can create scene resources only after the relevant district/interface is requested, and must dispose those resources with its owning module.

These adapters are intentionally not connected in this prototype. No existing recording, project-file, district, or engine behavior changes.

## Current limits

This is a tested manifest/catalog contract and injected loading seam, not a hosted CDN, asset marketplace, remote content manager, signed pack installer, or automatic updater. It has no production asset URLs or bundled sample packs. It must be integrated behind explicit owner review after real host adapters and asset integrity checks exist.
