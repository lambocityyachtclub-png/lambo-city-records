import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================
   SCENE
========================= */

engine.scene = new THREE.Scene();
engine.scene.background = new THREE.Color(0x111111);

/* LIGHT */
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(10, 20, 10);
engine.scene.add(light);

/* AMBIENT */
engine.scene.add(new THREE.AmbientLight(0xffffff, 1));

/* =========================
   🚨 FORCE VISIBILITY OBJECT
========================= */

const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

testCube.position.set(0, 1, 0);
engine.scene.add(testCube);

/* GROUND */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);

ground.rotation.x = -Math.PI / 2;
engine.scene.add(ground);

/* WORLD ROOT */
engine.scene.add(engine.world);
