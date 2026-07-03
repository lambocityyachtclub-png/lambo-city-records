import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    var woodMat  = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 });
    var plankMat = new THREE.MeshStandardMaterial({ color: 0xa0693a, roughness: 0.85 });
    var postMat  = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1 });
    var railMat  = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.8 });
    var DOCK_Y = 1.0;
    var base = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 100), woodMat);
    base.position.set(0, DOCK_Y, -20);
    scene.add(base);
    for (var z = -65; z < 35; z += 2) {
      var plank = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.15, 1.2), plankMat);
      plank.position.set(0, DOCK_Y + 0.28, z);
      scene.add(plank);
    }
    [-6, 6].forEach(function(x) {
      for (var pz = -65; pz < 35; pz += 8) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 8), postMat);
        post.position.set(x, DOCK_Y - 2.5, pz);
        scene.add(post);
      }
    });
    [-6.2, 6.2].forEach(function(x) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 100), railMat);
      rail.position.set(x, DOCK_Y + 0.6, -20);
      scene.add(rail);
    });
    for (var lz = -60; lz < 30; lz += 8) {
      [-5.5, 5.5].forEach(function(lx) {
        var pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        pole.position.set(lx, DOCK_Y + 1.5, lz);
        scene.add(pole);
        var lantern = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.5, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 2 })
        );
        lantern.position.set(lx, DOCK_Y + 2.9, lz);
        scene.add(lantern);
        var glow = new THREE.PointLight(0xffaa33, 2, 8);
        glow.position.set(lx, DOCK_Y + 2.9, lz);
        scene.add(glow);
      });
    }
  },
  update() {}
};
