import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

/* =========================================================
   CAMERA
========================================================= */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 5, 10);

/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

/* =========================================================
   LIGHTING
========================================================= */

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

/* =========================================================
   TEST OBJECT (YOU MUST SEE THIS)
========================================================= */

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

scene.add(cube);

/* =========================================================
   ANIMATION LOOP
========================================================= */

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();

/* =========================================================
   RESIZE FIX
========================================================= */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
