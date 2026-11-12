// LAMBO CITY — vehicle motion controller
// Pure movement logic shared by player-driven and AI vehicles. It never
// commits a proposed position unless the complete vehicle footprint and
// swept path remain on permitted road or declared turning-apron surfaces.

import {
  isVehicleFootprintOnRoad,
  isVehicleMoveOnRoad,
  buildVehicleUTurnPath
} from "./worldVehicleRoadRules.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const moveToward = (value, target, amount) =>
  value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);

function angleDifference(from, to) {
  let difference = to - from;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
}

export default class VehicleRoadController {
  constructor(district, initialState = {}, options = {}) {
    this.district = district;
    this.options = {
      length: Number.isFinite(options.length) ? options.length : 4.8,
      width: Number.isFinite(options.width) ? options.width : 2.1,
      wheelbase: Number.isFinite(options.wheelbase) ? options.wheelbase : 2.8,
      maxSteeringAngle: Number.isFinite(options.maxSteeringAngle) ? options.maxSteeringAngle : 0.48,
      steeringRate: Number.isFinite(options.steeringRate) ? options.steeringRate : 1.8,
      maxSpeed: Number.isFinite(options.maxSpeed) ? options.maxSpeed : 14,
      reverseSpeed: Number.isFinite(options.reverseSpeed) ? options.reverseSpeed : 4,
      acceleration: Number.isFinite(options.acceleration) ? options.acceleration : 5,
      braking: Number.isFinite(options.braking) ? options.braking : 10,
      drag: Number.isFinite(options.drag) ? options.drag : 1.2,
      turningRadius: Number.isFinite(options.turningRadius) ? options.turningRadius : 6.5,
      uTurnSpeed: Number.isFinite(options.uTurnSpeed) ? options.uTurnSpeed : 2.5
    };
    // Access is supplied only by trusted World System callbacks. Caller-provided
    // permission arrays or gate IDs are deliberately ignored.
    this.getPermissions = typeof options.getPermissions === "function" ? options.getPermissions : null;
    this.getOpenGates = typeof options.getOpenGates === "function" ? options.getOpenGates : null;
    this.permissions = new Set();
    this.openGates = new Set();
    this._refreshAccessState();
    this.state = {
      x: initialState.x,
      z: initialState.z,
      heading: Number.isFinite(initialState.heading) ? initialState.heading : 0,
      speed: 0,
      steering: 0,
      valid: false,
      blocked: false
    };
    this._uturn = null;
    this.state.valid = this._hasRoadFootprint(this.state);
    if (!this.state.valid) this.state.blocked = true;
  }

  _refreshAccessState() {
    const readList = provider => {
      if (!provider) return [];
      try {
        const value = provider();
        if (value instanceof Set) return [...value];
        return Array.isArray(value) ? value : [];
      } catch (_) {
        return [];
      }
    };
    this.permissions = new Set(readList(this.getPermissions));
    this.openGates = new Set(readList(this.getOpenGates));
  }

  _roadOptions(extra = {}) {
    this._refreshAccessState();
    return { permissions: [...this.permissions], openGates: this.openGates, ...extra };
  }

  _vehicleAt(state) {
    return {
      x: state.x,
      z: state.z,
      heading: state.heading,
      length: this.options.length,
      width: this.options.width,
      turningRadius: this.options.turningRadius
    };
  }

  _hasRoadFootprint(state) {
    return !!this.district && isVehicleFootprintOnRoad(
      this.district, this._vehicleAt(state), this._roadOptions()
    );
  }

  getState() {
    return { ...this.state, length: this.options.length, width: this.options.width };
  }

  applyTo(object) {
    if (!object?.position || !this.state.valid) return false;
    object.position.x = this.state.x;
    object.position.z = this.state.z;
    object.rotation.y = this.state.heading;
    return true;
  }

  requestUTurn(nodeId, options = {}) {
    this.state.valid = this._hasRoadFootprint(this.state);
    if (!this.state.valid) {
      this.state.speed = 0;
      this.state.blocked = true;
      this._uturn = null;
    }
    if (!this.state.valid || this._uturn) {
      return { accepted: false, reason: this._uturn ? "TURN_ALREADY_ACTIVE" : "VEHICLE_NOT_ON_ROAD" };
    }
    const path = buildVehicleUTurnPath(
      this.district,
      nodeId,
      this._vehicleAt(this.state),
      this._roadOptions(options)
    );
    if (!path.valid) return { accepted: false, reason: path.reason, path };

    const start = path.points[0];
    const distance = Math.hypot(start.x - this.state.x, start.z - this.state.z);
    const headingError = Math.abs(angleDifference(this.state.heading, start.heading));
    if (distance > 1.25 || headingError > 0.35) {
      return { accepted: false, reason: "VEHICLE_NOT_AT_TURN_START", path };
    }

    this._uturn = { path: path.points, index: 1, direction: path.direction };
    this.state.speed = 0;
    this.state.steering = 0;
    return { accepted: true, reason: null, points: path.points.length };
  }

  _advanceUTurn(delta) {
    let distanceBudget = this.options.uTurnSpeed * delta;
    const path = this._uturn.path;
    let completed = false;

    while (distanceBudget > 0 && this._uturn && this._uturn.index < path.length) {
      const target = path[this._uturn.index];
      const dx = target.x - this.state.x;
      const dz = target.z - this.state.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 1e-5) {
        this._uturn.index++;
        continue;
      }
      const travel = Math.min(distance, distanceBudget);
      const t = travel / distance;
      const nextHeading = this.state.heading +
        angleDifference(this.state.heading, target.heading) * t;
      const next = {
        x: this.state.x + dx * t,
        z: this.state.z + dz * t,
        heading: nextHeading,
        length: this.options.length,
        width: this.options.width
      };
      if (!isVehicleMoveOnRoad(
        this.district,
        this._vehicleAt(this.state),
        next,
        this._roadOptions({ maxStep: 0.2 })
      )) {
        this._uturn = null;
        this.state.speed = 0;
        this.state.blocked = true;
        return { moved: false, blocked: true, uturnCompleted: false };
      }
      this.state.x = next.x;
      this.state.z = next.z;
      this.state.heading = next.heading;
      distanceBudget -= travel;
      if (travel >= distance - 1e-5) this._uturn.index++;
      else break;
    }

    if (this._uturn && this._uturn.index >= path.length) {
      this.state.heading = path[path.length - 1].heading;
      this._uturn = null;
      completed = true;
    }
    this.state.speed = 0;
    this.state.blocked = false;
    return { moved: true, blocked: false, uturnCompleted: completed };
  }

  update(delta, controls = {}) {
    if (!this.district) {
      this.state.valid = false;
      this.state.speed = 0;
      this.state.blocked = true;
      return { moved: false, blocked: true, uturnCompleted: false, state: this.getState() };
    }

    // Re-read authoritative access on every update. Closing a gate or
    // revoking a permission invalidates the controller before it can move.
    this.state.valid = this._hasRoadFootprint(this.state);
    if (!this.state.valid) {
      this.state.speed = 0;
      this.state.blocked = true;
      this._uturn = null;
      return { moved: false, blocked: true, uturnCompleted: false, state: this.getState() };
    }
    const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, 0.05);
    if (dt <= 0) return { moved: false, blocked: this.state.blocked, uturnCompleted: false, state: this.getState() };
    if (this._uturn) {
      const result = this._advanceUTurn(dt);
      return { ...result, state: this.getState() };
    }

    const throttle = clamp(Number.isFinite(controls.throttle) ? controls.throttle : 0, -1, 1);
    const brake = clamp(Number.isFinite(controls.brake) ? controls.brake : 0, 0, 1);
    const steeringInput = clamp(Number.isFinite(controls.steering) ? controls.steering : 0, -1, 1);
    const targetSpeed = throttle >= 0
      ? throttle * this.options.maxSpeed
      : throttle * this.options.reverseSpeed;
    const rate = brake > 0 ? this.options.braking : (Math.abs(throttle) > 0.001 ? this.options.acceleration : this.options.drag);
    this.state.speed = moveToward(this.state.speed, targetSpeed, rate * dt);
    if (brake > 0) this.state.speed = moveToward(this.state.speed, 0, this.options.braking * brake * dt);

    const targetSteering = steeringInput * this.options.maxSteeringAngle;
    this.state.steering = moveToward(this.state.steering, targetSteering, this.options.steeringRate * dt);
    if (Math.abs(this.state.speed) < 0.02) {
      this.state.speed = 0;
      this.state.blocked = false;
      return { moved: false, blocked: false, uturnCompleted: false, state: this.getState() };
    }

    const yawRate = this.state.speed / this.options.wheelbase * Math.tan(this.state.steering);
    const nextHeading = this.state.heading + yawRate * dt;
    const midHeading = this.state.heading + yawRate * dt * 0.5;
    const next = {
      x: this.state.x + Math.sin(midHeading) * this.state.speed * dt,
      z: this.state.z + Math.cos(midHeading) * this.state.speed * dt,
      heading: nextHeading,
      length: this.options.length,
      width: this.options.width
    };

    if (!isVehicleMoveOnRoad(
      this.district,
      this._vehicleAt(this.state),
      next,
      this._roadOptions({ maxStep: 0.25 })
    )) {
      this.state.speed = moveToward(this.state.speed, 0, this.options.braking * dt);
      this.state.blocked = true;
      return { moved: false, blocked: true, uturnCompleted: false, state: this.getState() };
    }

    this.state.x = next.x;
    this.state.z = next.z;
    this.state.heading = next.heading;
    this.state.blocked = false;
    return { moved: true, blocked: false, uturnCompleted: false, state: this.getState() };
  }
}
