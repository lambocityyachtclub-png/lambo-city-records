import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 1 });
    const leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a7a3a, roughness: 0.8 });

    const positions = [
      // LEFT SIDE of dock
      [-18, 0, -10], [-22, 0, -25], [-18, 0, -40], [-24, 0, -55],
      // RIGHT SIDE of dock
      [ 18, 0, -10], [ 22, 0, -25], [ 18, 0, -40], [ 24, 0, -55],
      // NEAR STAGE
      [-14, 0, -65], [14, 0, -65],
    ];

    positions.forEach(([x, y, z]) => {
      const palm = new THREE.Group();

      // TRUNK — slight lean
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.45, 7, 8),
        trunkMat
      );
      trunk.position.y = 3.5;
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      palm.add(trunk);

      // LEAVES — layered spheres
      [0, 0.8, 1.4].forEach((yOff, i) => {
        const leaves = new THREE.Mesh(
          new THREE.SphereGeometry(2.2 - i * 0.4, 7, 7),
          leafMat
