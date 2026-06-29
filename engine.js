export default class Engine {
  constructor() {
    this.systems = {};
  }

  registerSystems(systems) {
    this.systems = systems;
  }

  init() {
    this.scene = this.systems.scene?.init?.();
    this.camera = this.systems.camera?.init?.();
    this.renderer = this.systems.renderer?.init?.();

    this.systems.world?.init?.(this.scene);
    this.systems.water?.init?.(this.scene);
    this.systems.dock?.init?.(this.scene);
    this.systems.sky?.init?.(this.scene);
    this.systems.lighting?.init?.(this.scene);

    this.loop();
  }

  loop = () => {
    requestAnimationFrame(this.loop);

    this.update();
    this.render();
  };

  update() {
    this.systems.player?.update?.();
    this.systems.input?.update?.();
  }

  render() {
    if (!this.scene || !this.camera || !this.renderer) return;

    this.renderer.render(this.scene, this.camera);
  }
}
