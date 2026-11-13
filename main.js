import Engine from "./engine.js";
import Scene, { THREE } from "./scene.js";
import Camera from "./camera.js";
import Renderer from "./renderer.js";
import World from "./world.js";
import Dock from "./dock.js";
import DockPath from "./dockPath.js";
import Water from "./water.js";
import Sky from "./sky.js";
import Lighting from "./lighting.js";
import Palms from "./palms.js";
import Yacht from "./yacht.js";
import Input from "./input.js";
import Player from "./player.js";
import HUD from "./hud.js";
import NPC from "./npc.js";
import HeroPerformance from "./heroPerformance.js";
import heroPostPerformance from "./heroPostPerformance.js";
// Cars temporarily disabled.
// The cars.js feature remains preserved for future use.
import CinematicFlowSystem from "./cinematicFlowSystem.js";
import CinematicWorldSkin from "./cinematicWorldSkin.js";
import CinematicDockCore from "./cinematicDockCore.js";
import Marina from "./marina.js";
import ConferenceCenterDistrict from "./conferenceCenterDistrict.js";
import StageVideo from "./stageVideo.js";
import StageScreenMedia from "./stageScreenMedia.js";
import StageBanner from "./stageBanner.js";
import AmbientMusic from "./ambientMusic.js";
import StageMusic from "./stageMusic.js";
import StageAudioZone from "./stageAudioZone.js";
import Collision from "./collision.js";
import GrandStagePier from "./grandStagePier.js";
import StageSpotlights from "./stageSpotlights.js";
import StageLasers from "./stageLasers.js";
import StageSmoke from "./stageSmoke.js";
import StageCrowdPulse from "./stageCrowdPulse.js";
import YachtLuxuryDetails from "./yachtLuxuryDetails.js";
import DockEntranceLuxury from "./dockEntranceLuxury.js";
import DockLuxuryOverhaul from "./dockLuxuryOverhaul.js";
import RecordsHQ from "./recordsHQ.js";
import RecordsHQFoundation from "./recordsHQFoundation.js";
import RecordsHQFloor1 from "./recordsHQFloor1.js";
import RecordsHQEntranceThreshold from "./recordsHQEntranceThreshold.js";
import RecordsHQMediaDetails from "./recordsHQMediaDetails.js";
import RecordsHQMerchDetails from "./recordsHQMerchDetails.js";
import HeroCareerCenter from "./heroCareerCenter.js";
import RecordsHQElevator from "./recordsHQElevator.js";
import Elevator from "./elevator.js";
import BoardwalkOverlooks from "./boardwalkOverlooks.js";
import PerformanceMonitor from "./performanceMonitor.js";
import WorldSystemHost from "./worldSystemHost.js";
import WorldStreaming from "./worldStreaming.js";
import ConferenceCenterBlueprint from "./worldDistricts/conferenceCenter.js";
const engine = new Engine();
if (typeof window !== "undefined") window.__lamboCityEngine = engine;
// All streamed departments share the single core Three.js 0.160.0 module.
engine.context.THREE = THREE;
engine.registerSystems({
  scene: Scene,
  camera: Camera,
  renderer: Renderer,
  world: World,
  water: Water,
  dock: Dock,
  dockPath: DockPath,
  sky: Sky,
  lighting: Lighting,
  palms: Palms,
  yacht: Yacht,
  // cars: Cars,
  npc: NPC,
  heroPerformance: HeroPerformance,
  heroPostPerformance,
  cinematicFlow: CinematicFlowSystem,
  worldSkin: CinematicWorldSkin,
  dockCore: CinematicDockCore,
  marina: Marina,
  conferenceCenterDistrict: ConferenceCenterDistrict,
  stageVideo: StageVideo,
  stageScreenMedia: StageScreenMedia,
  stageBanner: StageBanner,
  ambientMusic: AmbientMusic,
  stageMusic: StageMusic,
  stageAudioZone: StageAudioZone,
  collision: Collision,
  stageSpotlights: StageSpotlights,
  stageLasers: StageLasers,
  stageSmoke: StageSmoke,
  stageCrowdPulse: StageCrowdPulse,
  grandStagePier: GrandStagePier,
  yachtLuxuryDetails: YachtLuxuryDetails,
  dockEntranceLuxury: DockEntranceLuxury,
  dockLuxuryOverhaul: DockLuxuryOverhaul,
  recordsHQ: RecordsHQ,
  recordsHQFoundation: RecordsHQFoundation,
  recordsHQFloor1: RecordsHQFloor1,
  recordsHQEntranceThreshold: RecordsHQEntranceThreshold,
  recordsHQMediaDetails: RecordsHQMediaDetails,
  recordsHQMerchDetails: RecordsHQMerchDetails,
  heroCareerCenter: HeroCareerCenter,
  recordsHQElevator: RecordsHQElevator,
  boardwalkOverlooks: BoardwalkOverlooks,
  input: Input,
  player: Player,
  elevator: Elevator,
  hud: HUD,
  performanceMonitor: PerformanceMonitor,
  worldSystemHost: WorldSystemHost,
  worldStreaming: WorldStreaming,
});

// Load upper floors only when selected in the elevator.
// Each destination is cached so returning to a floor never rebuilds it.
const destinationLoads = new Map();
window.__lamboCityFloor2Ready = false;
window.__lamboCityFloor2CoreReady = false;
window.__lamboCityFloor2ModulesReady = false;
window.__lamboCityFloor2LoadPhase = "idle";
window.__lamboCityFloor2LoadingModule = null;
window.__lamboCityFloor2LoadedModules = [];
window.__lamboCityPrepareFloor = floor => {
  if (floor !== 2 && floor !== 3 && floor !== 4) return Promise.resolve();
  if (!destinationLoads.has(floor)) {
    if (floor === 2) {
      let resolveCoreReady;
      let rejectCoreReady;
      const coreReady = new Promise((resolve, reject) => {
        resolveCoreReady = resolve;
        rejectCoreReady = reject;
      });
      destinationLoads.set(floor, coreReady);
      let floor2InitializationStarted = false;
      const loadFloor2 = async () => {
        window.__lamboCityFloor2Ready = false;
        window.__lamboCityFloor2CoreReady = false;
        window.__lamboCityFloor2ModulesReady = false;
        window.__lamboCityFloor2LoadError = null;
        window.__lamboCityFloor2LoadPhase = "loading-core";
        window.__lamboCityFloor2LoadingModule = null;
        window.__lamboCityFloor2InitProgress = [];
        window.__lamboCityFloor2LoadedModules = [];
        // The room and session controller are the only hard arrival dependencies.
        // Optional Studio interfaces continue loading after the cockpit is reached.
        const [studio, session] = await Promise.all([
          import("./recordsHQFloor2Studio.js"),
          import("./floor2StudioSession.js")
        ]);
        if (!engine.scene || !engine.camera || !engine.renderer) {
          throw new Error("The LAMBO CITY scene is not ready for Floor 2.");
        }
        const coreSystems = {
          recordsHQFloor2Studio: studio.default,
          floor2StudioSession: session.default
        };
        for (const [name, system] of Object.entries(coreSystems)) {
          if (!system || typeof system.init !== "function") {
            throw new Error("Floor 2 core module failed to initialize: " + name);
          }
        }
        floor2InitializationStarted = true;
        engine.registerSystems(coreSystems);
        const coreInitializationOrder = [
          ["recordsHQFloor2Studio", [engine.scene]],
          ["floor2StudioSession", [engine.scene, engine.context]]
        ];
        for (const [name, args] of coreInitializationOrder) {
          window.__lamboCityFloor2LoadPhase = "initializing:" + name;
          window.__lamboCityFloor2LoadingModule = name;
          await Promise.resolve(engine.initSystem(name, ...args));
          if (engine.failedSystems?.has(name)) {
            throw new Error("Floor 2 core module failed to initialize: " + name);
          }
          window.__lamboCityFloor2InitProgress.push(name);
          window.__lamboCityFloor2LoadedModules = [...window.__lamboCityFloor2InitProgress];
          window.__lamboCityFloor2LoadingModule = null;
        }
        if (!engine.scene.getObjectByName("recordsHQFloor2Studio")) {
          throw new Error("Floor 2 architecture did not attach to the live scene.");
        }
        if (
          typeof window.__lamboCityBeginFloor2Session !== "function" ||
          typeof window.__lamboCityEnterFloor2CockpitDirect !== "function"
        ) {
          throw new Error("Floor 2 session navigation hooks did not register.");
        }
        window.__lamboCityFloor2CoreReady = true;
        window.__lamboCityFloor2Ready = true;
        window.__lamboCityFloor2LoadPhase = "core-ready";
        resolveCoreReady();
        window.__lamboCityFloor2LoadPhase = "loading-optional-module-graph";
        const [beatLab, instrument, drumStation, navigation, mixMaster, liveDrummer, vocalBooth, citySynth] = await Promise.all([
          import("./floor2StudioApp.js"),
          import("./floor2InstrumentApp.js"),
          import("./floor2DrumStation.js"),
          import("./floor2StudioNavigation.js"),
          import("./studioMixMasterConsole3D.js"),
          import("./floor2LiveDrummer.js"),
          import("./floor2VocalBooth3D.js"),
          import("./floor2CitySynth.js")
        ]);
        const systems = {
          floor2StudioApp: beatLab.default,
          floor2InstrumentApp: instrument.default,
          floor2DrumStation: drumStation.default,
          floor2StudioNavigation: navigation.default,
          studioMixMasterConsole3D: mixMaster.default,
          floor2LiveDrummer: liveDrummer.default,
          floor2VocalBooth3D: vocalBooth.default,
          floor2CitySynth: citySynth.default
        };
        for (const [name, system] of Object.entries(systems)) {
          if (!system || typeof system.init !== "function") {
            throw new Error("Floor 2 module failed to initialize: " + name);
          }
        }
        engine.registerSystems(systems);
        const initializationOrder = [
          ["floor2StudioApp", [engine.scene, engine.context]],
          ["floor2InstrumentApp", [engine.scene, engine.context]],
          ["floor2DrumStation", [engine.scene, engine.context]],
          ["floor2StudioNavigation", [engine.scene, engine.context]],
          ["studioMixMasterConsole3D", [engine.scene, engine.context]],
          ["floor2LiveDrummer", [engine.scene, engine.context]],
          ["floor2VocalBooth3D", [engine.scene, engine.context]],
          ["floor2CitySynth", [engine.scene, engine.context]]
        ];
        for (const [name, args] of initializationOrder) {
          window.__lamboCityFloor2LoadPhase = "initializing:" + name;
          window.__lamboCityFloor2LoadingModule = name;
          await Promise.resolve(engine.initSystem(name, ...args));
          if (engine.failedSystems?.has(name)) {
            throw new Error("Floor 2 module failed to initialize: " + name);
          }
          window.__lamboCityFloor2InitProgress.push(name);
          window.__lamboCityFloor2LoadedModules = [...window.__lamboCityFloor2InitProgress];
          window.__lamboCityFloor2LoadingModule = null;
          // Yield between optional visual layers so the arrival and touch controls keep updating.
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        window.__lamboCityFloor2ModulesReady = true;
        window.__lamboCityFloor2LoadError = null;
        window.__lamboCityFloor2LoadPhase = "ready";
        window.__lamboCityFloor2LoadingModule = null;
      };
      loadFloor2().catch(error => {
        const message = String(error?.message || error);
        window.__lamboCityFloor2LoadError = message;
        window.__lamboCityFloor2LoadPhase = "failed";
        window.__lamboCityFloor2LoadingModule = null;
        if (!window.__lamboCityFloor2CoreReady) {
          window.__lamboCityFloor2Ready = false;
          if (!floor2InitializationStarted) destinationLoads.delete(floor);
          rejectCore(error);
        } else {
          window.__lamboCityFloor2ModulesReady = false;
          console.error("LAMBO CITY optional Floor 2 module loading failed:", error);
        }
      });
    } else {
      const load = (async () => {
        if (floor === 3) {
          window.__lamboCityFloor3Ready = false;
          const [executive, details, experience] = await Promise.all([
            import("./recordsHQFloor3Executive.js"),
            import("./recordsHQFloor3Details.js"),
            import("./recordsHQFloor3Experience.js")
          ]);
          if (!engine.scene) throw new Error("The LAMBO CITY scene is not ready for Floor 3.");
          const systems = {
            recordsHQFloor3Executive: executive.default,
            recordsHQFloor3Details: details.default,
            recordsHQFloor3Experience: experience.default
          };
          for (const [name, system] of Object.entries(systems)) {
            if (!system || typeof system.init !== "function") {
              throw new Error("Floor 3 module failed to initialize: " + name);
            }
          }
          engine.registerSystems(systems);
          if (!engine.scene.getObjectByName("recordsHQFloor3Executive")) {
            engine.initSystem("recordsHQFloor3Executive", engine.scene);
          }
          if (!engine.scene.getObjectByName("floor3ExecutiveDetails")) {
            engine.initSystem("recordsHQFloor3Details", engine.scene);
          }
          engine.initSystem("recordsHQFloor3Experience", engine.scene, engine.context);
          if (
            !engine.scene.getObjectByName("recordsHQFloor3Executive") ||
            !engine.scene.getObjectByName("floor3ExecutiveDetails")
          ) {
            throw new Error("Floor 3 scene layers did not attach to the live scene.");
          }
          window.__lamboCityFloor3Ready = true;
        } else {
          const rooftop = await import("./recordsHQRooftopVIP.js");
          engine.registerSystems({ recordsHQRooftopVIP: rooftop.default });
          engine.initSystem("recordsHQRooftopVIP", engine.scene);
        }
      })().catch(error => {
        destinationLoads.delete(floor);
        throw error;
      });
      destinationLoads.set(floor, load);
    }
  }
  return destinationLoads.get(floor);
};
engine.init();

// Register the approved Conference Center blueprint with the shared World
// System after the live scene and collision system are ready. The runtime
// streams full detail/proxies by player distance and owns the generated
// roads, curbs, sidewalks, terrain, gates, and residential parcels.
window.__lamboCityWorldSystemReady = WorldSystemHost.initialize({
  districts: [ConferenceCenterBlueprint],
  streamingOptions: {
    streamInRadius: 30,
    streamOutRadius: 45,
    proxyInRadius: 900,
    proxyOutRadius: 1000,
    maxBuildsPerUpdate: 1,
    maxDetailedParcels: 6
  }
}).then(runtime => {
  window.__lamboCityWorldSystemError = null;
  return runtime.getStatus();
}).catch(error => {
  window.__lamboCityWorldSystemError = String(error?.message || error);
  console.error("LAMBO CITY World System initialization failed:", error);
  return null;
});
