# HERO Master Character Asset — Production Specification

Status: approved visual target; 3D source asset and in-game validation still required.

## Objective

Replace the current low-detail procedural HERO appearance with one high-fidelity, game-ready 3D character that matches the founder-supplied HERO turnaround/reference images. Preserve the existing HERO identity, world placement, player/world systems, and scripted stage performance.

The supplied front, side, and back views are the visual source of truth. The close-up reference panels govern the face, cap, sunglasses, dreadlocks, gold chain, and LAMBO CITY Records pendant. Do not reinterpret the outfit or invent a different character.

## Visual acceptance target

- Blue baseball cap with the gold HERO emblem.
- Long dark dreadlocks with readable strand grouping and silhouette from front, side, and rear.
- Dark sunglasses with the reference's HERO/LAMBO identity treatment.
- Face with natural proportions, visible facial hair, and clean close-up geometry.
- Orange-red zip hoodie with a white T-shirt beneath it.
- Gold chain and LAMBO CITY Records shield pendant.
- Dark blue jeans with believable denim folds and seams.
- White sneakers with readable sole, upper, and lace details.
- Natural skin and fabric response; no plastic-looking skin or flat painted-on detail.
- Match the supplied reference palette and silhouette. Optional skateboard, trophy, microphone, phone, headphones, and other props remain separate attachments and are not part of the base character.

## Model and coordinate contract

- Deliver one optimized GLB as the runtime asset; retain a source project/export so the asset can be revised.
- Normalize the character to exactly 4.0 Three.js world units from sole contact plane to top of cap.
- Feet rest at local Y = 0; character root is centered at X = 0, Z = 0.
- Upright humanoid, full body, both hands and feet visible in neutral bind pose.
- Target shoulder width 1.6–2.0 units and maximum depth 0.9–1.0 units, subject to the approved silhouette.
- Apply transforms before export; correct normals, UVs, tangents, material assignments, and scale.
- Closed, manifold mesh surfaces; no holes, inverted normals, detached accidental fragments, or intersecting clothing artifacts.
- Use PBR materials and texture maps for skin, hair, hoodie, shirt, denim, cap, sneakers, sunglasses, and gold jewelry.
- Keep the pendant lettering/logo as project-owned artwork. Do not introduce unlicensed third-party logos or marks.

## Rig and animation contract

The model must support the existing game animation behavior without changing the stage choreography.

Provide a humanoid skeleton with stable, named or explicitly mapped bones for:
- hips/root, spine/chest, neck, head
- left/right upper arms, forearms, hands
- left/right upper legs, lower legs, feet

The integration adapter must preserve the existing semantic rig access used by the game: torso, head, armL, armR, forearmL, forearmR, thighL, and thighR. If the GLB bone names differ, map them in one adapter rather than rewriting the performance controller.

The asset must be tested in neutral stance, walking, turning, greeting, and the existing HERO song choreography. Clothing and accessories must not visibly clip or detach during those motions.

## Integration plan

1. Produce and inspect the HERO GLB against the supplied reference from front, side, rear, and close-up angles.
2. Validate scale, origin, materials, topology, skeleton, and texture budgets before touching the live character path.
3. Add the GLB as a separate versioned asset; do not overwrite or delete the current procedural model.
4. Add a Three.js r160-compatible asynchronous asset loader and rig adapter behind a feature flag. Keep the current procedural HERO as a safe fallback if the asset fails to load.
5. Keep the NPC root transform, HERO spawn position, stage entry/exit, audio synchronization, performance animation timing, camera, and world geometry unchanged.
6. Run visual, animation, loading, and iPad/desktop performance checks in a Preview deployment.
7. Only switch the production HERO asset after the founder inspects and approves the Preview.

## Performance and device budget

- Prefer one optimized GLB with compressed textures and geometry where the existing runtime supports them.
- Avoid adding real-time lights or heavy post-processing for the character.
- Use sensible texture resolution and mesh detail; use normal/roughness maps for fine surface detail instead of excessive geometry where practical.
- Load the character asynchronously and show the current fallback until the asset is ready.
- Dispose temporary loader resources correctly if an asset is replaced.
- Validate memory, draw calls, frame rate, and visual quality on iPad Safari and desktop.

## Current code findings

- hero-model.js currently constructs HERO from Three.js primitive geometries and procedural materials.
- npc.js creates the HERO root group, calls createHeroModel(THREE), and has a fallback model if creation fails.
- heroPerformance.js obtains the existing HERO root through the NPC system and animates semantic rig parts. The stage sequence is tightly coupled to this interface.
- The safe integration boundary is therefore the visual child under the existing HERO root plus a rig adapter. Do not replace the root or alter stage-performance state logic as part of the asset swap.

## Not yet complete

This specification does not claim that the high-fidelity GLB has been generated, rigged, imported, or tested. A reference image is not itself a game-ready 3D mesh. The actual GLB must be created from the supplied turnaround and inspected before the code can display the exact target appearance.


## Founder correction — exact reference only

The founder has explicitly confirmed that the supplied HERO reference boards are the complete and exact design direction. Do not introduce any alternate style direction, anime influence, cartoon treatment, stylization, reinterpretation, or redesign.

Reproduce what the supplied images represent as faithfully as technically possible:
- Match the face, facial hair, skin tone, head shape, dreadlocks, cap, sunglasses, outfit, jewelry, pendant, jeans, sneakers, colors, silhouette, proportions, and visible details.
- The front, side, and rear views are authoritative. Close-up panels govern the head and accessory details.
- Preserve the reference's realistic 3D character presentation and game-ready humanoid construction.
- Do not add, remove, or change design elements. The reference explicitly excludes skateboard and trophy from the base model; optional props remain separate and are not attached by default.
- Animation must support the approved character in the game; it must not alter the character's appearance or design.
- If a detail cannot be reproduced confidently from the supplied references, flag it for review rather than inventing a substitute.

The images are the design specification. No new concept image or alternate visual interpretation is requested.

## Next-step execution — reuse the existing acceptance tools

The repository already has a separate, previously developed GLB acceptance chain:
- PR #104 adds GLB container, humanoid skeleton, animation-clip, and reference-metadata validation.
- PR #105 adds a local Three.js 0.160.0 viewer with orbit/zoom, wireframe, animation playback, transformed world-space measurements, and a human visual checklist.
- PR #106 hardens that viewer's resource cleanup and protects the last valid model when a candidate fails to load.

Do not rebuild these tools in this PR or create a duplicate viewer. Once a candidate GLB exists, use this existing acceptance chain in dependency order, then integrate only after the candidate passes the technical checks and founder visual review. These older PRs are currently open and stacked on one another; they are not merged into production, so their code must be integrated and revalidated before it can be used as a production capability.

## Reference source handling

The original saved HERO reference boards remain authoritative:
- HERO 3D Character Reference Portrait.jpeg
- HERO 3D Model Reference Landscape.jpeg
- Hero 3D Model Reference Sheet.png
- Lambo City Hero 3D Specification Guide.png

The seven-image HERO_reference_pack.zip is a convenience crop set derived from the saved boards, not a replacement for them. Use the original boards as the primary reference input whenever the generation tool supports multi-view references. Do not generate a new concept image, redraw the character, or use a text-only reinterpretation as a substitute for the supplied visual references.
