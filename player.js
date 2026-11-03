import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

import Collision from "./collision.js";

let player;
let bobTime = 0;

export default {

  init(scene) {

    player = new THREE.Group();

    const bm =
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.8
      });

    const body =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.2,
          1.8,
          0.7
        ),
        bm
      );

    body.position.y = 1.8;

    player.add(body);

    this._bodyMat = bm;
    this._studioBody = body;

    const logo =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.5,
          0.4,
          0.05
        ),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 0.6
        })
      );

    logo.position.set(
      0,
      1.9,
      0.38
    );

    player.add(logo);
    this._studioLogo = logo;

    const head =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.9,
          0.9,
          0.9
        ),
        new THREE.MeshStandardMaterial({
          color: 0x8d5524,
          roughness: 0.9
        })
      );

    head.position.y = 3.15;

    player.add(head);
    this._studioHead = head;

    const cap =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.95,
          0.25,
          0.95
        ),
        new THREE.MeshStandardMaterial({
          color: 0x111111
        })
      );

    cap.position.y = 3.65;

    player.add(cap);
    this._studioCap = cap;

    const brim =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.1,
          0.08,
          0.5
        ),
        new THREE.MeshStandardMaterial({
          color: 0x111111
        })
      );

    brim.position.set(
      0,
      3.52,
      0.55
    );

    player.add(brim);
    this._studioBrim = brim;

    this.armL =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.35,
          1.4,
          0.35
        ),
        new THREE.MeshStandardMaterial({
          color: 0x111111
        })
      );

    this.armL.position.set(
      -0.8,
      1.8,
      0
    );

    player.add(this.armL);

    this.armR =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.35,
          1.4,
          0.35
        ),
        new THREE.MeshStandardMaterial({
          color: 0x111111
        })
      );

    this.armR.position.set(
      0.8,
      1.8,
      0
    );

    player.add(this.armR);

    this.legL =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.45,
          1.6,
          0.45
        ),
        new THREE.MeshStandardMaterial({
          color: 0x222222
        })
      );

    this.legL.position.set(
      -0.35,
      0.6,
      0
    );

    player.add(this.legL);

    this.legR =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.45,
          1.6,
          0.45
        ),
        new THREE.MeshStandardMaterial({
          color: 0x222222
        })
      );

    this.legR.position.set(
      0.35,
      0.6,
      0
    );

    player.add(this.legR);

    [-0.35, 0.35].forEach(x => {

      const shoe =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.5,
            0.25,
            0.7
          ),
          new THREE.MeshStandardMaterial({
            color: 0xffffff
          })
        );

      shoe.position.set(
        x,
        -0.22,
        0.1
      );

      player.add(shoe);

    });

    const chain =
      new THREE.Mesh(
        new THREE.TorusGeometry(
          0.25,
          0.04,
          6,
          12
        ),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 0.4,
          metalness: 1,
          roughness: 0.2
        })
      );

    chain.position.set(
      0,
      2.1,
      0.36
    );

    chain.rotation.x =
      Math.PI / 2;

    player.add(chain);
    this._studioChain = chain;

    player.position.set(
      0,
      1.3,
      10
    );

    scene.add(player);

    /*
      Standard LAMBO CITY movement speed.
      This is the former Shift/sprint speed, now used all the time.
    */

    this.speed = 28;

    this.sprintSpeed = 28;

    /*
      Original LAMBO CITY world-flow
      facing system.

      0 = facing world -Z.
    */

    this._facing = Math.PI;

    player.rotation.y =
      this._facing;

    /*
      Preserve elevator support.
    */

    this._floorY = 1.3;

    this._elevatorY = null;

    return player;
  },

  setFacing(angle = 0) {
    this._facing = angle;
    if (player) {
      player.rotation.y = angle;
    }
  },

  setElevatorFloorY(y) {

    this._floorY = y;

    this._elevatorY = y;

    if (player) {

      player.position.y = y;

    }

  },

  setElevatorTravelY(y) {

    this._elevatorY = y;

    if (player) {

      player.position.y = y;

    }

  },

  clearElevatorControl() {

    this._elevatorY = null;

    if (player) {

      player.position.y =
        this._floorY ?? 1.3;

    }

  },

  setStudioSeatedPose(active) {
    if (!player) return;

    if (active) {
      this._studioBody.position.y = 1.45;
      this._studioHead.position.y = 2.55;
      this._studioCap.position.y = 3.05;
      this._studioBrim.position.y = 2.92;
      this._studioLogo.position.y = 1.58;
      this._studioChain.position.y = 1.76;

      this.armL.position.set(-0.8, 1.48, 0.28);
      this.armR.position.set(0.8, 1.48, 0.28);
      this.armL.rotation.x = -Math.PI / 2;
      this.armR.rotation.x = -Math.PI / 2;

      this.legL.position.set(-0.35, 0.70, 0.48);
      this.legR.position.set(0.35, 0.70, 0.48);
      this.legL.rotation.x = -Math.PI / 2;
      this.legR.rotation.x = -Math.PI / 2;
      this._studioPoseActive = true;
      return;
    }

    this._studioBody.position.y = 1.8;
    this._studioHead.position.y = 3.15;
    this._studioCap.position.y = 3.65;
    this._studioBrim.position.y = 3.52;
    this._studioLogo.position.y = 1.9;
    this._studioChain.position.y = 2.1;

    this.armL.position.set(-0.8, 1.8, 0);
    this.armR.position.set(0.8, 1.8, 0);
    this.armL.rotation.set(0, 0, 0);
    this.armR.rotation.set(0, 0, 0);

    this.legL.position.set(-0.35, 0.6, 0);
    this.legR.position.set(0.35, 0.6, 0);
    this.legL.rotation.set(0, 0, 0);
    this.legR.rotation.set(0, 0, 0);
    this._studioPoseActive = false;
  },

  equipHoodie() {

    if (this._bodyMat) {

      this._bodyMat.color.setHex(
        0x1a0040
      );

      this._bodyMat.emissive =
        new THREE.Color(
          0x9900ff
        );

      this._bodyMat.emissiveIntensity =
        0.2;

    }

  },

  update(delta, context) {

    const input =
      context.systems?.input;

    if (
      !input ||
      !player
    ) {
      return;
    }

    context.player = player;

    if (window.__lamboCityFloor2SessionActive) {
      input.keys.w = input.keys.a = input.keys.s = input.keys.d = false;
      input.keys.shift = false;
      if (input.joystick) {
        input.joystick.x = 0;
        input.joystick.y = 0;
        input.joystick.active = false;
      }

      if (window.__lamboCityFloor2SessionMode === "arrival") {
        bobTime += delta;
        const swing = Math.sin(bobTime * 12) * 0.36;
        this.armL.rotation.x = swing;
        this.armR.rotation.x = -swing;
        this.legL.rotation.x = -swing * 0.6;
        this.legR.rotation.x = swing * 0.6;
      }

      return;
    }

    if (this._studioPoseActive) this.setStudioSeatedPose(false);

    bobTime += delta;

    // Movement is always at the former Shift speed.
    // Shift no longer changes movement or walk animation.
    const sprint = false;

    const speed = this.speed * delta;

    let moving = false;

    let dx = 0;

    let dz = 0;

    /*
      ORIGINAL WORLD MOVEMENT

      W = world -Z
      S = world +Z
      A = world -X
      D = world +X
    */

    if (input.keys?.w) {

      dz = -1;

      moving = true;

    }

    if (input.keys?.s) {

      dz = 1;

      moving = true;

    }

    if (input.keys?.a) {

      dx = -1;

      moving = true;

    }

    if (input.keys?.d) {

      dx = 1;

      moving = true;

    }

    // Floor 3 uses reversed A/D strafe mapping only.
    const onFloor3 =
      player.position.y >= 16.2 &&
      player.position.y < 23.8;

    if (onFloor3) {
      // Floor 3: W toward the boardwalk, S toward the stage.
      // Swap A and D: A moves left and D moves right.
      if (input.keys?.w) dz = 1;
      if (input.keys?.s) dz = -1;
      // Floor 3 strafe directions: A = left (-X), D = right (+X).
      if (input.keys?.a) dx = -1;
      if (input.keys?.d) dx = 1;
    }

    /*
      Joystick follows the keyboard's directional mapping.
      Floor 3 joystick left/right now matches the swapped
      A/D keyboard directions. Floor 3 vertical joystick
      direction still matches W/S. Other floors are unchanged.
    */

    if (
      input.joystick?.active
    ) {

      const joystickX = input.joystick.x;

      const joystickY = onFloor3
        ? -input.joystick.y
        : input.joystick.y;

      if (
        Math.abs(joystickX) > 0.08
      ) {

        dx = joystickX;
        moving = true;

      }

      if (
        Math.abs(joystickY) > 0.08
      ) {

        dz = joystickY;
        moving = true;

      }

    }

    /*
      Normalize diagonal movement.
    */

    if (
      dx !== 0 &&
      dz !== 0
    ) {

      const length =
        Math.sqrt(
          dx * dx +
          dz * dz
        );

      dx /= length;
      dz /= length;

    }

    const newX =
      player.position.x +
      dx * speed;

    const newZ =
      player.position.z +
      dz * speed;

    /*
      Preserve elevator/floor collision
      behavior.
    */

    const collisionY =
      this._elevatorY !== null
        ? this._elevatorY
        : (
            this._floorY ??
            player.position.y ??
            1.3
          );

    /*
      X collision.
    */

    if (
      !Collision.isBlocked(
        newX,
        player.position.z,
        0.6,
        collisionY
      )
    ) {

      player.position.x =
        newX;

    }

    /*
      Z collision.
    */

    if (
      !Collision.isBlocked(
        player.position.x,
        newZ,
        0.6,
        collisionY
      )
    ) {

      player.position.z =
        newZ;

    }

    /*
      ORIGINAL SMOOTH FACING

      The character turns toward
      the direction he is actually
      walking.
    */

    if (
      moving &&
      (dx !== 0 || dz !== 0)
    ) {

      const targetAngle =
        Math.atan2(
          dx,
          dz
        );

      let difference =
        targetAngle -
        this._facing;

      while (
        difference > Math.PI
      ) {

        difference -=
          Math.PI * 2;

      }

      while (
        difference < -Math.PI
      ) {

        difference +=
          Math.PI * 2;

      }

      this._facing +=
        difference *
        Math.min(
          1,
          10 * delta
        );

      player.rotation.y =
        this._facing;

    }

    /*
      Preserve original walking
      animation.
    */

    if (
      this._elevatorY !== null
    ) {

      player.position.y =
        this._elevatorY;

    } else {

      const floorY =
        this._floorY ?? 1.3;

      if (moving) {

        const sw =
          Math.sin(
            bobTime *
            (
              sprint
                ? 16
                : 10
            )
          ) * 0.45;

        this.armL.rotation.x =
          sw;

        this.armR.rotation.x =
          -sw;

        this.legL.rotation.x =
          -sw;

        this.legR.rotation.x =
          sw;

        player.position.y =
          floorY +
          Math.abs(
            Math.sin(
              bobTime *
              (
                sprint
                  ? 16
                  : 10
              ) *
              0.5
            )
          ) * 0.05;

      } else {

        this.armL.rotation.x *=
          0.82;

        this.armR.rotation.x *=
          0.82;

        this.legL.rotation.x *=
          0.82;

        this.legR.rotation.x *=
          0.82;

        player.position.y =
          floorY +
          Math.sin(
            bobTime * 1.2
          ) * 0.025;

      }

    }

    /*
      Preserve hoodie gift system.
    */

    if (
      !this._giftReceived &&
      context.hoodieGifted
    ) {

      this._giftReceived = true;

      this.equipHoodie();

    }

    context.player =
      player;

  }

};
