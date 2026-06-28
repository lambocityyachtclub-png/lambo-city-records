import { engine } from "./engine.js";

/* =========================================================
   🎥 CINEMATIC CAMERA FOLLOW SYSTEM
========================================================= */

export function initCameraSystem() {

  engine.updateCamera = () => {

    const cam = engine.camera;
    const player = engine.player;

    if (!cam) return;

    // fallback if no player yet
    const target = player ? player.position : engine.world.position;

    // 🎥 cinematic offset (GTA style behind + above)
    const desiredX = target.x;
    const desiredY = target.y + 10;
    const desiredZ = target.z + 25;

    // smooth follow
    cam.position.x += (desiredX - cam.position.x) * 0.08;
    cam.position.y += (desiredY - cam.position.y) * 0.08;
    cam.position.z += (desiredZ - cam.position.z) * 0.08;

    cam.lookAt(target);
  };

}
