import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let cloudMaterials = [];
let cloudMeshes = [];
const DEFAULT_CLOUD_DRIFT_SPEED = 0.12;
let cloudDriftEnabled = false;
let cloudDriftSpeed = DEFAULT_CLOUD_DRIFT_SPEED;
let starMaterial = null;
let moonMaterial = null;
let haloMaterial = null;
let skyBaseline = null;

function getSkyStatus() {
  return {
    cloudCount: cloudMeshes.length,
    cloudOpacity: cloudMaterials[0]?.opacity ?? null,
    cloudDriftEnabled,
    cloudDriftSpeed,
    starOpacity: starMaterial?.opacity ?? null,
    moonOpacity: moonMaterial?.opacity ?? null,
    haloOpacity: haloMaterial?.opacity ?? null
  };
}

const skyControls = {
  getStatus: getSkyStatus,

  setCloudOpacity(value) {
    const opacity = Number(value);
    if (!Number.isFinite(opacity)) return { success: false, error: "Cloud opacity must be a number." };
    const safe = Math.max(0, Math.min(0.3, opacity));
    cloudMaterials.forEach(material => { material.opacity = safe; });
    return { success: true, status: getSkyStatus() };
  },

  setCloudDrift(enabled, speed) {
    let nextSpeed = cloudDriftSpeed;
    if (speed !== undefined) {
      const number = Number(speed);
      if (!Number.isFinite(number)) {
        return { success: false, error: "Cloud drift speed must be a finite number." };
      }
      nextSpeed = Math.max(0.02, Math.min(0.8, number));
    }
    cloudDriftSpeed = nextSpeed;
    cloudDriftEnabled = Boolean(enabled);
    return { success: true, status: getSkyStatus() };
  },

  setStarOpacity(value) {
    const opacity = Number(value);
    if (!starMaterial || !Number.isFinite(opacity)) return { success: false, error: "Star opacity is unavailable or invalid." };
    starMaterial.opacity = Math.max(0, Math.min(1, opacity));
    return { success: true, status: getSkyStatus() };
  },

  setMoonGlow(value) {
    const opacity = Number(value);
    if (!moonMaterial || !haloMaterial || !Number.isFinite(opacity)) return { success: false, error: "Moon glow is unavailable or invalid." };
    const safe = Math.max(0, Math.min(1, opacity));
    moonMaterial.opacity = safe;
    haloMaterial.opacity = safe * 0.06;
    return { success: true, status: getSkyStatus() };
  },

  restoreBaseline() {
    if (!skyBaseline) return { success: false, error: "Sky baseline is unavailable." };
    cloudMaterials.forEach(material => { material.opacity = skyBaseline.cloudOpacity; });
    cloudMeshes.forEach((cloud, index) => {
      const position = skyBaseline.cloudPositions[index];
      if (position) cloud.position.copy(position);
    });
    cloudDriftEnabled = false;
    cloudDriftSpeed = DEFAULT_CLOUD_DRIFT_SPEED;
    starMaterial.opacity = skyBaseline.starOpacity;
    moonMaterial.opacity = skyBaseline.moonOpacity;
    haloMaterial.opacity = skyBaseline.haloOpacity;
    return { success: true, status: getSkyStatus() };
  }
};
export default {
  init(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 4; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0.00, '#010008');
    g.addColorStop(0.15, '#080318');
    g.addColorStop(0.30, '#200840');
    g.addColorStop(0.45, '#5a0d30');
    g.addColorStop(0.58, '#aa2000');
    g.addColorStop(0.70, '#dd4400');
    g.addColorStop(0.80, '#ff7700');
    g.addColorStop(0.88, '#ff9900');
    g.addColorStop(0.94, '#ffaa00');
    g.addColorStop(1.00, '#003355');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 1024);
    const tex = new THREE.CanvasTexture(canvas);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    ));

    // CLOUDS — layered planes
    cloudMaterials = [];
    cloudMeshes = [];
    cloudDriftEnabled = false;
    cloudDriftSpeed = DEFAULT_CLOUD_DRIFT_SPEED;
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xff6633, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide
    });
    cloudMaterials.push(cloudMat);
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(120 + Math.random()*80, 20 + Math.random()*15),
        cloudMat
      );
      cloud.position.set(
        (Math.random()-0.5)*400,
        60 + Math.random()*80,
        -150 - Math.random()*200
      );
      cloud.rotation.x = -0.1;
      scene.add(cloud);
      cloudMeshes.push(cloud);
    }

    // STARS
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(1400*3);
    let i = 0;
    while (i < 1400) {
      pos[i*3]   = (Math.random()-0.5)*700;
      pos[i*3+1] = Math.random()*300+20;
      pos[i*3+2] = (Math.random()-0.5)*700;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starMaterial = new THREE.PointsMaterial({ color:0xffffff, size:0.5, transparent:true, opacity:0.85 });
    scene.add(new THREE.Points(starGeo, starMaterial));

    // MOON
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(8,16,16),
      new THREE.MeshBasicMaterial({ color:0xfffde8, transparent:true, opacity:1 })
    );
    moon.position.set(-140, 200, -300);
    moonMaterial = moon.material;
    scene.add(moon);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(14,16,16),
      new THREE.MeshBasicMaterial({ color:0xffffcc, transparent:true, opacity:0.05 })
    );
    halo.position.copy(moon.position);
    haloMaterial = halo.material;
    scene.add(halo);

    skyBaseline = {
      cloudOpacity: cloudMat.opacity,
      cloudPositions: cloudMeshes.map(cloud => cloud.position.clone()),
      starOpacity: starMaterial.opacity,
      moonOpacity: moonMaterial.opacity,
      haloOpacity: haloMaterial.opacity
    };
    window.__lamboCitySkyVisuals = skyControls;
  },
  update(delta) {
    if (!cloudDriftEnabled || !cloudMeshes.length) return;
    const safeDelta = Math.max(0, Math.min(Number(delta) || 0, 0.05));
    const movement = safeDelta * cloudDriftSpeed;
    cloudMeshes.forEach(cloud => {
      cloud.position.x += movement;
      if (cloud.position.x > 220) cloud.position.x = -220;
    });
  }
};
