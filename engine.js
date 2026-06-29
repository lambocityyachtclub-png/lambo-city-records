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
    // 1. CORE SYSTEMS FIRST (ONLY ONCE)
    this.context.scene = this.systems.scene?.init?.(this.context);
    this.context.camera = this.systems.camera?.init?.(this.context);
    this.context.renderer = this.systems.renderer?.init?.(this.context);

    // 2. WORLD SYSTEMS (NO RETURN EXPECTED)
    Object.entries(this.systems).forEach(([key, sys]) => {
      if (["scene", "camera", "renderer"].includes(key)) return;
      sys?.init?.(this.context);
    });

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
    Object.values(this.systems).forEach((sys) => {
      sys?.update?.(delta, this.context);
    });
  }

  render() {
    const { scene, camera, renderer } = this.context;

    if (!scene || !camera || !renderer) return;

    renderer.render(scene, camera);
  }
}
