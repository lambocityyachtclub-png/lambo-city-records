import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

// Example NPC (we'll expand later)
const npc = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 1.8, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x8888ff })
);

npc.position.set(0, 0.9, 0);
engine.world.add(npc);

// In a real game, we'd animate NPCs or have them walk around, but for now, we just ensure they load so no error stops the chain.
