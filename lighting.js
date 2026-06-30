import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let neonLights = [];
let time = 0;

export default {
  init(scene) {
    // AMBIENT — warm
    var ambient = new THREE.AmbientLight(0xff8844, 0.4);
    scene.add(ambient);

    // SUN — golden hour from right
    var sun = new THREE.DirectionalLight(0xff8844, 2.5);
    sun.position.set(80, 60, -40);
    scene.add(sun);

    // FILL — cool blue from left
    var fill = new THREE.DirectionalLight(0x4466aa, 0.5);
    fill.position.set(-80, 30, 40);
    scene.add(fill);

    // DOCK LANTERN GLOWS
    var positions = [-15, -8, 0, 8, 15];
    positions.forEach(function(x, i) {
      var light = new THREE.PointLight(0xffaa33, 1.5, 10);
      light.position.set(x, 2.5, -10 - i * 8);
      scene.add(light);
      neonLights.push(light);
    });

    // WATER REFLECTION LIGHT — teal
    var waterLight = new THREE.PointLight(0x00aacc, 1.5, 40);
    waterLight.position.set(0, 1, -20);
    scene.add(waterLight);

    // STAGE PURPLE WASH
    var stageLight = new THREE.PointLight(0x9900ff, 4, 80);
    stageLight.position.set(0, 15, -60);
    scene.add(stageLight);
  },

  update(delta) {
    time += delta;
    neonLights.forEach(function(l, i) {
      l.intensity = 1.2 + Math.sin(time * 1.5 + i * 0.5) * 0.4;
    });
  }
};
