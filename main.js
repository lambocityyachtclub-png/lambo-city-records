import { initScene, scene } from "./engine/scene.js";
import { initCamera, camera } from "./engine/camera.js";
import { initRenderer, renderer } from "./engine/renderer.js";

import { initMovement, updateMovement } from "./systems/movement.js";
import { initNPC, updateNPC } from "./systems/npc.js";
import { initDriving, updateDriving } from "./systems/driving.js";
import { initYacht } from "./systems/yacht.js";
import { initAudio, updateAudio } from "./systems/audio.js";
import { initDistricts, updateDistricts } from "./systems/districts.js";

initScene();
initCamera();
initRenderer();

initMovement();
initNPC();
initDriving();
initYacht();
initAudio();
initDistricts();

function animate(){
requestAnimationFrame(animate);

updateMovement();
updateNPC();
updateDriving();
updateAudio();
updateDistricts();

renderer.render(scene, camera);
}

animate();
