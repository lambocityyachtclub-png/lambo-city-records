# HERO Reference Image Preparation

The founder supplied two HERO character reference boards in the project conversation. A clean reference pack was prepared from the detailed turnaround board for the next 3D-generation step.

## Prepared views

- HERO_front_full_body.jpg — front full-body view
- HERO_side_full_body.jpg — side full-body view
- HERO_back_full_body.jpg — rear full-body view
- HERO_front_head_detail.jpg — front face, cap, sunglasses, and hair detail
- HERO_side_head_detail.jpg — side face, cap, and hair detail
- HERO_back_head_detail.jpg — rear cap and dreadlock detail
- HERO_pendant_detail.jpg — gold chain and LAMBO CITY Records pendant detail

The full-body front, side, and rear views are the primary multi-view generation references. Detail crops are supporting visual references and should not be mistaken for additional camera views.

## Generation brief

Create one complete, realistic, high-detail humanoid 3D game character matching the supplied HERO turnaround. Preserve the reference identity and silhouette: blue baseball cap with gold HERO emblem, long dark dreadlocks, dark sunglasses, natural face and facial hair, orange-red zip hoodie, white T-shirt, gold chain and LAMBO CITY Records shield pendant, dark blue denim jeans, and white sneakers. Use realistic skin, hair, knit/fabric, denim, leather/rubber, and metallic gold PBR materials. Maintain accurate front/side/rear consistency. Full body, upright neutral stance, hands and feet visible, no extra props, no skateboard, no trophy. Deliver a clean, closed, animation-ready humanoid mesh with UVs and textures, suitable for GLB export and real-time Three.js use.

## Important limitations and validation

- The reference board's 4.0-unit height and origin notes are target specifications, not proof that a generated model has those exact dimensions. Normalize and measure the exported GLB in the game before acceptance.
- Multi-view generation must use the front, left/side, and back images as labeled views if the generation service supports them.
- A generated static mesh is not automatically animation-ready. Inspect the skeleton, skin weights, topology, face/hands, and clothing intersections.
- Do not replace the current HERO model until the new GLB has passed visual and animation checks in Preview.
- Preserve the existing HERO root, stage choreography, audio synchronization, spawn position, camera, world, and movement systems.

## Generation access status

The connected Runway workspace was checked on 2026-11-27. Its 3D mesh generation capability is currently marked unavailable for that workspace (feature unavailable), so no GLB was generated in that session. This is a workspace capability limitation, not a completed generation. The prepared reference pack can be used with an enabled Tripo/3D-generation workspace.
