import test from "node:test";
import assert from "node:assert/strict";
import { resolveCompanionAvatarDesign } from "../../alive/identity/companionAvatarVisual.js";

test("avatar design resolves all saved visual choices", () => {
  const design = resolveCompanionAvatarDesign({
    characterForm: "stylized",
    appearanceProfile: {
      skinTone: "deep",
      hairStyle: "braids",
      hairColor: "auburn",
      eyeColor: "green",
      outfit: "creative",
      accentColor: "violet"
    }
  });
  assert.deepEqual(design, {
    form: "stylized",
    skin: 0x5a3528,
    hair: 0x783b27,
    eyes: 0x4f8766,
    hairStyle: "braids",
    outfit: 0x253b55,
    accent: 0x9565c9
  });
});

test("unknown or missing visual choices resolve to stable defaults", () => {
  assert.deepEqual(resolveCompanionAvatarDesign(null), {
    form: "digital-human",
    skin: 0xb87952,
    hair: 0x171411,
    eyes: 0x59331f,
    hairStyle: "short",
    outfit: 0x1b1b1f,
    accent: 0xffd700
  });
  assert.equal(resolveCompanionAvatarDesign({ appearanceProfile: { hairStyle: "invented" } }).hairStyle, "short");
});

test("avatar design resolution does not mutate saved identity data", () => {
  const companion = Object.freeze({
    characterForm: "digital-human",
    appearanceProfile: Object.freeze({
      skinTone: "light", hairStyle: "curly", hairColor: "silver",
      eyeColor: "gray", outfit: "minimal", accentColor: "silver"
    })
  });
  const before = JSON.stringify(companion);
  resolveCompanionAvatarDesign(companion);
  assert.equal(JSON.stringify(companion), before);
});

class FakeVector {
  constructor() { this.x = 0; this.y = 0; this.z = 0; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(other) { this.x = other.x; this.y = other.y; this.z = other.z; return this; }
  setScalar(value) { this.x = this.y = this.z = value; return this; }
}
class FakeObject3D {
  constructor() {
    this.children = [];
    this.position = new FakeVector();
    this.rotation = new FakeVector();
    this.scale = new FakeVector();
    this.visible = true;
    this.parent = null;
  }
  add(...items) {
    for (const item of items) {
      item.parent?.remove?.(item);
      item.parent = this;
      this.children.push(item);
    }
  }
  remove(item) {
    this.children = this.children.filter(child => child !== item);
    item.parent = null;
  }
  clear() { for (const child of [...this.children]) this.remove(child); }
  traverse(callback) { callback(this); this.children.forEach(child => child.traverse(callback)); }
  removeFromParent() { this.parent?.remove(this); }
}
class FakeGeometry { dispose() {} }
class FakeMaterial {
  constructor(options = {}) {
    const color = options.color ?? 0;
    this.color = { value: color, setHex(value) { this.value = value; } };
    this.emissive = { value: options.emissive ?? 0, setHex(value) { this.value = value; } };
  }
  dispose() {}
}
class FakeMesh extends FakeObject3D {
  constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
}
const fakeTHREE = {
  Group: FakeObject3D,
  Mesh: FakeMesh,
  MeshStandardMaterial: FakeMaterial,
  BoxGeometry: FakeGeometry,
  SphereGeometry: FakeGeometry,
  CylinderGeometry: FakeGeometry,
  TorusGeometry: FakeGeometry,
  CapsuleGeometry: FakeGeometry
};
const originalPart = (x = 0, y = 0, z = 0) => {
  const part = new FakeMesh(new FakeGeometry(), new FakeMaterial());
  part.position.set(x, y, z);
  return part;
};

test("avatar layer hides placeholders, follows player limb poses, and restores fallback parts", async () => {
  const { createCompanionAvatar } = await import("../../alive/identity/companionAvatarVisual.js");
  const root = new FakeObject3D();
  const original = {
    body: originalPart(0, 1.8, 0),
    head: originalPart(0, 3.15, 0),
    cap: originalPart(),
    brim: originalPart(),
    arms: [originalPart(-0.8, 1.8, 0), originalPart(0.8, 1.8, 0)],
    legs: [originalPart(-0.35, 0.6, 0), originalPart(0.35, 0.6, 0)],
    logo: originalPart(),
    chain: originalPart(),
    shoes: [originalPart(), originalPart()]
  };
  const avatar = createCompanionAvatar(fakeTHREE, root, original, null);
  assert.ok(Object.values(original).flat().every(part => part.visible === false));
  original.arms[0].position.set(-0.9, 1.5, 0.2);
  original.arms[0].rotation.set(0.5, 0, 0);
  avatar.sync();
  const armPivot = avatar.group.children.find(child => child.position.x === -0.9 && child.position.y === 1.5);
  assert.ok(armPivot, "avatar arm pivot follows the original arm position");
  assert.equal(armPivot.rotation.x, 0.5);
  avatar.apply({
    characterForm: "stylized",
    appearanceProfile: { skinTone: "deep", hairStyle: "curly", hairColor: "auburn", eyeColor: "green", outfit: "creative", accentColor: "violet" }
  });
  avatar.restoreOriginals();
  assert.ok(Object.values(original).flat().every(part => part.visible === true));
  assert.equal(root.children.includes(avatar.group), false);
});
