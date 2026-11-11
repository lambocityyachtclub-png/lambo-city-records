import Engine from "./engine.js";
import Scene from "./scene.js";
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
import RecordsHQFloor2Studio from "./recordsHQFloor2Studio.js";
import Floor2StudioApp from "./floor2StudioApp.js";
import Floor2InstrumentApp from "./floor2InstrumentApp.js";
import Floor2DrumStation from "./floor2DrumStation.js";
import Floor2StudioNavigation from "./floor2StudioNavigation.js";
import Floor2StudioSession from "./floor2StudioSession.js";
import StudioMixMasterConsole3D from "./studioMixMasterConsole3D.js";
import Floor2LiveDrummer from "./floor2LiveDrummer.js";
import Floor2VocalBooth3D from "./floor2VocalBooth3D.js";
import Floor2CitySynth from "./floor2CitySynth.js";
import RecordsHQEntranceThreshold from "./recordsHQEntranceThreshold.js";
import RecordsHQMediaDetails from "./recordsHQMediaDetails.js";
import RecordsHQMerchDetails from "./recordsHQMerchDetails.js";
import HeroCareerCenter from "./heroCareerCenter.js";
import RecordsHQElevator from "./recordsHQElevator.js";
import Elevator from "./elevator.js";
import PerformanceMonitor from "./performanceMonitor.js";
const engine = new Engine();
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
  recordsHQFloor2Studio: RecordsHQFloor2Studio,
  floor2StudioApp: Floor2StudioApp,
  floor2InstrumentApp: Floor2InstrumentApp,
  floor2DrumStation: Floor2DrumStation,
  floor2StudioNavigation: Floor2StudioNavigation,
  floor2StudioSession: Floor2StudioSession,
  studioMixMasterConsole3D: StudioMixMasterConsole3D,
  floor2LiveDrummer: Floor2LiveDrummer,
  floor2VocalBooth3D: Floor2VocalBooth3D,
  floor2CitySynth: Floor2CitySynth,
  recordsHQEntranceThreshold: RecordsHQEntranceThreshold,
  recordsHQMediaDetails: RecordsHQMediaDetails,
  recordsHQMerchDetails: RecordsHQMerchDetails,
  heroCareerCenter: HeroCareerCenter,
  recordsHQElevator: RecordsHQElevator,
  input: Input,
  player: Player,
  elevator: Elevator,
  hud: HUD,
  performanceMonitor: PerformanceMonitor,
});

// Load upper floors only when selected in the elevator.
// Each destination is cached so returning to a floor never rebuilds it.
const destinationLoads = new Map();
window.__lamboCityPrepareFloor = floor => {
  if (floor !== 3 && floor !== 4) return Promise.resolve();

  if (!destinationLoads.has(floor)) {
    const load = (async () => {
      if (floor === 3) {
        window.__lamboCityFloor3Ready = false;
        const [executive, details, experience] = await Promise.all([
          import("./recordsHQFloor3Executive.js"),
          import("./recordsHQFloor3Details.js"),
          import("./recordsHQFloor3Experience.js")
        ]);

        if (!engine.scene) {
          throw new Error("The LAMBO CITY scene is not ready for Floor 3.");
        }

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

        Object.assign(engine.systems, systems);
        engine.context.systems = engine.systems;

        // Initialize each visual layer only when its scene root is absent.
        if (!engine.scene.getObjectByName("recordsHQFloor3Executive")) {
          systems.recordsHQFloor3Executive.init(engine.scene);
        }
        if (!engine.scene.getObjectByName("floor3ExecutiveDetails")) {
          systems.recordsHQFloor3Details.init(engine.scene);
        }
        systems.recordsHQFloor3Experience.init(engine.scene, engine.context);

        // Do not let the elevator report a successful arrival until the
        // actual Floor 3 architecture is present in the live scene.
        if (
          !engine.scene.getObjectByName("recordsHQFloor3Executive") ||
          !engine.scene.getObjectByName("floor3ExecutiveDetails")
        ) {
          throw new Error("Floor 3 scene layers did not attach to the live scene.");
        }
        window.__lamboCityFloor3Ready = true;
      } else {
        const rooftop = await import("./recordsHQRooftopVIP.js");
        engine.systems.recordsHQRooftopVIP = rooftop.default;
        engine.context.systems = engine.systems;
        engine.systems.recordsHQRooftopVIP?.init?.(engine.scene);
      }
    })().catch(error => {
      destinationLoads.delete(floor);
      throw error;
    });

    destinationLoads.set(floor, load);
  }

  return destinationLoads.get(floor);
};

engine.init();
