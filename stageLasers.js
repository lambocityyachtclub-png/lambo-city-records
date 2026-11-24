// stageLasers.js
// Additive visual laser meshes; pulse timing follows HERO media playback.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const RIGS = [
  { x: -17, z: -83, color: 0x00ff44 },
  { x: -17, z: -83, color: 0xff0033 },
  { x: 17, z: -83, color: 0x00ff44 },
  { x: 17, z: -83, color: 0xff0033 },
];
const BEAM_LENGTH = 38;
let beams = [], idleTime = 0;

export default {
  init(scene) {
    RIGS.forEach((rig, i) => {
      const geo = new THREE.CylinderGeometry(0.08, 0.08, BEAM_LENGTH, 6, 1, true);
      geo.translate(0, -BEAM_LENGTH / 2, 0);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: rig.color, transparent: true, opacity: 0.65,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      mat.toneMapped = false;
      const beam = new THREE.Mesh(geo, mat);
      beam.position.set(rig.x, 25, rig.z);
      scene.add(beam);
      beams.push({ mesh: beam, mat, offset: i * 2.3, speed: 0.9 + i * 0.15 });
    });
  },

  update(delta, context) {
    idleTime += delta;
    const clock = context?.systems?.stageMusic?.getPlaybackClock?.();
    const time = clock?.playing ? clock.currentTime : idleTime;
    beams.forEach(b => {
      b.mesh.rotation.y = Math.sin(time * b.speed + b.offset) * 0.5;
      b.mesh.rotation.x = 1.0 + Math.sin(time * 0.5 + b.offset) * 0.25;
      // Keep lasers steady outside performances; no rapid flashing.
      b.mat.opacity = clock?.playing
        ? 0.6 + Math.abs(Math.sin(time * 3 + b.offset)) * 0.25
        : 0.65;
    });
  },
};
