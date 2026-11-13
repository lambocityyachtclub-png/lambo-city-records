import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// Additive architectural detailing for the three existing west-side storefronts.
// The original buildings, positions, street, sidewalks, Club Vista identity and
// marina geometry remain owned by marina.js and are not rebuilt here.

const STOREFRONTS = [
  {
    id: "club-vista",
    x: -20,
    title: "CLUB VISTA",
    subtitle: "PRIVATE WATERFRONT CLUB",
    accent: 0x00ccff,
    accentCss: "#39d9ff"
  },
  {
    id: "music-store",
    x: -32,
    title: "STORE",
    subtitle: "MUSIC • BEATS • RELEASES",
    accent: 0xff2288,
    accentCss: "#ff65ad"
  },
  {
    id: "producer-store",
    x: -44,
    title: "STORE",
    subtitle: "SOUND KITS • PRESETS",
    accent: 0xffcc00,
    accentCss: "#f3d27a"
  }
];

const FRONT_Z = 37.085;

function makeSignTexture(title, subtitle, accentCss) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 1024, 256);
  gradient.addColorStop(0, "#08090d");
  gradient.addColorStop(0.55, "#17171b");
  gradient.addColorStop(1, "#050608");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = accentCss;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accentCss;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fff7e8";
  ctx.font = title.length > 12 ? "bold 66px Arial, sans-serif" : "bold 82px Arial, sans-serif";
  ctx.fillText(title, 512, 104, 940);
  ctx.shadowBlur = 0;
  ctx.fillStyle = accentCss;
  ctx.font = "600 28px Arial, sans-serif";
  ctx.letterSpacing = "5px";
  ctx.fillText(subtitle, 512, 190, 940);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addBox(parent, name, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addStorefront(scene, store) {
  const root = new THREE.Group();
  root.name = "lcStorefrontDetails-" + store.id;
  root.position.set(store.x, 0, 0);
  scene.add(root);

  const dark = new THREE.MeshStandardMaterial({
    color: 0x090b10,
    roughness: 0.38,
    metalness: 0.42
  });
  const blackGlass = new THREE.MeshStandardMaterial({
    color: 0x101b24,
    roughness: 0.12,
    metalness: 0.28,
    transparent: true,
    opacity: 0.72
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc6a45e,
    roughness: 0.26,
    metalness: 0.82
  });
  const accent = new THREE.MeshStandardMaterial({
    color: store.accent,
    emissive: store.accent,
    emissiveIntensity: 1.25,
    roughness: 0.28,
    metalness: 0.45
  });
  const warmDisplay = new THREE.MeshStandardMaterial({
    color: 0x9d7540,
    emissive: 0x6a431c,
    emissiveIntensity: 0.42,
    roughness: 0.42,
    metalness: 0.58
  });

  // Dark architectural field sits over the original solid storefront wall.
  addBox(root, "facade-" + store.id, [9.55, 4.95, 0.12], [0, 3.65, FRONT_Z], dark);

  // Framed display windows with shallow shelves and restrained emissive edges.
  for (const side of [-1, 1]) {
    const x = side * 2.85;
    addBox(root, "display-back-" + store.id + "-" + side, [2.65, 3.45, 0.07], [x, 3.0, FRONT_Z + 0.075], dark);
    addBox(root, "display-glass-" + store.id + "-" + side, [2.48, 3.28, 0.035], [x, 3.0, FRONT_Z + 0.13], blackGlass);

    for (const edge of [-1, 1]) {
      addBox(root, "window-frame-" + store.id + "-" + side + "-" + edge,
        [0.075, 3.62, 0.12], [x + edge * 1.36, 3.0, FRONT_Z + 0.16], brass);
    }
    addBox(root, "window-top-" + store.id + "-" + side, [2.8, 0.075, 0.12],
      [x, 4.82, FRONT_Z + 0.16], brass);
    addBox(root, "window-shelf-" + store.id + "-" + side, [2.2, 0.1, 0.42],
      [x, 2.0, FRONT_Z + 0.23], warmDisplay);
    addBox(root, "window-display-plinth-" + store.id + "-" + side, [0.72, 0.72, 0.52],
      [x, 1.55, FRONT_Z + 0.22], dark);
    addBox(root, "window-accent-" + store.id + "-" + side, [0.045, 2.9, 0.045],
      [x + side * 1.18, 3.0, FRONT_Z + 0.19], accent);
  }

  // Central entry portal: visual door and hardware, without changing collision.
  addBox(root, "door-surround-left-" + store.id, [0.14, 4.45, 0.2],
    [-1.12, 2.82, FRONT_Z + 0.18], brass);
  addBox(root, "door-surround-right-" + store.id, [0.14, 4.45, 0.2],
    [1.12, 2.82, FRONT_Z + 0.18], brass);
  addBox(root, "door-surround-top-" + store.id, [2.38, 0.14, 0.2],
    [0, 5.04, FRONT_Z + 0.18], brass);
  addBox(root, "entry-glass-" + store.id, [1.98, 4.16, 0.045],
    [0, 2.8, FRONT_Z + 0.21], blackGlass);
  addBox(root, "door-center-seam-" + store.id, [0.035, 4.0, 0.05],
    [0, 2.8, FRONT_Z + 0.25], brass);

  for (const side of [-1, 1]) {
    addBox(root, "door-handle-" + store.id + "-" + side, [0.055, 0.72, 0.075],
      [side * 0.42, 2.75, FRONT_Z + 0.29], brass);
  }

  // Storefront pilasters and base trim make the three existing boxes read as
  // intentional retail architecture without adding lights or heavy geometry.
  for (const side of [-1, 1]) {
    addBox(root, "facade-pilaster-" + store.id + "-" + side, [0.2, 7.15, 0.22],
      [side * 4.72, 4.35, FRONT_Z + 0.12], brass);
  }
  addBox(root, "store-base-trim-" + store.id, [9.55, 0.22, 0.28],
    [0, 0.78, FRONT_Z + 0.13], brass);
  addBox(root, "store-canopy-edge-" + store.id, [9.8, 0.11, 0.22],
    [0, 5.12, 37.02], accent);
  addBox(root, "entry-threshold-" + store.id, [2.65, 0.12, 1.05],
    [0, 0.76, 38.05], dark);
  addBox(root, "threshold-accent-" + store.id, [2.45, 0.035, 0.08],
    [0, 0.84, 38.48], accent);

  const signTexture = makeSignTexture(store.title, store.subtitle, store.accentCss);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 1.3),
    new THREE.MeshBasicMaterial({ map: signTexture, toneMapped: false })
  );
  sign.name = "store-sign-" + store.id;
  sign.position.set(0, 6.8, 37.19);
  root.add(sign);

  const signGlow = new THREE.Mesh(
    new THREE.BoxGeometry(7.7, 0.035, 0.045),
    accent
  );
  signGlow.name = "store-sign-accent-" + store.id;
  signGlow.position.set(0, 6.08, 37.17);
  root.add(signGlow);

  return root;
}

export default {
  init(scene) {
    if (!scene || scene.getObjectByName("lcWaterfrontStorefrontDetails")) return null;

    const root = new THREE.Group();
    root.name = "lcWaterfrontStorefrontDetails";
    scene.add(root);

    for (const store of STOREFRONTS) {
      const detail = addStorefront(root, store);
      detail.position.set(store.x, 0, 0);
    }

    return root;
  },

  update() {}
};
