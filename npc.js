import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   👥 LAMBO CITY NPC SYSTEM (CROWD ENGINE CORE)
========================================================= */

const npcGroup = new THREE.Group();
engine.world.add(npcGroup);

engine.npcs = [];

/* =========================================================
   🧍 NPC CREATION FUNCTION
========================================================= */

function createNPC(x, z, color = 0x7aa6ff) {

  const npc = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.8, 0.8),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8
    })
  );

  npc.position.set(x, 0.9, z);

  /* simple AI state */
  npc.userData = {
    baseX: x,
    baseZ: z,
    speed: 0.01 + Math.random() * 0.02,
    offset: Math.random() * 1000
  };

  npcGroup.add(npc);
  engine.npcs.push(npc);

  return npc;
}

/* =========================================================
   🌆 NPC SPAWNING (DOCK + BOARDWALK POPULATION)
========================================================= */

for (let i = 0; i < 20; i++) {

  const x = (Math.random() - 0.5) * 80;
  const z = 50 + Math.random() * 800;

  createNPC(x, z);
}

/* =========================================================
   🚶 NPC UPDATE LOOP (SIMPLE LIFE SIMULATION)
========================================================= */

function updateNPCs() {

  const time = performance.now() * 0.001;

  for (let npc of engine.npcs) {

    const data = npc.userData;

    /* idle sway movement */
    npc.position.x =
      data.baseX + Math.sin(time + data.offset) * 0.5;

    npc.position.z =
      data.baseZ + Math.cos(time * data.speed) * 0.8;

    /* subtle breathing motion */
    npc.position.y =
      0.9 + Math.sin(time * 2 + data.offset) * 0.05;
  }
}

engine.updateNPCs = updateNPCs;
