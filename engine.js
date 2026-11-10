// LAMBO CITY — central runtime orchestrator.
// World features register here; destination-specific systems are attached
// later by main.js when the player enters that destination.

export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;
    this.context = {};
    this.initialized = false;
  }

  registerSystems(systems) {
    if (this.initialized) {
      throw new Error("Engine systems must be registered before initialization.");
    }
    this.systems = systems || {};
    return this;
  }

  init() {
    if (this.initialized) return this;
    this.initialized = true;

    const initialize = (name, ...args) =>
      this.systems[name]?.init?.(...args);

    this.scene = initialize("scene");
    this.camera = initialize("camera");
    this.renderer = initialize("renderer");

    this.context.scene = this.scene;
    this.context.camera = this.camera;
    this.context.renderer = this.renderer;
    this.context.systems = this.systems;

    initialize("performanceMonitor", this.renderer, this.context);
    initialize("world", this.scene);
    initialize("water", this.scene);
    initialize("dock", this.scene);
    initialize("dockPath", this.scene);
    initialize("sky", this.scene);
    initialize("lighting", this.scene);
    initialize("palms", this.scene);
    initialize("yacht", this.scene);
    initialize("cars", this.scene);
    initialize("npc", this.scene);
    initialize("heroPerformance", this.scene);
    initialize("heroPostPerformance", this.scene);
    initialize("cinematicFlow", this.scene);
    initialize("worldSkin", this.scene);
    initialize("dockCore", this.scene);
    initialize("marina", this.scene);
    initialize("conferenceCenterDistrict", this.scene, this.context);
    initialize("stageVideo", this.scene);
    initialize("stageScreenMedia", this.scene);
    initialize("stageBanner", this.scene);
    initialize("ambientMusic");
    initialize("stageMusic");
    initialize("stageAudioZone", this.scene);
    initialize("collision");
    initialize("stageSpotlights", this.scene);
    initialize("stageLasers", this.scene);
    initialize("stageSmoke", this.scene);
    initialize("stageCrowdPulse", this.scene);
    initialize("grandStagePier", this.scene);
    initialize("yachtLuxuryDetails", this.scene);
    initialize("villaLuxuryDetails", this.scene);
    initialize("dockEntranceLuxury", this.scene);
    initialize("dockLuxuryOverhaul", this.scene);
    initialize("recordsHQ", this.scene);
    initialize("recordsHQFoundation", this.scene);
    initialize("elevator", this.scene);
    initialize("recordsHQFloor1", this.scene);
    initialize("recordsHQEntranceThreshold", this.scene);
    initialize("recordsHQMediaDetails", this.scene);
    initialize("recordsHQMerchDetails", this.scene);
    initialize("recordsHQElevator", this.scene);
    initialize("boardwalkOverlooks", this.scene);
    initialize("input");
    initialize("player", this.scene);
    initialize("worldSystemHost", this.scene, this.context);
    initialize("worldStreaming", this.scene, this.context);
    initialize("hud");

    this.loop();
    return this;
  }

  loop = (time = 0) => {
    requestAnimationFrame(this.loop);
    const delta = Math.min((time - this.lastTime) / 1000, 0.033);
    this.lastTime = time;
    this.update(delta);
    this.render();
  };

  update(delta) {
    this.context.delta = delta;
    for (const system of Object.values(this.systems)) {
      system?.update?.(delta, this.context);
    }
  }

  render() {
    if (!this.scene || !this.camera || !this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }
}
