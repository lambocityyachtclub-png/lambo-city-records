# HERO GLB Acceptance Pipeline

## Purpose

This pipeline prepares a safe acceptance gate for the realistic HERO character asset described in `HERO_3D_CHARACTER_REFERENCE_SPEC.md`. It does not replace the existing procedural HERO, create a model, or change live gameplay.

## Required delivery

The future model is expected at `models/hero/hero.glb` when an actual asset is supplied. It must:

- Use binary glTF 2.0 (GLB).
- Match the saved owner reference boards: blue H cap, white LAMBO/HERO sunglasses, long dark locs, orange-red hoodie, white shirt, blue jeans, white sneakers, and gold chain with LAMBO CITY Records shield pendant.
- Be a complete head-to-toe humanoid with a skinned joint hierarchy and at least one animation clip.
- Declare 4.0 Three.js world units total height, within 0.02 units.
- Be normalized with feet at Y=0 and centered at X=0, Z=0.
- Exclude the separately planned skateboard and trophy.
- Receive a human visual review against the saved reference boards.

## GLB metadata

The glTF asset must include:

```json
{
  "asset": {
    "version": "2.0",
    "extras": {
      "lamboCityHero": {
        "referenceSpec": "HERO-3D-REFERENCE-v1",
        "heightUnits": 4.0,
        "feetAtGround": true,
        "centeredAtOrigin": true,
        "fullBody": true,
        "noSeparateProps": true,
        "visualReferenceReviewed": true
      }
    }
  }
}
```

These fields are declarations from the asset producer, not proof that the mesh geometry actually matches the dimensions or appearance. They must be backed by independent visual inspection and a Three.js runtime bounding-box check before replacement.

## Validation

- Automated tests: `node --experimental-default-type=module --test development/tests/*.test.js`
- Local file check: `node scripts/validate-hero-glb.mjs models/hero/hero.glb`

The validator checks GLB container integrity, glTF version, scene/mesh presence, a humanoid skin, animation presence, and required HERO metadata. It does not parse transformed vertex bounds, certify topology, or validate visual fidelity.

## Runtime replacement policy

Do not change `npc.js`, `hero-model.js`, `main.js`, world registration, or HERO performance behavior merely to point at a future asset path. Keep the current procedural model as the live fallback until the GLB exists and passes:

1. Automated container and metadata checks.
2. Independent transformed-geometry bounds check for 4.0 units and feet at ground.
3. Visual comparison against the saved reference boards.
4. Rig and animation playback inspection.
5. Three.js 0.160.0 runtime test on desktop and iPad-class hardware.
6. Regression check that the existing HERO position, performance, progression, and player/world behavior remain unchanged.

Only after all six pass should a separate narrowly scoped PR connect the asset to the live character loader.
