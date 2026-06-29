import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let lights = [];
let beams = [];
let time = 0;

export default {
  init(scene) {
    var colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff4400, 0x00ff88];

    for (var i = 0; i < 5; i++) {
      var spot = new THREE.SpotLight(colors[i], 10, 140, Math.PI / 14, 0.5);
      spot.position.set(-20 + i * 10, 30, -58);
      spot.target.position.set(0, 0, -75);
      scene.add(spot);
      scene.add(spot.target);
      lights.push(spot);

      var coneGeo = new THREE.CylinderGeometry(0.1, 3.5, 30, 8, 1, true);
      var coneMat = new THREE.MeshBasicMaterial({
        color: colors[i], transparent: true,
        opacity: 0.05, side: THREE.DoubleSide
      });
      var cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(-20 + i * 10, 15, -62);
      scene.add(cone);
      beams.push({ mesh: cone, offset: i });
    }

    // STAGE SCREEN LIGHT
    var screenLight = new THREE.PointLight(0x9900ff, 5, 55);
    screenLight.position.set(0, 10, -76);
    scene.add(screenLight);
    lights.push(screenLight);

    // NEON GROUND STRIPS on stage
    var neonMat = new THREE.MeshStandardMaterial({
      color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2
    });
    [-12, -6, 0, 6, 12].forEach(function(x) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.05, 18), neonMat
      );
      strip.position.set(x, 1.05, -70);
      scene.add(strip);
    });
  },

  update(delta) {
    time += delta;
    lights.forEach(function(light, i) {
      if (light.target) {
        light.target.position.x = Math.sin(time * 0.7 + i * 1.2) * 14;
        light.target.updateMatrixWorld();
        light.intensity = 8 + Math.sin(time * 2 + i) * 3;
      } else {
        light.intensity = 4 + Math.sin(time * 3) * 2;
      }
    });
    beams.forEach(function(b, i) {
      b.mesh.material.opacity = 0.03 + Math.sin(time * 2 + i * 0.8) * 0.025;
    });
  }
};
