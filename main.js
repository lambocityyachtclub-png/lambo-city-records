import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* -----------------------------
   WORLD OBJECTS
------------------------------*/

export function createWorld(scene) {

  /* -----------------------------
     GROUND DETAIL (OPTIONAL FUTURE EXPANSION)
  ------------------------------*/
  const groundDetail = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x111827 })
  );

  groundDetail.rotation.x = -Math.PI / 2;
  scene.add(groundDetail);

  /* -----------------------------
     PLAZA
  ------------------------------*/
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );

  plaza.position.y = 0.25;
  scene.add(plaza);

  /* -----------------------------
     PILLARS
  ------------------------------*/
  for (let i = 0; i < 4; i++) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(2, 10, 2),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1.5
      })
    );

    const angle = (i / 4) * Math.PI * 2;

    pillar.position.x = Math.cos(angle) * 6;
    pillar.position.z = Math.sin(angle) * 6;
    pillar.position.y = 5;

    scene.add(pillar);
  }

  /* -----------------------------
     BEACON
  ------------------------------*/
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  );

  beacon.position.set(0, 10, 0);
  scene.add(beacon);

  return {
    plaza,
    beacon
  };
}
