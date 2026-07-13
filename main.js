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
import AmbientMusic from "./ambientMusic.js";
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
  ambientMusic:  AmbientMusic,
  input:         Input,
  player:        Player,
  hud:           HUD,
});
engine.init();
