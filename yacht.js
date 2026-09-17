import * as THREE from 'three';
 
// Builds a stylized luxury mega yacht ~22m long, 9m wide
// Scale: 1 unit = 1 meter
 
function makeNeonMaterial(color, intensity) {
  const mat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.2,
    roughness: 0.4,
  });
  mat.userData.isNeon = true;
  return mat;
}
 
export function buildYacht() {
  const yacht = new THREE.Group();
  yacht.name = 'yachtGroup';
 
  const LENGTH = 22;
  const WIDTH = 9;
 
  // ---- Hull ----
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xf5f3ee,
    metalness: 0.55,
    roughness: 0.22,
  });
 
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-LENGTH / 2, 0);
  hullShape.lineTo(-LENGTH / 2 + 2.2, -1.3);
  hullShape.lineTo(LENGTH / 2 - 3.5, -1.3);
  hullShape.quadraticCurveTo(LENGTH / 2 + 0.5, -1.1, LENGTH / 2, 0.3);
  hullShape.quadraticCurveTo(LENGTH / 2 - 1.5, 1.0, LENGTH / 2 - 3.5, 1.05);
  hullShape.lineTo(-LENGTH / 2 + 2.2, 1.05);
  hullShape.closePath();
 
  const extrudeSettings = { steps: 1, depth: WIDTH, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 4 };
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  hullGeo.rotateY(Math.PI / 2);
  hullGeo.translate(0, 1.3, -WIDTH / 2);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.castShadow = true;
  hull.receiveShadow = true;
  hull.name = 'hull';
  yacht.add(hull);
 
  // Waterline dark stripe
  const stripeGeo = new THREE.BoxGeometry(LENGTH - 3, 0.28, WIDTH + 0.1);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.4, roughness: 0.5 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0.2, 0.25, 0);
  stripe.name = 'waterlineStripe';
  yacht.add(stripe);
 
  // ---- Neon trim line along hull ----
  const neonMat = makeNeonMaterial(0x22e8ff, 1.6);
  const neonGeo = new THREE.BoxGeometry(LENGTH - 1.5, 0.09, 0.09);
  const neonOffsets = [WIDTH / 2 + 0.08, -(WIDTH / 2 + 0.08)];
  neonOffsets.forEach((z, i) => {
    const neon = new THREE.Mesh(neonGeo, neonMat);
    neon.position.set(0.3, 1.55, z);
    neon.userData.baseEmissive = 1.6;
    neon.name = `neonTrim_${i}`;
    yacht.add(neon);
  });
  // Curved bow section of neon trim
  const neonCurveMat = neonMat;
  [1, -1].forEach((side, i) => {
    const curve = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.045, 8, 16, Math.PI * 0.5), neonCurveMat);
    curve.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    curve.rotation.z = Math.PI;
    curve.position.set(LENGTH / 2 - 3.2, 1.55, side * (WIDTH / 2 - 0.15));
    curve.userData.baseEmissive = 1.6;
    curve.name = `neonBowCurve_${i}`;
    yacht.add(curve);
  });
 
  // ---- Main deck platform ----
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xd9dadc, metalness: 0.3, roughness: 0.55 });
  const deck1Geo = new THREE.BoxGeometry(LENGTH - 2.5, 0.5, WIDTH - 0.6);
  const deck1 = new THREE.Mesh(deck1Geo, deckMat);
  deck1.position.set(-0.3, 2.1, 0);
  deck1.castShadow = true;
  deck1.receiveShadow = true;
  deck1.name = 'mainDeck';
  yacht.add(deck1);
 
  // ---- Tier 1 superstructure ----
  const superMat = new THREE.MeshStandardMaterial({ color: 0xe7e6e2, metalness: 0.4, roughness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a3a55,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.4,
    transparent: true,
    opacity: 0.85,
    reflectivity: 0.6,
    emissive: 0x0b2233,
    emissiveIntensity: 0.3,
  });
 
  function makeTier(length, height, width, yPos, xPos) {
    const grp = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(length, height, width);
    const body = new THREE.Mesh(bodyGeo, superMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    body.name = 'tierBody';
    grp.add(body);
 
    // Windows band (front + sides) using emissive glass strip
    const bandHeight = height * 0.45;
    const bandGeo = new THREE.BoxGeometry(length - 0.4, bandHeight, width + 0.05);
    const band = new THREE.Mesh(bandGeo, glassMat);
    band.position.y = height * 0.55;
    band.name = 'windowBand';
    grp.add(band);
 
    grp.position.set(xPos, yPos, 0);
    return grp;
  }
 
  const tier1 = makeTier(11, 2.6, WIDTH - 1.4, 2.35, 1.5);
  tier1.name = 'tier1';
  yacht.add(tier1);
 
  const tier2 = makeTier(7, 2.3, WIDTH - 3.2, 5.0, 2.0);
  tier2.name = 'tier2';
  yacht.add(tier2);
 
  const tier3 = makeTier(4.2, 2.0, WIDTH - 5.2, 7.35, 3.2);
  tier3.name = 'tier3';
  yacht.add(tier3);
 
  // ---- Bridge / bow cabin (topmost, near bow) ----
  const bridgeGeo = new THREE.BoxGeometry(2.6, 1.7, WIDTH - 6.4);
  const bridge = new THREE.Mesh(bridgeGeo, superMat);
  bridge.position.set(5.3, 9.2, 0);
  bridge.castShadow = true;
  bridge.name = 'bridge';
  yacht.add(bridge);
 
  const bridgeGlassGeo = new THREE.BoxGeometry(2.62, 0.8, WIDTH - 6.6);
  const bridgeGlass = new THREE.Mesh(bridgeGlassGeo, glassMat);
  bridgeGlass.position.set(5.3, 9.5, 0);
  bridgeGlass.name = 'bridgeGlass';
  yacht.add(bridgeGlass);
 
  // ---- Side window rows (tinted blue glass strips along hull sides) ----
  const rowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x14304a,
    metalness: 0.15,
    roughness: 0.08,
    transmission: 0.35,
    transparent: true,
    opacity: 0.9,
    emissive: 0x0a1e30,
    emissiveIntensity: 0.4,
  });
  const rowGeo = new THREE.BoxGeometry(9, 0.6, 0.08);
  [WIDTH / 2 + 0.02, -(WIDTH / 2 + 0.02)].forEach((z, i) => {
    const row = new THREE.Mesh(rowGeo, rowGlassMat);
    row.position.set(-1.5, 1.9, z);
    row.name = `hullWindowRow_${i}`;
    yacht.add(row);
  });
 
  // ---- Chrome mast ----
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdfe4e8, metalness: 0.95, roughness: 0.08 });
  const mastGeo = new THREE.CylinderGeometry(0.06, 0.09, 5.5, 12);
  const mast = new THREE.Mesh(mastGeo, chromeMat);
  mast.position.set(4.6, 12.55, 0);
  mast.castShadow = true;
  mast.name = 'mast';
  yacht.add(mast);
 
  const mastCrossGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8);
  const mastCross = new THREE.Mesh(mastCrossGeo, chromeMat);
  mastCross.rotation.z = Math.PI / 2;
  mastCross.position.set(4.6, 11.3, 0);
  mastCross.name = 'mastCross';
  yacht.add(mastCross);
 
  // Antenna ball / beacon
  const beaconMat = makeNeonMaterial(0xff3355, 2.0);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), beaconMat);
  beacon.position.set(4.6, 15.3, 0);
  beacon.userData.baseEmissive = 2.0;
  beacon.name = 'mastBeacon';
  yacht.add(beacon);
 
  // ---- Gold emissive signage panel on stern ----
  const signGeo = new THREE.PlaneGeometry(2.6, 0.6);
  const signMat = makeNeonMaterial(0xd4af37, 1.4);
  signMat.side = THREE.DoubleSide;
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(-LENGTH / 2 + 1.55, 2.0, 0);
  sign.rotation.y = Math.PI / 2;
  sign.userData.baseEmissive = 1.4;
  sign.name = 'sternSign';
  yacht.add(sign);
 
  // Small gold accent strip trim on tiers
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 });
  const goldTrimGeo = new THREE.BoxGeometry(11.1, 0.06, 0.06);
  const goldTrim = new THREE.Mesh(goldTrimGeo, goldTrimMat);
  goldTrim.position.set(1.5, 3.62, (WIDTH - 1.4) / 2 + 0.03);
  goldTrim.name = 'goldTrim1';
  yacht.add(goldTrim);
  const goldTrim2 = goldTrim.clone();
  goldTrim2.position.z = -((WIDTH - 1.4) / 2 + 0.03);
  goldTrim2.name = 'goldTrim2';
  yacht.add(goldTrim2);
 
  // ---- Railings (simple thin cylinders) ----
  const railMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, metalness: 0.7, roughness: 0.3 });
  function addRailing(xStart, xEnd, z, y) {
    const len = xEnd - xStart;
    const railGeo = new THREE.CylinderGeometry(0.025, 0.025, len, 6);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set((xStart + xEnd) / 2, y, z);
    rail.name = 'railing';
    yacht.add(rail);
    const postCount = Math.max(2, Math.floor(len / 1.2));
    for (let p = 0; p <= postCount; p++) {
      const px = xStart + (len * p) / postCount;
      const postGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
      const post = new THREE.Mesh(postGeo, railMat);
      post.position.set(px, y - 0.25, z);
      post.name = 'railingPost';
      yacht.add(post);
    }
  }
  addRailing(-9.5, 6.2, WIDTH / 2 - 1.5, 2.65);
  addRailing(-9.5, 6.2, -(WIDTH / 2 - 1.5), 2.65);
 
  // ---- Deck loungers (small detail boxes) ----
  const loungerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  for (let i = 0; i < 3; i++) {
    const lounger = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 0.5), loungerMat);
    lounger.position.set(-6 + i * 1.6, 2.42, WIDTH / 2 - 2.2);
    lounger.castShadow = true;
    lounger.name = `lounger_${i}`;
    yacht.add(lounger);
  }
 
  yacht.position.x = -1;
  return yacht;
}
