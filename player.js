import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let player;

export default {
  init(scene) {
    const geometry = new THREE.BoxGeometry(1.5, 3, 1.5);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(geometry, material);
    // SPAWN ON TOP OF DOCK, near camera start
    player.position.set(0, 2, 10);
    scene.add(player);
    console.log("PLAYER SPAWNED:", player.position);
    this.speed = 8;
    return player;
  },
  update(delta, context) {
    const input = context.systems?.input;
    if (!input || !player) return;
    const move = this.speed * delta;
    if (input.keys?.w) player.position.z -= move;
    if (input.keys?.s) player.position.z += move;
    if (input.keys?.a) player.position.x -= move;
    if (input.keys?.d) player.position.x += move;
    context.player = player;
  }
};
