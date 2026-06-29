import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let lights = [];
let beams = [];
let time = 0;

export default {
  init(scene) {
    // STAGE SPOT BEAMS — visible cones
    var colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff4400, 0x00ff88];
    for (var i = 0; i < 5; i++) {
      var spot = new THREE.SpotLight(colors[i], 12, 150, Math.PI / 14, 0.5);
      spot.position.set(-20 + i * 10, 35, -60);
      spot.target.position.set(-20 + i * 10, 0, -75);
      scene.add(spot);
      scene.add(spot.target);
      lights.push(spot);

      // VISIBLE BEAM CONE
      var coneGeo = new THREE.CylinderGeometry(0.1, 4, 35, 8, 1, true);
      var coneMat = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide
      });
      var cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(-20 + i * 10, 18, -65);
      scene.add(cone);
      beams.push({ mesh: cone, baseOpacity: 0.06, color: colors[i], offset: i });
    }

    // NEON GROUND STRIPS — stage area
    var neonMat = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 2
    });
    [-12, -6, 0, 6, 12].forEach(function(x) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.05, 20),
        neonMat
      );
      strip.position.set(x, 0.55, -70);
      scene.add(strip);
    });

    // STAGE LED SCREEN PULSE LIGHT
    var screenLight = new THREE.PointLight(0x9900ff, 4, 60);
    screenLight.position.set(0, 12, -78);
    scene.add(screenLight);
    lights.push(screenLight);
  },

  update(delta) {
    time += delta;

    // ANIMATE SPOT LIGHTS — sweep side to side
    lights.forEach(function(light, i) {
      if (light.target) {
        light.target.position.x = Math.sin(time * 0.8 + i * 1.2) * 15;
        light.target.updateMatrixWorld();
        light.intensity = 8 + Math.sin(time * 2 + i) * 4;
      } else {
        // screen light pulse
        light.intensity = 3 + Math.sin(time * 3) * 2;
      }
    });

    // ANIMATE BEAM OPACITY
    beams.forEach(function(b, i) {
      b.mesh.material.opacity = 0.04 + Math.sin(time * 2 + i * 0.8) * 0.03;
    });
  }
};
