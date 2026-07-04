import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let player;
let bobTime = 0;

// PHYSICS STATE
let velX = 0;
let velZ = 0;
const ACCEL      = 45;
const DECEL      = 28;
const MAX_SPEED  = 14;
const SPRINT_MAX = 26;
const TURN_SPEED = 12;

let currentAngle = 0;
let targetAngle  = 0;

export default {
  init(scene) {
    player = new THREE.Group();

    // SHARED MATERIALS
    var darkMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    var dark2Mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    var skinMat  = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.9 });
    var whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var goldMat  = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.6
    });

    // BODY
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.7), darkMat);
    body.position.y = 1.8;
    player.add(body);
    this._bodyMat = darkMat;

    // GOLD LOGO
    var logo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.05), goldMat);
    logo.position.set(0, 1.9, 0.38);
    player.add(logo);

    // HEAD
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), skinMat);
    head.position.y = 3.15;
    player.add(head);
    this._head = head;

    // CAP
    var cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.25, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    cap.position.y = 3.65;
    player.add(cap);

    var brim = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    brim.position.set(0, 3.52, 0.55);
    player.add(brim);

    // ARMS
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), darkMat);
    this.armL.position.set(-0.8, 1.8, 0);
    this.armL.geometry.translate(0, -0.7, 0); // pivot from shoulder
    player.add(this.armL);

    this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), darkMat);
    this.armR.position.set(0.8, 1.8, 0);
    this.armR.geometry.translate(0, -0.7, 0);
    player.add(this.armR);

    // LEGS
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.6, 0.45), dark2Mat);
    this.legL.position.set(-0.32, 1.1, 0);
    this.legL.geometry.translate(0, -0.8, 0); // pivot from hip
    player.add(this.legL);

    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.6, 0.45), dark2Mat);
    this.legR.position.set(0.32, 1.1, 0);
    this.legR.geometry.translate(0, -0.8, 0);
    player.add(this.legR);

    // SHOES
    [-0.32, 0.32].forEach(function(x) {
      var shoe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.72), whiteMat);
      shoe.position.set(x, -0.1, 0.08);
      player.add(shoe);
    });

    // GOLD CHAIN
    var chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.04, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700,
        emissiveIntensity: 0.4, metalness: 1, roughness: 0.2
      })
    );
    chain.position.set(0, 2.1, 0.36);
    chain.rotation.x = Math.PI / 2;
    player.add(chain);

    // PLAYER GLOW
    var glow = new THREE.PointLight(0xffd700, 0.6, 5);
    glow.position.set(0, 2, 0);
    player.add(glow);

    player.position.set(0, 1.3, 10);
    scene.add(player);

    this.speed      = MAX_SPEED;
    this.sprintSpeed = SPRINT_MAX;
    this._giftReceived = false;
    this._moving = false;
    this._animPhase = 0;

    return player;
  },

  equipHoodie() {
    if (this._bodyMat) {
      this._bodyMat.color.setHex(0x1a0040);
      this._bodyMat.emissive = new THREE.Color(0x9900ff);
      this._bodyMat.emissiveIntensity = 0.2;
    }
  },

  update(delta, context) {
    var input = context.systems?.input;
    if (!input || !player) return;

    bobTime += delta;

    var sprint = input.keys?.shift;
    var maxSpeed = sprint ? SPRINT_MAX : MAX_SPEED;

    // INPUT VECTOR
    var inputX = 0;
    var inputZ = 0;

    if (input.keys?.w) inputZ = -1;
    if (input.keys?.s) inputZ =  1;
    if (input.keys?.a) inputX = -1;
    if (input.keys?.d) inputX =  1;

    // JOYSTICK
    if (input.joystick?.active) {
      var jx = input.joystick.x;
      var jy = input.joystick.y;
      if (Math.abs(jx) > 0.08) inputX = jx;
      if (Math.abs(jy) > 0.08) inputZ = jy;
    }

    var hasInput = (inputX !== 0 || inputZ !== 0);
    this._moving = hasInput;

    // NORMALIZE DIAGONAL
    if (inputX !== 0 && inputZ !== 0) {
      var len = Math.sqrt(inputX*inputX + inputZ*inputZ);
      inputX /= len;
      inputZ /= len;
    }

    // SMOOTH ACCELERATION
    if (hasInput) {
      velX += inputX * ACCEL * delta;
      velZ += inputZ * ACCEL * delta;
    } else {
      // DECELERATION
      velX *= Math.max(0, 1 - DECEL * delta);
      velZ *= Math.max(0, 1 - DECEL * delta);
    }

    // CLAMP TO MAX SPEED
    var currentSpeed = Math.sqrt(velX*velX + velZ*velZ);
    if (currentSpeed > maxSpeed) {
      var scale = maxSpeed / currentSpeed;
      velX *= scale;
      velZ *= scale;
    }

    // APPLY MOVEMENT
    player.position.x += velX * delta;
    player.position.z += velZ * delta;

    // SMOOTH ROTATION — only when moving
    if (hasInput) {
      targetAngle = Math.atan2(inputX, inputZ);
      var diff = targetAngle - currentAngle;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      currentAngle += diff * Math.min(1, TURN_SPEED * delta);
      player.rotation.y = currentAngle;
    }

    // ANIMATION
    var speed = Math.sqrt(velX*velX + velZ*velZ);
    if (speed > 0.5) {
      this._animPhase += delta * (sprint ? 18 : 10);
      var swing = Math.sin(this._animPhase) * 0.55;
      var legSwing = Math.sin(this._animPhase) * 0.65;

      this.armL.rotation.x =  swing;
      this.armR.rotation.x = -swing;
      this.legL.rotation.x = -legSwing;
      this.legR.rotation.x =  legSwing;

      // HEAD BOB
      this._head.position.y = 3.15 + Math.abs(Math.sin(this._animPhase)) * 0.05;

      // BODY SWAY
      player.position.y = 1.3 + Math.abs(Math.sin(this._animPhase)) * 0.04;

    } else {
      // SMOOTH IDLE RETURN
      this.armL.rotation.x += (0 - this.armL.rotation.x) * 0.15;
      this.armR.rotation.x += (0 - this.armR.rotation.x) * 0.15;
      this.legL.rotation.x += (0 - this.legL.rotation.x) * 0.15;
      this.legR.rotation.x += (0 - this.legR.rotation.x) * 0.15;
      this._head.position.y = 3.15;

      // IDLE BREATH
      player.position.y = 1.3 + Math.sin(bobTime * 1.0) * 0.025;
    }

    if (!this._giftReceived && context.hoodieGifted) {
      this._giftReceived = true;
      this.equipHoodie();
    }

    context.player = player;
  }
};
