// LAMBO CITY — modular World System registry
// Validates and manages district definitions independently of the game engine.
// Nothing is built automatically at startup; callers explicitly request a build.

import { validateDistrict } from "./worldDistrictSchema.js";
import { buildDistrictGeometry } from "./worldBuilder.js";

export default class WorldSystem {
  constructor(options = {}) {
    this.options = options;
    this.districts = new Map();
    this.roots = new Map();
    this.scene = null;
    this.protectedLandmarks = options.protectedLandmarks || [];
  }

  init(scene) {
    this.scene = scene || null;
    return this;
  }

  registerDistrict(district) {
    const result = validateDistrict(district, {
      protectedLandmarks: this.protectedLandmarks
    });
    if (!result.valid) {
      return { registered: false, validation: result };
    }
    if (this.districts.has(district.id)) {
      return {
        registered: false,
        validation: {
          valid: false,
          issues: [{ code: "DISTRICT_ALREADY_REGISTERED", message: "District is already registered: " + district.id, severity: "error" }]
        }
      };
    }
    this.districts.set(district.id, district);
    return { registered: true, validation: result };
  }

  buildDistrict(id, buildOptions = {}) {
    if (!this.scene) throw new Error("WorldSystem must be initialized with a scene before building.");
    const district = this.districts.get(id);
    if (!district) throw new Error("Unknown district: " + id);
    if (this.roots.has(id)) return this.roots.get(id);

    const root = buildDistrictGeometry(this.scene, district, buildOptions);
    this.roots.set(id, root);
    return root;
  }

  removeDistrict(id) {
    const root = this.roots.get(id);
    if (!root) return false;
    this.scene?.remove(root);
    root.traverse?.(object => {
      if (object.geometry && object.geometry.dispose) object.geometry.dispose();
    });
    this.roots.delete(id);
    return true;
  }

  getDistrictIds() {
    return Array.from(this.districts.keys());
  }

  getStatus() {
    return {
      registeredDistricts: this.getDistrictIds(),
      builtDistricts: Array.from(this.roots.keys())
    };
  }
}
