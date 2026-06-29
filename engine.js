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
    this.scene    = this.systems.scene?.init?.();
    this.camera   = this.systems.camera?.init?.();
    this.renderer = this.systems.renderer?.init?.();

    this.context.scene    = this.scene;
    this.context.camera   = this.camera;
    this.context.renderer = this.renderer;
    this.context.systems  = this.systems;

    this.systems.world?.init?.(this.scene);
    this.systems.water?.init?.(this.scene);
    this.systems.dock?.init?.(this.scene);
    this.systems.sky?.init?.(this.scene);
    this.systems.lighting?.init?.(this.scene);
    this.systems.palms?.init?.(this.scene);
    this.systems.yacht?.init?.(this.scene);

    this.systems.input?.init?.();
    this.systems.player?.init?.(this.scene);
    this.systems.hud?.init?.();       // ✅ HUD needs no scene

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
    Object.values(this.systems).forEach((sys) => {
      sys?.update?.(delta, this.context);
    });
  }
  render() {
    if (!this.scene || !this.camera || !this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }
}
