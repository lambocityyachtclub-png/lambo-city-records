import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xa0693a, roughness: 0.85 });

    // MAIN DOCK PLATFORM
    const base = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 80), woodMat);
    base.position.set(0, 0.1, -20);
    scene.add(base);

    // PLANKS
    for (let z = -55; z < 25; z += 2) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.15, 1.2), plankMat);
      plank.position.set(0, 0.32, z);
      scene.add(plank);
    }

    // DOCK POSTS
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1 });
    [-6, 6].forEach(x => {
      for (let z = -55; z < 25; z += 8) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 8), postMat);
        post.position.set(x, -1, z);
        scene.add(post);
      }
    });

    // LANTERNS
    const lanternPositions = [];
    for (let z = -50; z < 20; z += 8) {
      lanternPositions.push([-5.5, z]);
      lanternPositions.push([5.5, z]);
    }
    lanternPositions.forEach(([x, z]) => {
      // pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      pole.position.set(x, 1.5, z);
      scene.add(pole);

      // lantern box
      const lantern = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 1.5 })
      );
      lantern.position.set(x, 2.8, z);
      scene.add(lantern);

      // glow point light
      const glow = new THREE.PointLight(0xffaa33, 1.2, 6);
      glow.position.set(x, 2.8, z);
      scene.add(glow);
    });

    // SIDE RAILINGS
    const railMat = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.8 });
    [-6.2, 6.2].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 80), railMat);
      rail.position.set(x, 0.7, -20);
      scene.add(rail);
    });
  },
  update() {}
};
