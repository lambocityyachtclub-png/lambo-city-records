import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let npcGroup;
let time = 0;
let crowdNPCs = [];

export default {
  init(scene) {
    this._buildHeroNPC(scene);
    this._buildCrowd(scene);
  },

  _buildHeroNPC(scene) {
    npcGroup = new THREE.Group();

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1a0a2e })
    );
    body.position.y = 1.8;
    npcGroup.add(body);

    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x8d5524 })
    );
    head.position.y = 3.15;
    npcGroup.add(head);

    var cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.25, 0.95),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    cap.position.y = 3.65;
    npcGroup.add(cap);

    var capBrim = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    capBrim.position.set(0, 3.52, 0.5);
    npcGroup.add(capBrim);

    [-0.8, 0.8].forEach(function(x) {
      var arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.4, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x1a0a2e })
      );
      arm.position.set(x, 1.8, 0);
      npcGroup.add(arm);
    });

    [-0.35, 0.35].forEach(function(x) {
      var leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 1.6, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      leg.position.set(x, 0.6, 0);
      npcGroup.add(leg);
    });

    var chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.04, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700,
        emissiveIntensity: 0.5, metalness: 1, roughness: 0.2
      })
    );
    chain.position.set(0, 2.1, 0.36);
    chain.rotation.x = Math.PI / 2;
    npcGroup.add(chain);

    var glow = new THREE.PointLight(0xffd700, 2, 8);
    glow.position.set(0, 2, 0);
    npcGroup.add(glow);

    npcGroup.position.set(3, 0.5, 6);
    npcGroup.rotation.y = Math.PI;
    scene.add(npcGroup);

    setTimeout(function() { showHeroDialogue(); }, 1800);
  },

  _buildCrowd(scene) {
    var colors = [
      0xff2200, 0x0044ff, 0x00aa44, 0xffaa00,
      0xaa00ff, 0xff0088, 0x00ffcc, 0xffffff
    ];

    for (var i = 0; i < 20; i++) {
      var npc = new THREE.Group();
      var color = colors[i % colors.length];

      var body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.5, 0.5),
        new THREE.MeshStandardMaterial({ color: color })
      );
      body.position.y = 1.5;
      npc.add(body);

      var head = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x8d5524 })
      );
      head.position.y = 2.65;
      npc.add(head);

      [-0.35, 0.35].forEach(function(x) {
        var leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 1.2, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        leg.position.set(x, 0.5, 0);
        npc.add(leg);
      });

      // SPREAD AROUND STAGE AREA
      var angle = (i / 20) * Math.PI * 2;
      var radius = 8 + Math.random() * 12;
      var x = Math.cos(angle) * radius;
      var z = -72 + Math.sin(angle) * 6;

      npc.position.set(x, 0.5, z);
      npc.rotation.y = Math.random() * Math.PI * 2;
      scene.add(npc);
      crowdNPCs.push({ mesh: npc, offset: Math.random() * Math.PI * 2 });
    }
  },

  update(delta) {
    time += delta;

    // HERO BOB
    if (npcGroup) {
      npcGroup.position.y = 0.5 + Math.sin(time * 1.2) * 0.05;
      npcGroup.rotation.y = Math.PI + Math.sin(time * 0.4) * 0.2;
    }

    // CROWD DANCE
    crowdNPCs.forEach(function(c) {
      c.mesh.position.y = 0.5 + Math.sin(time * 3 + c.offset) * 0.15;
      c.mesh.rotation.y += delta * 0.5;
    });
  }
};

function showHeroDialogue() {
  var box = document.createElement('div');
  box.style.cssText = `
    position:fixed;bottom:130px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.88);
    border:1px solid rgba(255,215,0,0.4);
    border-radius:12px;padding:18px 28px;
    color:white;font-family:Arial,sans-serif;
    max-width:460px;width:90%;z-index:200;
    box-shadow:0 0 30px rgba(153,0,255,0.3);
    text-align:center;pointer-events:all;
  `;
  box.innerHTML = `
    <div style="color:#ffd700;font-size:11px;letter-spacing:3px;margin-bottom:8px;">HERO</div>
    <div style="font-size:14px;line-height:1.7;color:#eee;">
      "Welcome to <span style="color:#ffd700;font-weight:bold;">Lambo City</span>.
      Walk the dock, reach the stage, earn your
      <span style="color:#ff00aa;font-weight:bold;">Boarding Pass</span>.
      Your legend starts now."
    </div>
    <button onclick="this.parentElement.remove()" style="
      margin-top:14px;
      background:linear-gradient(90deg,#9900ff,#ff00aa);
      border:none;border-radius:20px;color:white;
      padding:8px 24px;font-size:11px;letter-spacing:2px;cursor:pointer;
    ">LET'S GO →</button>
  `;
  document.body.appendChild(box);
}
