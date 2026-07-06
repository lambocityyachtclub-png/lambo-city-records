import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [], time = 0, frame = 0;
export default {
  init(scene) {
    // WARM AMBIENT
    scene.add(new THREE.AmbientLight(0xff8844, 1.2));

    // SUN — strong golden hour
    const sun = new THREE.DirectionalLight(0xff7722, 3.5);
    sun.position.set(120, 55, -20);
    scene.add(sun);

    // COOL PURPLE FILL — sky bounce
    const fill = new THREE.DirectionalLight(0x441166, 0.8);
    fill.position.set(-80, 50, 30);
    scene.add(fill);

    // GROUND BOUNCE — warms underside
    const bounce = new THREE.DirectionalLight(0xff5511, 0.4);
    bounce.position.set(0, -8, 0);
    scene.add(bounce);

    // DOCK LANTERNS — warm amber
    [-55,-45,-35,-25,-15,-5,5,15,22].forEach(z => {
      [-5.5, 5.5].forEach(x => {
        const l = new THREE.PointLight(0xffaa33, 3.5, 14);
        l.position.set(x, 3.8, z);
        scene.add(l);
        lanternLights.push(l);
      });
    });

    // TEAL WATER GLOW — wide
    const wc = new THREE.PointLight(0x00bbdd, 4, 150);
    wc.position.set(0, 0.5, -5);
    scene.add(wc);

    // VILLA POOL LIGHTS
    [8,-16,-40].forEach(z => {
      const vl = new THREE.PointLight(0x00aacc, 2.5, 22);
      vl.position.set(-37, 1, z+12);
      scene.add(vl);
      const wl = new THREE.PointLight(0xffaa44, 3, 20);
      wl.position.set(-37, 4, z+5);
      scene.add(wl);
    });

    // STAGE — powerful purple wash
    const sp = new THREE.PointLight(0x9900ff, 12, 160);
    sp.position.set(0, 24, -62);
    scene.add(sp);
    const sl = new THREE.PointLight(0xff00aa, 5, 90);
    sl.position.set(-22, 12, -68);
    scene.add(sl);
    const sr = new THREE.PointLight(0x0055ff, 5, 90);
    sr.position.set(22, 12, -68);
    scene.add(sr);

    // YACHT CYAN GLOW
    const yl = new THREE.PointLight(0x00ffff, 4, 55);
    yl.position.set(38, 4, -28);
    scene.add(yl);

    // BUILDING ROOFTOP GLOWS
    const bl = new THREE.PointLight(0x9900ff, 2, 40);
    bl.position.set(-65, 25, -45);
    scene.add(bl);
    const br = new THREE.PointLight(0xff00aa, 2, 40);
    br.position.set(65, 22, -45);
    scene.add(br);
  },
  update(delta) {
    time += delta;
    frame++;
    if (frame % 2 !== 0) return;
    lanternLights.forEach((l, i) => {
      l.intensity = 3.0 + Math.sin(time*1.8+i*0.4)*0.6;
    });
  }
};
