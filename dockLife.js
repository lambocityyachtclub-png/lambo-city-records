// dockLife.js
// LAMBO CITY — ambient life along the existing central dock.
// Adds a small, bounded group of visitors without changing approved
// dock geometry, the player start, navigation, or the existing stage crowd.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const VISITORS = [
  { x: -3.8, z: -30, color: 0x263f66, line: "HERO is performing up ahead." },
  { x:  3.5, z: -22, color: 0x7a3445, line: "You can hear the stage from here." },
  { x: -3.2, z:  -8, color: 0x28634f, line: "Let's get a little closer." },
  { x:  3.7, z:   2, color: 0x80612e, line: "The waterfront looks incredible tonight." },
  { x: -3.5, z:  20, color: 0x59447d, line: "I heard HERO is putting on a show." },
  { x:  3.4, z:  27, color: 0x3e5962, line: "Meet you closer to the stage." }
];

const CHATTER = [
  "HERO is performing up ahead.",
  "You can hear the stage from here.",
  "Let's get a little closer.",
  "The waterfront looks incredible tonight.",
  "I heard HERO is putting on a show.",
  "Meet you closer to the stage.",
  "This is a great place to catch the music.",
  "The crowd is starting to gather."
];

let visitors = [];
let elapsed = 0;

function makeBubbleTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  drawBubble(ctx, text);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, ctx, texture };
}

function drawBubble(ctx, text) {
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = "rgba(10, 12, 18, 0.88)";
  ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 138, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7f3e8";
  ctx.font = "bold 27px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 78, 450);
}

function pickTarget(visitor) {
  // Stay on the existing 14-unit-wide central dock and well clear of its edges.
  return {
    x: THREE.MathUtils.clamp(visitor.homeX + (Math.random() - 0.5) * 5.8, -4.55, 4.55),
    z: THREE.MathUtils.clamp(visitor.homeZ + (Math.random() - 0.5) * 16, -36, 30)
  };
}

function createVisitor(scene, spec, index) {
  const root = new THREE.Group();
  root.name = "lamboCityDockVisitor_" + (index + 1);
  const outfit = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.78 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9a684b, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.85 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.35, 0.44), outfit);
  torso.position.y = 1.52;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), skin);
  head.position.y = 2.48;
  root.add(head);

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.position.set(-0.48, 2.0, 0);
  rightArm.position.set(0.48, 2.0, 0);
  [-1, 1].forEach((side, i) => {
    const limb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.76, 0.2), outfit);
    limb.position.y = -0.36;
    (i === 0 ? leftArm : rightArm).add(limb);
  });
  root.add(leftArm, rightArm);

  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.86, 0);
  rightLeg.position.set(0.2, 0.86, 0);
  [leftLeg, rightLeg].forEach(leg => {
    const limb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.78, 0.25), dark);
    limb.position.y = -0.38;
    leg.add(limb);
    root.add(leg);
  });

  const bubbleData = makeBubbleTexture(spec.line);
  const bubble = new THREE.Sprite(new THREE.SpriteMaterial({
    map: bubbleData.texture,
    transparent: true,
    depthWrite: false
  }));
  bubble.position.set(0, 3.55, 0);
  bubble.scale.set(3.4, 1.06, 1);
  bubble.visible = false;
  root.add(bubble);

  root.position.set(spec.x, 1.3, spec.z);
  root.rotation.y = spec.x < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(root);

  return {
    root, torso, leftArm, rightArm, leftLeg, rightLeg,
    bubble, bubbleData, homeX: spec.x, homeZ: spec.z,
    target: null, pause: 1 + Math.random() * 3,
    phase: index * 1.73, speechTimer: 2 + Math.random() * 7,
    speechRemaining: 0, stepTime: 0
  };
}

export default {
  init(scene) {
    visitors.forEach(visitor => scene.remove(visitor.root));
    visitors = VISITORS.map((spec, index) => createVisitor(scene, spec, index));
    elapsed = 0;
  },

  update(delta, context) {
    elapsed += delta;
    const collision = context?.systems?.collision;
    for (const visitor of visitors) {
      visitor.speechTimer -= delta;
      if (visitor.speechTimer <= 0) {
        const phrase = CHATTER[Math.floor(Math.random() * CHATTER.length)];
        drawBubble(visitor.bubbleData.ctx, phrase);
        visitor.bubbleData.texture.needsUpdate = true;
        visitor.bubble.visible = true;
        visitor.speechRemaining = 2.8;
        visitor.speechTimer = 8 + Math.random() * 10;
      }
      if (visitor.speechRemaining > 0) {
        visitor.speechRemaining -= delta;
        if (visitor.speechRemaining <= 0) visitor.bubble.visible = false;
      }

      visitor.pause -= delta;
      if (!visitor.target && visitor.pause <= 0) {
        visitor.target = pickTarget(visitor);
      }

      let walking = false;
      if (visitor.target) {
        const dx = visitor.target.x - visitor.root.position.x;
        const dz = visitor.target.z - visitor.root.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 0.18) {
          visitor.target = null;
          visitor.pause = 1.5 + Math.random() * 3.5;
        } else {
          const step = Math.min(distance, 1.05 * delta);
          const nx = visitor.root.position.x + dx / distance * step;
          const nz = visitor.root.position.z + dz / distance * step;
          const blocked = collision?.isBlocked?.(nx, nz, 0.34, 1.3);
          if (!blocked && nx >= -4.7 && nx <= 4.7 && nz >= -37 && nz <= 31) {
            visitor.root.position.x = nx;
            visitor.root.position.z = nz;
            visitor.root.rotation.y = Math.atan2(dx, dz);
            walking = true;
          } else {
            visitor.target = null;
            visitor.pause = 2;
          }
        }
      }

      visitor.stepTime += delta * (walking ? 8.2 : 1.3);
      const stride = walking ? Math.sin(visitor.stepTime) * 0.55 : Math.sin(visitor.stepTime) * 0.025;
      visitor.leftLeg.rotation.x = stride;
      visitor.rightLeg.rotation.x = -stride;
      visitor.leftArm.rotation.x = walking ? -stride * 0.55 : 0;
      visitor.rightArm.rotation.x = walking ? stride * 0.55 : 0;
      visitor.torso.rotation.z = walking ? Math.sin(visitor.stepTime * 0.5) * 0.035 : 0;
      visitor.root.position.y = 1.3 + (walking ? Math.abs(Math.sin(visitor.stepTime * 2)) * 0.035 : 0);
    }
  },

  getVisitors() {
    return visitors;
  }
};
