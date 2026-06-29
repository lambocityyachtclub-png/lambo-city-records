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

const engine = new Engine();

engine.registerSystems({
  scene: Scene,
  camera: Camera,
  renderer: Renderer,

  dock: Dock,
  water: Water,
  sky: Sky,
  lighting: Lighting,

  palms: Palms,
  yacht: Yacht
});

engine.init();
