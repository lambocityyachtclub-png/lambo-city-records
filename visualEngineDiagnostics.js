// visualEngineDiagnostics.js
// LAMBO CITY Visual Engine 2.0 — on-demand scene and renderer audit.
//
// This module does not add visual objects or run a per-frame scene scan.
// Call window.__lamboCityVisualDiagnostics.getReport() when diagnostics
// are needed. The report is read-only and safe to run from the browser console.

let scene = null;
let context = null;

function inspectScene() {
  const report = {
    objects: 0,
    meshes: 0,
    instancedMeshes: 0,
    points: 0,
    lines: 0,
    lights: 0,
    cameras: 0,
    geometries: 0,
    materials: 0,
    textures: 0,
    transparentMaterials: 0,
    materialTypes: {},
    lightTypes: {},
    textureTypes: {}
  };

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  if (!scene) return report;

  scene.traverse(object => {
    report.objects++;

    if (object.isMesh) report.meshes++;
    if (object.isInstancedMesh) report.instancedMeshes++;
    if (object.isPoints) report.points++;
    if (object.isLine || object.isLineSegments) report.lines++;
    if (object.isLight) {
      report.lights++;
      const type = object.type || "UnknownLight";
      report.lightTypes[type] = (report.lightTypes[type] || 0) + 1;
    }
    if (object.isCamera) report.cameras++;

    if (object.geometry) geometries.add(object.geometry);

    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : object.material ? [object.material] : [];

    objectMaterials.forEach(material => {
      materials.add(material);
      const type = material.type || "UnknownMaterial";
      report.materialTypes[type] = (report.materialTypes[type] || 0) + 1;
      if (material.transparent || material.opacity < 1) {
        report.transparentMaterials++;
      }

      Object.keys(material).forEach(key => {
        const value = material[key];
        if (value?.isTexture) textures.add(value);
      });
    });
  });

  report.geometries = geometries.size;
  report.materials = materials.size;
  report.textures = textures.size;

  textures.forEach(texture => {
    const type = texture.type || texture.constructor?.name || "Texture";
    report.textureTypes[type] = (report.textureTypes[type] || 0) + 1;
  });

  return report;
}

function getReport() {
  const renderer = context?.renderer;
  const camera = context?.camera;
  const performance = window.__lamboCityPerformance || null;
  const visualQuality = window.__lamboCityVisualEngine?.getStatus?.() || null;
  const rendererInfo = renderer?.info;

  return {
    generatedAt: new Date().toISOString(),
    scene: inspectScene(),
    renderer: {
      type: renderer?.constructor?.name || null,
      pixelRatio: renderer?.getPixelRatio?.() ?? null,
      outputColorSpace: renderer?.outputColorSpace || null,
      toneMapping: renderer?.toneMapping ?? null,
      toneMappingExposure: renderer?.toneMappingExposure ?? null,
      maxTextureSize: renderer?.capabilities?.maxTextureSize ?? null,
      maxAnisotropy: renderer?.capabilities?.getMaxAnisotropy?.() ?? null,
      memory: rendererInfo?.memory ? {
        geometries: rendererInfo.memory.geometries,
        textures: rendererInfo.memory.textures
      } : null,
      lastRender: rendererInfo?.render ? {
        calls: rendererInfo.render.calls,
        triangles: rendererInfo.render.triangles,
        points: rendererInfo.render.points,
        lines: rendererInfo.render.lines
      } : null
    },
    camera: camera ? {
      type: camera.type,
      fov: camera.fov ?? null,
      near: camera.near ?? null,
      far: camera.far ?? null,
      aspect: camera.aspect ?? null
    } : null,
    performance,
    visualQuality
  };
}

export default {
  init(scene_, context_ = {}) {
    scene = scene_ || null;
    context = context_ || {};
    const controls = { getReport };
    window.__lamboCityVisualDiagnostics = controls;
    return controls;
  },

  update() {
    // Intentionally idle. Diagnostics are generated only on explicit request.
  }
};
