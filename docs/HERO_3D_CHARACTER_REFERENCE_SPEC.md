# HERO 3D Character Reference and Acceptance Specification

**Owner-provided visual references:** two original HERO character reference boards, saved in the ChatGPT Library under `/LAMBO CITY/HERO Character References/`:
- `HERO 3D Character Reference Portrait.jpeg`
- `HERO 3D Model Reference Landscape.jpeg`

These are the source-of-truth visual direction for the HERO character. Preserve the supplied look; do not invent a new outfit, redesign the silhouette, or replace the character with a generic NPC.

## Visual identity to preserve

The reference depicts one full-body, upright male-presenting humanoid character in front, side, rear, and three-quarter views, plus close-ups of the head, cap, jewelry, and clothing.

- Royal/deep blue fitted baseball cap with gold outlined `H` emblem.
- Long black locs/dreadlocks visible below and behind the cap.
- Dark sunglasses with white frames and the `LAMBO` / `HERO` lens lettering.
- Natural skin tone; defined face, mustache, and goatee.
- Orange-red zip hoodie, hood down, with realistic fabric folds, seams, cuffs, hem, pockets, and zipper details.
- White T-shirt under the open hoodie.
- Gold Cuban-link chain and prominent gold LAMBO CITY Records shield pendant. The pendant is part of the character's identity and must remain.
- Dark blue denim jeans with natural folds and stitching.
- White low-top sneakers.
- No skateboard, trophy, or unrelated handheld props. The pendant, chain, cap, and glasses are intentional identity details, not removable props.

## Required model dimensions and origin

| Property | Required value |
|---|---|
| Total height | Exactly 4.0 Three.js world units |
| Width at shoulders | Approximately 1.6–2.0 units |
| Maximum depth | Approximately 0.9–1.0 units |
| Local origin | X = 0, Y = 0, Z = 0 |
| Ground contact | Both soles aligned to local Y = 0 |
| Centering | Character centered on X = 0 and Z = 0 |
| Pose | Upright, neutral, full body, head to toe |

The local model asset must meet this origin/scale contract. A parent world actor may have a separate world-space placement; do not confuse the asset's local ground origin with the world actor's position.

## Runtime and delivery requirements

The final asset target is one clean, game-ready GLB/GLTF character with:
- Closed, clean geometry and animation-friendly topology.
- A usable humanoid skeleton/rig with named, correctly oriented joints.
- Neutral bind/rest pose and a repeatable animation retargeting test.
- Correct materials and textures for the cap, glasses, hair, hoodie, shirt, jeans, shoes, chain, and pendant.
- Verified dimensions and ground contact after export and after Three.js import.
- Three.js r160 compatibility and acceptable draw calls/material count for iPad-class devices.
- No required runtime lights or world-system changes inside the character asset.

The supplied boards describe the intended visual and technical target. They are not themselves a 3D mesh, skeleton, texture set, or GLB deliverable.

## Current repository audit (main at 2026-11-17)

The existing `hero-model.js` is a procedural Three.js visual builder. It already contains recognizable elements from the reference: blue cap and H mark, locs, white sunglasses with LAMBO/HERO lens lettering, orange hoodie, white shirt, blue jeans, white shoes, gold chain and shield pendant. It normalizes the generated object's bounding-box height to 4.0 units, then centers X/Z and moves its lowest point to Y=0.

This is useful as a fallback/prototype visual and should be preserved until a verified replacement exists.

It is **not yet** the final requested deliverable:
- It builds a collection of primitive Three.js meshes at runtime; it is not a single exported GLB/GLTF asset.
- The current source does not provide a complete skinned humanoid skeleton or production animation rig.
- The visual detail is procedural and should not be represented as equivalent to the photographic fabric, facial, hair, and material realism in the references.
- No imported GLB/GLTF asset, texture package, rig validation, or physical-device character review was found in the inspected main-branch paths.

## Integration and preservation rules

- Keep `hero-model.js` available as a known-good fallback until a new asset passes visual, scale, rig, runtime, and device checks.
- Do not change HERO's existing stage performance, security entrance, world placement, or approved world layout as part of an asset-only task.
- Separate the HERO visual asset from the identity/controller: HERO is the owner's personal ALIVE identity, not a company-owned autonomous NPC. The visual mesh can be reused by the owner-controlled actor; account ownership, input authority, and multiplayer presence are separate runtime integrations.
- Do not turn on autonomous HERO movement or replace the current actor behavior as a side effect of a visual asset upgrade.
- Any later replacement must be additive and reversible, and must preserve the 4.0-unit local scale/origin contract.

## Next acceptance gate

The next asset milestone is to produce or obtain a real GLB/GLTF from the two saved boards, then verify it locally in an isolated preview. Do not claim the model is complete until the file exists, imports in Three.js r160, measures exactly 4.0 units after normalization, rests on Y=0, has a working humanoid rig, and passes a visual comparison against the supplied front/side/back references.
