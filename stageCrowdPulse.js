// stageCrowdPulse.js
// Bass-reactive-style crowd lighting — a glowing color-cycling wash on the
// stage floor that pulses on a steady beat. This is a SIMULATED rhythm
// (not real audio frequency analysis), chosen deliberately for reliability:
// true audio-reactive lighting would need to tap whichever of three
// different audio sources (radio, stage video, YouTube modal) happens to
// be playing, which is fragile. This gives the same "alive with the music"
// feel without that risk. Pure visual mesh, no real lights — cheap on iPad.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const BPM = 126;
const BEAT_DURATION = 60 / BPM;
const COLORS = [0x9900ff, 0xff00aa, 0x00ffff, 0xffd700];

let mesh, time = 0, colorIndex = 0;

export default {
  init(scene) {
    const geo = new THREE.CircleGeometry(14, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS[0],
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    mat.toneMapped = false;

    mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.05, -74); // stage platform ground level
    scene.add(mesh);
  },

  update(delta) {
    time += delta;

    const beatT = (time % BEAT_DURATION) / BEAT_DURATION;
    const pulse = Math.pow(1 - beatT, 2);
    mesh.material.opacity = 0.1 + pulse * 0.35;
    mesh.scale.setScalar(1 + pulse * 0.15);

    const newIndex = Math.floor(time / (BEAT_DURATION * 4)) % COLORS.length;
    if (newIndex !== colorIndex) {
      colorIndex = newIndex;
      mesh.material.color.setHex(COLORS[colorIndex]);
    }
  },
};
