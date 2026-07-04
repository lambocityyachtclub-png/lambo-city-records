import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [];
let time = 0;
export default {
  init(scene) {
    // STRONG WARM AMBIENT — golden hour base
    var ambient = new THREE.AmbientLight(0xff8844, 1.8);
    scene.add(ambient);

    // SUN — low angle golden hour from right
    var sun = new THREE.DirectionalLight(0xff7722, 4.0);
    sun.position.set(120, 50, -30);
    scene.add(sun);

    // WARM FILL — opposite side
    var fill = new THREE.DirectionalLight(0xff5500, 1.5);
    fill.position.set(-80, 30, 40);
    scene.add(fill);

    // GROUND BOUNCE — stops dark undersides
    var bounce = new THREE.DirectionalLight(0xff6622, 0.8);
    bounce.position.set(0, -5, 0);
    scene.add(bounce);

    // DOCK LANTERNS — warm amber
    var lanternZ = [-55,-45,-35,-25,-15,-5,5,15,22];
    lanternZ.forEach(function(z) {
      [-5.5, 5.5].forEach(function(x) {
        var l = new THREE.PointLight(0xffaa33, 3.5, 14);
        l.position.set(x, 3.8, z);
        scene.add(l);
        lanternLights.push(l);
      });
    });

    // WATER TEAL GLOW
    var waterL = new THREE.PointLight(0x00bbcc, 3, 100);
    waterL.position.set(0, 0.5, -15);
    scene.add(waterL);

    // LEFT WATER — villa side pools
    var leftWater = new THREE.PointLight(0x00aacc, 2, 50);
    leftWater.position.set(-30, 0.5, -10);
    scene.add(leftWater);

    // RIGHT WATER — jet ski side
    var rightWater = new THREE.PointLight(0x00aacc, 2, 50);
    rightWater.position.set(30, 0.5, -10);
    scene.add(rightWater);

    // STAGE PURPLE WASH
    var stagePurple = new THREE.PointLight(0x9900ff, 10, 130);
    stagePurple.position.set(0, 22, -62);
    scene.add(stagePurple);

    // STAGE PINK LEFT
    var stageL = new THREE.PointLight(0xff00aa, 5, 70);
    stageL.position.set(-25, 12, -68);
    scene.add(stageL);

    // STAGE BLUE RIGHT
    var stageR = new THREE.PointLight(0x0055ff, 5, 70);
    stageR.position.set(25, 12, -68);
    scene.add(stageR);

    // YACHT CYAN
    var yachtLight = new THREE.PointLight(0x00ffff, 3, 40);
    yachtLight.position.set(38, 4, -28);
    scene.add(yachtLight);

    // VILLA WARMTH
    [-37].forEach(function(x) {
      [8, -16, -40].forEach(function(z) {
        var vl = new THREE.PointLight(0xff8833, 3, 22);
        vl.position.set(x, 4, z + 6);
        scene.add(vl);
      });
    });
  },
  update(delta) {
    time += delta;
    lanternLights.forEach(function(l, i) {
      l.intensity = 3.0 + Math.sin(time * 1.8 + i * 0.3) * 0.6;
    });
  }
};
