import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let npcMesh;
let bobTime = 0;

export default {
  init(scene) {
    npcMesh = new THREE.Group();

    // BODY
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
    );
    body.position.y = 1.8;
    npcMesh.add(body);

    // JACKET — gold trim
    const jacket = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 1.82, 0.72),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.15,
        wireframe: true
      })
    );
    jacket.position.y = 1.8;
    npcMesh.add(jacket);

    // HEAD
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x8d5524 })
    );
    head.position.y = 3.15;
    npcMesh.add(head);

    // CAP
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.25, 0.95),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    cap.position.y = 3.65;
    npcMesh.add(cap);

    // ARMS
    [-0.8, 0.8].forEach(function(x) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.4, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
      );
      arm.position.set(x, 1.8, 0);
      npcMesh.add(arm);
    });

    // LEGS
    [-0.35, 0.35].forEach(function(x) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 1.6, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      leg.position.set(x, 0.6, 0);
      npcMesh.add(leg);
    });

    // GOLD CHAIN
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.04, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        metalness: 1,
        roughness: 0.2
      })
    );
    chain.position.set(0, 2.1, 0.36);
    chain.rotation.x = Math.PI / 2;
    npcMesh.add(chain);

    // GLOW UNDER FEET
    const glow = new THREE.PointLight(0xffd700, 1.5, 6);
    glow.position.set(0, 0.5, 0);
    npcMesh.add(glow);

    // PLACE AT DOCK ENTRANCE — facing player
    npcMesh.position.set(3, 0.3, 6);
    npcMesh.rotation.y = Math.PI;
    scene.add(npcMesh);

    // SHOW WELCOME DIALOGUE after 1.5s
    setTimeout(function() {
      showDialogue();
    }, 1500);
  },

  update(delta) {
    if (!npcMesh) return;
    bobTime += delta;
    npcMesh.position.y = 0.3 + Math.sin(bobTime * 1.2) * 0.06;
    npcMesh.rotation.y = Math.PI + Math.sin(bobTime * 0.5) * 0.15;
  }
};

function showDialogue() {
  const box = document.createElement('div');
  box.id = 'hero-dialogue';
  box.style.cssText = `
    position:fixed;
    bottom:120px;
    left:50%;
    transform:translateX(-50%);
    background:rgba(0,0,0,0.85);
    border:1px solid rgba(255,215,0,0.4);
    border-radius:12px;
    padding:18px 28px;
    color:white;
    font-family:Arial,sans-serif;
    max-width:480px;
    width:90%;
    z-index:200;
    box-shadow:0 0 30px rgba(153,0,255,0.3);
    text-align:center;
    animation:fadeIn 0.5s ease;
  `;

  box.innerHTML = `
    <style>
      @keyframes fadeIn { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      @keyframes fadeOut { from{opacity:1} to{opacity:0} }
    </style>
    <div style="color:#ffd700;font-size:13px;letter-spacing:2px;margin-bottom:8px;">
      HERO
    </div>
    <div style="font-size:15px;line-height:1.6;color:#eee;">
      "Welcome to <span style="color:#ffd700;font-weight:bold;">Lambo City</span>. 
      This is where legends are made. Walk the dock, reach the stage — 
      your journey starts <span style="color:#ff00aa;">right here.</span>"
    </div>
    <div style="margin-top:14px;">
      <button onclick="nextDialogue()" style="
        background:linear-gradient(90deg,#9900ff,#ff00aa);
        border:none;border-radius:20px;
        color:white;padding:8px 24px;
        font-size:12px;letter-spacing:1px;
        cursor:pointer;
      ">LETS GO →</button>
    </div>
  `;

  document.body.appendChild(box);

  window.nextDialogue = function() {
    box.style.animation = 'fadeOut 0.4s ease forwards';
    setTimeout(function() {
      box.remove();
      showDialogue2();
    }, 400);
  };
}

function showDialogue2() {
  const box = document.createElement('div');
  box.style.cssText = `
    position:fixed;
    bottom:120px;
    left:50%;
    transform:translateX(-50%);
    background:rgba(0,0,0,0.85);
    border:1px solid rgba(255,215,0,0.4);
    border-radius:12px;
    padding:18px 28px;
    color:white;
    font-family:Arial,sans-serif;
    max-width:480px;
    width:90%;
    z-index:200;
    box-shadow:0 0 30px rgba(153,0,255,0.3);
    text-align:center;
    animation:fadeIn 0.5s ease;
  `;

  box.innerHTML = `
    <div style="color:#ffd700;font-size:13px;letter-spacing:2px;margin-bottom:8px;">HERO</div>
    <div style="font-size:15px;line-height:1.6;color:#eee;">
      "I came from nothing — no followers, no budget, no connections. 
      Now look at this city. <span style="color:#ffd700;">Every step forward is yours.</span> 
      Use <span style="color:#ff00aa;">WASD</span> to move. The stage is waiting."
    </div>
    <div style="margin-top:14px;">
      <button onclick="closeDialogue(this)" style="
        background:linear-gradient(90deg,#9900ff,#ff00aa);
        border:none;border-radius:20px;
        color:white;padding:8px 24px;
        font-size:12px;letter-spacing:1px;
        cursor:pointer;
      ">I'M READY →</button>
    </div>
  `;

  document.body.appendChild(box);

  window.closeDialogue = function(btn) {
    const el = btn.closest('div[style]');
    if (el) el.remove();
  };
}
