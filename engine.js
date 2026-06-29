export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;

    // shared world state (CRITICAL)
    this.context = {};
  }

  registerSystems(systems) {
    this.systems = systems;
  }

  init() {
    // CORE SYSTEMS
    this.scene = this.systems.scene?.init?.();
    this.camera = this.systems.camera?.init?.();
    this.renderer = this.systems.renderer?.init?.();

    // STORE IN CONTEXT
    this.context.scene = this.scene;
    this.context.camera = this.camera;
    this.context.renderer = this.renderer;

    // WORLD INIT (pass scene)
    this.systems.world?.init?.(this.scene);
    this.systems.water?.init?.(this.scene);
    this.systems.dock?.init?.(this.scene);
    this.systems.sky?.init?.(this.scene);
    this.systems.lighting?.init?.(this.scene);

    // PLAYER SYSTEM INIT (IMPORTANT)
    this.systems.input?.init?.();
    this.systems.player?.init?.(this.scene);

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
    // PASS CONTEXT TO EVERYTHING
    this.context.delta = delta;

    this.systems.input?.update?.(delta, this.context);
    this.systems.player?.update?.(delta, this.context);
  }

  render() {
    if (!this.scene || !this.camera || !this.renderer) return;

    this.renderer.render(this.scene, this.camera);
  }
}
