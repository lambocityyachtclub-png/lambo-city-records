# LAMBO CITY World Expansion Loading Guide

## Purpose

Keep the initial world responsive on iPad and desktop as LAMBO CITY grows. New districts and optional destinations should not increase startup work until a player requests them.

## Current verified loading arrangement

- The core world, dock, boardwalk, player, collision, camera, renderer, and essential navigation systems are registered during startup.
- Floor 3 executive modules are dynamically imported only when the elevator requests Floor 3.
- The rooftop VIP module is dynamically imported only when the elevator requests the rooftop.
- Destination load promises are cached, so repeated visits reuse the same in-flight/completed load rather than importing and initializing duplicate copies.
- A failed destination load clears its cached promise, allowing a later retry.
- Floor 3 checks the scene and required module exports before registration, then verifies its architecture roots are attached before marking the floor ready.
- Floor 3 and rooftop systems are attached to the live engine registry so their update methods participate in the existing engine loop after loading.

## Rules for future district modules

1. Keep essential traversal systems eager: player input, movement, collision, camera, scene, renderer, and the minimum world geometry needed to navigate safely.
2. Load optional districts, interiors, event spaces, and high-detail decorative layers on demand, using dynamic `import()`.
3. Cache each destination's load promise. Do not create a second copy when a player revisits or taps a destination repeatedly.
4. On failure, clear the rejected promise so the player can retry; show an actionable loading error rather than reporting a false arrival.
5. Validate module exports before registering them. Initialize only after the live scene exists.
6. Make visual initialization idempotent by checking for an existing named scene root before attaching another copy.
7. Register successfully loaded systems into the existing engine registry and keep the shared context synchronized.
8. Do not lazy-load collision or navigation data required to reach a destination. Preload those dependencies before enabling access.
9. Dispose of event listeners, geometries, materials, textures, and audio only when a future unload lifecycle is explicitly implemented and verified.
10. Keep Floor 2 Studio and its production workflow independent from world-district loading. Do not split or defer Studio modules as part of district expansion without a separate approved task.

## Cycle 5 completion boundary

The current Floor 3/rooftop demand-loading path already provides the required foundation: deferred imports, promise caching, retry after failure, live-system registration, and readiness checks. This cycle records the reusable expansion contract without rewriting the working elevator, navigation, Studio, or core startup path.

## Final validation checklist

- Initial entry still loads the core world and controls.
- Floor 3 loads on first selection, reports ready only after its scene roots attach, and reuses the same scene on return.
- Rooftop loads on first selection and does not duplicate its root on return.
- A failed optional-destination import can be retried.
- WASD/touch movement, dock-to-boardwalk collision, camera, and elevator navigation remain unchanged.
- Floor 2 Studio opens and its existing recording/playback workflow remains unchanged.
- Compare performance-monitor readings in the same device/browser and viewport before and after the full release; do not treat a single FPS sample as a benchmark.
