import { engine } from "./engine.js";

window.addEventListener("keydown", (e) => {
  engine.keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  engine.keys[e.code] = false;
});
