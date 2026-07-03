import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let heroMesh;
let crowdNPCs = [];
let time = 0;
let giftGiven = false;
export default {
  init(scene) {
    this._buildHero(scene);
    this._buildCrowd(scene);
  },
  _buildHero(scene) {
    heroMesh = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.8,0.7), new THREE.MeshStandardMaterial({color:0x0a0a0a}));
    body.position.y = 1.8;
    heroMesh.add(body);
    var logo = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.45,0.06), new THREE.MeshStandardMaterial({color:0xffd700,emissive:0xffd700,emissiveIntensity:0.8}));
    logo.position.set(0,1.9,0.38);
    heroMesh.add(logo);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.9,0.9), new THREE.MeshStandardMaterial({color:0x8d5524}));
    head.position.y = 3.15;
    heroMesh.add(head);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.95,0.25,0.95), new THREE.MeshStandardMaterial({color:0xffd700,emissive:0xffd700,emissiveIntensity:0.2}));
    cap.position.y = 3.65;
    heroMesh.add(cap);
    var brim = new THREE.Mesh(new THREE.BoxGeometry(1.1,0.08,0.5), new THREE.MeshStandardMaterial({color:0xffd700}));
    brim.position.set(0,3.52,0.5);
    heroMesh.add(brim);
    [-0.8,0.8].forEach(function(x) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.35,1.4,0.35), new THREE.MeshStandardMaterial({color:0x0a0a0a}));
      arm.position.set(x,1.8,0);
      heroMesh.add(arm);
    });
    [-0.35,0.35].forEach(function(x) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.45,1.6,0.45), new THREE.MeshStandardMaterial({color:0x111111}));
      leg.position.set(x,0.6,0);
      heroMesh.add(leg);
    });
    [-0.35,0.35].forEach(function(x) {
      var shoe = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.25,0.7), new THREE.MeshStandardMaterial({color:0xffffff}));
      shoe.position.set(x,-0.22,0.1);
      heroMesh.add(shoe);
    });
    var chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.25,0.04,6,12),
      new THREE.MeshStandardMaterial({color:0xffd700,emissive:0xffd700,emissiveIntensity:0.6,metalness:1,roughness:0.2})
    );
    chain.position.set(0,2.1,0.36);
    chain.rotation.x = Math.PI/2;
    heroMesh.add(chain);
    var glow = new THREE.PointLight(0xffd700,2,8);
    glow.position.set(0,2,0);
    heroMesh.add(glow);
    heroMesh.position.set(2.5,1.3,6);
    heroMesh.rotation.y = Math.PI;
    scene.add(heroMesh);
    setTimeout(function() { showHeroDialogue(); }, 1500);
  },
  _buildCrowd(scene) {
    var colors = [0xff2200,0x0044ff,0x00aa44,0xffaa00,0xaa00ff,0xff0088,0x00ffcc,0xffffff];
    for (var i = 0; i < 16; i++) {
      var npc = new THREE.Group();
      var color = colors[i % colors.length];
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.5,0.5), new THREE.MeshStandardMaterial({color:color}));
      body.position.y = 1.5;
      npc.add(body);
      var head = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.7,0.7), new THREE.MeshStandardMaterial({color:0x8d5524}));
      head.position.y = 2.65;
      npc.add(head);
      [-0.35,0.35].forEach(function(x) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.35,1.2,0.35), new THREE.MeshStandardMaterial({color:0x222222}));
        leg.position.set(x,0.5,0);
        npc.add(leg);
      });
      var angle = (i/16)*Math.PI*2;
      var radius = 6+Math.random()*10;
      npc.position.set(Math.cos(angle)*radius, 1.3, -72+Math.sin(angle)*5);
      npc.rotation.y = Math.random()*Math.PI*2;
      scene.add(npc);
      crowdNPCs.push({mesh:npc,offset:Math.random()*Math.PI*2});
    }
  },
  update(delta,context) {
    time += delta;
    if (heroMesh) {
      heroMesh.position.y = 1.3+Math.sin(time*1.2)*0.05;
      heroMesh.rotation.y = Math.PI+Math.sin(time*0.4)*0.15;
    }
    crowdNPCs.forEach(function(c) {
      c.mesh.position.y = 1.3+Math.sin(time*3+c.offset)*0.12;
      c.mesh.rotation.y += delta*0.4;
    });
    if (!giftGiven && context.player) {
      var dx = context.player.position.x-2.5;
      var dz = context.player.position.z-6;
      if (Math.sqrt(dx*dx+dz*dz) < 4) {
        giftGiven = true;
        showGiftPopup();
      }
    }
  }
};
function showHeroDialogue() {
  var box = document.createElement('div');
  box.style.cssText = `position:fixed;bottom:130px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.88);border:1px solid rgba(255,215,0,0.4);border-radius:12px;padding:18px 28px;color:white;font-family:Arial,sans-serif;max-width:460px;width:90%;z-index:200;box-shadow:0 0 30px rgba(153,0,255,0.3);text-align:center;pointer-events:all;`;
  box.innerHTML = `<div style="color:#ffd700;font-size:11px;letter-spacing:3px;margin-bottom:8px;">HERO</div><div style="font-size:14px;line-height:1.7;color:#eee;">"Welcome to <span style="color:#ffd700;font-weight:bold;">Lambo City</span>. Walk the dock, reach the Yacht Club, earn your <span style="color:#ff00aa;font-weight:bold;">Boarding Pass</span>."</div><button onclick="this.parentElement.remove()" style="margin-top:14px;background:linear-gradient(90deg,#9900ff,#ff00aa);border:none;border-radius:20px;color:white;padding:8px 24px;font-size:11px;letter-spacing:2px;cursor:pointer;">LET'S GO →</button>`;
  document.body.appendChild(box);
}
function showGiftPopup() {
  var gift = document.createElement('div');
  gift.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#0a0020,#1a0040);border:2px solid #ffd700;border-radius:16px;padding:28px 36px;color:white;text-align:center;z-index:500;pointer-events:all;box-shadow:0 0 60px rgba(255,215,0,0.4);`;
  gift.innerHTML = `<div style="font-size:32px;margin-bottom:10px;">🎁</div><div style="color:#ffd700;font-size:11px;letter-spacing:3px;margin-bottom:8px;">HERO GIFTED YOU</div><div style="font-size:18px;font-weight:bold;margin-bottom:6px;">LAMBO CITY HOODIE</div><div style="color:#aaa;font-size:11px;margin-bottom:16px;">Exclusive Lambo City Records merch.</div><button onclick="this.parentElement.remove()" style="background:linear-gradient(90deg,#9900ff,#ff00aa);border:none;border-radius:20px;color:white;padding:10px 28px;font-size:12px;letter-spacing:2px;cursor:pointer;">WEAR IT →</button>`;
  document.body.appendChild(gift);
}
