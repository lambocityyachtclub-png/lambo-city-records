start() {
  const loop = () => {
    requestAnimationFrame(loop);

    this.delta = this.clock.getDelta();
    this.elapsed += this.delta;

    for (const sys of this.systems) {
      sys(this);
    }

    if (this.updateCamera) {
      this.updateCamera(this);
    }

    // 🚨 DEBUG FORCE LOG
    if (!this.scene) console.error("NO SCENE");
    if (!this.camera) console.error("NO CAMERA");
    if (!this.renderer) console.error("NO RENDERER");

    this.renderer.render(this.scene, this.camera);
  };

  loop();
}
