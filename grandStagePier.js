import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const PIER_X = 0;
    const PIER_Z = -74;
    const PIER_RADIUS = 30;

    // Main pier
    const pier = new THREE.Mesh(
      new THREE.CylinderGeometry(30, 30, 1, 32),
      new THREE.MeshStandardMaterial({
        color: 0x17131c,
        roughness: 0.7,
        metalness: 0.25
      })
    );

    pier.position.set(PIER_X, 0.45, PIER_Z);
    pier.receiveShadow = true;
    pier.name = "grandStageCircularPier";
    scene.add(pier);

    // Outer rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 0.35,
        0.45,
        8,
        64
      ),
      new THREE.MeshStandardMaterial({
        color: 0x08080d,
        roughness: 0.45,
        metalness: 0.65
      })
    );

    rim.rotation.x = Math.PI / 2;
    rim.position.set(PIER_X, 1.0, PIER_Z);
    rim.name = "grandStagePierRim";
    scene.add(rim);

    // Purple neon
    const neonMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 2.5
    });

    const neon = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 0.9,
        0.08,
        6,
        64
      ),
      neonMaterial
    );

    neon.rotation.x = Math.PI / 2;
    neon.position.set(PIER_X, 1.08, PIER_Z);
    neon.name = "grandStagePierNeon";
    scene.add(neon);
  },

  update() {}
};
