import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// Palm locations, heights, and lean are approved world coordinates.
// Canopy detail is additive and stays inside the existing landscaping footprint.
const PALMS = [
  {x:-16,z:5,h:10,lean:0.08},{x:-20,z:-10,h:12,lean:0.12},
  {x:-17,z:-25,h:9,lean:0.06},{x:-22,z:-42,h:13,lean:0.10},
  {x:16,z:5,h:10,lean:-0.08},{x:20,z:-10,h:12,lean:-0.12},
  {x:17,z:-25,h:9,lean:-0.06},{x:22,z:-42,h:13,lean:-0.10}
];

function makeFrondGeometry(length, phase, droop) {
  const segments = 12;
  const across = 4;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const radius = length * t;
    const y = 0.38 * Math.sin(Math.PI * t) - droop * t * t;
    const width = (0.035 + 0.48 * Math.pow(Math.sin(Math.PI * t), 0.82)) * (1 - 0.34 * t);
    for (let j = 0; j <= across; j++) {
      const side = (j / across) * 2 - 1;
      const radialX = Math.cos(phase);
      const radialZ = Math.sin(phase);
      const sideX = -radialZ;
      const sideZ = radialX;
      positions.push(
        radialX * radius + sideX * width * side,
        y + Math.abs(side) * 0.045 * Math.sin(Math.PI * t),
        radialZ * radius + sideZ * width * side
      );
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * (across + 1) + j;
      const b = a + across + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createCanopy(palm, crownY, leanOffset, material) {
  const positions = [];
  const indices = [];
  const colors = [];
  const shades = [0x28733a, 0x398849, 0x1d5d31];
  const frondCount = 11;

  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2 + 0.13 * (i % 2);
    const length = 3.65 + (i % 4) * 0.42;
    const droop = 1.05 + (i % 3) * 0.18;
    const geometry = makeFrondGeometry(length, angle, droop);
    const vertexPositions = geometry.getAttribute("position").array;
    const vertexCount = vertexPositions.length / 3;
    const offset = positions.length / 3;
    positions.push(...vertexPositions);
    for (const index of geometry.index.array) indices.push(index + offset);
    const color = new THREE.Color(shades[i % shades.length]);
    for (let vertex = 0; vertex < vertexCount; vertex++) {
      colors.push(color.r, color.g, color.b);
    }
    geometry.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  merged.setIndex(indices);
  merged.computeVertexNormals();

  const canopy = new THREE.Group();
  canopy.position.set(leanOffset, crownY, 0);
  const fronds = new THREE.Mesh(merged, material);
  fronds.castShadow = false;
  fronds.receiveShadow = true;
  canopy.add(fronds);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.43, 8, 6),
    new THREE.MeshStandardMaterial({color:0x398849,roughness:0.88})
  );
  crown.scale.set(1, 0.72, 1);
  crown.position.y = 0.13;
  canopy.add(crown);
  palm.add(canopy);
}

export default {
  init(scene) {
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x765035,
      roughness: 0.96,
      metalness: 0
    });
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.88,
      side: THREE.DoubleSide
    });

    PALMS.forEach(p => {
      const palm = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.38, p.h, 9, 5),
        trunkMaterial
      );
      trunk.position.y = p.h / 2;
      trunk.rotation.z = p.lean;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      palm.add(trunk);

      const leanOffset = Math.sin(p.lean) * p.h * 0.5;
      createCanopy(palm, p.h, leanOffset, leafMaterial);
      palm.position.set(p.x, 0.5, p.z);
      scene.add(palm);
    });
  },
  update() {}
};
