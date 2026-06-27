import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

// Example car (we'll expand later)
const car = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xff3333 })
);

car.position.set(0, 0.5, 0);
engine.world.add(car);

// Similarly, we'll add logic later to make cars move, but for now, this just ensures the chain loads.
