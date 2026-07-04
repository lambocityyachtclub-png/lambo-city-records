import Engine from "./engine.js";
import Scene from "./scene.js";
import Camera from "./camera.js";
import Renderer from "./renderer.js";
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
import World from "./world.js";
import Marina from "./marina.js";

const engine = new Engine();
engine.registerSystems({
  scene:        Scene,
  camera:       Camera,
  renderer:     Renderer,
  world:        World,
  input:        Input,
  player:       Player,
  dock:         Dock,
  water:        Water,
  sky:          Sky,
  lighting:     Lighting,
  palms:        Palms,
  yacht:        Yacht,
  hud:          HUD,
  npc:          NPC,
  cars:         Cars,
  cinematicFlow:  CinematicFlowSystem,
  worldSkin:    CinematicWorldSkin,
  dockCore:     CinematicDockCore,
  marina:       Marina,
});
engine.init();
