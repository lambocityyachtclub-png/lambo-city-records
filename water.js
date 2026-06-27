import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌊 LAMBO CITY OCEAN
========================================================= */

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(8000, 8000),
  new THREE.MeshStandardMaterial({
    color: 0x0a3d62,
    metalness: 0.8,
    roughness: 0.2
  })
);

water.rotation.x = -Math.PI / 2;

/*
  Move the ocean north of the city.
  City stays near z = 0.
*/
water.position.set(0, -0.5, 2500);

engine.world.add(water);

/* =========================================================
   🏖 BEACH STRIP
========================================================= */

const beach = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 400),
  new THREE.MeshStandardMaterial({
    color: 0xd9c28c
  })
);

beach.rotation.x = -Math.PI / 2;
beach.position.set(0, 0.02, 600);

engine.world.add(beach);
