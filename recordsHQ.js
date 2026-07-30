bash
cat > /home/claude/recordsHQPlaza.js << 'ENDOFFILE'
// recordsHQPlaza.js
// Expands the Records HQ entrance into a full VIP red-carpet arrival zone:
// premium marble plaza flooring, a permanent lime-green display Lamborghini
// (brand landmark, never moves), and a small waterfront lounge area beside
// the building. Anchored to recordsHQ.js's actual current position
// (28, 30) — not the older z:22 reference. Pure emissive materials, no
// added dynamic lights, stays cheap on iPad. Doesn't touch recordsHQ.js,
// marina.js, or anything else.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 30;

function buildPremiumPlaza(scene) {
  // Wider marble flooring around the entrance, beyond just the carpet
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: 0xeceae4, roughness: 0.25, metalness: 0.2 })
  );
  plaza.position.set(HQ_X, 0.04, HQ_Z + 8);
  scene.add(plaza);

  // Subtle gold seam lines in the marble
  [-6, 0, 6].forEach(x => {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.09, 14),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.8 })
    );
    seam.position.set(HQ_X + x, 0.05, HQ_Z + 8);
    scene.add(seam);
  });
}

function buildDisplayLamborghini(scene) {
  const group = new THREE.Group();

  // Small display pedestal
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.3, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4, metalness: 0.4 })
  );
  pedestal.position.y = 0.15;
  group.add(pedestal);

  const pedestalGlow = new THREE.Mesh(
    new THREE.BoxGeometry(6.1, 0.06, 3.5),
    new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.8 })
  );
  pedestalGlow.position.y = 0.31;
  group.add(pedestalGlow);

  // Lime green, early-Lamborghini-inspired 2-door coupe silhouette
  const limeGreen = 0x9dff00;
  const bodyMat = new THREE.MeshStandardMaterial({ color: limeGreen, metalness: 0.6, roughness: 0.25 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 1.9), bodyMat);
  body.position.y = 0.75;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 0.55, 1.6), bodyMat);
  cabin.position.set(-0.2, 1.25, 0);
  group.add(cabin);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1.7), bodyMat);
  nose.position.set(2.4, 0.6, 0);
  group.add(nose);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  [[1.4, 0.9], [1.4, -0.9], [-1.4, 0.9], [-1.4, -0.9]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.35, z);
    group.add(wheel);
  });

  // Headlight glow, small brand plate
  [-0.75, 0.75].forEach(z => {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffcc, emissiveIntensity: 2 })
    );
    light.position.set(2.9, 0.7, z);
    group.add(light);
  });

  group.position.set(HQ_X - 6, 0, HQ_Z + 6);
  group.rotation.y = Math.PI / 2;
  scene.add(group);
}

function buildLounge(scene) {
  const loungeGroup = new THREE.Group();

  // Low luxury furniture — a few seats + a low table, ambient glow
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
  [[-2, -1.5], [2, -1.5], [-2, 1.5], [2, 1.5]].forEach(([x, z]) => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.4), seatMat);
    seat.position.set(x, 0.35, z);
    loungeGroup.add(seat);
  });

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.4 })
  );
  table.position.y = 0.55;
  loungeGroup.add(table);

  const tableGlow = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.03, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2 })
  );
  tableGlow.rotation.x = Math.PI / 2;
  tableGlow.position.y = 0.56;
  loungeGroup.add(tableGlow);

  // Railing suggesting the ocean edge just past the lounge
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.8, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7, roughness: 0.3 })
  );
  rail.position.set(0, 0.4, 4.5);
  loungeGroup.add(rail);

  const railGlow = new THREE.Mesh(
    new THREE.BoxGeometry(8.1, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 })
  );
  railGlow.position.set(0, 0.05, 4.55);
  loungeGroup.add(railGlow);

  loungeGroup.position.set(HQ_X + 12, 0, HQ_Z + 5);
  scene.add(loungeGroup);
}

export default {
  init(scene) {
    buildPremiumPlaza(scene);
    buildDisplayLamborghini(scene);
    buildLounge(scene);
  },
  update() {},
};
ENDOFFILE
echo "done"
Output
done
