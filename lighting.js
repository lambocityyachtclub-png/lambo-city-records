import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let neonLights = [];
let time = 0;

export default {
  init(scene) {
    // AMBIENT
    const ambient = new THREE.AmbientLight(0xff6030, 0.3);
    scene.add(ambient);

    // SUN — golden hour
    const sun = new THREE.DirectionalLight(0xff8844, 2.0);
    sun.position.set(60, 80, -100);
    scene.add(sun);

    // FILL LIGHT — cool side
    const fill = new THREE.DirectionalLight(0x4488ff, 0.4);
    fill.position.set(-60, 30, 60);
    scene.add(fill);

    // NEON POINT LIGHTS along dock
    const neonColors = [0x9900ff, 0x00ffff, 0xff00aa, 0x9900ff];
    const positions = [-15, -5, 5, 15];
    positions.forEach((x, i) => {
      const light = new THREE.PointLight(neonColors[i % neonColors.length], 2, 18);
      light.position.set(x, 1.5, 0);
      scene.add(light);
      neonLights.push(light);
    });

    // STAGE SPOT LIGHTS
    const spotColors = [0xff00ff, 0x00ffff, 0xffff00];
    spotColors.forEach((color, i) => {
      const spot = new THREE.SpotLight(color, 8, 120, Math.PI / 10, 0.4);
      spot.position.set(-10 + i * 10, 30, -60);
      spot.target.position.set(-10 + i * 10, 0, -40);
      scene.add(spot);
      scene.add(spot.target);
    });
  },
  update(delta) {
    time += delta;
    neonLights.forEach((light, i) => {
      light.intensity = 1.5 + Math.sin(time * 2 + i) * 0.8;
    });
  }
};
