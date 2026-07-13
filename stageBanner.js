// stageBanner.js
// Paints a glowing "LAMBO CITY RECORDS" marquee onto the gold sign mesh
// above the stage screen (built in world.js, tagged "stageGoldSign"). Uses
// a canvas-drawn texture, so no image file or hosting is needed. Pulses
// gently to match the concert/neon vibe of the rest of the stage.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const SIGN_MESH_NAME = "stageGoldSign";
const BANNER_TEXT = "LAMBO CITY RECORDS";

function createBannerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 80px Arial, sans-serif";

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.shadowColor = "#ff00aa";
  ctx.shadowBlur = 35;
  ctx.fillStyle = "#ffd700";
  ctx.fillText(BANNER_TEXT, cx, cy);

  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 14;
  ctx.fillText(BANNER_TEXT, cx, cy);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff4cc";
  ctx.fillText(BANNER_TEXT, cx, cy);

  return canvas;
}

let signMesh, time = 0;

export default {
  init(scene) {
    signMesh = scene.getObjectByName(SIGN_MESH_NAME);
    if (!signMesh) return;

    const texture = new THREE.CanvasTexture(createBannerTexture());
    texture.colorSpace = THREE.SRGBColorSpace;

    signMesh.material.color.setHex(0x000000);
    signMesh.material.map = null;
    signMesh.material.emissive.setHex(0xffffff);
    signMesh.material.emissiveMap = texture;
    signMesh.material.emissiveIntensity = 1.8;
    signMesh.material.needsUpdate = true;
  },

  update(delta) {
    if (!signMesh) return;
    time += delta;
    signMesh.material.emissiveIntensity = 1.7 + Math.sin(time * 1.4) * 0.3;
  },
};
