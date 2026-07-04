import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let camera;
let cinTime = 0;
let camVelocity = new THREE.Vector3();
let currentPos = new THREE.Vector3();
let targetPos = new THREE.Vector3();

export default {
  init() {
    camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1500
    );
    camera.position.set(0, 18, 32);
    currentPos.copy(camera.position);
    camera.lookAt(0, 2, 0);

    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
    return camera;
  },

  update(delta, context) {
    var player = context.player;
    if (!player) return;
    cinTime += delta;

    // SUBTLE CINEMATIC DRIFT
    var drift = Math.sin(cinTime * 0.2) * 1.0;

    targetPos.set(
      player.position.x + drift,
      player.position.y + 13,
      player.position.z + 22
    );

    // SMOOTH WEIGHTED FOLLOW — feels heavy like GTA
    var lerpSpeed = 4.5;
    currentPos.lerp(targetPos, Math.min(1, lerpSpeed * delta));
    camera.position.copy(currentPos);

    // LOOK AHEAD of player direction
    var lookTarget = new THREE.Vector3(
      player.position.x,
      player.position.y + 2.5,
      player.position.z - 6
    );
    camera.lookAt(lookTarget);
  },

  getCamera() { return camera; }
};
