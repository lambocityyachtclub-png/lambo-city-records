// stageLasers.js
// Fast-sweeping concert laser beams firing from the stage towers, angled
// down and out over the crowd area (toward +Z, where the audience stands).
// Pure visual meshes with additive blending, NOT real dynamic lights —
// same performance approach as stageSpotlights.js.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// Tower positions match world.js: [-17, 17] at z=-83, tower height 26
const RIGS = [
  { x: -17, z: -83, color: 0x00ff44 },
  { x: -17, z: -83, color: 0xff0033 },
  { x:  17, z: -83, color: 0x00ff44 },
  { x:  17, z: -83, color: 0xff0033 },
];

const BEAM_LENGTH = 38;
let beams = [], time = 0;

export default {
  init(scene) {
    RIGS.forEach((rig, i) => {
      const geo = new THREE.CylinderGeometry(0.08, 0.08, BEAM_LENGTH, 6, 1, true);
      geo.translate(0, -BEAM_LENGTH / 2, 0); // pivot at the top (fixture point)
      geo.rotateX(-Math.PI / 2); // points toward +Z (over the crowd)

      const mat = new THREE.MeshBasicMaterial({
        color: rig.color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      mat.toneMapped = false;

      const beam = new THREE.Mesh(geo, mat);
      beam.position.set(rig.x, 25, rig.z);
      scene.add(beam);

      beams.push({
        mesh: beam,
        mat,
        offset: i * 2.3,
        speed: 0.9 + i * 0.15,
      });
    });
  },

  update(delta) {
    time += delta;
    beams.forEach(b => {
      // Tighter, steeper sweep so beams stay focused over the stage/crowd
      // area instead of swinging out into open sky.
      b.mesh.rotation.y = Math.sin(time * b.speed + b.offset) * 0.5;
      b.mesh.rotation.x = 1.0 + Math.sin(time * 0.5 + b.offset) * 0.25;
      b.mat.opacity = 0.6 + Math.abs(Math.sin(time * 6 + b.offset)) * 0.35;
    });
  },
};
