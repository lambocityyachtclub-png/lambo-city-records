export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;
    this.context = {}; // shared world data (future-proof)
  }

  registerSystems(systems) {
    this.systems = systems;
  }

  init() {
    const scene = this.systems.scene?.init?.(this.context);
    const camera = this.systems.camera?.init?.(this.context);
    const renderer = this.systems.renderer?.init?.(this.context);

    this.context.scene = scene;
    this.context.camera = camera;
    this.context.renderer = renderer;

    // AUTO INIT ALL SYSTEMS (NO MANUAL LISTING EVER AGAIN)
    Object.values(this.systems).forEach((sys) => {
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
