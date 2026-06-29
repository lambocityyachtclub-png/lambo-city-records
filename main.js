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

try {
  const engine = new Engine();
  engine.registerSystems({
    scene: Scene,
    camera: Camera,
    renderer: Renderer,
    input: Input,
    player: Player,
    dock: Dock,
    water: Water,
    sky: Sky,
    lighting: Lighting,
    palms: Palms,
    yacht: Yacht,
    hud: HUD,
  });
  engine.init();
} catch(e) {
  document.body.style.background = '#000';
  document.body.style.color = '#ff0000';
  document.body.style.fontFamily = 'monospace';
  document.body.style.padding = '20px';
  document.body.innerHTML = '<h2>LAMBO CITY ERROR</h2><pre>' + e.stack + '</pre>';
}
