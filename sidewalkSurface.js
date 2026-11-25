import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const tileGeometryCache = new Map();

function getTileGeometry(axis, crossSize, alongSize, thickness) {
  const dimensions = axis === "x"
    ? [alongSize, thickness, crossSize]
    : [crossSize, thickness, alongSize];
  const key = dimensions.join(":");
  if (!tileGeometryCache.has(key)) {
    tileGeometryCache.set(key, new THREE.BoxGeometry(...dimensions));
  }
  return tileGeometryCache.get(key);
}

/**
 * Adds a concrete sidewalk without changing its approved footprint.
 * A continuous foundation supports shallow, individually jointed pavers.
 * Pavers are instanced so the detail remains light enough for iPad Safari.
 */
export function addSegmentedSidewalk(parent, options) {
  const {
    name,
    width,
    depth,
    position,
    axis = "z",
    baseMaterial,
    paverMaterial,
    curbMaterial,
    baseThickness = 0.14,
    paverThickness = 0.04,
    curbHeight = 0.14,
    curbWidth = 0.18,
    curbSide = null
  } = options;

  if (!parent || !name || !Array.isArray(position) || position.length !== 3) {
    throw new TypeError("A parent, name, and [x, y, z] position are required.");
  }
  if (!(width > 0) || !(depth > 0) || !baseMaterial || !paverMaterial) {
    throw new TypeError("Sidewalk dimensions and base/paver materials are required.");
  }
  if (axis !== "x" && axis !== "z") {
    throw new TypeError('Sidewalk axis must be "x" or "z".');
  }

  const [x, y, z] = position;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, baseThickness, depth),
    baseMaterial
  );
  base.name = name + "_foundation";
  base.position.set(x, y, z);
  base.receiveShadow = true;
  parent.add(base);

  const alongLength = axis === "x" ? width : depth;
  const crossLength = axis === "x" ? depth : width;
  const segmentCount = Math.max(1, Math.floor(alongLength / 2.55));
  const segmentPitch = alongLength / segmentCount;
  const tileAlong = Math.max(0.5, segmentPitch - 0.075);
  const rowCount = Math.max(1, Math.floor(crossLength / 2.15));
  const rowPitch = crossLength / rowCount;
  const tileCross = Math.max(0.5, rowPitch - 0.075);
  const tileGeometry = getTileGeometry(axis, tileCross, tileAlong, paverThickness);
  const instanceCount = segmentCount * rowCount;
  const pavers = new THREE.InstancedMesh(tileGeometry, paverMaterial, instanceCount);
  pavers.name = name + "_paverPanels";
  pavers.receiveShadow = true;

  const helper = new THREE.Object3D();
  const shades = [0xc1c0b9, 0xb8b9b4, 0xb2b3ae, 0xc6c3bb];
  let instance = 0;

  for (let row = 0; row < rowCount; row++) {
    for (let segment = 0; segment < segmentCount; segment++) {
      const alongOffset = -alongLength / 2 + segmentPitch * (segment + 0.5);
      const crossOffset = -crossLength / 2 + rowPitch * (row + 0.5);
      helper.position.set(
        x + (axis === "x" ? alongOffset : crossOffset),
        y + baseThickness / 2 - paverThickness / 2 + 0.002,
        z + (axis === "z" ? alongOffset : crossOffset)
      );
      helper.updateMatrix();
      pavers.setMatrixAt(instance, helper.matrix);
      pavers.setColorAt(instance, new THREE.Color(shades[(segment + row * 2) % shades.length]));
      instance++;
    }
  }

  pavers.instanceMatrix.needsUpdate = true;
  if (pavers.instanceColor) pavers.instanceColor.needsUpdate = true;
  parent.add(pavers);

  if (curbMaterial && curbSide) {
    const curbGeometry = axis === "x"
      ? new THREE.BoxGeometry(width, curbHeight, curbWidth)
      : new THREE.BoxGeometry(curbWidth, curbHeight, depth);
    const curb = new THREE.Mesh(curbGeometry, curbMaterial);
    curb.name = name + "_roadsideCurb";
    // Align the curb's road-facing outer face exactly with the road edge.
    // The complete curb remains inside the sidewalk footprint: no gap,
    // no overlap with the roadway, and one continuous pedestrian boundary.
    const edgeOffset = crossLength / 2 - curbWidth / 2;
    const crossOffset = curbSide.startsWith("positive") ? edgeOffset : -edgeOffset;
    curb.position.set(
      x + (axis === "x" ? 0 : crossOffset),
      y + baseThickness / 2 - curbHeight / 2,
      z + (axis === "z" ? 0 : crossOffset)
    );
    curb.receiveShadow = true;
    parent.add(curb);
  }

  return { foundation: base, pavers };
}
