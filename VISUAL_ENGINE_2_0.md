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
- visualEngineMaterials.js: opt-in texture anisotropy controls plus reversible per-material polished/satin/matte/chrome presets; default texture and material settings remain untouched.
- visualEngineAtmosphere.js: reversible fog presets, exposed as window.__lamboCityAtmosphere.setPreset(name); the current scene fog is captured as the baseline and restored with the baseline preset.
- visualEngineColor.js: reversible renderer tone-mapping and exposure controls, exposed as window.__lamboCityVisualColor; existing ACES / exposure values are captured and left unchanged by default.
- visualEngineShadows.js: opt-in directional shadow pipeline. At scene initialization it discovers only meshes already explicitly tagged with castShadow/receiveShadow by their feature modules; shadows remain disabled until deliberately enabled. Groups/named objects can also be registered manually; point-light shadows are excluded.
- lighting.js: registers the existing sun with the shadow controller without enabling shadows or changing the default lighting.
- water.js: reversible water surface and shimmer/reflection-layer presets plus an explicitly opt-in, low-resolution cube-map environment reflection mode. The reflection mode uses the existing MeshStandardMaterial, defaults to 128px per cube face with a 3-second refresh interval, clamps resolution to 64–256px and refresh interval to 2–10 seconds, and performs no extra render passes unless deliberately enabled. It is an environment reflection, not a planar mirror/reflection pass; the established water look and wave animation remain the default.
- sky.js: reversible cloud, star, and moon-glow controls, exposed as window.__lamboCitySkyVisuals; existing sky colors, object positions, and default intensities remain unchanged.
- performanceMonitor.js: existing optional ?perf=1 overlay and renderer metrics.
- engine.js / main.js: register and initialize the Visual Engine modules without changing the existing scene feature modules.

## Development inspection controls

Open the development preview with `?perf=1` to show the existing performance overlay.

Browser-console inspection commands:

```js
window.__lamboCityVisualEngine.getStatus()
window.__lamboCityVisualDiagnostics.getReport()
window.__lamboCityVisualMaterials.getReport()
window.__lamboCityAtmosphere.getStatus()
window.__lamboCityVisualColor.getStatus()
window.__lamboCityWaterVisuals.getStatus()
window.__lamboCityWaterVisuals.setEnvironmentReflection(true, {
  resolution: 128,
  refreshIntervalSeconds: 3,
  intensity: 0.45
})
window.__lamboCityWaterVisuals.setEnvironmentReflection(false)
window.__lamboCitySkyVisuals.getStatus()
window.__lamboCityVisualShadows.getStatus()
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
- Default profile preserves current baseline appearance.
- Adaptive resolution remains disabled unless deliberately enabled.
- No regression in camera, navigation, collisions, Floor 2 Studio, stage performance, HERO sequence, or lazy-loaded HQ floors.
- Optional cube-map water reflections are tested at 64px, 128px, and 256px on iPad Safari and desktop; compare frame rate and visual artifacts, and confirm disabling restores the exact baseline material settings.
- Any new shadows, reflections, atmosphere, or post-processing are measured with ?perf=1.
- No feature is called complete based only on source inspection; runtime verification is still required.

## Status

The quality-management, diagnostics, opt-in texture filtering, reversible atmosphere controls, renderer color controls, opt-in water appearance presets, reversible sky controls, and explicit-registration shadow framework are implemented. Targeted world caster/receiver tagging, measured shadow quality, physically based water reflections, broader material improvements, and optional post-processing remain in development. This document is the scope and verification contract for the branch; it is not a claim that those later layers are already finished.