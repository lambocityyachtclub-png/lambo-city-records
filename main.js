import Engine from "./engine.js";
import Scene from "./scene.js";
import Camera from "./camera.js";
import Renderer from "./renderer.js";
import World from "./world.js";
import Dock from "./dock.js";
import Water from "./water.js";
import Sky from "./sky.js";
import Lighting from "./lighting.js";
import Palms from "./palms.js";
import Yacht from "./yacht.js";
import Input from "./input.js";
import Player from "./player.js";
import HUD from "./hud.js";
import NPC from "./npc.js";
import Cars from "./cars.js";
import CinematicFlowSystem from "./cinematicFlowSystem.js";
import CinematicWorldSkin from "./cinematicWorldSkin.js";
import CinematicDockCore from "./cinematicDockCore.js";
import Marina from "./marina.js";
import StageVideo from "./stageVideo.js";
import StageScreenMedia from "./stageScreenMedia.js";
import StageBanner from "./stageBanner.js";
import AmbientMusic from "./ambientMusic.js";
import StageAudioZone from "./stageAudioZone.js";
import Collision from "./collision.js";
import StageSpotlights from "./stageSpotlights.js";
import StageLasers from "./stageLasers.js";
import StageSmoke from "./stageSmoke.js";
import StageCrowdPulse from "./stageCrowdPulse.js";
import YachtLuxuryDetails from "./yachtLuxuryDetails.js";
import VillaLuxuryDetails from "./villaLuxuryDetails.js";
const engine = new Engine();
engine.registerSystems({
  scene:         Scene,
  camera:        Camera,
  renderer:      Renderer,
  world:         World,
  water:         Water,
  dock:          Dock,
  sky:           Sky,
  lighting:      Lighting,
  palms:         Palms,
  yacht:         Yacht,
  cars:          Cars,
  npc:           NPC,
  cinematicFlow: CinematicFlowSystem,
  worldSkin:     CinematicWorldSkin,
  dockCore:      CinematicDockCore,
  marina:        Marina,
  stageVideo:    StageVideo,
  stageScreenMedia: StageScreenMedia,
  stageBanner:   StageBanner,
  ambientMusic:  AmbientMusic,
  stageAudioZone: StageAudioZone,
  collision:     Collision,
  stageSpotlights: StageSpotlights,
  stageLasers:   StageLasers,
  stageSmoke:    StageSmoke,
  stageCrowdPulse: StageCrowdPulse,
  yachtLuxuryDetails: YachtLuxuryDetails,
  villaLuxuryDetails: VillaLuxuryDetails,
  input:         Input,
  player:        Player,
  hud:           HUD,
});
engine.init();
