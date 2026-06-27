import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌉 CINEMATIC DOCK CORE SYSTEM v1
   (NO BREAKING CHANGES - PURE LAYER SYSTEM)
========================================================= */

export const DockCore = {

  init() {

    console.log("🌉 DockCore initializing...");

    /* =====================================================
       🧭 CINEMATIC SPINE (FORWARD WORLD DIRECTION)
    ===================================================== */

    this.spine = {
      ENTRY_Z: 200,
      BOARDWALK_Z: 500,
      STAGE_Z: 900,
      YACHT_Z: 1300
    };

    /* =====================================================
       🧍 PLAYER ALIGNMENT (SAFE ADJUST ONLY)
    ===================================================== */

    if (engine.player) {

      // keep your spawn but enforce forward facing direction
      engine.player.position.set(
        engine.player.position.x,
        engine.player.position.y,
        this.spine.ENTRY_Z
      );

    }

    /* =====================================================
       🌴 SIDE WORLD: RESORT BEACH (A LAYER)
       - behind cabins feel
       - calm aesthetic space
    ===================================================== */

    this.leftBeach = this.createBeach(-1200);
    this.rightBeach = this.createBeach(1200);

    engine.world.add(this.leftBeach);
    engine.world.add(this.rightBeach);

    /* =====================================================
       🌊 MAIN WATER SPLIT SYSTEM
       - CENTER = ENERGY / PROGRESSION
       - SIDES = RESORT CALM WATER
    ===================================================== */

    this.centerWater = this.createWater(0, 900, 2000, 8000);

    this.leftWater = this.createWater(-1200, 900, 2000, 8000);
    this.rightWater = this.createWater(1200, 900, 2000, 8000);

    engine.world.add(this.centerWater);
    engine.world.add(this.leftWater);
    engine.world.add(this.rightWater);

    /* =====================================================
       🚤 JET SKI LANES (CENTER ENERGY LAYER)
    ===================================================== */

    this.jetLaneLeft = this.createJetLane(-400);
    this.jetLaneRight = this.createJetLane(400);

    engine.world.add(this.jetLaneLeft);
    engine.world.add(this.jetLaneRight);

    console.log("🌉 DockCore READY");
  },

  /* =========================================================
     🏖 BEACH CREATION (SIDE LAYER)
  ========================================================= */

  createBeach(x) {

    const beach = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 800),
      new THREE.MeshStandardMaterial({
        color: 0xd9c28c
      })
    );

    beach.rotation.x = -Math.PI / 2;
    beach.position.set(x, 0.02, 600);

    return beach;
  },

  /* =========================================================
     🌊 WATER CREATION (REUSABLE LAYER)
  ========================================================= */

  createWater(x, z, w, h) {

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        color: x === 0 ? 0x0a3d62 : 0x0b2a3a,
        metalness: 0.7,
        roughness: 0.25
      })
    );

    water.rotation.x = -Math.PI / 2;
    water.position.set(x, -0.5, z);

    return water;
  },

  /* =========================================================
     🚤 JET SKI LANE
  ========================================================= */

  createJetLane(x) {

    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 6000),
      new THREE.MeshStandardMaterial({
        color: 0x00bfff,
        transparent: true,
        opacity: 0.25
      })
    );

    lane.rotation.x = -Math.PI / 2;
    lane.position.set(x, -0.49, 900);

    return lane;
  }
};
