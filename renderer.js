import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);
