import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎬 CINEMATIC FLOW SYSTEM v2 (STABLE DIRECTOR LAYER)
========================================================= */

export const CinematicFlow = {

  state: {
    currentPhase: "DOCK"
  },

  init() {

    console.log("🎬 Cinematic Flow System Active (v2)");

    this.stageZ = 900;
    this.yachtZ = 1300;

    /* =====================================================
       🌫 FOG SYSTEM
    ===================================================== */

    engine.scene.fog = new THREE.Fog(
      0x0a0f1f,
      300,
      2200
    );

    /* =====================================================
       💡 LIGHT REFERENCES (SAFE DETECTION)
    ===================================================== */

    this.ambient = null;
    this.sun = null;

    engine.scene.traverse((obj) => {

      if (obj instanceof THREE.AmbientLight) {
        this.ambient = obj;
      }

      if (obj instanceof THREE.DirectionalLight) {
        this.sun = obj;
      }
    });

    this.baseAmbient = this.ambient ? this.ambient.intensity : 0.8;
    this.baseSun = this.sun ? this.sun.intensity : 2.0;
  },

  /* =========================================================
     🎬 UPDATE (CINEMATIC DIRECTOR LOGIC)
  ========================================================= */

  update() {

    if (!engine.player) return;

    const z = engine.player.position.z;

    /* =====================================================
       🎯 NORMALIZED WORLD PROGRESS
    ===================================================== */

    const progress = THREE.MathUtils.clamp(
      (z - 200) / (this.yachtZ - 200),
      0,
      1
    );

    /* =====================================================
       🎭 PHASE SYSTEM (MATCHES DockCore)
    ===================================================== */

    if (z < 400) this.state.currentPhase = "DOCK";
    else if (z < 800) this.state.currentPhase = "BOARDWALK";
    else if (z < 1200) this.state.currentPhase = "STAGE";
    else this.state.currentPhase = "YACHT";

    engine.state.cinematicPhase = this.state.currentPhase;

    /* =====================================================
       🌫 FOG DEPTH CONTROL
    ===================================================== */

    if (engine.scene.fog) {
      engine.scene.fog.far = 2200 - (progress * 900);
    }

    /* =====================================================
       💡 LIGHT INTENSITY GRADIENT
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
       🎥 CAMERA DO NOT DRIFT (IMPORTANT FIX)
    ===================================================== */

    // intentionally removed permanent camera movement
    // camera control belongs ONLY in camera.js
  }
};
