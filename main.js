import { engine } from "./engine.js";
import { renderer } from "./renderer.js";
import { initCameraSystem } from "./camera.js";

/* WORLD MODULES */
import "./scene.js";
import "./world.js";
import "./dock.js";
import "./player.js";
import "./input.js";

/* CAMERA */
initCameraSystem();

/* START ENGINE */
engine.start();
