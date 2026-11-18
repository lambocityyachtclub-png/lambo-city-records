# HERO Local GLB Visual Review

Open `development/hero-review/index.html` through a local static server or the Vercel preview, then choose a candidate `.glb` file. The page uses Three.js 0.160.0, GLTFLoader, and OrbitControls.

## Privacy

The selected GLB is read through a browser object URL. It is not uploaded to an API or saved by the tool. Closing the tab releases the local object URL.

## Automated geometry inspection

The page measures the loaded scene's transformed world-space bounding box and reports:
- Total height (target 4.00 ± 0.02 Three.js units).
- Lowest point (target Y=0 ± 0.02).
- Bounding-box center X and Z (target 0 ± 0.02).
- Number of skinned meshes.
- Number and names of animation clips.

It supports orbit, zoom, reset view, wireframe inspection, and playing the first animation clip.

## Human visual checklist

The checklist prompts the owner/reviewer to compare the loaded model against the saved reference boards: cap, glasses, locs, hoodie/shirt, jeans/sneakers, pendant, complete body, unobstructed hands, and no skateboard/trophy.

Marking every checkbox does not automatically approve the model. It only records that the checklist was reviewed in the current browser session.

## Limits

This is a review aid, not a complete certification:
- It does not validate retopology quality, UVs, texture fidelity, deformation quality, or every animation.
- A loaded model can pass dimensions and still fail visual likeness.
- The browser tool does not write a review result back to the repository.
- iPad-class performance, memory use, animation playback, and in-game regression still need hands-on testing.

Do not replace the existing procedural HERO until the actual asset passes the automated checks, owner visual review, animation review, and desktop/iPad runtime tests.

## Resource and load safety

When a new candidate replaces the currently displayed model, the review page stops and uncaches its animation mixer and disposes the previous model's unique geometries, materials, textures, and skeletons. Concurrent file selections are guarded so a slower earlier load cannot replace a newer selection; stale completed loads are disposed. Starting a new review clears prior measurements and visual checklist marks so results cannot be accidentally carried over between candidates.
