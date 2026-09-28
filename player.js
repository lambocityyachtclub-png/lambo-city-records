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

    /*
      HERO starts facing the same direction
      used by the previous movement system.

      Rotation 0 = forward toward world -Z.
    */
    this._facing = 0;

    this._floorY = 1.3;
    this._elevatorY = null;

    return player;
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


    /*
      ------------------------------------------------
      PLAYER-RELATIVE MOVEMENT
      ------------------------------------------------

      HERO's facing direction determines "forward".

      W  = forward
      S  = backward
      A  = left
      D  = right

      The camera is NOT involved in this calculation.
      ------------------------------------------------
    */

    let forward = 0;
    let right = 0;

    let moving = false;


    /*
      KEYBOARD
    */

    if (input.keys?.w) {
      forward += 1;
      moving = true;
    }

    if (input.keys?.s) {
      forward -= 1;
      moving = true;
    }

    if (input.keys?.a) {
      right -= 1;
      moving = true;
    }

    if (input.keys?.d) {
      right += 1;
      moving = true;
    }


    /*
      MOBILE JOYSTICK

      Joystick Y:
        -1 = forward
        +1 = backward

      Joystick X:
        -1 = left
        +1 = right
    */

    if (input.joystick?.active) {

      const jx =
        input.joystick.x;

      const jy =
        input.joystick.y;


      if (
        Math.abs(jx) > 0.08 ||
        Math.abs(jy) > 0.08
      ) {

        right = jx;

        forward = -jy;

        moving = true;

      }

    }


    /*
      Normalize diagonal movement.
    */

    const inputLength =
      Math.sqrt(
        forward * forward +
        right * right
      );

    if (inputLength > 1) {

      forward /=
        inputLength;

      right /=
        inputLength;

    }


    /*
      Convert player-relative input
      into world movement.

      At rotation 0:

        forward = world -Z
        right   = world +X

      As HERO rotates, these directions
      rotate with him.
    */

    let dx = 0;
    let dz = 0;


    if (moving) {

      const sin =
        Math.sin(
          this._facing
        );

      const cos =
        Math.cos(
          this._facing
        );


      dx =
        (sin * forward) +
        (cos * right);


      dz =
        (-cos * forward) +
        (sin * right);

    }


    /*
      Calculate the new position.
    */

    const newX =
      player.position.x +
      dx * speed;

    const newZ =
      player.position.z +
      dz * speed;


    const collisionY =
      this._elevatorY !== null
        ? this._elevatorY
        : (
            this._floorY ??
            player.position.y ??
            1.3
          );


    /*
      Collision remains exactly the same.
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
      HERO turns toward the direction
      he is actually moving.

      This does NOT control the camera.
    */

    if (
      moving &&
      (dx !== 0 || dz !== 0)
    ) {

      const targetAngle =
        Math.atan2(
          dx,
          -dz
        );


      let diff =
        targetAngle -
        this._facing;


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


    /*
      ELEVATOR FLOOR CONTROL
    */

    if (
      this._elevatorY !== null
    ) {

      player.position.y =
        this._elevatorY;

    } else {

      const floorY =
        this._floorY ??
        1.3;


      /*
        WALK / RUN ANIMATION
      */

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


    /*
      HOODIE GIFT
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
