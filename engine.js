export default class Engine {
  constructor() {
    this.systems = {};
    this.rawSystems = {};
    this.initializedSystems = new Set();
    this.systemInitResults = new Map();
    this.lastTime = 0;
    this.context = { systems: this.systems };
    this.started = false;
  }

  registerSystems(systems) {
    // Merge new modules into the existing registry. Floor 2 and other
    // streamed departments are registered after startup; replacing this
    // object would silently remove the live world and render systems.
    for (const [name, system] of Object.entries(systems || {})) {
      if (this.rawSystems[name] === system && this.systems[name]) continue;

      this.rawSystems[name] = system;
      this.initializedSystems.delete(name);
      this.systemInitResults.delete(name);

      if (!system || typeof system !== "object") {
        this.systems[name] = system;
        continue;
      }

      const failed = new Set();
      this.systems[name] = new Proxy(system, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          if (typeof value !== "function") return value;

          if (property === "init") {
            return (...args) => {
              if (failed.has("init")) return undefined;
              try {
                return value.apply(target, args);
              } catch (error) {
                failed.add("init");
                console.error(`[LAMBO CITY] ${name}.init failed; continuing startup.`, error);
                if (typeof window !== "undefined") {
                  window.__lamboCityStartupErrors ||= [];
                  window.__lamboCityStartupErrors.push({
                    system: name,
                    phase: "init",
                    message: String(error?.message || error)
                  });
                }
                return undefined;
              }
            };
          }

          if (property === "update") {
            return (...args) => {
              if (failed.has("update")) return undefined;
              try {
                return value.apply(target, args);
              } catch (error) {
                failed.add("update");
                console.error(`[LAMBO CITY] ${name}.update failed; disabling this update only.`, error);
                if (typeof window !== "undefined") {
                  window.__lamboCityStartupErrors ||= [];
                  window.__lamboCityStartupErrors.push({
                    system: name,
                    phase: "update",
                    message: String(error?.message || error)
                  });
                }
                return undefined;
              }
            };
          }

          return value.bind(target);
        }
      });
    }

    // Keep the context pointed at the same live registry as modules stream in.
    this.context.systems = this.systems;
    return this.systems;
  }

  initSystem(name, ...args) {
    const system = this.systems[name];
    if (!system) return undefined;

    if (this.initializedSystems.has(name)) {
      return this.systemInitResults.get(name);
    }

    this.initializedSystems.add(name);
    const initArgs = args.length ? args : [this.scene, this.context];
    const result = system.init?.(...initArgs);
    this.systemInitResults.set(name, result);
    return result;
  }

  init() {
    if (this.started) return;
    this.started = true;

    this.scene = this.initSystem("scene");
    this.camera = this.initSystem("camera", this.scene);
    this.renderer = this.initSystem("renderer", this.scene, this.camera);

    this.context.scene = this.scene;
    this.context.camera = this.camera;
    this.context.renderer = this.renderer;
    this.context.systems = this.systems;

    // Build touch controls immediately after the core renderer/context exist.
    // Do not let optional world-feature initialization delay or suppress the iPad joystick.
    this.initSystem("input", this.scene, this.context);
    this.initSystem("performanceMonitor", this.renderer, this.context);

    this.initSystem("world", this.scene);
    this.initSystem("water", this.scene);
    this.initSystem("dock", this.scene);
    this.initSystem("dockPath", this.scene);
    this.initSystem("sky", this.scene);
    this.initSystem("lighting", this.scene);
    this.initSystem("palms", this.scene);
    this.initSystem("yacht", this.scene);
    this.initSystem("cars", this.scene);
    this.initSystem("npc", this.scene);
    this.initSystem("heroPerformance", this.scene);
    this.initSystem("heroPostPerformance", this.scene);
    this.initSystem("cinematicFlow", this.scene);
    this.initSystem("worldSkin", this.scene);
    this.initSystem("dockCore", this.scene);
    this.initSystem("marina", this.scene);
    this.initSystem("conferenceCenterDistrict", this.scene, this.context);
    this.initSystem("stageVideo", this.scene);
    this.initSystem("stageScreenMedia", this.scene);
    this.initSystem("stageBanner", this.scene);
    this.initSystem("ambientMusic");
    this.initSystem("stageMusic");
    this.initSystem("stageAudioZone", this.scene);
    this.initSystem("collision");
    this.initSystem("stageSpotlights", this.scene);
    this.initSystem("stageLasers", this.scene);
    this.initSystem("stageSmoke", this.scene);
    this.initSystem("stageCrowdPulse", this.scene);
    this.initSystem("grandStagePier", this.scene);
    this.initSystem("yachtLuxuryDetails", this.scene);
    this.initSystem("villaLuxuryDetails", this.scene);
    this.initSystem("dockEntranceLuxury", this.scene);
    this.initSystem("dockLuxuryOverhaul", this.scene);

    this.initSystem("recordsHQ", this.scene);
    this.initSystem("recordsHQFoundation", this.scene);
    this.initSystem("elevator", this.scene);
    this.initSystem("recordsHQFloor1", this.scene);
    this.initSystem("recordsHQEntranceThreshold", this.scene);
    this.initSystem("recordsHQMediaDetails", this.scene);
    this.initSystem("recordsHQMerchDetails", this.scene);
    this.initSystem("heroCareerCenter", this.scene, this.context);
    this.initSystem("recordsHQElevator", this.scene);
    this.initSystem("boardwalkOverlooks", this.scene);

    this.initSystem("player", this.scene);
    this.initSystem("worldSystemHost", this.scene, this.context);
    this.initSystem("worldStreaming", this.scene, this.context);
    this.initSystem("hud");

    this.loop();
  }

  loop = (time = 0) => {
    requestAnimationFrame(this.loop);
    // Keep simulation time close to wall time on lower-frame-rate devices.
    // A 33ms cap made elevator and player motion crawl below 30 FPS.
    const delta = Math.min(
      (time - this.lastTime) / 1000,
      0.1
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
    this.renderer.render(this.scene, this.camera);
  }
}
