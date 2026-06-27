import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

engine.scene = new THREE.Scene();
engine.world = new THREE.Group();

engine.scene.add(engine.world);

/* =========================================================
   🌌 GLOBAL VISIBILITY SETUP
========================================================= */

engine.scene.fog = new THREE.Fog(0x0a0a0a, 200, 2000);

engine.scene.background = new THREE.Color(0x05070a);
