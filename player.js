import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

import Collision from "./collision.js";

let player, bobTime = 0;

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


    player.position.set(
      0,
      1.3,
      10
    );

    scene.add(player);


    this.speed = 10;
    this.sprintSpeed = 18;

    this._facing = 0;

    // ----------------------------------------------------------
    // FLOOR / ELEVATOR VERTICAL CONTROL
    // ----------------------------------------------------------

    this._floorY = 1.3;
    this._elevatorY = null;


    return player;
  },


  // ============================================================
  // ELEVATOR ARRIVAL
  // ============================================================

  setElevatorFloorY(y) {

    this._floorY = y;
    this._elevatorY = y;

    if (player) {
      player.position.y = y;
    }

  },


  // ============================================================
  // ELEVATOR TRAVEL
  // ============================================================

  setElevatorTravelY(y) {

    this._elevatorY = y;

    if (player) {
      player.position.y = y;
    }

  },


  // ============================================================
  // RETURN CONTROL TO NORMAL GAMEPLAY
  // ============================================================

  clearElevatorControl() {

    this._elevatorY = null;

    if (player) {
      player.position.y =
        this._floorY ?? 1.3;
    }

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


  // ============================================================
  // UPDATE
  // ============================================================

  update(delta, context) {

    const input =
      context.systems?.input;

    if (!input || !player) {
      return;
    }

    bobTime += delta;


    const sprint =
      input.keys?.shift;

    const speed =
      (sprint
        ? this.sprintSpeed
        : this.speed) * delta;


    let moving = false;

    let dx = 0;
    let dz = 0;


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


    if (input.joystick?.active) {

      if (
        Math.abs(
          input.joystick.x
        ) > 0.08
      ) {

        dx =
          input.joystick.x;

        moving = true;

      }


      if (
        Math.abs(
          input.joystick.y
        ) > 0.08
      ) {

        dz =
          input.joystick.y;

        moving = true;

      }

    }


    if (
      dx !== 0 &&
      dz !== 0
    ) {

      const l =
        Math.sqrt(
          dx * dx +
          dz * dz
        );

      dx /= l;
      dz /= l;

    }


    const newX =
      player.position.x +
      dx * speed;

    const newZ =
      player.position.z +
      dz * speed;


    // ----------------------------------------------------------
    // CURRENT FLOOR HEIGHT
    // ----------------------------------------------------------

    const collisionY =
      this._elevatorY !== null
        ? this._elevatorY
        : (
            this._floorY ??
            player.position.y ??
            1.3
          );


    // ----------------------------------------------------------
    // X COLLISION
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // Z COLLISION
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // ROTATION
    // ----------------------------------------------------------

    if (
      moving &&
      (dx !== 0 || dz !== 0)
    ) {

      const ta =
        Math.atan2(
          dx,
          dz
        );

      let diff =
        ta - this._facing;


      while (
        diff > Math.PI
      ) {

        diff -=
          Math.PI * 2;

      }


      while (
        diff < -Math.PI
      ) {

        diff +=
          Math.PI * 2;

      }


      this._facing +=
        diff *
        Math.min(
          1,
          10 * delta
        );

      player.rotation.y =
        this._facing;

    }


    // ----------------------------------------------------------
    // VERTICAL POSITION
    // ----------------------------------------------------------

    if (
      this._elevatorY !== null
    ) {

      player.position.y =
        this._elevatorY;

    } else {

      const floorY =
        this._floorY ??
        1.3;


      if (moving) {

        const sw =
          Math.sin(
            bobTime *
            (sprint ? 16 : 10)
          ) *
          0.45;


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
              (sprint ? 16 : 10) *
              0.5
            )
          ) *
          0.05;

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
          ) *
          0.025;

      }

    }


    // ----------------------------------------------------------
    // HOODIE
    // ----------------------------------------------------------

    if (
      !this._giftReceived &&
      context.hoodieGifted
    ) {

      this._giftReceived = true;
      this.equipHoodie();

    }


    // ----------------------------------------------------------
    // SHARE PLAYER
    // ----------------------------------------------------------

    context.player =
      player;

  }

};
