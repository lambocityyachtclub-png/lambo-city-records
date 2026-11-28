const SKIN = Object.freeze({
  porcelain: 0xf0d6c2, light: 0xd8a27e, medium: 0xb87952, tan: 0x99613f, deep: 0x5a3528
});
const HAIR = Object.freeze({ black: 0x171411, brown: 0x4a2c1d, blonde: 0xc7a45d, auburn: 0x783b27, silver: 0xaeb4bb });
const EYES = Object.freeze({ brown: 0x59331f, blue: 0x4b8fbf, green: 0x4f8766, hazel: 0x9b7b42, gray: 0x929ba3 });
const OUTFITS = Object.freeze({ streetwear: 0x1b1b1f, classic: 0x34302a, minimal: 0x50545a, creative: 0x253b55 });
const ACCENTS = Object.freeze({ gold: 0xffd700, blue: 0x4d91d8, violet: 0x9565c9, silver: 0xb9c2cc });

export function resolveCompanionAvatarDesign(companion) {
  const source = companion?.appearanceProfile && typeof companion.appearanceProfile === "object"
    ? companion.appearanceProfile : {};
  const form = companion?.characterForm === "stylized" ? "stylized" : "digital-human";
  return Object.freeze({
    form,
    skin: SKIN[source.skinTone] ?? SKIN.medium,
    hair: HAIR[source.hairColor] ?? HAIR.black,
    eyes: EYES[source.eyeColor] ?? EYES.brown,
    hairStyle: ["short", "curly", "long", "braids", "buzz", "none"].includes(source.hairStyle) ? source.hairStyle : "short",
    outfit: OUTFITS[source.outfit] ?? OUTFITS.streetwear,
    accent: ACCENTS[source.accentColor] ?? ACCENTS.gold
  });
}

function disposeTree(root) {
  root.traverse(item => {
    item.geometry?.dispose?.();
    if (Array.isArray(item.material)) item.material.forEach(entry => entry.dispose?.());
    else item.material?.dispose?.();
  });
}

function material(THREE, color, roughness = 0.72, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function mesh(THREE, geometry, mat, parent, position = [0, 0, 0], scale = null) {
  const item = new THREE.Mesh(geometry, mat);
  item.position.set(...position);
  if (scale) item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function addHair(THREE, head, color, style) {
  if (style === "none") return;
  const hairMat = material(THREE, color, 0.86);
  const cap = mesh(THREE, new THREE.SphereGeometry(0.435, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat, head, [0, 0.12, -0.015], [1.02, 0.94, 1.02]);
  if (style === "buzz") {
    cap.scale.set(1.01, 0.83, 1.01);
    return;
  }
  if (style === "short") {
    mesh(THREE, new THREE.SphereGeometry(0.19, 12, 10), hairMat, head, [0, 0.25, 0.31], [1.65, 0.42, 0.7]);
    return;
  }
  if (style === "curly") {
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      mesh(THREE, new THREE.SphereGeometry(0.115, 10, 8), hairMat, head,
        [Math.cos(angle) * 0.31, 0.28 + (i % 2) * 0.045, Math.sin(angle) * 0.28]);
    }
    return;
  }
  if (style === "long") {
    mesh(THREE, new THREE.CapsuleGeometry(0.14, 0.72, 4, 8), hairMat, head, [0, -0.35, -0.28]);
    mesh(THREE, new THREE.CapsuleGeometry(0.105, 0.62, 4, 8), hairMat, head, [-0.31, -0.24, -0.05]);
    mesh(THREE, new THREE.CapsuleGeometry(0.105, 0.62, 4, 8), hairMat, head, [0.31, -0.24, -0.05]);
    return;
  }
  if (style === "braids") {
    for (let i = -2; i <= 2; i++) {
      const braid = mesh(THREE, new THREE.CapsuleGeometry(0.055, 0.72, 4, 7), hairMat, head,
        [i * 0.14, -0.42, -0.24 + Math.abs(i) * 0.035]);
      braid.rotation.z = i * 0.07;
      mesh(THREE, new THREE.SphereGeometry(0.065, 8, 7), material(THREE, 0xd8b475, 0.5, 0.25), braid, [0, -0.39, 0]);
    }
  }
}

function createHead(THREE, parent, design) {
  const head = new THREE.Group();
  parent.add(head);
  const skin = material(THREE, design.skin, 0.82);
  const eyeWhite = material(THREE, 0xf1eee8, 0.38);
  const iris = material(THREE, design.eyes, 0.32);
  const dark = material(THREE, 0x211b19, 0.78);
  const stylized = design.form === "stylized";
  mesh(THREE, new THREE.SphereGeometry(0.42, 24, 20), skin, head, [0, 0, 0],
    stylized ? [1.04, 1.08, 0.98] : [0.94, 1.08, 0.92]);
  for (const side of [-1, 1]) {
    mesh(THREE, new THREE.SphereGeometry(0.075, 10, 8), skin, head, [side * 0.41, -0.015, 0]);
    mesh(THREE, new THREE.SphereGeometry(stylized ? 0.075 : 0.055, 12, 10), eyeWhite, head, [side * 0.16, 0.045, 0.365]);
    mesh(THREE, new THREE.SphereGeometry(0.035, 10, 8), iris, head, [side * 0.16, 0.045, 0.412]);
    mesh(THREE, new THREE.SphereGeometry(0.017, 8, 6), dark, head, [side * 0.16, 0.045, 0.43]);
    const brow = mesh(THREE, new THREE.BoxGeometry(0.14, 0.025, 0.035), dark, head, [side * 0.16, 0.14, 0.37]);
    brow.rotation.z = side * -0.08;
  }
  mesh(THREE, new THREE.SphereGeometry(0.065, 10, 8), skin, head, [0, -0.075, 0.385], [0.72, 0.9, 0.75]);
  mesh(THREE, new THREE.BoxGeometry(0.14, 0.018, 0.025), dark, head, [0, -0.22, 0.365]);
  addHair(THREE, head, design.hair, design.hairStyle);
  return head;
}

export function createCompanionAvatar(THREE, playerRoot, originalParts, initialCompanion = null) {
  const group = new THREE.Group();
  group.name = "aliveCompanionAvatar";
  playerRoot.add(group);

  const bodyMat = material(THREE, OUTFITS.streetwear, 0.68);
  const trimMat = material(THREE, ACCENTS.gold, 0.32, 0.45);
  const skinMat = material(THREE, SKIN.medium, 0.82);
  const shoeMat = material(THREE, 0xf4f2ed, 0.62);
  const pantMat = material(THREE, 0x202126, 0.82);
  const metalMat = material(THREE, ACCENTS.gold, 0.2, 0.85);

  const torso = new THREE.Group();
  group.add(torso);
  mesh(THREE, new THREE.CylinderGeometry(0.37, 0.49, 1.45, 16, 1), bodyMat, torso, [0, 0, 0]);
  mesh(THREE, new THREE.SphereGeometry(0.43, 16, 12), bodyMat, torso, [0, 0.48, 0], [1.02, 0.58, 0.86]);
  mesh(THREE, new THREE.CylinderGeometry(0.32, 0.37, 0.28, 14), pantMat, torso, [0, -0.78, 0]);
  for (const side of [-1, 1]) {
    mesh(THREE, new THREE.BoxGeometry(0.035, 0.95, 0.018), trimMat, torso, [side * 0.29, 0.02, 0.355]);
  }
  mesh(THREE, new THREE.BoxGeometry(0.16, 0.22, 0.035), trimMat, torso, [0, -0.08, 0.39]);

  const neck = mesh(THREE, new THREE.CylinderGeometry(0.14, 0.17, 0.26, 12), skinMat, group, [0, 2.58, 0]);
  const head = createHead(THREE, group, resolveCompanionAvatarDesign(initialCompanion));
  head.position.set(0, 3.15, 0);

  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.8, 1.8, 0);
    group.add(pivot);
    mesh(THREE, new THREE.SphereGeometry(0.19, 12, 10), bodyMat, pivot, [0, 0.52, 0]);
    mesh(THREE, new THREE.CylinderGeometry(0.135, 0.115, 0.78, 12), bodyMat, pivot, [0, 0, 0]);
    mesh(THREE, new THREE.SphereGeometry(0.125, 10, 8), skinMat, pivot, [0, -0.48, 0]);
    arms.push(pivot);
  }

  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.35, 0.6, 0);
    group.add(pivot);
    mesh(THREE, new THREE.CylinderGeometry(0.19, 0.15, 1.3, 12), pantMat, pivot, [0, 0, 0]);
    mesh(THREE, new THREE.SphereGeometry(0.17, 10, 8), shoeMat, pivot, [0, -0.67, 0.18], [1, 0.58, 1.55]);
    mesh(THREE, new THREE.BoxGeometry(0.28, 0.035, 0.46), shoeMat, pivot, [0, -0.76, 0.18]);
    legs.push(pivot);
  }

  const chain = mesh(THREE, new THREE.TorusGeometry(0.24, 0.035, 8, 18), metalMat, group, [0, 2.08, 0.38]);
  chain.rotation.x = Math.PI / 2;
  const pendant = mesh(THREE, new THREE.BoxGeometry(0.16, 0.2, 0.045), trimMat, group, [0, 1.91, 0.43]);
  const hoodie = mesh(THREE, new THREE.SphereGeometry(0.08, 8, 6), trimMat, torso, [0, 0.42, -0.32]);
  hoodie.visible = false;
  let hoodieActive = false;
  let currentDesign = resolveCompanionAvatarDesign(initialCompanion);

  const originals = Object.values(originalParts).flat().filter(Boolean);
  const originalVisibility = originals.map(part => part.visible);
  const apply = companion => {
    const design = resolveCompanionAvatarDesign(companion);
    currentDesign = design;
    bodyMat.color.setHex(hoodieActive ? 0x1a0040 : design.outfit);
    trimMat.color.setHex(design.accent);
    trimMat.emissive?.setHex(design.accent);
    metalMat.color.setHex(design.accent);
    skinMat.color.setHex(design.skin);
    for (const arm of arms) {
      arm.children.forEach(child => {
        if (child.material === bodyMat) child.material = bodyMat;
      });
    }
    disposeTree(head);
    head.clear();
    const nextHead = createHead(THREE, group, design);
    nextHead.position.copy(head.position);
    group.remove(head);
    // Keep the head node stable for pose syncing.
    head.add(...nextHead.children.slice());
    group.add(head);
    group.remove(nextHead);
    head.scale.setScalar(design.form === "stylized" ? 1.04 : 1);
    return design;
  };

  const sync = () => {
    if (originalParts.body) torso.position.copy(originalParts.body.position);
    if (originalParts.head) head.position.copy(originalParts.head.position);
    arms.forEach((pivot, index) => {
      const source = originalParts.arms?.[index];
      if (source) { pivot.position.copy(source.position); pivot.rotation.copy(source.rotation); }
    });
    legs.forEach((pivot, index) => {
      const source = originalParts.legs?.[index];
      if (source) { pivot.position.copy(source.position); pivot.rotation.copy(source.rotation); }
    });
    if (originalParts.chain) chain.position.copy(originalParts.chain.position);
    if (originalParts.logo) pendant.position.copy(originalParts.logo.position);
  };

  originals.forEach(part => { part.visible = false; });
  apply(initialCompanion);
  sync();

  return {
    group,
    apply,
    sync,
    setHoodie(active) {
      hoodieActive = Boolean(active);
      hoodie.visible = hoodieActive;
      bodyMat.color.setHex(hoodieActive ? 0x1a0040 : currentDesign.outfit);
    },
    restoreOriginals() {
      originals.forEach((part, index) => { part.visible = originalVisibility[index]; });
      group.removeFromParent();
    }
  };
}
