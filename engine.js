import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {
  scene: new THREE.Scene(),
  camera: null,
  renderer: null,

  world: new THREE.Group(),

  clock: new THREE.Clock(),
  delta: 0,
  elapsed: 0,

  updateCamera: null,

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      // 🔥 HARD FAIL-SAFE CAMERA
      if (!this.camera) {
        this.camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          2000
        );
        this.camera.position.set(0, 10, 20);
      }

      // 🔥 HARD FAIL-SAFE SCENE CONTENT
      if (this.world.children.length === 0) {
        const test = new THREE.Mesh(
          new THREE.BoxGeometry(3, 3, 3),
          new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        this.world.add(test);
      }

      if (this.updateCamera) this.updateCamera();

      // 🔥 FINAL RENDER GUARANTEE
      this.renderer.render(this.world, this.camera);
    };

    loop();
  }
};
