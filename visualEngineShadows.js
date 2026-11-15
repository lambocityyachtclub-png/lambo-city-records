// visualEngineShadows.js
// LAMBO CITY Visual Engine 2.0 — explicitly registered, budgeted shadow pipeline.
//
// Shadows remain OFF by default. Only explicitly registered meshes and
// directional lights can participate. A strict caster budget protects mobile
// GPUs; point-light shadows are intentionally excluded.

let renderer = null;
let scene = null;
let enabled = false;
let baselineShadowMap = null;
let maxActiveCasters = 24;
const meshRecords = new Map();
const lightRecords = new Map();
const activeCasterSet = new Set();

function normalizePriority(value) {
  const priority = Number(value);
  return Number.isFinite(priority) ? priority : 0;
}

function applyMesh(mesh, settings) {
  if (!mesh || !mesh.isMesh) return false;

  const normalized = {
    castShadow: Boolean(settings.castShadow),
    receiveShadow: Boolean(settings.receiveShadow),
    priority: normalizePriority(settings.priority)
  };

  if (!meshRecords.has(mesh)) {
    meshRecords.set(mesh, {
      castShadow: mesh.castShadow,
      receiveShadow: mesh.receiveShadow,
      settings: normalized
    });
  } else {
    meshRecords.get(mesh).settings = normalized;
  }

  if (enabled) {
    mesh.castShadow = activeCasterSet.has(mesh) && normalized.castShadow;
    mesh.receiveShadow = normalized.receiveShadow;
  }
  return true;
}

function captureLightState(light) {
  const shadow = light.shadow;
  const camera = shadow?.camera;
  return {
    castShadow: light.castShadow,
    shadow: shadow ? {
      mapSize: shadow.mapSize?.clone?.() || null,
      bias: shadow.bias,
      normalBias: shadow.normalBias,
      radius: shadow.radius,
      map: shadow.map || null,
      camera: camera ? {
        near: camera.near,
        far: camera.far,
        left: camera.left,
        right: camera.right,
        top: camera.top,
        bottom: camera.bottom
      } : null
    } : null
  };
}

function restoreLightState(light, baseline) {
  light.castShadow = baseline.castShadow;
  const shadow = light.shadow;
  if (!shadow || !baseline.shadow) return;

  if (baseline.shadow.mapSize && shadow.mapSize) {
    shadow.mapSize.copy(baseline.shadow.mapSize);
  }
  shadow.bias = baseline.shadow.bias;
  shadow.normalBias = baseline.shadow.normalBias;
  shadow.radius = baseline.shadow.radius;

  if (shadow.map && shadow.map !== baseline.shadow.map) {
    shadow.map.dispose?.();
  }
  shadow.map = baseline.shadow.map;

  if (shadow.camera && baseline.shadow.camera) {
    Object.assign(shadow.camera, baseline.shadow.camera);
    shadow.camera.updateProjectionMatrix();
  }
}

function applyLight(light, options = {}) {
  if (!light || !light.isDirectionalLight) {
    return {
      success: false,
      error: "Only explicitly registered directional lights can cast shadows."
    };
  }

  const mapSize = Math.max(256, Math.min(1024, Number(options.mapSize) || 512));
  if (!lightRecords.has(light)) {
    lightRecords.set(light, {
      baseline: captureLightState(light),
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

function getCasterCandidates() {
  return [...meshRecords.entries()]
    .filter(([, record]) => record.settings.castShadow)
    .sort((a, b) => b[1].settings.priority - a[1].settings.priority);
}

function getStatus() {
  const registeredCasters = getCasterCandidates().length;
  return {
    enabled,
    rendererAvailable: Boolean(renderer?.shadowMap),
    registeredMeshes: meshRecords.size,
    registeredDirectionalLights: lightRecords.size,
    enabledCasters: registeredCasters,
    enabledReceivers: [...meshRecords.values()].filter(record => record.settings.receiveShadow).length,
    activeCasters: activeCasterSet.size,
    skippedCasters: Math.max(0, registeredCasters - activeCasterSet.size),
    maxActiveCasters,
    pointLightShadows: false,
    maxShadowMapSize: 1024
  };
}

const controls = {
  getStatus,

  registerMesh(mesh, settings = {}) {
    const accepted = applyMesh(mesh, settings);
    return accepted
      ? { success: true, status: getStatus() }
      : { success: false, error: "registerMesh expects a Three.js Mesh." };
  },

  unregisterMesh(mesh) {
    const record = meshRecords.get(mesh);
    if (!record) return { success: false, error: "Mesh is not registered." };
    mesh.castShadow = record.castShadow;
    mesh.receiveShadow = record.receiveShadow;
    activeCasterSet.delete(mesh);
    meshRecords.delete(mesh);
    return { success: true, status: getStatus() };
  },

  registerTaggedObject(root) {
    if (!root || typeof root.traverse !== "function") {
      return { success: false, error: "registerTaggedObject expects a Three.js object or group." };
    }

    let registered = 0;
    root.traverse(object => {
      if (!object.isMesh || (!object.castShadow && !object.receiveShadow)) return;
      if (applyMesh(object, {
        castShadow: object.castShadow,
        receiveShadow: object.receiveShadow,
        priority: object.userData?.shadowPriority
      })) registered++;
    });

    return { success: true, registeredMeshes: registered, status: getStatus() };
  },

  registerObject(root, settings = {}) {
    if (!root || typeof root.traverse !== "function") {
      return { success: false, error: "registerObject expects a Three.js object or group." };
    }

    let registered = 0;
    root.traverse(object => {
      if (object.isMesh && applyMesh(object, settings)) registered++;
    });

    return { success: registered > 0, registeredMeshes: registered, status: getStatus() };
  },

  registerNamedObject(name, settings = {}) {
    const root = scene?.getObjectByName?.(name);
    if (!root) return { success: false, error: "No scene object found with that name." };
    return controls.registerObject(root, settings);
  },

  registerDirectionalLight(light, options = {}) {
    return applyLight(light, options);
  },

  enable(options = {}) {
    if (!renderer?.shadowMap) {
      return { success: false, error: "Renderer shadow map is unavailable." };
    }

    const candidates = getCasterCandidates();
    const receiverCount = [...meshRecords.values()]
      .filter(record => record.settings.receiveShadow).length;

    if (!candidates.length || !receiverCount || !lightRecords.size) {
      return {
        success: false,
        error: "Register at least one caster, one receiver, and one directional light first.",
        status: getStatus()
      };
    }

    const requestedBudget = Number(options.maxCasters);
    maxActiveCasters = Number.isFinite(requestedBudget)
      ? Math.max(1, Math.min(64, Math.floor(requestedBudget)))
      : 24;

    activeCasterSet.clear();
    candidates.slice(0, maxActiveCasters).forEach(([mesh]) => {
      activeCasterSet.add(mesh);
    });

    if (!baselineShadowMap) {
      baselineShadowMap = {
        enabled: renderer.shadowMap.enabled,
        type: renderer.shadowMap.type
      };
    }

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 2;

    meshRecords.forEach((record, mesh) => {
      mesh.castShadow = activeCasterSet.has(mesh);
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
      restoreLightState(light, record.baseline);
    });

    activeCasterSet.clear();
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
    activeCasterSet.clear();
    window.__lamboCityVisualShadows = controls;
    return controls;
  },

  update() {
    // No per-frame work; Three.js renders shadows only when explicitly enabled.
  }
};
