import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [];
let time = 0;
export default {
  init(scene) {
    var ambient = new THREE.AmbientLight(0xffaa55, 1.2);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xff8844, 3.0);
    sun.position.set(80, 60, 20);
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0x4466cc, 0.8);
    fill.position.set(-80, 40, -20);
    scene.add(fill);
    var groundFill = new THREE.DirectionalLight(0xff6622, 0.5);
    groundFill.position.set(0, -10, 0);
    scene.add(groundFill);
    var lanternZ = [-50,-40,-30,-20,-10,0,10,20];
    lanternZ.forEach(function(z, i) {
      [-5.5, 5.5].forEach(function(x) {
        var l = new THREE.PointLight(0xffaa33, 2.5, 12);
        l.position.set(x, 3.8, z);
        scene.add(l);
        lanternLights.push(l);
      });
    });
    var waterLight = new THREE.PointLight(0x00bbcc, 2, 80);
    waterLight.position.set(0, 0, -20);
    scene.add(waterLight);
    var stagePurple = new THREE.PointLight(0x9900ff, 8, 120);
    stagePurple.position.set(0, 20, -65);
    scene.add(stagePurple);
    var stageL = new THREE.PointLight(0xff00aa, 4, 60);
    stageL.position.set(-25, 10, -70);
    scene.add(stageL);
    var stageR = new THREE.PointLight(0x0044ff, 4, 60);
    stageR.position.set(25, 10, -70);
    scene.add(stageR);
    var yachtLight = new THREE.PointLight(0x00ffff, 2, 35);
    yachtLight.position.set(38, 5, -28);
    scene.add(yachtLight);
  },
  update(delta) {
    time += delta;
    lanternLights.forEach(function(l, i) {
      l.intensity = 2.0 + Math.sin(time * 1.8 + i * 0.3) * 0.5;
    });
  }
};
