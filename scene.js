import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌍 ENGINE WORLD INITIALIZATION
========================================================= */

engine.scene = new THREE.Scene();
engine.world = new THREE.Group();

engine.scene.add(engine.world);
