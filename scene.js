import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

engine.scene = new THREE.Scene();

/* SKY */
engine.scene.background = new THREE.Color(0x87b5ff);
engine.scene.fog = new THREE.Fog(0x87b5ff, 50, 200);

/* LIGHTING */
const ambient = new THREE.AmbientLight(0xffffff, 1);
engine.scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(50, 100, 50);
engine.scene.add(sun);

/* IMPORTANT: WORLD ROOT */
engine.scene.add(engine.world);

/* DEBUG VISUAL (FORCED CONFIRMATION) */
const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

testCube.position.set(0, 1, 0);
engine.scene.add(testCube);
