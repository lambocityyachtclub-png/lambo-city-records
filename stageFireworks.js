// stageFireworks.js
// Restrained, non-strobing finale fireworks triggered when HERO's actual
// performance track ends. Uses lightweight point particles, no real lights.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import StageMusic from "./stageMusic.js";

const BURSTS = [
  { x: -9, y: 15, z: -74, color: 0xb66cff, seed: 1 },
  { x: 0, y: 18, z: -75, color: 0xffd36b, seed: 2 },
  { x: 9, y: 15, z: -74, color: 0x59d9ff, seed: 3 },
];
const PARTICLES_PER_BURST = 48;
const LIFETIME = 2.8;
let activeBursts = [];
let observedPlayback = false;
let finaleStarted = false;

function createBurst(scene, config) {
  const positions = new Float32Array(PARTICLES_PER_BURST * 3);
  const velocities = [];
  for (let i = 0; i < PARTICLES_PER_BURST; i++) {
    const u = (i + 0.5) / PARTICLES_PER_BURST;
    const y = 1 - 2 * u;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = i * 2.399963229728653 + config.seed;
    const speed = 2.8 + ((i * 7 + config.seed * 3) % 13) * 0.16;
    velocities.push([
      Math.cos(angle) * radius * speed,
      y * speed,
      Math.sin(angle) * radius * speed
    ]);
    positions[i * 3] = config.x;
    positions[i * 3 + 1] = config.y;
    positions[i * 3 + 2] = config.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: config.color,
    size: 0.24,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  material.toneMapped = false;
  const points = new THREE.Points(geometry, material);
  points.name = "lamboCityHEROFinaleFireworks";
  scene.add(points);
  activeBursts.push({ points, velocities, age: 0 });
}

function clearBursts(scene) {
  activeBursts.forEach(burst => {
    scene?.remove(burst.points);
    burst.points.geometry.dispose();
    burst.points.material.dispose();
  });
  activeBursts = [];
}

export default {
  init(scene) {
    this.scene = scene;
    observedPlayback = false;
    finaleStarted = false;
  },

  update(delta, context) {
    const scene = this.scene;
    if (!scene) return;
    const clock = context?.systems?.stageMusic?.getPlaybackClock?.() || StageMusic.getPlaybackClock();

    if (clock.playing) observedPlayback = true;
    if (observedPlayback && !clock.playing && StageMusic.hasEnded() && !finaleStarted) {
      finaleStarted = true;
      BURSTS.forEach(config => createBurst(scene, config));
    }

    activeBursts = activeBursts.filter(burst => {
      burst.age += delta;
      const t = burst.age;
      const position = burst.points.geometry.attributes.position;
      for (let i = 0; i < burst.velocities.length; i++) {
        const velocity = burst.velocities[i];
        position.array[i * 3] = velocity[0] * t;
        position.array[i * 3 + 1] = velocity[1] * t - 2.4 * t * t;
        position.array[i * 3 + 2] = velocity[2] * t;
      }
      position.needsUpdate = true;
      burst.points.material.opacity = Math.max(0, 0.95 * (1 - t / LIFETIME));
      burst.points.material.size = 0.24 * (1 - Math.min(0.45, t / LIFETIME * 0.45));
      if (t >= LIFETIME) {
        scene.remove(burst.points);
        burst.points.geometry.dispose();
        burst.points.material.dispose();
        return false;
      }
      return true;
    });

    // HERO's performance module resets the track before the next run.
    if (!clock.playing && !StageMusic.hasEnded() && finaleStarted && activeBursts.length === 0) {
      observedPlayback = false;
      finaleStarted = false;
    }
  },

  reset() {
    clearBursts(this.scene);
    observedPlayback = false;
    finaleStarted = false;
  }
};
