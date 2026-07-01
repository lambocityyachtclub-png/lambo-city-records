import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let lanternLights = [];
let time = 0;

export default {
  init(scene) {
    // AMBIENT — deep warm night
    const ambient = new THREE.AmbientLight(0x220a44, 0.8);
    scene.add(ambient);

    // SUN — golden hour, low angle from right
    const sun = new THREE.DirectionalLight(0xff7722, 1.8);
    sun.position.set(100, 40, -60);
    scene.add(sun);

    // MOON FILL — cool blue left
    const moonFill = new THREE.DirectionalLight(0x2244aa, 0.4);
    moonFill.position.set(-100, 60, 40);
    scene.add(moonFill);

    // DOCK LANTERN POINT LIGHTS
    const lanternZ = [-55, -45, -35, -25, -15, -5, 5, 15];
    lanternZ.forEach(function(z, i) {
      const light = new THREE.PointLight(0xffaa33, 1.8, 9);
      light.position.set(-5.5, 3, z);
      scene.add(light);
      lanternLights.push(light);

      const light2 = new THREE.PointLight(0xffaa33, 1.8, 9);
      light2.position.set(5.5, 3, z);
      scene.add(light2);
      lanternLights.push(light2);
    });

    // WATER TEAL LIGHT
    const waterLight = new THREE.PointLight(0x00aacc, 2, 60);
    waterLight.position.set(0, 0.5, -10);
    scene.add(waterLight);

    // STAGE WASH — purple
    const stagePurple = new THREE.PointLight(0x9900ff, 6, 100);
    stagePurple.position.set(0, 20, -65);
    scene.add(stagePurple);

    // STAGE PINK SIDE WASH
    const stagePink = new THREE.PointLight(0xff00aa, 3, 60);
    stagePink.position.set(-20, 10, -70);
    scene.add(stagePink);

    const stageBlue = new THREE.PointLight(0x0044ff, 3, 60);
    stageBlue.position.set(20, 10, -70);
    scene.add(stageBlue);

    // YACHT LIGHT
    const yachtLight = new THREE.PointLight(0x00ffff, 2, 35);
    yachtLight.position.set(36, 5, -25);
    scene.add(yachtLight);
  },

  update(delta) {
    time += delta;
    lanternLights.forEach(function(l, i) {
      l.intensity = 1.5 + Math.sin(time * 1.8 + i * 0.3) * 0.4;
    });
  }
};
