import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [];
let time = 0;
let frameSkip = 0;

export default {
  init(scene) {
    // AMBIENT — single strong warm light
    var ambient = new THREE.AmbientLight(0xff9944, 1.4);
    scene.add(ambient);

    // SUN — one strong directional
    var sun = new THREE.DirectionalLight(0xff8833, 3.0);
    sun.position.set(100, 60, -30);
    scene.add(sun);

    // COOL FILL
    var fill = new THREE.DirectionalLight(0x6633aa, 0.5);
    fill.position.set(-80, 40, 20);
    scene.add(fill);

    // DOCK LANTERNS — reduced to every other one
    var lanternZ = [-55, -35, -15, 5, 22];
    lanternZ.forEach(function(z) {
      [-5.5, 5.5].forEach(function(x) {
        var l = new THREE.PointLight(0xffaa33, 3.0, 14);
        l.position.set(x, 3.8, z);
        scene.add(l);
        lanternLights.push(l);
      });
    });

    // WATER TEAL — one wide light
    var waterL = new THREE.PointLight(0x00bbcc, 3, 120);
    waterL.position.set(0, 0.5, -10);
    scene.add(waterL);

    // STAGE — two lights instead of five
    var stagePurple = new THREE.PointLight(0x9900ff, 10, 140);
    stagePurple.position.set(0, 22, -62);
    scene.add(stagePurple);

    var stagePink = new THREE.PointLight(0xff00aa, 4, 80);
    stagePink.position.set(-20, 10, -68);
    scene.add(stagePink);

    // YACHT
    var yachtL = new THREE.PointLight(0x00ffff, 3, 45);
    yachtL.position.set(38, 4, -28);
    scene.add(yachtL);

    // VILLA — one wide light covers all three
    var villaL = new THREE.PointLight(0xffaa44, 4, 60);
    villaL.position.set(-37, 5, -16);
    scene.add(villaL);
  },

  update(delta) {
    time += delta;
    frameSkip++;
    // ONLY ANIMATE LANTERNS EVERY 2 FRAMES
    if (frameSkip % 2 !== 0) return;
    lanternLights.forEach(function(l, i) {
      l.intensity = 2.8 + Math.sin(time * 1.8 + i * 0.4) * 0.5;
    });
  }
};
