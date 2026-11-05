export default class Engine {
  constructor() {
    this.systems = {};
    this.initializedSystems = new Set();
    this.failedUpdates = new Set();
    this.lastTime = 0;
    this.context = {};
  }
  registerSystems(systems) {
    this.systems = systems;
  }

  initializeSystem(name, ...args) {
    const system = this.systems[name];
    if (!system || typeof system.init !== "function") return false;
    if (this.initializedSystems.has(name)) return true;
    try {
      system.init(...args);
      this.initializedSystems.add(name);
      return true;
    } catch (error) {
      console.error("LAMBO CITY system initialization failed:", name, error);
      window.__lamboCitySystemErrors ??= [];
      window.__lamboCitySystemErrors.push({ system: name, message: error?.message || String(error) });
      return false;
    }
  }
  init() {
    try { this.scene = this.systems.scene?.init?.(); } catch (error) { console.error("Scene initialization failed:", error); }
    try { this.camera = this.systems.camera?.init?.(); } catch (error) { console.error("Camera initialization failed:", error); }
    try { this.renderer = this.systems.renderer?.init?.(); } catch (error) { console.error("Renderer initialization failed:", error); }
    this.context.scene    = this.scene;
    this.context.camera   = this.camera;
    this.context.renderer = this.renderer;
    this.context.systems  = this.systems;
    this.context.initializeSystem = this.initializeSystem.bind(this);
    this.initializeSystem("performanceMonitor", this.renderer, this.context);
    this.initializeSystem("world", this.scene);
    this.initializeSystem("water", this.scene);
    this.initializeSystem("dock", this.scene);
    this.initializeSystem("dockPath", this.scene);
    this.initializeSystem("sky", this.scene);
    this.initializeSystem("lighting", this.scene);
    this.initializeSystem("palms", this.scene);
    this.initializeSystem("yacht", this.scene);
    this.initializeSystem("cars", this.scene);
    this.initializeSystem("npc", this.scene);
    this.initializeSystem("heroPerformance", this.scene);
    this.initializeSystem("heroPostPerformance", this.scene);
    this.initializeSystem("cinematicFlow", this.scene);
    this.initializeSystem("worldSkin", this.scene);
    this.initializeSystem("dockCore", this.scene);
    this.initializeSystem("marina", this.scene);
    this.initializeSystem("stageVideo", this.scene);
    this.initializeSystem("stageScreenMedia", this.scene);
    this.initializeSystem("stageBanner", this.scene);
    this.initializeSystem("ambientMusic");
    this.initializeSystem("stageMusic");
    this.initializeSystem("stageAudioZone", this.scene);
    this.initializeSystem("collision");
    this.initializeSystem("stageSpotlights", this.scene);
    this.initializeSystem("stageLasers", this.scene);
    this.initializeSystem("stageSmoke", this.scene);
    this.initializeSystem("stageCrowdPulse", this.scene);
    this.initializeSystem("grandStagePier", this.scene);
    this.initializeSystem("yachtLuxuryDetails", this.scene);
    this.initializeSystem("villaLuxuryDetails", this.scene);
   this.initializeSystem("dockEntranceLuxury", this.scene);
this.initializeSystem("dockLuxuryOverhaul", this.scene);

this.initializeSystem("recordsHQ", this.scene);
this.initializeSystem("recordsHQFoundation", this.scene);
this.initializeSystem("elevator", this.scene);
this.initializeSystem("recordsHQFloor1", this.scene);
this.systems.recordsHQFloor2Studio?.init?.(this.scene);

this.systems.floor2StudioApp?.init?.(
  this.scene,
  this.context
);

this.systems.floor2InstrumentApp?.init?.(
  this.scene,
  this.context
);

this.systems.floor2DrumStation?.init?.(
  this.scene,
  this.context
);
this.systems.floor2StudioNavigation?.init?.(
  this.scene,
  this.context
);
this.initializeSystem("recordsHQFloor3Executive", this.scene);
this.initializeSystem("recordsHQFloor3Details", this.scene);
this.initializeSystem("recordsHQFloor3Experience", this.scene, this.context);
this.initializeSystem("recordsHQRooftopVIP", this.scene);
this.initializeSystem("recordsHQEntranceThreshold", this.scene);
this.initializeSystem("recordsHQMediaDetails", this.scene);
this.initializeSystem("recordsHQMerchDetails", this.scene);
this.initializeSystem("recordsHQElevator", this.scene);

// Session controls need the initialized renderer and the elevator arrival hook.
this.systems.floor2StudioSession?.init?.(
  this.scene,
  this.context
);

this.initializeSystem("boardwalkOverlooks", this.scene);
    this.initializeSystem("input");
    this.initializeSystem("player", this.scene);
    this.initializeSystem("hud");
    if (!this.scene || !this.camera || !this.renderer) {
      if (typeof document !== "undefined" && !document.getElementById("lambo-city-startup-error")) {
        const panel = document.createElement("div");
        panel.id = "lambo-city-startup-error";
        panel.setAttribute("role", "alert");
        panel.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:28px;background:#080a0f;color:#f4f1eb;font:14px/1.6 Arial,sans-serif;text-align:center";
        panel.textContent = "LAMBO CITY could not start the 3D world. A required rendering component did not initialize. Please refresh the page and check the browser console.";
        document.body.appendChild(panel);
      }
      return;
    }
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
    for (const [name, system] of Object.entries(this.systems)) {
      if (this.failedUpdates.has(name) || typeof system?.update !== "function") continue;
      try {
        system.update(delta, this.context);
      } catch (error) {
        this.failedUpdates.add(name);
        console.error("LAMBO CITY system update disabled after an error:", name, error);
      }
    }
  }
  render() {
    if (!this.scene || !this.camera || !this.renderer) return;
    this.renderer.render(
      this.scene,
      this.camera
    );
  }
}
