import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* -----------------------------
   LAMBO CITY WORLD MODELS
   (DOCKS + CABINS + BEACH BASE)
------------------------------*/

export function createWorldModels(scene) {
  
  /* =========================
     WATER (REALISTIC BASE)
  ========================== */
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
      color: 0x0a3a5a,
      roughness: 0.2,
      metalness: 0.6
    })
  );

  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.5, -80);
  scene.add(water);

  /* =========================
     DOCK PLATFORM
  ========================== */
  const dock = new THREE.Mesh(
    new THREE.BoxGeometry(120, 2, 40),
    new THREE.MeshStandardMaterial({
      color: 0x3b2a1a,
      roughness: 0.9
    })
  );

  dock.position.set(0, 0, -40);
  scene.add(dock);

  /* =========================
     CABINS (LOCKED VILLAS)
  ========================== */
  function createCabin(x, z, color = 0x8b5a2b) {
    const cabin = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6, 10),
      new THREE.MeshStandardMaterial({ color })
    );

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(7, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );

    roof.position.y = 5.5;

    cabin.add(base);
    cabin.add(roof);

    cabin.position.set(x, 3, z);

    scene.add(cabin);
    return cabin;
  }

  createCabin(-30, -55);
  createCabin(0, -55);
  createCabin(30, -55);

  /* =========================
     HERO MANSION (MAIN CABIN)
  ========================== */
  const heroMansion = new THREE.Mesh(
    new THREE.BoxGeometry(18, 10, 18),
    new THREE.MeshStandardMaterial({
      color: 0xd4af37, // gold luxury tone
      emissive: 0x222200
    })
  );

  heroMansion.position.set(0, 5, -70);
  scene.add(heroMansion);

  /* =========================
     BEACH TRANSITION ZONE
  ========================== */
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 120),
    new THREE.MeshStandardMaterial({ color: 0xc2b280 })
  );

  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.45, 60);
  scene.add(sand);

}
