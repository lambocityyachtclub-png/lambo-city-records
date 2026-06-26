import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   LAMBO CITY - MODELS SYSTEM (CABINS + DOCKS + STAGE)
   This is where your world "stops being squares"
========================================================= */

export function loadCityModels(scene) {

  /* -----------------------------
     OCEAN WATER (BASIC REALISTIC BASE)
  ------------------------------*/
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshStandardMaterial({
      color: 0x0a1a2a,
      metalness: 0.2,
      roughness: 0.1
    })
  );

  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.5;
  scene.add(water);

  /* -----------------------------
     MAIN DOCK (LUXURY WOOD PLATFORM)
  ------------------------------*/
  const dock = new THREE.Mesh(
    new THREE.BoxGeometry(40, 1, 12),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1e })
  );

  dock.position.set(0, 0, -10);
  scene.add(dock);

  /* -----------------------------
     HERO MANSION CABIN (BIGGEST BUILDING)
  ------------------------------*/
  const heroCabin = new THREE.Mesh(
    new THREE.BoxGeometry(10, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );

  heroCabin.position.set(0, 3, -25);
  scene.add(heroCabin);

  /* -----------------------------
     VIP CABINS (LOCKED AREA)
  ------------------------------*/
  const cabinPositions = [
    [-12, -25],
    [12, -25],
    [-18, -35],
    [18, -35]
  ];

  cabinPositions.forEach((pos, i) => {
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );

    cabin.position.set(pos[0], 2, pos[1]);
    scene.add(cabin);
  });

  /* -----------------------------
     BEACH TRANSITION (SAND ZONE)
  ------------------------------*/
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 200),
    new THREE.MeshStandardMaterial({ color: 0xc2b280 })
  );

  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0, 60);
  scene.add(sand);

  /* -----------------------------
     COACHELLA STYLE STAGE
  ------------------------------*/
  const stage = new THREE.Mesh(
    new THREE.BoxGeometry(30, 3, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );

  stage.position.set(0, 1.5, 30);
  scene.add(stage);

  const jumbotron = new THREE.Mesh(
    new THREE.BoxGeometry(18, 10, 1),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );

  jumbotron.position.set(0, 8, 24);
  scene.add(jumbotron);

  /* -----------------------------
     SIMPLE PALM / ATMOSPHERE LIGHTS
  ------------------------------*/
  for (let i = -40; i <= 40; i += 20) {
    const light = new THREE.PointLight(0xffcc88, 1, 20);
    light.position.set(i, 5, 10);
    scene.add(light);
  }

}
