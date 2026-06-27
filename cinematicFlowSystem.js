import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎬 CINEMATIC FLOW SYSTEM v1
   (LIGHTWEIGHT WORLD FEEL LAYER)
========================================================= */

export const CinematicFlow = {

  init() {

    console.log("🎬 Cinematic Flow System Active");

    this.stageZ = 900;
    this.yachtZ = 1300;

    /* =====================================================
       🌫 FOG SYSTEM (DEPTH CONTROL)
    ===================================================== */

    engine.scene.fog = new THREE.Fog(
      0x0a0f1f,
      300,
      2200
    );

    /* =====================================================
       💡 STORE LIGHT BASES (FOR DYNAMIC INTENSITY)
    ===================================================== */

    this.baseAmbient = 0.8;
    this.baseSun = 2.0;

    this.ambient = engine.scene.children.find(
      obj => obj.isAmbientLight
    );

    this.sun = engine.scene.children.find(
      obj => obj.isDirectionalLight
    );

  },

  update() {

    if (!engine.player) return;

    const z = engine.player.position.z;

    /* =====================================================
       🎯 PROGRESS VALUE (0 → 1)
       Based on movement toward stage/yacht
    ===================================================== */

    const progress = THREE.MathUtils.clamp(
      (z - 200) / (this.yachtZ - 200),
      0,
      1
    );

    /* =====================================================
       🌫 FOG INTENSITY SHIFT
    ===================================================== */

    if (engine.scene.fog) {
      engine.scene.fog.far = 2200 - (progress * 900);
    }

    /* =====================================================
       💡 LIGHT INTENSITY SHIFT
    ===================================================== */

    if (this.ambient) {
      this.ambient.intensity =
        this.baseAmbient + (progress * 0.6);
    }

    if (this.sun) {
      this.sun.intensity =
        this.baseSun + (progress * 1.2);
    }

    /* =====================================================
       🎥 CAMERA FORWARD PULL (SUBTLE)
    ===================================================== */

    engine.camera.position.z -= progress * 0.02;

  }
};
