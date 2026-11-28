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
    outfitStyle: ["streetwear", "classic", "minimal", "creative"].includes(source.outfit) ? source.outfit : "streetwear",
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
  const lip = material(THREE, 0x754b43, 0.82);
  const highlight = material(THREE, 0xffffff, 0.22);
  const stylized = design.form === "stylized";
  mesh(THREE, new THREE.SphereGeometry(0.42, 28, 22), skin, head, [0, 0, 0],
    stylized ? [1.04, 1.08, 0.98] : [0.94, 1.08, 0.92]);
  mesh(THREE, new THREE.SphereGeometry(0.27, 18, 14), skin, head, [0, -0.2, 0.055],
    stylized ? [0.92, 0.62, 0.86] : [0.82, 0.66, 0.78]);
  for (const side of [-1, 1]) {
    mesh(THREE, new THREE.SphereGeometry(0.075, 12, 10), skin, head, [side * 0.405, -0.015, 0]);
    mesh(THREE, new THREE.SphereGeometry(0.105, 12, 10), skin, head, [side * 0.245, -0.105, 0.29], [1, 0.72, 0.52]);
    mesh(THREE, new THREE.SphereGeometry(0.095, 12, 10), dark, head, [side * 0.16, 0.045, 0.355], [1.2, 0.9, 0.55]);
    mesh(THREE, new THREE.SphereGeometry(stylized ? 0.075 : 0.055, 14, 12), eyeWhite, head, [side * 0.16, 0.045, 0.385]);
    mesh(THREE, new THREE.SphereGeometry(0.035, 12, 10), iris, head, [side * 0.16, 0.045, 0.433]);
    mesh(THREE, new THREE.SphereGeometry(0.017, 10, 8), dark, head, [side * 0.16, 0.045, 0.452]);
    mesh(THREE, new THREE.SphereGeometry(0.012, 8, 6), highlight, head, [side * 0.175, 0.065, 0.466]);
    const upperLid = mesh(THREE, new THREE.SphereGeometry(0.085, 12, 8), skin, head, [side * 0.16, 0.112, 0.378], [1, 0.28, 0.48]);
    upperLid.rotation.z = side * -0.04;
    const brow = mesh(THREE, new THREE.CapsuleGeometry(0.018, 0.105, 3, 6), dark, head, [side * 0.16, 0.155, 0.365]);
    brow.rotation.z = side * -0.08;
  }
  mesh(THREE, new THREE.SphereGeometry(0.075, 14, 10), skin, head, [0, -0.075, 0.39], [0.66, 1.25, 0.72]);
  mesh(THREE, new THREE.SphereGeometry(0.021, 9, 7), dark, head, [-0.025, -0.105, 0.445]);
  mesh(THREE, new THREE.SphereGeometry(0.021, 9, 7), dark, head, [0.025, -0.105, 0.445]);
  mesh(THREE, new THREE.SphereGeometry(0.075, 12, 8), lip, head, [0, -0.245, 0.35], [1.05, 0.24, 0.5]);
  mesh(THREE, new THREE.SphereGeometry(0.035, 10, 8), skin, head, [0, -0.285, 0.345], [1.1, 0.16, 0.35]);
  addHair(THREE, head, design.hair, design.hairStyle);
  return head;
}

export function createCompanionAvatar(THREE, playerRoot, originalParts, initialCompanion = null) {
  const group = new THREE.Group();
  group.name = "aliveCompanionAvatar";
  playerRoot.add(group);

  const bodyMat = material(THREE, OUTFITS.streetwear, 0.68);
  const trimMat = material(THREE, ACCENTS.gold, 0.32, 0.45);
  const shirtMat = material(THREE, 0xe9e5dc, 0.82);
  const seamMat = material(THREE, 0x111318, 0.86);
  const skinMat = material(THREE, SKIN.medium, 0.82);
  const shoeMat = material(THREE, 0xf4f2ed, 0.62);
  const pantMat = material(THREE, 0x202126, 0.82);
  const metalMat = material(THREE, ACCENTS.gold, 0.2, 0.85);

  const torso = new THREE.Group();
  group.add(torso);
  mesh(THREE, new THREE.CapsuleGeometry(0.39, 0.68, 6, 14), bodyMat, torso, [0, 0, 0]);
  mesh(THREE, new THREE.SphereGeometry(0.43, 16, 12), bodyMat, torso, [0, 0.48, 0], [1.02, 0.58, 0.86]);
  mesh(THREE, new THREE.CylinderGeometry(0.32, 0.37, 0.28, 14), pantMat, torso, [0, -0.78, 0]);
  const wardrobe = new THREE.Group();
  wardrobe.name = "companionWardrobe";
  torso.add(wardrobe);
  const rebuildWardrobe = design => {
    wardrobe.traverse(item => item.geometry?.dispose?.());
    wardrobe.clear();
    const addPanel = (width, height, depth, mat, position, rotation = 0) => {
      const panel = mesh(THREE, new THREE.BoxGeometry(width, height, depth), mat, wardrobe, position);
      panel.rotation.z = rotation;
      return panel;
    };
    if (design.outfitStyle === "streetwear") {
      mesh(THREE, new THREE.SphereGeometry(0.34, 14, 10), bodyMat, wardrobe, [0, 0.38, -0.27], [1, 0.82, 0.55]);
      addPanel(0.46, 0.24, 0.055, bodyMat, [0, -0.34, 0.405]);
      addPanel(0.025, 0.58, 0.025, trimMat, [0, 0.04, 0.414]);
      for (const side of [-1, 1]) {
        const cord = mesh(THREE, new THREE.CylinderGeometry(0.012, 0.012, 0.26, 6), trimMat, wardrobe, [side * 0.07, 0.23, 0.43]);
        cord.rotation.z = side * -0.08;
      }
    } else if (design.outfitStyle === "classic") {
      addPanel(0.32, 0.82, 0.04, shirtMat, [0, 0.08, 0.378]);
      for (const side of [-1, 1]) {
        addPanel(0.16, 0.48, 0.045, trimMat, [side * 0.13, 0.38, 0.405], side * -0.22);
        addPanel(0.035, 0.94, 0.02, trimMat, [side * 0.29, 0.02, 0.36]);
      }
      addPanel(0.13, 0.1, 0.025, trimMat, [-0.22, 0.22, 0.414]);
      for (let button = 0; button < 3; button++) {
        mesh(THREE, new THREE.SphereGeometry(0.018, 7, 6), metalMat, wardrobe, [0, 0.2 - button * 0.16, 0.43]);
      }
    } else if (design.outfitStyle === "minimal") {
      addPanel(0.25, 0.88, 0.035, shirtMat, [0, 0.04, 0.38]);
      addPanel(0.018, 0.72, 0.02, seamMat, [0, 0.02, 0.406]);
      addPanel(0.18, 0.025, 0.02, trimMat, [0, -0.38, 0.405]);
    } else {
      addPanel(0.31, 0.8, 0.04, shirtMat, [0, 0.08, 0.378]);
      addPanel(0.22, 0.58, 0.05, trimMat, [-0.12, 0.23, 0.41], 0.24);
      addPanel(0.16, 0.38, 0.045, bodyMat, [0.16, -0.12, 0.415], -0.3);
      addPanel(0.12, 0.12, 0.035, metalMat, [0.22, 0.45, 0.42]);
    }
  };

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
    mesh(THREE, new THREE.SphereGeometry(0.125, 12, 10), skinMat, pivot, [0, -0.48, 0]);
    for (let finger = 0; finger < 4; finger++) {
      mesh(THREE, new THREE.CapsuleGeometry(0.018, 0.065, 3, 6), skinMat, pivot,
        [-0.075 + finger * 0.05, -0.59, 0.035 + (finger === 1 || finger === 2 ? 0.012 : 0)]);
    }
    const thumb = mesh(THREE, new THREE.CapsuleGeometry(0.022, 0.07, 3, 6), skinMat, pivot, [side * -0.115, -0.52, 0.045]);
    thumb.rotation.z = side * 0.72;
    mesh(THREE, new THREE.TorusGeometry(0.12, 0.025, 6, 12), trimMat, pivot, [0, -0.39, 0]);
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
    mesh(THREE, new THREE.BoxGeometry(0.29, 0.055, 0.47), seamMat, pivot, [0, -0.79, 0.18]);
    for (let lace = 0; lace < 3; lace++) {
      mesh(THREE, new THREE.BoxGeometry(0.11, 0.012, 0.018), trimMat, pivot, [0, -0.61 + lace * 0.045, 0.34]);
    }
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
    rebuildWardrobe(design);
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
  try {
    apply(initialCompanion);
    sync();
  } catch (error) {
    originals.forEach((part, index) => { part.visible = originalVisibility[index]; });
    disposeTree(group);
    group.removeFromParent();
    throw error;
  }

  let disposed = false;
  const restoreOriginals = () => {
    originals.forEach((part, index) => { part.visible = originalVisibility[index]; });
    if (!disposed) {
      disposed = true;
      disposeTree(group);
      group.removeFromParent();
    }
  };

  return {
    group,
    apply(companion) {
      if (disposed) throw new Error("Companion avatar has already been disposed.");
      return apply(companion);
    },
    sync() {
      if (!disposed) sync();
    },
    setHoodie(active) {
      if (disposed) return;
      hoodieActive = Boolean(active);
      hoodie.visible = hoodieActive;
      bodyMat.color.setHex(hoodieActive ? 0x1a0040 : currentDesign.outfit);
    },
    restoreOriginals
  };
}
