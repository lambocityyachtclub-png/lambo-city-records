import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [];
let time = 0;
export default {
  init(scene) {
    scene.add(new THREE.AmbientLight(0xff9944, 1.0));
    const sun = new THREE.DirectionalLight(0xff8833, 2.5);
    sun.position.set(100, 60, -30);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x6633aa, 0.5);
    fill.position.set(-80, 40, 20);
    scene.add(fill);
    const bounce = new THREE.DirectionalLight(0xff6622, 0.3);
    bounce.position.set(0, -5, 0);
    scene.add(bounce);
    [-55,-35,-15,5,22].forEach(z => {
      [-5.5, 5.5].forEach(x => {
        const l = new THREE.PointLight(0xffaa33, 3.0, 14);
        l.position.set(x, 3.8, z);
        scene.add(l);
        lanternLights.push(l);
      });
    });
    const wl = new THREE.PointLight(0x00bbcc, 3, 120);
    wl.position.set(0, 0.5, -10);
    scene.add(wl);
    const sp = new THREE.PointLight(0x9900ff, 10, 140);
    sp.position.set(0, 22, -62);
    scene.add(sp);
    const sl = new THREE.PointLight(0xff00aa, 4, 80);
    sl.position.set(-20, 10, -68);
    scene.add(sl);
    const sr = new THREE.PointLight(0x0055ff, 4, 80);
    sr.position.set(20, 10, -68);
    scene.add(sr);
    const yl = new THREE.PointLight(0x00ffff, 3, 45);
    yl.position.set(38, 4, -28);
    scene.add(yl);
    const vl = new THREE.PointLight(0xffaa44, 4, 60);
    vl.position.set(-37, 5, -16);
    scene.add(vl);
  },
  update(delta) {
    time += delta;
    lanternLights.forEach((l, i) => {
      l.intensity = 2.8 + Math.sin(time * 1.8 + i * 0.4) * 0.5;
    });
  }
};
