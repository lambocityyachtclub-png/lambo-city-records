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
   - On-demand scene audit reports scene object counts, geometry/material/texture counts, lights, renderer capabilities, and performance snapshot.
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
- visualEngineMaterials.js: opt-in texture anisotropy controls, exposed as window.__lamboCityVisualMaterials.setTextureAnisotropy(level); default texture settings remain untouched.
- performanceMonitor.js: existing optional ?perf=1 overlay and renderer metrics.
- engine.js / main.js: register and initialize the Visual Engine modules without changing the existing scene feature modules.

## Acceptance checklist before calling 2.0 complete

- Module imports and startup succeed on the development branch.
- iPad Safari and desktop both render without black screens or console errors.
- Orientation changes preserve viewport sizing and active quality profile.
- Default profile preserves current baseline appearance.
- Adaptive resolution remains disabled unless deliberately enabled.
- No regression in camera, navigation, collisions, Floor 2 Studio, stage performance, HERO sequence, or lazy-loaded HQ floors.
- Any new shadows, reflections, atmosphere, or post-processing are measured with ?perf=1.
- No feature is called complete based only on source inspection; runtime verification is still required.

## Status

The quality-management and diagnostics foundation is implemented. The material, lighting/shadow, water/reflection, atmosphere, and optional post-processing layers remain in development. This document is the scope and verification contract for the branch; it is not a claim that those later layers are already finished.