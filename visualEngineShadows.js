// visualEngineShadows.js
// LAMBO CITY Visual Engine 2.0 — explicitly registered shadow pipeline.
//
// Shadows remain OFF by default. Only objects and directional lights
// explicitly registered through this API can participate in shadow maps.
// Point-light shadows are intentionally excluded for mobile GPU safety.

let renderer = null;
let scene = null;
let enabled = false;
let baselineShadowMap = null;
const meshRecords = new Map();
const lightRecords = new Map();

function applyMesh(mesh, settings) {
  if (!mesh || !mesh.isMesh) return false;
  if (!meshRecords.has(mesh)) {
    meshRecords.set(mesh, {
      castShadow: mesh.castShadow,
      receiveShadow: mesh.receiveShadow,
      settings: { ...settings }
    });
  } else {
    meshRecords.get(mesh).settings = { ...settings };
  }
  if (enabled) {
    mesh.castShadow = Boolean(settings.castShadow);
    mesh.receiveShadow = Boolean(settings.receiveShadow);
  }
  return true;
}

function applyLight(light, options = {}) {
  if (!light || !light.isDirectionalLight) {
    return { success: false, error: "Only explicitly registered directional lights can cast shadows." };
  }
  const mapSize = Math.max(256, Math.min(1024, Number(options.mapSize) || 512));
  if (!lightRecords.has(light)) {
    lightRecords.set(light, {
      castShadow: light.castShadow,
      options: { mapSize }
    });
  } else {
    lightRecords.get(light).options = { mapSize };
  }
  if (enabled) configureLight(light, mapSize);
  return { success: true, registeredLights: lightRecords.size };
}

function configureLight(light, mapSize) {
  light.castShadow = true;
  if (!light.shadow) return;
  light.shadow.mapSize.set(mapSize, mapSize);
  light.shadow.bias = -0.0001;
  light.shadow.normalBias = 0.02;
  light.shadow.radius = 2;
  if (light.shadow.camera) {
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 400;
    light.shadow.camera.left = -120;
    light.shadow.camera.right = 120;
    light.shadow.camera.top = 120;
    light.shadow.camera.bottom = -120;
    light.shadow.camera.updateProjectionMatrix();
  }
}

function getStatus() {
  return {
    enabled,
    rendererAvailable: Boolean(renderer?.shadowMap),
    registeredMeshes: meshRecords.size,
    registeredDirectionalLights: lightRecords.size,
    enabledCasters: [...meshRecords.values()].filter(record => record.settings.castShadow).length,
    enabledReceivers: [...meshRecords.values()].filter(record => record.settings.receiveShadow).length,
    pointLightShadows: false,
    maxShadowMapSize: 1024
  };
}

const controls = {
  getStatus,

  registerMesh(mesh, settings = {}) {
    const accepted = applyMesh(mesh, {
      castShadow: Boolean(settings.castShadow),
      receiveShadow: Boolean(settings.receiveShadow)
    });
    return accepted
      ? { success: true, status: getStatus() }
      : { success: false, error: "registerMesh expects a Three.js Mesh." };
  },

  unregisterMesh(mesh) {
    const record = meshRecords.get(mesh);
    if (!record) return { success: false, error: "Mesh is not registered." };
    mesh.castShadow = record.castShadow;
    mesh.receiveShadow = record.receiveShadow;
    meshRecords.delete(mesh);
    return { success: true, status: getStatus() };
  },

  registerObject(root, settings = {}) {
    if (!root || typeof root.traverse !== "function") {
      return { success: false, error: "registerObject expects a Three.js object or group." };
    }
    let registered = 0;
    root.traverse(object => {
      if (object.isMesh && applyMesh(object, {
        castShadow: Boolean(settings.castShadow),
        receiveShadow: Boolean(settings.receiveShadow)
      })) registered++;
    });
    return { success: registered > 0, registeredMeshes: registered, status: getStatus() };
  },

  registerNamedObject(name, settings = {}) {
    const root = scene?.getObjectByName?.(name);
    if (!root) return { success: false, error: "No scene object found with that name." };
    return this.registerObject(root, settings);
  },

  registerDirectionalLight(light, options = {}) {
    return applyLight(light, options);
  },

  enable() {
    if (!renderer?.shadowMap) {
      return { success: false, error: "Renderer shadow map is unavailable." };
    }
    if (!meshRecords.size || !lightRecords.size) {
      return {
        success: false,
        error: "Register at least one shadow caster/receiver mesh and one directional light first.",
        status: getStatus()
      };
    }

    if (!baselineShadowMap) {
      baselineShadowMap = { enabled: renderer.shadowMap.enabled, type: renderer.shadowMap.type };
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 2;
    meshRecords.forEach((record, mesh) => {
      mesh.castShadow = Boolean(record.settings.castShadow);
      mesh.receiveShadow = Boolean(record.settings.receiveShadow);
    });
    lightRecords.forEach((record, light) => {
      configureLight(light, record.options.mapSize);
    });
    enabled = true;
    return { success: true, status: getStatus() };
  },

  disable() {
    if (renderer?.shadowMap && baselineShadowMap) {
      renderer.shadowMap.enabled = baselineShadowMap.enabled;
      renderer.shadowMap.type = baselineShadowMap.type;
    }
    meshRecords.forEach((record, mesh) => {
      mesh.castShadow = record.castShadow;
      mesh.receiveShadow = record.receiveShadow;
    });
    lightRecords.forEach((record, light) => {
      light.castShadow = record.castShadow;
    });
    enabled = false;
    return { success: true, status: getStatus() };
  }
};

export default {
  init(scene_, context = {}) {
    scene = scene_ || null;
    renderer = context.renderer || null;
    baselineShadowMap = renderer?.shadowMap ? {
      enabled: renderer.shadowMap.enabled,
      type: renderer.shadowMap.type
    } : null;
    enabled = false;
    window.__lamboCityVisualShadows = controls;
    return controls;
  },

  update() {
    // No per-frame work; shadow maps are rendered by Three.js only when enabled.
  }
};