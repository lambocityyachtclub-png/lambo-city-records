import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

export function initWorldSkin() {

  /* =====================================================
     🌅 SKY ATMOSPHERE
  ===================================================== */

  engine.scene.background = new THREE.Color(0x070a12);

  engine.scene.fog = new THREE.FogExp2(0x0a0f18, 0.0008);

  /* =====================================================
     💡 CINEMATIC LIGHT BALANCE
  ===================================================== */

  const ambient = new THREE.AmbientLight(0x2a3b5a, 0.6);
  engine.scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffd6a0, 1.4);
  sun.position.set(200, 300, 150);
  engine.scene.add(sun);

  /* =====================================================
     🌴 SIMPLE PALM TREE SYSTEM (PLACEHOLDER PROPS)
  ===================================================== */

  function createPalm(x, z) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1, 12, 6),
      new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
    );

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(3, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x1f6b3a })
    );

    const group = new THREE.Group();
    trunk.position.y = 6;
    leaves.position.y = 12;

    group.add(trunk);
    group.add(leaves);

    group.position.set(x, 0, z);

    engine.world.add(group);
  }

  /* =====================================================
     🌴 PLACE PALM ROWS (DOCK FEEL)
  ===================================================== */

  for (let i = -10; i <= 10; i++) {
    createPalm(-20, i * 30);
    createPalm(20, i * 30);
  }

  console.log("🌴 Cinematic World Skin Loaded");
}
