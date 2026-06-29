export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;

    this.context = {};
  }

  registerSystems(systems) {
    this.systems = systems;
  }

  init() {
    // CORE
    this.scene = this.systems.scene?.init?.();
    this.camera = this.systems.camera?.init?.();
    this.renderer = this.systems.renderer?.init?.();

    this.context.scene = this.scene;
    this.context.camera = this.camera;
    this.context.renderer = this.renderer;

    // WORLD
    this.systems.world?.init?.(this.scene);
    this.systems.water?.init?.(this.scene);
    this.systems.dock?.init?.(this.scene);
    this.systems.sky?.init?.(this.scene);
    this.systems.lighting?.init?.(this.scene);

    // PLAYER LAYER (explicit = safer than auto loop init)
    this.systems.input?.init?.(this.context);
    this.systems.player?.init?.(this.context);

    this.loop();
  }

  loop = (time = 0) => {
    requestAnimationFrame(this.loop);

    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(delta);
    this.render();
  };

  update(delta) {
    this.context.delta = delta;

    // ONLY UPDATE systems that actually exist in gameplay loop
    this.systems.input?.update?.(delta, this.context);
    this.systems.player?.update?.(delta, this.context);

    this.systems.world?.update?.(delta, this.context);
    this.systems.water?.update?.(delta, this.context);
    this.systems.dock?.update?.(delta, this.context);

    this.systems.sky?.update?.(delta, this.context);
    this.systems.lighting?.update?.(delta, this.context);
  }

  render() {
    if (!this.scene || !this.camera || !this.renderer) return;

    this.renderer.render(this.scene, this.camera);
  }
}
