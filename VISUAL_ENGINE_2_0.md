# LAMBO CITY Visual Engine 2.0

## Purpose

Evolve the existing Three.js 0.160.0 renderer into a modular, performance-aware visual platform. This is an upgrade to the current engine, not a replacement for it.

## Non-negotiable preservation rules

- Keep the existing Three.js CDN / native ES-module architecture.
- Do not move or rebuild established world geography, buildings, docks, marina, stage, Records HQ, floors, or approved objects.
- Do not change camera framing, player movement, joystick controls, collision, elevator behavior, Studio workflows, HERO performance choreography, or NPC behavior as part of renderer work.
- Do not add heavy effects to initial load without measured benefit.
- Keep adaptive or expensive quality features opt-in until tested on iPad Safari and desktop.
- Keep production untouched until the owner has reviewed and approved the branch.

## Engine layers

1. **Renderer and quality management**
   - Centralized resolution profiles.
   - Optional adaptive resolution driven by measured frame rate.
   - Resize/orientation handling.
   - WebGL context-loss awareness.
   - Existing ACES tone mapping and exposure remain the visual baseline.

2. **Diagnostics and profiling**
   - Existing ?perf=1 overlay remains available.
   - On-demand scene audit reports scene object counts, geometry/material/texture counts, texture slots/color spaces, named objects, lights, renderer capabilities, and performance snapshot.
   - Diagnostics must not run full scene traversal every frame.

3. **Materials and texture quality**
   - Audit current material types, texture use, color-space declarations, and anisotropy.
   - Improve only through shared, reversible helpers and measured device testing.
   - Avoid global material replacement or unreviewed changes to approved assets.

4. **Lighting and shadows**
   - Retain the existing lighting design as the baseline.
   - Add controlled, explicitly enabled shadow support only after caster/receiver tagging and performance budgets are defined.
   - Prefer emissive/baked glow over multiplying real-time point lights.
   - Limit expensive shadow-casting lights.

5. **Water and reflections**
   - Preserve current ocean placement, dimensions, color identity, and wave motion.
   - Evaluate reflection techniques against iPad GPU cost before adoption.
   - No full-scene real-time reflection pass by default.

6. **Atmosphere and sky**
   - Preserve the established sunset/night palette and skyline composition.
   - Improve depth, haze, cloud movement, and atmospheric transitions without relocating sky objects or obscuring landmarks.
   - Any time-of-day transition must be reversible and performance-budgeted.

7. **Optional advanced rendering**
   - Evaluate bloom, selective glow, ambient occlusion, and cinematic post-processing as opt-in layers.
   - No full-screen post-processing chain in the default path unless it proves stable on iPad Safari.

## Current implementation

- visualEngine.js: centralized performance / balanced / high pixel-ratio profiles; opt-in adaptive resolution; resize handling; WebGL context-loss/restoration handling; status and reset controls.
- visualEngineDiagnostics.js: on-demand read-only scene and renderer report, exposed as window.__lamboCityVisualDiagnostics.getReport().
- visualEngineMaterials.js: opt-in texture anisotropy controls with baseline restoration, reversible per-material polished/satin/matte/chrome presets, and explicit object/group batch apply/restore helpers; default texture and material settings remain untouched.
- visualEngineAtmosphere.js: reversible fog presets plus smooth, delta-time-based transitions through window.__lamboCityAtmosphere.transitionTo(name, seconds); the current scene fog is captured as the baseline, and transitions are idle unless explicitly requested.
- visualEngineColor.js: reversible renderer tone-mapping and exposure controls, exposed as window.__lamboCityVisualColor; existing ACES / exposure values are captured and left unchanged by default.
- visualEnginePostProcessing.js: optional Unreal Bloom post-processing. The composer and Three.js example modules are dynamically loaded only after an explicit enableBloom() request; the default render path remains the direct renderer path. Bloom can be tuned or disabled to return to the standard renderer.
- visualEngineShadows.js: opt-in directional shadow pipeline. At scene initialization it discovers only meshes already explicitly tagged with castShadow/receiveShadow by their feature modules; shadows remain disabled until deliberately enabled. Enabling requires at least one caster, receiver, and directional light, defaults to a maximum of 24 active casters (hard cap 64), supports explicit per-mesh priority, and restores the original mesh, light-shadow, and renderer settings when disabled. Groups/named objects can also be registered manually; point-light shadows are excluded.
- lighting.js: registers the existing sun with the shadow controller without enabling shadows or changing the default lighting.
- water.js: reversible water surface and shimmer/reflection-layer presets plus two explicitly opt-in reflection paths: low-resolution cube-map environment reflections on the existing MeshStandardMaterial, and a throttled planar Reflector layer. Both remain disabled by default; cube-map reflections default to 128px per face / 3 seconds, while planar reflections default to 128px / 3 seconds / 0.18 opacity. Both clamp their quality settings, and either path disables the other to avoid stacking reflection costs.
- sky.js: reversible cloud, star, and moon-glow controls plus optional slow cloud drift, exposed as window.__lamboCitySkyVisuals; cloud drift is disabled by default, and baseline restoration returns clouds to their original positions.
- performanceMonitor.js: existing optional ?perf=1 overlay and renderer metrics.
- engine.js / main.js: register and initialize the Visual Engine modules without changing the existing scene feature modules.

## Development inspection controls

Open the development preview with `?perf=1` to show the existing performance overlay.

Browser-console inspection commands:

```js
window.__lamboCityVisualEngine.getStatus()
window.__lamboCityVisualDiagnostics.getReport()
window.__lamboCityVisualMaterials.getReport()
window.__lamboCityVisualMaterials.setTextureAnisotropy(4)
window.__lamboCityVisualMaterials.restoreTextureAnisotropy()
window.__lamboCityAtmosphere.getStatus()
window.__lamboCityAtmosphere.transitionTo("sunsetHaze", 4)
window.__lamboCityAtmosphere.transitionTo("baseline", 3)
window.__lamboCityVisualColor.getStatus()
window.__lamboCityVisualPostProcessing.getStatus()
await window.__lamboCityVisualPostProcessing.enableBloom({
  strength: 0.35,
  radius: 0.3,
  threshold: 0.88
})
window.__lamboCityVisualPostProcessing.setBloom({
  strength: 0.4,
  radius: 0.35,
  threshold: 0.9
})
window.__lamboCityVisualPostProcessing.disableBloom()
window.__lamboCityWaterVisuals.getStatus()
window.__lamboCityWaterVisuals.setEnvironmentReflection(true, {
  resolution: 128,
  refreshIntervalSeconds: 3,
  intensity: 0.45
})
window.__lamboCityWaterVisuals.setEnvironmentReflection(false)
await window.__lamboCityWaterVisuals.setPlanarReflection(true, {
  resolution: 128,
  refreshIntervalSeconds: 3,
  opacity: 0.18
})
await window.__lamboCityWaterVisuals.setPlanarReflection(false)
window.__lamboCitySkyVisuals.getStatus()
window.__lamboCitySkyVisuals.setCloudDrift(true, 0.12)
window.__lamboCitySkyVisuals.setCloudDrift(false)
window.__lamboCitySkyVisuals.restoreBaseline()
window.__lamboCityVisualShadows.getStatus()
window.__lamboCityVisualShadows.enable({ maxCasters: 24 })
window.__lamboCityVisualShadows.disable()
```

Quality profile controls (deliberate test actions only):

```js
window.__lamboCityVisualEngine.setQuality("performance")
window.__lamboCityVisualEngine.setQuality("balanced")
window.__lamboCityVisualEngine.setQuality("high")
window.__lamboCityVisualEngine.setAdaptiveEnabled(true)
window.__lamboCityVisualEngine.reset()
```

Do not enable shadows or change material, water, sky, fog, or tone-mapping presets for production use until the preview has been compared against the established baseline on iPad Safari and desktop.

## Acceptance checklist before calling 2.0 complete

- Module imports and startup succeed on the development branch.
- iPad Safari and desktop both render without black screens or console errors.
- Orientation changes preserve viewport sizing and active quality profile.
- Fog preset transitions complete smoothly, remain idle by default, and can be interrupted or returned to baseline.
- Cloud drift remains disabled by default, moves slowly when enabled, and baseline restoration returns all cloud positions.
- Default profile preserves current baseline appearance.
- Adaptive resolution remains disabled unless deliberately enabled.
- No regression in camera, navigation, collisions, Floor 2 Studio, stage performance, HERO sequence, or lazy-loaded HQ floors.
- Optional cube-map and planar water reflections are compared at low/medium resolutions on iPad Safari and desktop; measure frame rate, visual artifacts, and ensure disabling either path returns to the baseline.
- Optional shadows are tested with a 24-caster budget first; inspect activeCasters/skippedCasters and compare performance before considering a higher budget.
- Optional bloom is tested on both device classes, and its dynamic imports, render path, resize handling, and fallback to direct rendering are verified.
- Any new shadows, reflections, atmosphere, or post-processing are measured with ?perf=1.
- No feature is called complete based only on source inspection; runtime verification is still required.

## Development authorization

The owner authorized completion of this Visual Engine 2.0 feature-branch scope. The PR remains a draft; this does not authorize merging to main or deploying to production.

## Status

The quality-management, diagnostics, reversible texture filtering/material helpers, reversible atmosphere controls and transitions, renderer color controls, opt-in water appearance presets with cube-map and planar reflection paths, reversible sky controls, budgeted directional-shadow framework, and optional dynamically loaded bloom path are implemented on the feature branch. Targeted world caster/receiver tuning, measured shadow/reflection/bloom quality, and broader asset-specific material improvements remain in development. This document is the scope and verification contract for the branch; it is not a claim that those later layers are already finished.