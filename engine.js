export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;
    this.context = {};
    this.fpsInterval = 1000 / 60;
    this.then = 0;
  }
  registerSystems(systems) { this.systems = systems; }
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
    this.systems.cars?.init?.(this.scene);
    this.systems.npc?.init?.(this.scene);
    this.systems.cinematicFlow?.init?.(this.scene);
    this.systems.worldSkin?.init?.(this.scene);
    this.systems.dockCore?.init?.(this.scene);
    this.systems.marina?.init?.(this.scene);
    this.systems.input?.init?.();
    this.systems.player?.init?.(this.scene);
    this.systems.hud?.init?.();
    this.then = performance.now();
    this.loop();
  }
  loop = (now = 0) => {
    requestAnimationFrame(this.loop);
    var elapsed = now - this.then;
    if (elapsed < this.fpsInterval) return;
    this.then = now - (elapsed % this.fpsInterval);
    var delta = Math.min(elapsed / 1000, 0.05); // cap delta at 50ms
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
