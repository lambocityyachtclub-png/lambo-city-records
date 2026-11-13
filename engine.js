export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;
    this.context = {};
  }
  registerSystems(systems) {
    // Isolate every feature at its lifecycle boundary. A failed optional
    // module must not prevent the remaining world from initializing or
    // interrupt the animation loop.
    this.systems = Object.fromEntries(
      Object.entries(systems).map(([name, system]) => {
        if (!system || typeof system !== "object") return [name, system];
        const failed = new Set();
        const isolated = new Proxy(system, {
          get(target, property) {
            const value = Reflect.get(target, property, target);
            if (typeof value !== "function") return value;

            if (property === "init" || property === "update") {
              return (...args) => {
                if (failed.has(property)) return undefined;
                try {
                  return value.apply(target, args);
                } catch (error) {
                  failed.add(property);
                  const record = {
                    system: name,
                    phase: property,
                    message: String(error?.message || error),
                    timestamp: Date.now()
                  };
                  console.error(
                    `[LAMBO CITY] ${name}.${property} failed; isolating this feature.`,
                    error
                  );
                  if (typeof window !== "undefined") {
                    window.__lamboCityStartupErrors ||= [];
                    window.__lamboCityStartupErrors.push(record);
                  }
                  return undefined;
                }
              };
            }
            return value.bind(target);
          }
        });
        return [name, isolated];
      })
    );
  }
  init() {
    this.scene    = this.systems.scene?.init?.();
    this.camera   = this.systems.camera?.init?.();
    this.renderer = this.systems.renderer?.init?.();
    this.context.scene    = this.scene;
    this.context.camera   = this.camera;
    this.context.renderer = this.renderer;
    this.context.systems  = this.systems;
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
    this.systems.conferenceCenterDistrict?.init?.(this.scene, this.context);
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
this.systems.recordsHQFloor3Executive?.init?.(this.scene);
this.systems.recordsHQFloor3Details?.init?.(this.scene);
this.systems.recordsHQFloor3Experience?.init?.(this.scene, this.context);
this.systems.recordsHQRooftopVIP?.init?.(this.scene);
this.systems.recordsHQEntranceThreshold?.init?.(this.scene);
this.systems.recordsHQMediaDetails?.init?.(this.scene);
this.systems.recordsHQMerchDetails?.init?.(this.scene);
this.systems.heroCareerCenter?.init?.(this.scene, this.context);
this.systems.recordsHQElevator?.init?.(this.scene);

// Session controls need the initialized renderer and the elevator arrival hook.
this.systems.floor2StudioSession?.init?.(
  this.scene,
  this.context
);

// The dedicated music-interface modules enhance the already-built stations.
// Their Three.js imports are lazy so standalone Studio remains independent.
this.systems.studioMixMasterConsole3D?.init?.(this.scene, this.context);
this.systems.floor2LiveDrummer?.init?.(this.scene, this.context);
this.systems.floor2VocalBooth3D?.init?.(this.scene, this.context);
this.systems.floor2CitySynth?.init?.(this.scene, this.context);

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
