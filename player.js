import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let player;

export default {
  init(scene) {
    player = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0x00ffcc })
    );

    player.position.set(0, 1, 5);
    scene.add(player);

    this.speed = 5; // units per second (smooth movement)

    return player;
  },

  update(delta, context) {
    const input = context.systems?.input || context.input;

    if (!input) return;

    const move = this.speed * delta;

    if (input.keys?.w) player.position.z -= move;
    if (input.keys?.s) player.position.z += move;
    if (input.keys?.a) player.position.x -= move;
    if (input.keys?.d) player.position.x += move;

    context.player = player;
  },

  getPlayer() {
    return player;
  }
};
