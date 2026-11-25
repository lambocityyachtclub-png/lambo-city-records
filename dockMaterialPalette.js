import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// One shared material palette for the main dock, circular stage pier,
// HQ dock spur, and private estate/cabin walkways.
// Keep the visible walking surface on the same warm premium timber.
export const DOCK_MATERIALS = Object.freeze({
  structuralWood: new THREE.MeshStandardMaterial({
    color: 0x8b5e3c,
    roughness: 0.9
  }),
  plankWood: new THREE.MeshStandardMaterial({
    color: 0x6d4327,
    roughness: 0.72,
    metalness: 0.02
  }),
  supportPostWood: new THREE.MeshStandardMaterial({
    color: 0x5c3d1e,
    roughness: 1
  }),
  railWood: new THREE.MeshStandardMaterial({
    color: 0x3a2510,
    roughness: 0.8
  })
});
