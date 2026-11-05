export default class Engine {
  constructor() {
    this.systems = {};
    this.initializedSystems = new Set();
    this.lastTime = 0;
    this.context = {};
  }
  registerSystems(systems) {
    this.systems = systems;
  }

  // Used only for modules loaded after initial world startup.
  initializeSystem(name, ...args) {
    const system = this.systems[name];
    if (!system || typeof system.init !== "function") return false;
    if (this.initializedSystems.has(name)) return true;
    try {
      system.init(...args);
      this.initializedSystems.add(name);
      return true;
    } catch (error) {
      console.error("LAMBO CITY lazy system initialization failed:", name, error);
      window.__lamboCitySystemErrors ??= [];
      window.__lamboCitySystemErrors.push({ system: name, message: error?.message || String(error) });
      return false;
    }
  }
  init() {
    this.scene    = this.systems.scene?.init?.();
    this.camera   = this.systems.camera?.init?.();
    this.renderer = this.systems.renderer?.init?.();
    this.context.scene    = this.scene;
    this.context.camera   = this.camera;
    this.context.renderer = this.renderer;
    this.context.systems  = this.systems;
    this.context.initializeSystem = this.initializeSystem.bind(this);
    this.systems.performanceMonitor?.init?.(this.renderer, this.context);
    this.systems.world?.init?.(this.scene);
    this.systems.water?.init?.(this.scene);
    this.systems.dock?.init?.(this.scene);
    this.systems.dockPath?.init?.(this.scene);
    this.systems.sky?.init?.(this.scene);
    this.systems.lighting?.init?.(this.scene);
    this.systems.palms?.init?.(this.scene);
    this.systems.yacht?.init?.(this.scene);
    this.systems.cars?.init?.(this.scene);
    this.systems.npc?.init?.(this.scene);
    this.systems.heroPerformance?.init?.(this.scene);
    this.systems.heroPostPerformance?.init?.(this.scene);
    this.systems.cinematicFlow?.init?.(this.scene);
    this.systems.worldSkin?.init?.(this.scene);
    this.systems.dockCore?.init?.(this.scene);
    this.systems.marina?.init?.(this.scene);
    this.systems.stageVideo?.init?.(this.scene);
    this.systems.stageScreenMedia?.init?.(this.scene);
    this.systems.stageBanner?.init?.(this.scene);
    this.systems.ambientMusic?.init?.();
    this.systems.stageMusic?.init?.();
    this.systems.stageAudioZone?.init?.(this.scene);
    this.systems.collision?.init?.();
    this.systems.stageSpotlights?.init?.(this.scene);
    this.systems.stageLasers?.init?.(this.scene);
    this.systems.stageSmoke?.init?.(this.scene);
    this.systems.stageCrowdPulse?.init?.(this.scene);
    this.systems.grandStagePier?.init?.(this.scene);
    this.systems.yachtLuxuryDetails?.init?.(this.scene);
    this.systems.villaLuxuryDetails?.init?.(this.scene);
   this.systems.dockEntranceLuxury?.init?.(this.scene);
this.systems.dockLuxuryOverhaul?.init?.(this.scene);

this.systems.recordsHQ?.init?.(this.scene);
this.systems.recordsHQFoundation?.init?.(this.scene);
this.systems.elevator?.init?.(this.scene);
this.systems.recordsHQFloor1?.init?.(this.scene);
// Floor 2 architecture and studio applications are loaded on demand.
this.systems.recordsHQFloor3Executive?.init?.(this.scene);
this.systems.recordsHQFloor3Details?.init?.(this.scene);
this.systems.recordsHQFloor3Experience?.init?.(this.scene, this.context);
this.systems.recordsHQRooftopVIP?.init?.(this.scene);
this.systems.recordsHQEntranceThreshold?.init?.(this.scene);
this.systems.recordsHQMediaDetails?.init?.(this.scene);
this.systems.recordsHQMerchDetails?.init?.(this.scene);
this.systems.recordsHQElevator?.init?.(this.scene);

// Floor 2 session controls are initialized when Floor 2 is selected.
this.systems.boardwalkOverlooks?.init?.(this.scene);
    this.systems.input?.init?.();
    this.systems.player?.init?.(this.scene);
    this.systems.hud?.init?.();
    this.loop();
  }
  loop = (time = 0) => {
    requestAnimationFrame(this.loop);
    const delta = Math.min(
      (time - this.lastTime) / 1000,
      0.033
    );
    this.lastTime = time;
    this.update(delta);
    this.render();
  };
  update(delta) {
    this.context.delta = delta;
    Object.values(this.systems).forEach(sys =>
      sys?.update?.(delta, this.context)
    );
  }
  render() {
    if (!this.scene || !this.camera || !this.renderer) return;
    this.renderer.render(
      this.scene,
      this.camera
    );
  }
}
