import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
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
    // DOCK LANTERNS — REMOVED (duplicate): dock.js builds the actual lantern meshes
    // and now owns its own (thinned) set of lantern PointLights. Having a second,
    // separate set of lantern lights here was doubling up on the same stretch of dock.
    // TEAL WATER GLOW — wide (kept: haven't seen water.js, don't want to risk the water going dark)
    const wc = new THREE.PointLight(0x00bbdd, 4, 150);
    wc.position.set(0, 0.5, -5);
    scene.add(wc);
    // VILLA POOL LIGHTS — REMOVED (redundant): world.js already gives the pool and
    // windows their own emissive materials, so the glow persists without these lights.
    // STAGE — powerful purple wash (kept: main gameplay focal point)
    const sp = new THREE.PointLight(0x9900ff, 12, 160);
    sp.position.set(0, 24, -62);
    scene.add(sp);
    const sl = new THREE.PointLight(0xff00aa, 5, 90);
    sl.position.set(-22, 12, -68);
    scene.add(sl);
    const sr = new THREE.PointLight(0x0055ff, 5, 90);
    sr.position.set(22, 12, -68);
    scene.add(sr);
    // YACHT CYAN GLOW — REMOVED (duplicate): yacht.js already builds its own cyan
    // PointLight directly on the yacht group, at essentially this same position.
    // BUILDING ROOFTOP GLOWS — REMOVED (redundant): world.js's skyline buildings already
    // have their own bright emissive rooftop neon strips (emissiveIntensity 2.5) plus
    // their own per-building PointLights.
  },
  update() {}
};
