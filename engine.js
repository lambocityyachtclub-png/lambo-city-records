export default class Engine {
  constructor() {
    this.systems = {};
  }

  init() {
    this.systems.scene?.init?.();
    this.systems.camera?.init?.();
    this.systems.renderer?.init?.();

    this.loop();
  }

  loop = () => {
    requestAnimationFrame(this.loop);

    this.update();
    this.render();
  };

  update() {
    this.systems.player?.update?.();
    this.systems.world?.update?.();
  }

  render() {
    const scene = this.systems.scene?.getScene?.();
    const camera = this.systems.camera?.getCamera?.();
    const renderer = this.systems.renderer?.getRenderer?.();

    if (!scene || !camera || !renderer) return;

    renderer.render(scene, camera);
  }
}
