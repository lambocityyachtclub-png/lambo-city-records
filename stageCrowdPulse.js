// stageCrowdPulse.js
// Lightweight stage-floor pulse driven by HERO's actual media playback clock.
// The 126 BPM beat grid is a provisional tempo map; effects are anchored to
// audio.currentTime so they do not drift independently from the song.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const BEAT_BPM = 126;
const BEAT_DURATION = 60 / BEAT_BPM;
const COLORS = [0x9900ff, 0xff00aa, 0x00ffff, 0xffd700];

let mesh, idleTime = 0, colorIndex = 0;

export default {
  init(scene) {
    const geo = new THREE.CircleGeometry(14, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS[0], transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    mat.toneMapped = false;
    mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.05, -74);
    scene.add(mesh);
  },

  update(delta, context) {
    if (!mesh) return;
    idleTime += delta;
    const clock = context?.systems?.stageMusic?.getPlaybackClock?.();
    const playing = !!clock?.playing;
    const songTime = playing ? clock.currentTime : idleTime;
    const beatT = (songTime % BEAT_DURATION) / BEAT_DURATION;
    const pulse = playing ? Math.pow(1 - beatT, 2) : 0.12;
    mesh.material.opacity = playing ? 0.1 + pulse * 0.35 : 0.1;
    mesh.scale.setScalar(1 + pulse * (playing ? 0.15 : 0.025));
    if (playing) {
      const nextIndex = Math.floor(songTime / (BEAT_DURATION * 4)) % COLORS.length;
      if (nextIndex !== colorIndex) {
        colorIndex = nextIndex;
        mesh.material.color.setHex(COLORS[colorIndex]);
      }
    }
  },
};
