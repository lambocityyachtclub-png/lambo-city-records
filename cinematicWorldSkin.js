import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌍 WORLD SKIN (STABLE BASE LAYER)
========================================================= */

export function initWorldSkin() {

  const scene = engine.scene;

  if (!scene) {
    console.error("Scene not ready in engine");
    return;
  }

  /* =========================
     🌊 OCEAN BASE
  ========================= */

  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshStandardMaterial({
      color: 0x0a2a3a,
      roughness: 0.9,
      metalness: 0.1
    })
  );

  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = 0;
  scene.add(ocean);

  /* =========================
     🪵 DOCK (CENTER LINE)
  ========================= */

  const dock = new THREE.Mesh(
    new THREE.BoxGeometry(10, 1, 300),
    new THREE.MeshStandardMaterial({ color: 0x5a3b22 })
  );

  dock.position.set(0, 0.5, -80);
  scene.add(dock);

  /* =========================
     🌴 PALM TREES (CINEMATIC FRAMING)
  ========================= */

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1a });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f6b3a });

  function palm(x, z) {

    const g = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 7, 6),
      trunkMat
    );

    trunk.position.y = 3.5;

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 6, 6),
      leafMat
    );

    leaves.position.y = 7;

    g.add(trunk);
    g.add(leaves);

    g.position.set(x, 0, z);

    scene.add(g);
  }

  for (let i = -120; i <= 120; i += 25) {
    palm(-15, i);
    palm(15, i);
  }

  /* =========================
     🌫 ATMOSPHERE (GTA FEEL)
  ========================= */

  scene.fog = new THREE.FogExp2(0x0a1a22, 0.006);

  scene.background = new THREE.Color(0x87b5d6);
}
