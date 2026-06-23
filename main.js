import { initScene, scene } from "./engine/scene.js";
import { initCamera, camera } from "./engine/camera.js";
import { initRenderer, renderer } from "./engine/renderer.js";

console.log("LAMBO CITY BOOT STARTED");

initScene();
console.log("Scene OK");

initCamera();
console.log("Camera OK");

initRenderer();
console.log("Renderer OK");

// REMOVE ALL SYSTEMS FOR NOW
console.log("Skipping systems for test...");

function animate(){
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();

console.log("GAME LOOP RUNNING");
