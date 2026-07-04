import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let camera;

// SPRING ARM STATE
let camX = 0, camY = 18, camZ = 32;
let camVelX = 0, camVelY = 0, camVelZ = 0;

// LOOK AT STATE
let lookX = 0, lookY = 3, lookZ = 0;
let lookVelX = 0, lookVelY = 0, lookVelZ = 0;

let cinTime = 0;

const SPRING     = 6.0;   // spring strength
const DAMPING    = 0.75;  // 0=bouncy 1=no bounce
const LOOK_SPRING = 8.0;

export default {
  init() {
    camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.1,
      1500
    );
    camera.position.set(0, 18, 32);
    camera.lookAt(0, 3, 0);

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
    var drift = Math.sin(cinTime * 0.18) * 0.8;

    // TARGET POSITION — behind and above player
    var tX = player.position.x + drift;
    var tY = player.position.y + 12;
    var tZ = player.position.z + 20;

    // SPRING PHYSICS X
    var forceX = (tX - camX) * SPRING;
    camVelX = (camVelX + forceX * delta) * DAMPING;
    camX += camVelX * delta;

    // SPRING PHYSICS Y
    var forceY = (tY - camY) * SPRING;
    camVelY = (camVelY + forceY * delta) * DAMPING;
    camY += camVelY * delta;

    // SPRING PHYSICS Z
    var forceZ = (tZ - camZ) * SPRING;
    camVelZ = (camVelZ + forceZ * delta) * DAMPING;
    camZ += camVelZ * delta;

    camera.position.set(camX, camY, camZ);

    // SMOOTH LOOK AT — spring toward player head
    var lX = player.position.x;
    var lY = player.position.y + 2.5;
    var lZ = player.position.z - 4;

    var lfX = (lX - lookX) * LOOK_SPRING;
    var lfY = (lY - lookY) * LOOK_SPRING;
    var lfZ = (lZ - lookZ) * LOOK_SPRING;

    lookVelX = (lookVelX + lfX * delta) * DAMPING;
    lookVelY = (lookVelY + lfY * delta) * DAMPING;
    lookVelZ = (lookVelZ + lfZ * delta) * DAMPING;

    lookX += lookVelX * delta;
    lookY += lookVelY * delta;
    lookZ += lookVelZ * delta;

    camera.lookAt(lookX, lookY, lookZ);
  },

  getCamera() { return camera; }
};
