// LAMBO CITY — HERO character visual
// Three.js r160 compatible. The parent NPC group owns world position/rotation.
// This module creates visuals only; it does not create lights, controls, or world logic.

export function createHeroModel(THREE) {
  if (!THREE) throw new Error("Three.js is required to build HERO.");

  const hero = new THREE.Group();
  hero.name = "HERO_visual";

  const mat = (color, roughness = 0.8, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  const skin = mat("#7A4B2F", 0.72);
  const hair = mat("#1A1210", 0.88);
  const capMat = mat("#14307A", 0.72);
  const orange = mat("#E4452A", 0.92);
  const shirt = mat("#F2F2F2", 0.82);
  const denim = mat("#1B3A6B", 0.88);
  const white = mat("#F4F4F4", 0.48);
  const frameWhite = mat("#FFFFFF", 0.22);
  const black = mat("#0A0A0A", 0.28);
  const gold = new THREE.MeshStandardMaterial({
    color: "#D4A82A", metalness: 0.9, roughness: 0.25
  });
  const seam = mat("#B99A6B", 0.9);
  const darkStrap = mat("#171717", 0.65);

  const addMesh = (parent, geometry, material, position, name) => {
    const mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(position[0], position[1], position[2]);
    if (name) mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const sphere = (parent, material, position, scale, name, segments = 12) => {
    const mesh = addMesh(parent,
      new THREE.SphereGeometry(1, segments, Math.max(8, segments - 2)),
      material, position, name);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    return mesh;
  };
  const box = (parent, material, position, size, name, bevel = false) => {
    const geometry = bevel && THREE.BoxGeometry
      ? new THREE.BoxGeometry(size[0], size[1], size[2], 1, 1, 1)
      : new THREE.BoxGeometry(size[0], size[1], size[2]);
    return addMesh(parent, geometry, material, position, name);
  };
  const rodBetween = (parent, material, a, b, radius, name, radial = 7) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const delta = new THREE.Vector3().subVectors(end, start);
    const mesh = addMesh(parent,
      new THREE.CylinderGeometry(radius * 0.82, radius, delta.length(), radial),
      material, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], name);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return mesh;
  };
  const makeTextTexture = (lines, options = {}) => {
    const canvas = document.createElement("canvas");
    canvas.width = options.width || 512;
    canvas.height = options.height || 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = options.color || "#FFFFFF";
    ctx.font = options.font || "900 90px Arial";
    const lineGap = options.lineGap || 86;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineGap) / 2;
    lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, startY + i * lineGap));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    return texture;
  };

  // Lower body: named pivots are retained for future animation.
  const pelvis = new THREE.Group();
  pelvis.name = "pelvis";
  pelvis.position.set(0, 1.9, 0);
  hero.add(pelvis);
  sphere(pelvis, denim, [0, 0.02, 0], [0.39, 0.31, 0.25], "jean_hips");

  const makeLeg = (side, label) => {
    const x = side * 0.22;
    const thigh = new THREE.Group();
    thigh.name = label === "L" ? "thighL" : "thighR";
    thigh.position.set(x, 0, 0);
    pelvis.add(thigh);
    const thighMesh = addMesh(thigh, new THREE.CylinderGeometry(0.17, 0.145, 0.91, 9),
      denim, [0, -0.46, 0], "denim_thigh");
    thighMesh.rotation.z = side * -0.025;
    sphere(thigh, denim, [0, -0.88, 0], [0.15, 0.16, 0.15], "knee_fold");

    const shin = new THREE.Group();
    shin.name = label === "L" ? "shinL" : "shinR";
    shin.position.set(0, -0.9, 0);
    thigh.add(shin);
    addMesh(shin, new THREE.CylinderGeometry(0.13, 0.115, 0.78, 9),
      denim, [0, -0.39, 0], "denim_shin");
    sphere(shin, denim, [0, -0.76, 0.01], [0.13, 0.11, 0.14], "ankle_fold");

    const foot = new THREE.Group();
    foot.name = label === "L" ? "footL" : "footR";
    foot.position.set(0, -0.78, 0.035);
    shin.add(foot);
    // Sole at local y=-0.20; top of shoe at roughly ankle height.
    box(foot, white, [0, -0.145, 0.12], [0.27, 0.11, 0.62], "white_rubber_sole");
    sphere(foot, white, [0, -0.075, 0.18], [0.135, 0.105, 0.25], "sneaker_toe", 12);
    box(foot, white, [0, -0.055, -0.035], [0.235, 0.17, 0.30], "sneaker_upper");
    // Laces and tongue.
    for (let i = 0; i < 4; i++) {
      rodBetween(foot, seam, [-0.07, 0.015, 0.04 + i * 0.055],
        [0.07, 0.015, 0.04 + i * 0.055], 0.008, "lace");
    }
    rodBetween(foot, white, [side * 0.118, -0.015, -0.04],
      [side * 0.125, 0.005, 0.17], 0.012, "side_detail");
    foot.rotation.y = side * -0.09;
  };
  makeLeg(-1, "R");
  makeLeg(1, "L");

  // Torso and open hoodie.
  const torso = new THREE.Group();
  torso.name = "torso";
  torso.position.set(0, 2.2, 0);
  hero.add(torso);
  sphere(torso, shirt, [0, 0.48, 0], [0.49, 0.64, 0.245], "white_tee");
  sphere(torso, skin, [0, 0.99, 0], [0.18, 0.18, 0.17], "neck");
  // Open jacket sides, shoulders and back panel.
  sphere(torso, orange, [0, 0.51, -0.13], [0.57, 0.62, 0.27], "hoodie_back");
  for (const side of [-1, 1]) {
    const panel = sphere(torso, orange, [side * 0.34, 0.48, 0.11],
      [0.19, 0.58, 0.18], "open_hoodie_front");
    panel.rotation.z = side * -0.08;
    box(torso, gold, [side * 0.29, 0.48, 0.275], [0.018, 0.91, 0.018], "zipper_edge");
    // Drawstring and gold tip.
    rodBetween(torso, orange, [side * 0.09, 0.91, 0.24],
      [side * 0.12, 0.55, 0.25], 0.012, "hoodie_drawstring");
    sphere(torso, gold, [side * 0.12, 0.54, 0.25], [0.018, 0.035, 0.018], "drawstring_tip", 8);
    // Angled kangaroo pocket detail on each open front panel.
    const pocket = box(torso, orange, [side * 0.31, 0.16, 0.27],
      [0.22, 0.14, 0.035], "hoodie_pocket");
    pocket.rotation.z = side * 0.12;
    // Sleeve pivot, upper arm and forearm.
    const armName = side > 0 ? "armL" : "armR";
    const foreName = side > 0 ? "forearmL" : "forearmR";
    const handName = side > 0 ? "handL" : "handR";
    const arm = new THREE.Group();
    arm.name = armName;
    arm.position.set(side * 0.52, 0.88, 0);
    torso.add(arm);
    const upper = addMesh(arm, new THREE.CylinderGeometry(0.125, 0.14, 0.64, 9),
      orange, [side * 0.035, -0.32, 0], "hoodie_upper_sleeve");
    upper.rotation.z = side * -0.16;
    sphere(arm, orange, [side * 0.08, -0.62, 0], [0.13, 0.14, 0.13], "elbow_fold");
    const fore = new THREE.Group();
    fore.name = foreName;
    fore.position.set(side * 0.08, -0.62, 0);
    arm.add(fore);
    const lower = addMesh(fore, new THREE.CylinderGeometry(0.105, 0.12, 0.57, 9),
      orange, [side * 0.025, -0.285, 0], "hoodie_forearm");
    lower.rotation.z = side * -0.08;
    // Ribbed cuff.
    const cuff = addMesh(fore, new THREE.CylinderGeometry(0.11, 0.11, 0.12, 9),
      orange, [side * 0.035, -0.59, 0], "ribbed_cuff");
    cuff.rotation.z = side * -0.08;
    for (let rib = 0; rib < 3; rib++) {
      rodBetween(fore, seam, [side * -0.065, -0.55 - rib * 0.025, 0.055],
        [side * 0.13, -0.55 - rib * 0.025, 0.055], 0.004, "cuff_rib", 5);
    }
    const hand = new THREE.Group();
    hand.name = handName;
    hand.position.set(side * 0.035, -0.66, 0);
    fore.add(hand);
    sphere(hand, skin, [0, -0.075, 0.015], [0.095, 0.13, 0.07], "hand_palm");
    // Four relaxed fingers and a separate thumb, all visible.
    for (let finger = 0; finger < 4; finger++) {
      const fx = (finger - 1.5) * 0.042;
      rodBetween(hand, skin, [fx, -0.13, 0.025],
        [fx + side * 0.008, -0.28 + Math.abs(finger - 1.5) * 0.018, 0.045],
        0.018, "finger", 6);
    }
    rodBetween(hand, skin, [side * -0.075, -0.06, 0.015],
      [side * -0.13, -0.18, 0.055], 0.022, "thumb", 6);

    // Gold ring on HERO's own left hand (+X).
    if (side > 0) {
      const ring = addMesh(hand, new THREE.TorusGeometry(0.022, 0.006, 5, 9),
        gold, [0.052, -0.13, 0.065], "gold_signet_ring");
      ring.rotation.x = Math.PI / 2;
      // Watch on HERO's own left wrist (+X).
      const watch = addMesh(fore, new THREE.CylinderGeometry(0.074, 0.074, 0.045, 12),
        darkStrap, [side * 0.035, -0.53, 0], "watch_strap");
      watch.rotation.z = Math.PI / 2;
      const bezel = addMesh(fore, new THREE.CylinderGeometry(0.052, 0.052, 0.025, 12),
        gold, [side * 0.035, -0.53, 0.045], "gold_watch_bezel");
      bezel.rotation.z = Math.PI / 2;
    }
  }

  // Hood down, bunched behind the neck.
  const hood = sphere(torso, orange, [0, 0.96, -0.24], [0.43, 0.19, 0.16], "hood_down");
  hood.rotation.x = -0.12;
  sphere(torso, orange, [0, 0.81, -0.29], [0.34, 0.12, 0.13], "hood_fold");

  // Hoodie ribbed hem at the hip line.
  box(torso, orange, [0, -0.19, 0], [0.98, 0.13, 0.49], "hoodie_waistband");
  // Small gold zipper pull.
  sphere(torso, gold, [0, -0.22, 0.29], [0.025, 0.045, 0.012], "zipper_pull", 8);

  // Head pivot at the requested head height.
  const head = new THREE.Group();
  head.name = "head";
  head.position.set(0, 3.45, 0);
  hero.add(head);
  sphere(head, skin, [0, 0.22, 0], [0.205, 0.26, 0.205], "face", 16);
  // Jaw and chin.
  sphere(head, skin, [0, 0.075, 0.025], [0.17, 0.12, 0.17], "strong_jaw", 12);
  // Nose, mustache and neat goatee.
  sphere(head, skin, [0, 0.205, 0.19], [0.045, 0.07, 0.045], "nose", 8);
  rodBetween(head, hair, [-0.075, 0.12, 0.19], [0.075, 0.12, 0.19], 0.018, "mustache", 7);
  sphere(head, hair, [0, 0.045, 0.17], [0.055, 0.065, 0.035], "goatee", 10);

  // Ears partly hidden by the locs.
  sphere(head, skin, [-0.205, 0.22, 0], [0.045, 0.075, 0.055], "ear", 8);
  sphere(head, skin, [0.205, 0.22, 0], [0.045, 0.075, 0.055], "ear", 8);

  // 20 slim dreadlocks arranged around the skull; front locs frame the cheeks.
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = Math.sin(angle) * 0.205;
    const z = Math.cos(angle) * 0.17;
    const length = 0.47 + (i % 4) * 0.035;
    const outward = Math.sin(angle) * 0.045;
    const loc = rodBetween(head, hair,
      [x, 0.43, z],
      [x + outward, 0.43 - length, z + (z > 0 ? 0.035 : -0.025)],
      0.026, "dreadlock", 6);
    sphere(head, hair,
      [x + outward, 0.43 - length, z + (z > 0 ? 0.035 : -0.025)],
      [0.026, 0.032, 0.026], "loc_tip", 6);
    loc.rotation.z += outward * 0.2;
  }

  // Blue fitted cap and forward visor.
  const crown = sphere(head, capMat, [0, 0.49, -0.005], [0.235, 0.145, 0.22], "blue_cap_crown", 14);
  box(head, capMat, [0, 0.405, 0.015], [0.46, 0.055, 0.43], "cap_band");
  const brim = addMesh(head, new THREE.SphereGeometry(1, 14, 8), capMat,
    [0, 0.405, 0.255], "cap_brim");
  brim.scale.set(0.245, 0.025, 0.18);
  // Front gold hexagon outline and HERO H mark.
  const hex = new THREE.Shape();
  hex.moveTo(0, 0.055); hex.lineTo(0.05, 0.028); hex.lineTo(0.05, -0.028);
  hex.lineTo(0, -0.055); hex.lineTo(-0.05, -0.028); hex.lineTo(-0.05, 0.028);
  hex.closePath();
  const hexLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    hex.getPoints(6).map(p => new THREE.Vector3(p.x, p.y, 0))
  ), gold);
  hexLine.position.set(0, 0.49, 0.218);
  head.add(hexLine);
  const hTexture = makeTextTexture(["H"], { width: 128, height: 128, font: "900 90px Arial" });
  const hMark = addMesh(head, new THREE.PlaneGeometry(0.065, 0.075),
    new THREE.MeshBasicMaterial({ map: hTexture, transparent: true, side: THREE.DoubleSide }),
    [0, 0.49, 0.221], "cap_H_logo");
  // Small white patch on rear cap.
  box(head, frameWhite, [0, 0.405, -0.218], [0.065, 0.035, 0.012], "rear_cap_patch");

  // Chunky white wayfarer sunglasses, black lenses and printed lens lettering.
  for (const side of [-1, 1]) {
    box(head, frameWhite, [side * 0.105, 0.23, 0.205], [0.205, 0.105, 0.045], "white_wayfarer_frame");
    box(head, black, [side * 0.105, 0.23, 0.231], [0.15, 0.065, 0.012], "black_sunglass_lens");
    rodBetween(head, frameWhite, [side * 0.19, 0.25, 0.20],
      [side * 0.28, 0.21, -0.10], 0.012, "sunglass_temple", 6);
  }
  const lamboTexture = makeTextTexture(["LAMBO"], {
    width: 512, height: 128, font: "900 72px Arial"
  });
  const heroTexture = makeTextTexture(["HERO"], {
    width: 512, height: 128, font: "900 82px Arial"
  });
  addMesh(head, new THREE.PlaneGeometry(0.14, 0.035),
    new THREE.MeshBasicMaterial({ map: lamboTexture, transparent: true, side: THREE.DoubleSide }),
    [-0.105, 0.23, 0.24], "LAMBO_lens_text");
  addMesh(head, new THREE.PlaneGeometry(0.14, 0.035),
    new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true, side: THREE.DoubleSide }),
    [0.105, 0.23, 0.24], "HERO_lens_text");

  // Cuban-link chain: curved gold strand around the neck and down in a V.
  const chainPoints = [
    new THREE.Vector3(-0.23, 3.13, 0.12),
    new THREE.Vector3(-0.18, 3.02, 0.22),
    new THREE.Vector3(-0.10, 2.91, 0.29),
    new THREE.Vector3(0, 2.86, 0.31),
    new THREE.Vector3(0.10, 2.91, 0.29),
    new THREE.Vector3(0.18, 3.02, 0.22),
    new THREE.Vector3(0.23, 3.13, 0.12)
  ];
  const chainCurve = new THREE.CatmullRomCurve3(chainPoints);
  addMesh(hero, new THREE.TubeGeometry(chainCurve, 32, 0.035, 7, false),
    gold, [0, 0, 0], "gold_cuban_chain");
  // Link accents placed along the chain curve.
  for (let i = 0; i < 17; i++) {
    const p = chainCurve.getPoint(i / 16);
    const link = addMesh(hero, new THREE.TorusGeometry(0.035, 0.009, 5, 8),
      gold, [p.x, p.y, p.z], "chain_link");
    link.rotation.x = Math.PI / 2;
    link.rotation.z = (i % 2) * 0.45;
  }

  // Shield pendant, gold beveled edge, bail and readable two-line engraving.
  const shield = new THREE.Shape();
  shield.moveTo(-0.16, 0.15);
  shield.quadraticCurveTo(-0.18, 0.19, -0.13, 0.19);
  shield.lineTo(0.13, 0.19);
  shield.quadraticCurveTo(0.18, 0.19, 0.16, 0.15);
  shield.lineTo(0.14, -0.045);
  shield.quadraticCurveTo(0.12, -0.13, 0, -0.20);
  shield.quadraticCurveTo(-0.12, -0.13, -0.14, -0.045);
  shield.closePath();
  const pendantGeometry = new THREE.ExtrudeGeometry(shield, {
    depth: 0.035, bevelEnabled: true, bevelSegments: 2,
    steps: 1, bevelSize: 0.012, bevelThickness: 0.012, curveSegments: 5
  });
  const pendant = addMesh(hero, pendantGeometry, gold, [0, 2.76, 0.34], "LAMBO_CITY_shield_pendant");
  pendant.rotation.x = 0;
  const pendantTexture = makeTextTexture(["LAMBO", "CITY", "RECORDS"], {
    width: 512, height: 384, font: "900 66px Arial", lineGap: 105, color: "#8A6412"
  });
  addMesh(hero, new THREE.PlaneGeometry(0.27, 0.17),
    new THREE.MeshBasicMaterial({ map: pendantTexture, transparent: true, side: THREE.DoubleSide }),
    [0, 2.87, 0.39], "pendant_LAMBO_CITY_RECORDS_text");
  const bail = addMesh(hero, new THREE.TorusGeometry(0.045, 0.012, 6, 12),
    gold, [0, 3.14, 0.36], "pendant_bail");
  bail.rotation.x = Math.PI / 2;

  // Left wrist watch and signet ring are attached above to HERO's own left (+X).
  // A few subtle tan denim seams reinforce the tailored jeans.
  for (const side of [-1, 1]) {
    rodBetween(hero, seam, [side * 0.17, 1.27, 0.13],
      [side * 0.17, 0.93, 0.13], 0.004, "denim_stitch", 5);
  }

  // Normalize to exactly four units high and place the soles at y=0.
  hero.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(hero);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) {
    throw new Error("HERO model has invalid bounds.");
  }
  const scaleFactor = 4.0 / size.y;
  hero.scale.setScalar(scaleFactor);
  hero.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(hero);
  hero.position.y -= bounds.min.y;
  hero.position.x -= (bounds.min.x + bounds.max.x) / 2;
  hero.position.z -= (bounds.min.z + bounds.max.z) / 2;
  hero.updateMatrixWorld(true);
  const finalBounds = new THREE.Box3().setFromObject(hero);
  const finalSize = finalBounds.getSize(new THREE.Vector3());
  console.log("[LAMBO CITY] HERO model bounds:", {
    height: Number(finalSize.y.toFixed(3)),
    minY: Number(finalBounds.min.y.toFixed(3)),
    centerX: Number(((finalBounds.min.x + finalBounds.max.x) / 2).toFixed(3)),
    centerZ: Number(((finalBounds.min.z + finalBounds.max.z) / 2).toFixed(3))
  });
  return hero;
}
