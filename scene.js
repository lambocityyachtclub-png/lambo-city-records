import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* FORCE SCENE */
engine.scene = new THREE.Scene();

/* LIGHT */
engine.scene.add(new THREE.AmbientLight(0xffffff, 1));
engine.scene.add(new THREE.DirectionalLight(0xffffff, 2));

/* ATTACH WORLD ROOT */
engine.scene.add(engine.world);
