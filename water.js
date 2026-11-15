// water.js
// LAMBO CITY Ocean System v2
// Luxury marina water foundation
//
// Features:
// - layered ocean waves
// - cinematic teal/purple reflections
// - optimized animation loop
// - designed for offshore yacht environment
// - no extra lights (lighting.js controls world lighting)

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";


let waterMesh;
let shimmerMesh;
let reflectionMesh;

let time = 0;
let frame = 0;

let visualBaseline = null;

function getWaterVisualStatus() {
  return {
    surface: waterMesh?.material ? {
      roughness: waterMesh.material.roughness,
      metalness: waterMesh.material.metalness,
      opacity: waterMesh.material.opacity
    } : null,
    shimmerOpacity: shimmerMesh?.material?.opacity ?? null,
    reflectionOpacity: reflectionMesh?.material?.opacity ?? null,
    baselineCaptured: Boolean(visualBaseline)
  };
}

const waterVisualControls = {
  getStatus: getWaterVisualStatus,

  setSurface(settings = {}) {
    if (!waterMesh?.material) {
      return { success: false, error: "Water surface is not initialized." };
    }

    const ranges = {
      roughness: [0, 1],
      metalness: [0, 1],
      opacity: [0.5, 1]
    };

    for (const [key, value] of Object.entries(settings)) {
      if (!ranges[key]) continue;
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return { success: false, error: key + " must be a finite number." };
      }
      const [min, max] = ranges[key];
      waterMesh.material[key] = Math.max(min, Math.min(max, number));
    }

    waterMesh.material.needsUpdate = true;
    return { success: true, status: getWaterVisualStatus() };
  },

  setReflectionLayers(settings = {}) {
    const values = {
      shimmer: shimmerMesh?.material,
      reflection: reflectionMesh?.material
    };

    for (const [key, value] of Object.entries(settings)) {
      const material = values[key];
      if (!material) continue;
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return { success: false, error: key + " opacity must be a finite number." };
      }
      material.opacity = Math.max(0, Math.min(0.3, number));
    }

    return { success: true, status: getWaterVisualStatus() };
  },

  restoreBaseline() {
    if (!visualBaseline || !waterMesh?.material) {
      return { success: false, error: "Water visual baseline is unavailable." };
    }

    Object.assign(waterMesh.material, visualBaseline.surface);
    waterMesh.material.needsUpdate = true;
    shimmerMesh.material.opacity = visualBaseline.shimmerOpacity;
    reflectionMesh.material.opacity = visualBaseline.reflectionOpacity;

    return { success: true, status: getWaterVisualStatus() };
  }
};


export default {

  init(scene) {


    // ================================
    // MAIN OCEAN SURFACE
    // ================================


    const geo = new THREE.PlaneGeometry(
      800,
      800,
      48,
      48
    );


    const mat = new THREE.MeshStandardMaterial({

      color:0x064b66,

      roughness:0.18,

      metalness:0.65,

      emissive:0x002b44,

      emissiveIntensity:0.35,

      transparent:true,

      opacity:0.92

    });



    waterMesh = new THREE.Mesh(
      geo,
      mat
    );


    waterMesh.rotation.x = -Math.PI/2;


    waterMesh.position.y = 0.3;


    scene.add(waterMesh);



    // ================================
    // TEAL LIGHT SHIMMER LAYER
    // ================================


    shimmerMesh = new THREE.Mesh(

      new THREE.PlaneGeometry(
        800,
        800
      ),

      new THREE.MeshBasicMaterial({

        color:0x00ddff,

        transparent:true,

        opacity:0.12

      })

    );


    shimmerMesh.rotation.x = -Math.PI/2;


    shimmerMesh.position.y = 0.315;


    scene.add(shimmerMesh);



    // ================================
    // PURPLE CITY REFLECTION LAYER
    // ================================


    reflectionMesh = new THREE.Mesh(

      new THREE.PlaneGeometry(
        800,
        800
      ),

      new THREE.MeshBasicMaterial({

        color:0x6600cc,

        transparent:true,

        opacity:0.08

      })

    );


    reflectionMesh.rotation.x = -Math.PI/2;


    reflectionMesh.position.y = 0.325;


    scene.add(reflectionMesh);

    // Capture the established water appearance. Visual presets remain opt-in.
    visualBaseline = {
      surface: {
        roughness: waterMesh.material.roughness,
        metalness: waterMesh.material.metalness,
        opacity: waterMesh.material.opacity
      },
      shimmerOpacity: shimmerMesh.material.opacity,
      reflectionOpacity: reflectionMesh.material.opacity
    };
    window.__lamboCityWaterVisuals = waterVisualControls;



  },



  update(delta) {


    if(!waterMesh) return;


    frame++;


    // Performance limiter
    // keeps iPad Safari smooth

    if(frame % 3 !== 0)
      return;



    time += delta;



    const pos =
      waterMesh.geometry.attributes.position;



    for(
      let i = 0;
      i < pos.count;
      i++
    ){


      const x = pos.getX(i);

      const z = pos.getZ(i);



      // Large ocean swell

      const swell =
        Math.sin(
          x * 0.015 +
          time * 0.35
        ) * 0.22;



      // Cross wave movement

      const wave =
        Math.cos(
          z * 0.025 +
          time * 0.45
        ) * 0.12;



      // Small surface ripples

      const ripple =
        Math.sin(
          (x + z) * 0.08 +
          time * 0.9
        ) * 0.05;



      pos.setY(
        i,
        swell +
        wave +
        ripple
      );


    }



    pos.needsUpdate = true;


    waterMesh.geometry.computeVertexNormals();



    // Slowly animate reflection intensity

    if(reflectionMesh){

      reflectionMesh.material.opacity =
        0.07 +
        Math.sin(time*0.5)*0.02;

    }


    if(shimmerMesh){

      shimmerMesh.material.opacity =
        0.10 +
        Math.sin(time*0.8)*0.03;

    }


  }

};
