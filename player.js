import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let player;
let bobTime = 0;

export default {
  init(scene) {
    player = new THREE.Group();

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
    );
    body.position.y = 1.8;
    player.add(body);

    var logo = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.6
      })
    );
    logo.position.set(0, 1.9, 0.38);
    player.add(logo);

    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.9 })
    );
    head.position.y = 3.15;
    player.add(head);

    var cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.25, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    cap.position.y = 3.65;
    player.add(cap);

    var capBrim = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    capBrim.position.set(0, 3.52, 0.55);
    player.add(capBrim);

    this.armL = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.4, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    this.armL.position.set(-0.8, 1.8, 0);
    player.add(this.armL);

    this.armR = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.4, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    this.armR.position.set(0.8, 1.8, 0);
    player.add(this.armR);

    this.legL = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 1.6, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    this.legL.position.set(-0.35, 0.6, 0);
    player.add(this.legL);

    this.legR = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 1.6, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    this.legR.position.set(0.35, 0.6, 0);
    player.add(this.legR);

    [-0.35, 0.35].forEach(function(x) {
      var shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.25, 0.7),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      shoe.position.set(x, -0.22, 0.1);
      player.add(shoe);
    });

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
    var glow = new THREE.PointLight(0xffd700, 0.8, 6);
    glow.position.set(0, 2, 0);
    player.add(glow);

    player.position.set(0, 0.3, 10);
    scene.add(player);

    this.speed = 8;
    this.sprintSpeed = 16;
    return player;
  },

  update(delta, context) {
    var input = context.systems?.input;
    if (!input || !player) return;

    bobTime += delta;

    var sprint = input.keys?.shift;
    var speed = sprint ? this.sprintSpeed : this.speed;
    var move = speed * delta;
    var moving = false;
    var dx = 0, dz = 0;

    // KEYBOARD
    if (input.keys?.w) { dz = -1; moving = true; }
    if (input.keys?.s) { dz =  1; moving = true; }
    if (input.keys?.a) { dx = -1; moving = true; }
    if (input.keys?.d) { dx =  1; moving = true; }

    // JOYSTICK
    if (input.joystick && input.joystick.active) {
      var jx = input.joystick.x;
      var jy = input.joystick.y;
      if (Math.abs(jx) > 0.1 || Math.abs(jy) > 0.1) {
        dx = jx;
        dz = jy;
        moving = true;
        speed = this.speed * Math.min(1, Math.sqrt(jx*jx + jy*jy));
        move = speed * delta;
      }
    }

    player.position.x += dx * move;
    player.position.z += dz * move;

    // FACE DIRECTION
    if (moving && (dx !== 0 || dz !== 0)) {
      var angle = Math.atan2(dx, dz);
      player.rotation.y = angle;
    }

    // WALK ANIMATION
    if (moving) {
      var swing = Math.sin(bobTime * (sprint ? 16 : 10)) * 0.4;
      this.armL.rotation.x =  swing;
      this.armR.rotation.x = -swing;
      this.legL.rotation.x = -swing;
      this.legR.rotation.x =  swing;
    } else {
      this.armL.rotation.x *= 0.85;
      this.armR.rotation.x *= 0.85;
      this.legL.rotation.x *= 0.85;
      this.legR.rotation.x *= 0.85;
      player.position.y = 0.3 + Math.sin(bobTime * 1.5) * 0.04;
    }

    context.player = player;
  }
};
