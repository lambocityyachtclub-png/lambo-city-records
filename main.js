// LAMBO CITY startup: make input and HERO playable before optional world systems load.
// Optional systems are imported and initialized in small ordered stages to preserve frame time.
import Engine from "./engine.js";
import Scene from "./scene.js";
import Camera from "./camera.js";
import Renderer from "./renderer.js";
import Input from "./input.js";
import Collision from "./collision.js";
import Player from "./player.js";
import PerformanceMonitor from "./performanceMonitor.js";

const engine = new Engine();
engine.registerSystems({
  scene: Scene,
  camera: Camera,
  renderer: Renderer,
  input: Input,
  collision: Collision,
  player: Player,
  performanceMonitor: PerformanceMonitor
});

// Core startup completes synchronously: keyboard listeners, collision, HERO,
// camera, renderer, and the animation loop are ready before world add-ons load.
engine.init();

const startupStages = [
  [
    ["world", () => import("./world.js")],
    ["festivalStageUpgrade", () => import("./festivalStageUpgrade.js"), "sceneContext"],
    ["festivalStageArchitecture", () => import("./festivalStageArchitecture.js"), "sceneContext"],
    ["festivalStageFinishing", () => import("./festivalStageFinishing.js"), "sceneContext"]
  ],
  [
    ["festivalAudienceZone", () => import("./festivalAudienceZone.js"), "sceneContext"],
    ["water", () => import("./water.js")],
    ["dock", () => import("./dock.js")],
    ["dockPath", () => import("./dockPath.js")]
  ],
  [
    ["sky", () => import("./sky.js")],
    ["lighting", () => import("./lighting.js")],
    ["palms", () => import("./palms.js")],
    ["yacht", () => import("./yacht.js")]
  ],
  [
    ["npc", () => import("./npc.js")],
    ["characterSystem", () => import("./characterSystem.js"), "sceneContext"],
    ["dockLife", () => import("./dockLife.js"), "sceneContext"],
    ["heroPerformance", () => import("./heroPerformance.js")]
  ],
  [
    ["heroPostPerformance", () => import("./heroPostPerformance.js")],
    ["heroMentorInteraction", () => import("./heroMentorInteraction.js"), null],
    ["heroSecurityExperience", () => import("./heroSecurityExperience.js"), "sceneContext"],
    ["cinematicFlow", () => import("./cinematicFlowSystem.js")],
    ["worldSkin", () => import("./cinematicWorldSkin.js")]
  ],
  [
    ["dockCore", () => import("./cinematicDockCore.js")],
    ["marina", () => import("./marina.js")],
    ["waterfrontStorefrontDetails", () => import("./waterfrontStorefrontDetails.js"), "sceneContext"],
    ["conferenceCenterDistrict", () => import("./conferenceCenterDistrict.js"), "sceneContext"]
  ],
  [
    ["stageVideo", () => import("./stageVideo.js")],
    ["stageScreenMedia", () => import("./stageScreenMedia.js")],
    ["stageBanner", () => import("./stageBanner.js")],
    ["ambientMusic", () => import("./ambientMusic.js"), "none"]
  ],
  [
    ["stageMusic", () => import("./stageMusic.js"), "none"],
    ["stageAudioZone", () => import("./stageAudioZone.js")],
    ["stageSpotlights", () => import("./stageSpotlights.js")],
    ["stageLasers", () => import("./stageLasers.js")]
  ],
  [
    ["stageSmoke", () => import("./stageSmoke.js")],
    ["stageCrowdPulse", () => import("./stageCrowdPulse.js")],
    ["stageLiveDrummer", () => import("./stageLiveDrummer.js"), "sceneContext"],
    ["stageFireworks", () => import("./stageFireworks.js"), "sceneContext"]
  ],
  [
    ["grandStagePier", () => import("./grandStagePier.js")],
    ["yachtLuxuryDetails", () => import("./yachtLuxuryDetails.js")],
    ["dockEntranceLuxury", () => import("./dockEntranceLuxury.js")],
    ["dockLuxuryOverhaul", () => import("./dockLuxuryOverhaul.js")]
  ],
  [
    ["recordsHQ", () => import("./recordsHQ.js")],
    ["recordsHQFoundation", () => import("./recordsHQFoundation.js")],
    ["elevator", () => import("./elevator.js")],
    ["recordsHQFloor1", () => import("./recordsHQFloor1.js")]
  ],
  [
    ["recordsHQFloor2Studio", () => import("./recordsHQFloor2Studio.js")],
    ["floor2StudioApp", () => import("./floor2StudioApp.js"), "sceneContext"],
    ["floor2InstrumentApp", () => import("./floor2InstrumentApp.js"), "sceneContext"],
    ["floor2DrumStation", () => import("./floor2DrumStation.js"), "sceneContext"]
  ],
  [
    ["floor2StudioNavigation", () => import("./floor2StudioNavigation.js"), "sceneContext"],
    ["recordsHQEntranceThreshold", () => import("./recordsHQEntranceThreshold.js")],
    ["recordsHQMediaDetails", () => import("./recordsHQMediaDetails.js")],
    ["recordsHQMerchDetails", () => import("./recordsHQMerchDetails.js")]
  ],
  [
    ["heroCareerCenter", () => import("./heroCareerCenter.js"), "sceneContext"],
    ["recordsHQElevator", () => import("./recordsHQElevator.js")],
    ["floor2StudioSession", () => import("./floor2StudioSession.js"), "sceneContext"],
    ["studioMixMasterConsole3D", () => import("./studioMixMasterConsole3D.js"), "sceneContext"]
  ],
  [
    ["floor2LiveDrummer", () => import("./floor2LiveDrummer.js"), "sceneContext"],
    ["floor2VocalBooth3D", () => import("./floor2VocalBooth3D.js"), "sceneContext"],
    ["floor2CitySynth", () => import("./floor2CitySynth.js"), "sceneContext"],
    ["boardwalkOverlooks", () => import("./boardwalkOverlooks.js")]
  ],
  [
    ["hud", () => import("./hud.js"), "none"]
  ]
];

const yieldToRender = () =>
  new Promise(resolve => requestAnimationFrame(() => resolve()));

async function loadWorldInStages() {
  for (let stageIndex = 0; stageIndex < startupStages.length; stageIndex++) {
    const stage = startupStages[stageIndex];
    const loaded = await Promise.all(
      stage.map(async ([name, load, initMode = "scene"]) => [name, (await load()).default, initMode])
    );

    for (const [name, system, initMode] of loaded) {
      if (!system || (initMode !== null && typeof system.init !== "function")) {
        throw new Error("LAMBO CITY startup module is invalid: " + name);
      }
      engine.systems[name] = system;
    }

    // Preserve the original module initialization order. Yield between
    // modules so the browser can render and process keyboard input.
    for (const [name, system, initMode] of loaded) {
      if (initMode === "sceneContext") system.init(engine.scene, engine.context);
      else if (initMode === "none") system.init();
      else if (initMode !== null) system.init(engine.scene);
      await yieldToRender();
    }
  }

  window.__lamboCityWorldReady = true;
}

loadWorldInStages().catch(error => {
  window.__lamboCityStartupError = String(error?.message || error);
  console.error("LAMBO CITY staged startup stopped:", error);
});

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
        if (!engine.scene) throw new Error("The LAMBO CITY scene is not ready for Floor 3.");
        const systems = {
          recordsHQFloor3Executive: executive.default,
          recordsHQFloor3Details: details.default,
          recordsHQFloor3Experience: experience.default
        };
        for (const [name, system] of Object.entries(systems)) {
          if (!system || typeof system.init !== "function") throw new Error("Floor 3 module failed to initialize: " + name);
        }
        Object.assign(engine.systems, systems);
        engine.context.systems = engine.systems;
        if (!engine.scene.getObjectByName("recordsHQFloor3Executive")) systems.recordsHQFloor3Executive.init(engine.scene);
        if (!engine.scene.getObjectByName("floor3ExecutiveDetails")) systems.recordsHQFloor3Details.init(engine.scene);
        systems.recordsHQFloor3Experience.init(engine.scene, engine.context);
        if (!engine.scene.getObjectByName("recordsHQFloor3Executive") || !engine.scene.getObjectByName("floor3ExecutiveDetails")) {
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
