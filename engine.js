import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {
  scene: null,
  camera: null,
  renderer: null,

  world: new THREE.Group(),

  player: null,

  npcs: [],
  cars: [],

  keys: {},

  state: {
    district: "CENTER"
  }
};
