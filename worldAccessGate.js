// LAMBO CITY — physical access gate for restricted district roads
// A closed gate registers a lightweight AABB blocker; an authorized access
// tier raises the arm and removes that blocker. No autonomous access grants.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function createGate(parent, segment, from, to, collision) {
  const width = Number.isFinite(segment.width) ? segment.width : 8;
  const dx = to.x - from.x, dz = to.z - from.z;
  const length = Math.hypot(dx, dz) || 1;
  const offset = Number.isFinite(segment.gate?.offset) ? segment.gate.offset : 1.4;
  const x = from.x + dx / length * offset;
  const z = from.z + dz / length * offset;
  const angle = Math.atan2(dx, dz);
  const id = segment.gate?.id || "gate-" + segment.id;
  const collisionName = "worldAccessGate_" + id;

  const root = new THREE.Group();
  root.name = "worldAccessGate_" + id;
  root.position.set(x, 0.64, z);
  root.rotation.y = angle;
  parent.add(root);

  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x242a30, metalness: 0.78, roughness: 0.3 });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xc9a85f, metalness: 0.78, roughness: 0.28 });
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xe4d8b8, metalness: 0.58, roughness: 0.32 });

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.7, 0.48), postMaterial);
    post.name = id + "_post_" + side;
    post.position.set(side * (width / 2 - 0.24), 0.85, 0);
    post.castShadow = true;
    root.add(post);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.54), goldMaterial);
    cap.position.set(side * (width / 2 - 0.24), 1.74, 0);
    root.add(cap);
  }

  const pivot = new THREE.Group();
  pivot.name = id + "_armPivot";
  pivot.position.set(-width / 2 + 0.48, 1.52, 0);
  root.add(pivot);
  const armLength = Math.max(1, width - 0.96);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(armLength, 0.2, 0.18), armMaterial);
  arm.name = id + "_barrierArm";
  arm.position.x = armLength / 2;
  arm.castShadow = true;
  pivot.add(arm);

  const halfX = (Math.abs(Math.cos(angle)) * width + Math.abs(Math.sin(angle)) * 0.5) / 2;
  const halfZ = (Math.abs(Math.sin(angle)) * width + Math.abs(Math.cos(angle)) * 0.5) / 2;
  const requiredAccess = segment.requiredAccess;
  let isOpen = null;

  function setOpen(open) {
    const next = !!open;
    if (next === isOpen) return;
    isOpen = next;
    pivot.rotation.z = isOpen ? -Math.PI / 2 : 0;
    if (collision && typeof collision.unregister === "function") collision.unregister(collisionName);
    if (!isOpen && collision && typeof collision.registerBox === "function") {
      collision.registerBox(collisionName, {
        x, z, width: halfX * 2, depth: halfZ * 2,
        minY: 0, maxY: 2.4, level: "world-access-gate"
      });
    }
    root.userData.isOpen = isOpen;
  }

  function setPermissions(permissions = []) {
    const granted = new Set(Array.isArray(permissions) ? permissions : []);
    setOpen(!!requiredAccess && granted.has(requiredAccess));
    return getStatus();
  }

  function getStatus() {
    return { id, open: isOpen, requiredAccess };
  }

  function destroy() {
    if (collision && typeof collision.unregister === "function") collision.unregister(collisionName);
    parent.remove(root);
  }

  setOpen(false);
  root.userData.requiredAccess = requiredAccess;
  root.userData.isOpen = false;
  return { id, setPermissions, getStatus, destroy };
}

export function buildAccessGates(parent, district, collision = null) {
  const nodes = new Map((district?.roadNetwork?.nodes || []).map(node => [node.id, node]));
  const controllers = [];
  for (const segment of district?.roadNetwork?.segments || []) {
    if (segment.access !== "permission-controlled" || !segment.gate) continue;
    const from = nodes.get(segment.from), to = nodes.get(segment.to);
    if (!from || !to) continue;
    controllers.push(createGate(parent, segment, from, to, collision));
  }
  return controllers;
}

export default { buildAccessGates };
