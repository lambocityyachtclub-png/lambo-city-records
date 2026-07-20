// stageSpotlights.js
// Sweeping concert spotlight beams over the stage — pure visual cones with
// additive-blended transparent material, NOT real dynamic lights. Kept as
// pure visual meshes (no lighting calculations added) to stay fast on iPad.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const RIGS = [
  { x: -17, z: -83, color: 0x9900ff },
  { x:  17, z: -83, color: 0xff00aa },
  { x:  -8, z: -83, color: 0x00ffff },
  { x:   8, z: -83, color: 0xffd700 },
];

let beams = [], time = 0;

export default {
  init(scene) {
    RIGS.forEach((rig, i) => {
      const geo = new THREE.ConeGeometry(4.5, 26, 16, 1, true);
      geo.translate(0, -13, 0);

      const mat = new THREE.MeshBasicMaterial({
        color: rig.color,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      mat.toneMapped = false;

      const beam = new THREE.Mesh(geo, mat);
      beam.position.set(rig.x, 26, rig.z);
      scene.add(beam);

      beams.push({
        mesh: beam,
        offset: i * 1.7,
        dir: i % 2 === 0 ? 1 : -1,
      });
    });
  },

  update(delta) {
    time += delta;
    beams.forEach(b => {
      b.mesh.rotation.x = 0.55 + Math.sin(time * 0.6 + b.offset) * 0.3;
      b.mesh.rotation.z = Math.sin(time * 0.4 + b.offset) * 0.55 * b.dir;
    });
  },
};
