export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;
  }

  init() {
    // init systems safely
    this.systems.scene?.init?.();
    this.systems.camera?.init?.();
    this.systems.renderer?.init?.();

    this.loop();
  }

  loop = (time = 0) => {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(delta);
    this.render();

    requestAnimationFrame(this.loop);
  };

  update(delta) {
    this.systems.input?.update?.(delta);
    this.systems.player?.update?.(delta);
    this.systems.world?.update?.(delta);
  }

  render() {
    const scene = this.systems.scene?.getScene?.();
    const camera = this.systems.camera?.getCamera?.();
    const renderer = this.systems.renderer?.getRenderer?.();

    if (!scene || !camera || !renderer) return;

    renderer.render(scene, camera);
  }
}
