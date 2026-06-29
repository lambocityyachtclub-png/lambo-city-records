import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 1 });
    const leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a7a3a, roughness: 0.8 });

    const positions = [
      [-18, 0, -10],
      [-22, 0, -25],
      [-18, 0, -40],
      [-24, 0, -55],
      [ 18, 0, -10],
      [ 22, 0, -25],
      [ 18, 0, -40],
      [ 24, 0, -55],
      [-14, 0, -65],
      [ 14, 0, -65]
    ];

    positions.forEach(function(coord) {
      var x = coord[0];
      var y = coord[1];
      var z = coord[2];

      var palm = new THREE.Group();

      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.45, 7, 8),
        trunkMat
      );
      trunk.position.y = 3.5;
      palm.add(trunk);

      var leaf1 = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 7, 7),
        leafMat
      );
      leaf1.position.y = 7.5;
      palm.add(leaf1);

      var leaf2 = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 7, 7),
        leafMat
      );
      leaf2.position.y = 8.3;
      palm.add(leaf2);

      var leaf3 = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 7, 7),
        leafMat
      );
      leaf3.position.y = 8.9;
      palm.add(leaf3);

      palm.position.set(x, y, z);
      scene.add(palm);
    });
  },

  update() {}
};
