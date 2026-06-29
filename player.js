import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let player;

export default {
  init(scene) {
    const geometry = new THREE.BoxGeometry(2, 3, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // 🔥 UNLIT = ALWAYS VISIBLE

    player = new THREE.Mesh(geometry, material);

    player.position.set(0, 5, 0);

    scene.add(player);

    console.log("PLAYER SPAWNED:", player);

    this.speed = 5;

    return player;
  },

  update(delta, context) {
    const input = context.systems?.input;

    if (!input) return;

    const move = this.speed * delta;

    if (input.keys?.w) player.position.z -= move;
    if (input.keys?.s) player.position.z += move;
    if (input.keys?.a) player.position.x -= move;
    if (input.keys?.d) player.position.x += move;

    context.player = player;
  }
};
