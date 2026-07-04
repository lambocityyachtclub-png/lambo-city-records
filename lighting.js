import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [];
let time = 0;
export default {
  init(scene) {
    // AMBIENT — warm but not overpowering
    var ambient = new THREE.AmbientLight(0xff9944, 0.9);
    scene.add(ambient);

    // SUN — golden, low angle
    var sun = new THREE.DirectionalLight(0xff8833, 2.5);
    sun.position.set(100, 45, -20);
    scene.add(sun);

    // COOL FILL — purple sky bounce
    var fill = new THREE.DirectionalLight(0x6633aa, 0.6);
    fill.position.set(-80, 40, 20);
    scene.add(fill);

    // GROUND BOUNCE
    var bounce = new THREE.DirectionalLight(0xff6622, 0.4);
    bounce.position.set(0, -5, 0);
    scene.add(bounce);

    // DOCK LANTERNS
    var lanternZ = [-55,-45,-35,-25,-15,-5,5,15,22];
    lanternZ.forEach(function(z) {
      [-5.5, 5.5].forEach(function(x) {
        var l = new THREE.PointLight(0xffaa33, 3.0, 12);
        l.position.set(x, 3.8, z);
        scene.add(l);
        lanternLights.push(l);
      });
    });

    // TEAL WATER GLOW — strong
    var waterC = new THREE.PointLight(0x00ccdd, 4, 120);
    waterC.position.set(0, 0.5, -10);
    scene.add(waterC);

    var waterL = new THREE.PointLight(0x00aacc, 3, 60);
    waterL.position.set(-28, 0.5, -15);
    scene.add(waterL);

    var waterR = new THREE.PointLight(0x00aacc, 3, 60);
    waterR.position.set(28, 0.5, -15);
    scene.add(waterR);

    // STAGE
    var stagePurple = new THREE.PointLight(0x9900ff, 10, 130);
    stagePurple.position.set(0, 22, -62);
    scene.add(stagePurple);

    var stageL = new THREE.PointLight(0xff00aa, 5, 70);
    stageL.position.set(-25, 12, -68);
    scene.add(stageL);

    var stageR = new THREE.PointLight(0x0055ff, 5, 70);
    stageR.position.set(25, 12, -68);
    scene.add(stageR);

    // YACHT
    var yachtLight = new THREE.PointLight(0x00ffff, 3, 40);
    yachtLight.position.set(38, 4, -28);
    scene.add(yachtLight);

    // VILLA WARMTH
    [8, -16, -40].forEach(function(z) {
      var vl = new THREE.PointLight(0xff8833, 3, 22);
      vl.position.set(-37, 4, z + 6);
      scene.add(vl);
    });
  },
  update(delta) {
    time += delta;
    lanternLights.forEach(function(l, i) {
      l.intensity = 2.8 + Math.sin(time * 1.8 + i * 0.3) * 0.5;
    });
  }
};
