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
let shimmerOpacityOverride = null;
let reflectionOpacityOverride = null;
let waterScene = null;
let waterRenderer = null;
let reflectionCamera = null;
let reflectionTarget = null;
let environmentReflectionEnabled = false;
let reflectionElapsed = 0;
let reflectionIntervalSeconds = 3;
let reflectionBusy = false;
let environmentReflectionIntensity = 0.45;
let planarReflector = null;
let planarReflectionEnabled = false;
let planarReflectionIntervalSeconds = 3;
let planarReflectionOpacity = 0.18;
let planarReflectionClock = 0;
let planarNextRefreshAt = 0;

function getWaterVisualStatus() {
  return {
    surface: waterMesh?.material ? {
      roughness: waterMesh.material.roughness,
      metalness: waterMesh.material.metalness,
      opacity: waterMesh.material.opacity
    } : null,
    shimmerOpacity: shimmerMesh?.material?.opacity ?? null,
    reflectionOpacity: reflectionMesh?.material?.opacity ?? null,
    baselineCaptured: Boolean(visualBaseline),
    environmentReflection: {
      enabled: environmentReflectionEnabled,
      ready: Boolean(reflectionCamera && reflectionTarget),
      resolution: reflectionTarget?.width ?? null,
      refreshIntervalSeconds: reflectionIntervalSeconds,
      intensity: environmentReflectionIntensity
    },
    planarReflection: {
      enabled: planarReflectionEnabled,
      ready: Boolean(planarReflector),
      resolution: planarReflector?.getRenderTarget?.()?.width ?? null,
      refreshIntervalSeconds: planarReflectionIntervalSeconds,
      opacity: planarReflectionOpacity
    }
  };
}

const WATER_VISUAL_PRESETS = Object.freeze({
  baseline: null,
  cinematic: Object.freeze({
    surface: { roughness: 0.16, metalness: 0.58, opacity: 0.94 },
    layers: { shimmer: 0.12, reflection: 0.10 }
  }),
  glossy: Object.freeze({
    surface: { roughness: 0.08, metalness: 0.78, opacity: 0.97 },
    layers: { shimmer: 0.14, reflection: 0.12 }
  }),
  soft: Object.freeze({
    surface: { roughness: 0.32, metalness: 0.38, opacity: 0.90 },
    layers: { shimmer: 0.07, reflection: 0.05 }
  })
});

function disableEnvironmentReflection() {
  environmentReflectionEnabled = false;
  reflectionElapsed = 0;
  if (waterMesh?.material && visualBaseline?.environment) {
    waterMesh.material.envMap = visualBaseline.environment.envMap;
    waterMesh.material.envMapIntensity = visualBaseline.environment.envMapIntensity;
    waterMesh.material.needsUpdate = true;
  }
  if (reflectionCamera && waterScene) waterScene.remove(reflectionCamera);
  reflectionCamera = null;
  if (reflectionTarget) reflectionTarget.dispose();
  reflectionTarget = null;
}

function disablePlanarReflection() {
  planarReflectionEnabled = false;
  planarNextRefreshAt = 0;
  if (planarReflector && waterScene) {
    waterScene.remove(planarReflector);
    planarReflector.dispose?.();
    planarReflector.geometry?.dispose?.();
  }
  planarReflector = null;
}

const waterVisualControls = {
  getStatus: getWaterVisualStatus,

  async setPlanarReflection(enabled, options = {}) {
    if (!enabled) {
      disablePlanarReflection();
      return { success: true, status: getWaterVisualStatus() };
    }
    if (!waterScene || !waterRenderer || !waterMesh?.material) {
      return { success: false, error: "Scene, renderer, or water material is unavailable." };
    }

    disableEnvironmentReflection();
    const requestedSize = Number(options.resolution) || 128;
    const size = Math.max(64, Math.min(256, Math.round(requestedSize)));
    const requestedInterval = Number(options.refreshIntervalSeconds) || 3;
    const interval = Math.max(2, Math.min(10, requestedInterval));
    const requestedOpacity = Number(options.opacity);
    const opacity = Number.isFinite(requestedOpacity)
      ? Math.max(0.05, Math.min(0.4, requestedOpacity))
      : 0.18;

    if (!planarReflector || planarReflector.getRenderTarget?.()?.width !== size) {
      disablePlanarReflection();
      try {
        const [THREE_MODULE, reflectorModule] = await Promise.all([
          import("https://esm.sh/three@0.160.0"),
          import("https://esm.sh/three@0.160.0/examples/jsm/objects/Reflector.js")
        ]);
        const Reflector = reflectorModule.Reflector;
        planarReflector = new Reflector(
          new THREE_MODULE.PlaneGeometry(800, 800),
          {
            clipBias: 0.003,
            textureWidth: size,
            textureHeight: size,
            multisample: 0,
            color: 0x777777
          }
        );
        planarReflector.name = "lamboCityPlanarWaterReflection";
        planarReflector.rotation.x = -Math.PI / 2;
        planarReflector.position.y = 0.34;
        const reflectionMaterial = planarReflector.material;
        const reflectionShader = reflectionMaterial.fragmentShader;
        const alphaOutput = "gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );";
        if (!reflectionShader.includes(alphaOutput)) {
          throw new Error("Reflector shader does not match the expected Three.js 0.160.0 output.");
        }
        reflectionMaterial.fragmentShader = reflectionShader
          .replace("uniform vec3 color;", "uniform vec3 color;\nuniform float opacity;")
          .replace(alphaOutput, "gl_FragColor = vec4( blendOverlay( base.rgb, color ), opacity );");
        reflectionMaterial.uniforms.opacity = { value: opacity };
        reflectionMaterial.transparent = true;
        reflectionMaterial.opacity = opacity;
        reflectionMaterial.depthWrite = false;
        reflectionMaterial.needsUpdate = true;

        const renderReflection = planarReflector.onBeforeRender.bind(planarReflector);
        planarReflector.onBeforeRender = (activeRenderer, activeScene, activeCamera) => {
          if (!planarReflectionEnabled || planarReflectionClock < planarNextRefreshAt) return;
          planarNextRefreshAt = planarReflectionClock + planarReflectionIntervalSeconds;
          const visibility = [waterMesh.visible, shimmerMesh.visible, reflectionMesh.visible];
          let refreshFailed = false;
          try {
            waterMesh.visible = false;
            shimmerMesh.visible = false;
            reflectionMesh.visible = false;
            renderReflection(activeRenderer, activeScene, activeCamera);
          } catch (error) {
            console.warn("[LAMBO CITY Water] Planar reflection refresh failed.", error);
            refreshFailed = true;
          } finally {
            waterMesh.visible = visibility[0];
            shimmerMesh.visible = visibility[1];
            reflectionMesh.visible = visibility[2];
            if (refreshFailed) disablePlanarReflection();
          }
        };
        waterScene.add(planarReflector);
      } catch (error) {
        disablePlanarReflection();
        console.warn("[LAMBO CITY Water] Planar reflection modules could not be loaded.", error);
        return {
          success: false,
          error: "Planar reflection module could not be loaded; the normal water renderer remains active."
        };
      }
    }

    planarReflectionIntervalSeconds = interval;
    planarReflectionOpacity = opacity;
    planarReflector.material.opacity = opacity;
    if (planarReflector.material.uniforms?.opacity) {
      planarReflector.material.uniforms.opacity.value = opacity;
    }
    planarReflectionEnabled = true;
    planarNextRefreshAt = 0;
    return { success: true, status: getWaterVisualStatus() };
  },

  setEnvironmentReflection(enabled, options = {}) {
    if (!enabled) {
      disableEnvironmentReflection();
      return { success: true, status: getWaterVisualStatus() };
    }
    if (!waterScene || !waterRenderer || !waterMesh?.material) {
      return { success: false, error: "Scene, renderer, or water material is unavailable." };
    }

    disablePlanarReflection();
    const requestedSize = Number(options.resolution) || 128;
    const size = Math.max(64, Math.min(256, Math.round(requestedSize)));
    const requestedInterval = Number(options.refreshIntervalSeconds) || 3;
    const interval = Math.max(2, Math.min(10, requestedInterval));
    const requestedIntensity = Number(options.intensity);
    const intensity = Number.isFinite(requestedIntensity)
      ? Math.max(0, Math.min(1, requestedIntensity))
      : 0.45;

    if (!reflectionTarget || reflectionTarget.width !== size) {
      disableEnvironmentReflection();
      reflectionTarget = new THREE.WebGLCubeRenderTarget(size, {
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter
      });
      reflectionCamera = new THREE.CubeCamera(0.1, 500, reflectionTarget);
      reflectionCamera.position.set(0, 1.2, 0);
      waterScene.add(reflectionCamera);
    }

    reflectionIntervalSeconds = interval;
    environmentReflectionIntensity = intensity;
    waterMesh.material.envMap = reflectionTarget.texture;
    waterMesh.material.envMapIntensity = intensity;
    waterMesh.material.needsUpdate = true;
    environmentReflectionEnabled = true;
    reflectionElapsed = interval;
    return { success: true, status: getWaterVisualStatus() };
  },

  setPreset(name) {
    if (name === "baseline") return waterVisualControls.restoreBaseline();
    const preset = WATER_VISUAL_PRESETS[name];
    if (!preset) {
      return {
        success: false,
        error: "Choose baseline, cinematic, glossy, or soft."
      };
    }

    const surfaceResult = waterVisualControls.setSurface(preset.surface);
    if (!surfaceResult.success) return surfaceResult;
    return waterVisualControls.setReflectionLayers(preset.layers);
  },

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
      const opacity = Math.max(0, Math.min(0.3, number));
      material.opacity = opacity;
      if (key === "shimmer") shimmerOpacityOverride = opacity;
      if (key === "reflection") reflectionOpacityOverride = opacity;
    }

    return { success: true, status: getWaterVisualStatus() };
  },

  restoreBaseline() {
    if (!visualBaseline || !waterMesh?.material) {
      return { success: false, error: "Water visual baseline is unavailable." };
    }

    disableEnvironmentReflection();
    disablePlanarReflection();
    reflectionIntervalSeconds = 3;
    environmentReflectionIntensity = 0.45;
    planarReflectionIntervalSeconds = 3;
    planarReflectionOpacity = 0.18;
    Object.assign(waterMesh.material, visualBaseline.surface);
    waterMesh.material.needsUpdate = true;
    shimmerOpacityOverride = null;
    reflectionOpacityOverride = null;
    shimmerMesh.material.opacity = visualBaseline.shimmerOpacity;
    reflectionMesh.material.opacity = visualBaseline.reflectionOpacity;

    return { success: true, status: getWaterVisualStatus() };
  }
};


export default {

  init(scene, context = {}) {
    waterScene = scene || null;
    waterRenderer = context.renderer || null;

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
      environment: {
        envMap: waterMesh.material.envMap,
        envMapIntensity: waterMesh.material.envMapIntensity
      },
      shimmerOpacity: shimmerMesh.material.opacity,
      reflectionOpacity: reflectionMesh.material.opacity
    };
    window.__lamboCityWaterVisuals = waterVisualControls;



  },



  update(delta) {


    if(!waterMesh) return;


    frame++;
    if (planarReflectionEnabled) {
      planarReflectionClock += Math.max(0, Math.min(Number(delta) || 0, 0.05));
    }

    // Optional, low-resolution cube-map reflections. This is deliberately
    // disabled by default and refreshed infrequently to protect mobile GPUs.
    if (environmentReflectionEnabled && !reflectionBusy && reflectionCamera && waterRenderer) {
      reflectionElapsed += Math.max(0, Math.min(Number(delta) || 0, 0.05));
      if (reflectionElapsed >= reflectionIntervalSeconds) {
        reflectionElapsed = 0;
        reflectionBusy = true;
        const visibility = [waterMesh.visible, shimmerMesh.visible, reflectionMesh.visible];
        try {
          waterMesh.visible = false;
          shimmerMesh.visible = false;
          reflectionMesh.visible = false;
          reflectionCamera.update(waterRenderer, waterScene);
        } catch (error) {
          console.warn("[LAMBO CITY Water] Environment reflection refresh failed.", error);
          disableEnvironmentReflection();
        } finally {
          waterMesh.visible = visibility[0];
          shimmerMesh.visible = visibility[1];
          reflectionMesh.visible = visibility[2];
          reflectionBusy = false;
        }
      }
    }

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

      reflectionMesh.material.opacity = reflectionOpacityOverride ?? (
        0.07 + Math.sin(time*0.5)*0.02
      );

    }


    if(shimmerMesh){

      shimmerMesh.material.opacity = shimmerOpacityOverride ?? (
        0.10 + Math.sin(time*0.8)*0.03
      );

    }


  }

};
