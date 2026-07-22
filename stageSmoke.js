// stageSmoke.js
// Drifting stage smoke/fog — lightweight billboarded sprite particles that
// rise, fade in, fade out, and recycle. Cheap on iPad: no real geometry
// per particle, just a handful of camera-facing sprites with a soft
// radial-gradient texture drawn once on a canvas.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function createSmokeTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

const PARTICLE_COUNT = 14;
const STAGE_CENTER = { x: 0, z: -74 }; // matches world.js stage platform
const SPREAD_X = 16;
const SPREAD_Z = 8;

let particles = [];

function resetParticle(p) {
  p.mesh.position.set(
    STAGE_CENTER.x + (Math.random() - 0.5) * SPREAD_X * 2,
    1.2 + Math.random() * 1.5,
    STAGE_CENTER.z + (Math.random() - 0.5) * SPREAD_Z * 2
  );
  const s = 4 + Math.random() * 4;
  p.mesh.scale.set(s, s, 1);
  p.mesh.material.opacity = 0;
  p.age = 0;
  p.life = 6 + Math.random() * 4;
  p.driftX = (Math.random() - 0.5) * 0.4;
  p.riseSpeed = 0.5 + Math.random() * 0.4;
  p.rotSpeed = (Math.random() - 0.5) * 0.3;
}

export default {
  init(scene) {
    const texture = new THREE.CanvasTexture(createSmokeTexture());
    const baseMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: 0xcccccc,
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mat = baseMat.clone(); // each particle fades independently
      const mesh = new THREE.Sprite(mat);
      scene.add(mesh);
      const p = { mesh, age: 0, life: 0, driftX: 0, riseSpeed: 0, rotSpeed: 0 };
      resetParticle(p);
      p.age = Math.random() * p.life; // stagger so they don't all pulse in sync
      particles.push(p);
    }
  },

  update(delta) {
    particles.forEach(p => {
      p.age += delta;
      if (p.age >= p.life) {
        resetParticle(p);
        return;
      }
      const t = p.age / p.life;
      const fade = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
      p.mesh.material.opacity = fade * 0.35;
      p.mesh.position.y += p.riseSpeed * delta;
      p.mesh.position.x += p.driftX * delta;
      p.mesh.material.rotation += p.rotSpeed * delta;
    });
  },
};
