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

    // HERO's visual front is +Z.
    // W moves HERO toward -Z.
    // Therefore HERO initially faces -Z.
    this._facing = Math.PI;

    player.rotation.y =
      this._facing;

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


    let moving = false;

    let dx = 0;
    let dz = 0;

    let moveMode =
      "idle";


    // ==========================================================
    // HERO-RELATIVE CONTROLS
    // ==========================================================
    //
    // W = HERO forward
    // S = HERO backward
    // A = HERO left
    // D = HERO right
    //
    // The camera does NOT control movement.
    // HERO's facing controls movement.
    //
    // ==========================================================

    const forwardPressed =
      !!input.keys?.w;

    const backwardPressed =
      !!input.keys?.s;

    const leftPressed =
      !!input.keys?.a;

    const rightPressed =
      !!input.keys?.d;


    // ==========================================================
    // HERO FACING
    // ==========================================================
    //
    // W/S establish HERO's forward direction.
    //
    // A/D are pure strafing controls.
    // They never rotate HERO.
    //
    // HERO visual front = +Z
    //
    // W = -Z = Math.PI
    // S = +Z = 0
    //
    // ==========================================================

    let targetFacing =
      null;


    if (
      forwardPressed &&
      !backwardPressed
    ) {

      targetFacing =
        Math.PI;

    } else if (
      backwardPressed &&
      !forwardPressed
    ) {

      targetFacing =
        0;

    }


    // ==========================================================
    // MOBILE JOYSTICK FACING
    // ==========================================================

    if (
      input.joystick?.active &&
      Math.abs(
        input.joystick.y
      ) > 0.18
    ) {

      if (
        input.joystick.y < 0
      ) {

        // Joystick up = HERO forward.
        targetFacing =
          Math.PI;

      } else {

        // Joystick down = HERO backward.
        targetFacing =
          0;

      }

    }


    // ==========================================================
    // SMOOTH HERO ROTATION
    // ==========================================================

    if (
      targetFacing !== null
    ) {

      let diff =
        targetFacing -
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


    // ==========================================================
    // LOCAL HERO MOVEMENT
    // ==========================================================
    //
    // localX:
    //
    //   -1 = HERO left
    //    1 = HERO right
    //
    // localZ:
    //
    //   -1 = HERO forward
    //    1 = HERO backward
    //
    // ==========================================================

    let localX =
      0;

    let localZ =
      0;


    if (
      forwardPressed
    ) {

      localZ =
        -1;

      moving =
        true;

    }


    if (
      backwardPressed
    ) {

      localZ =
        1;

      moving =
        true;

    }


    if (
      leftPressed
    ) {

      localX =
        -1;

      moving =
        true;

    }


    if (
      rightPressed
    ) {

      localX =
        1;

      moving =
        true;

    }


    // ==========================================================
    // MOBILE JOYSTICK
    // ==========================================================
    //
    // Up    = HERO forward
    // Down  = HERO backward
    // Left  = HERO left
    // Right = HERO right
    //
    // ==========================================================

    if (
      input.joystick?.active
    ) {

      if (
        Math.abs(
          input.joystick.x
        ) > 0.08
      ) {

        localX =
          input.joystick.x;

        moving =
          true;

      }


      if (
        Math.abs(
          input.joystick.y
        ) > 0.08
      ) {

        localZ =
          input.joystick.y;

        moving =
          true;

      }

    }


    // ==========================================================
    // HERO LOCOMOTION STATE
    // ==========================================================

    if (
      moving
    ) {

      const hasForward =
        localZ < -0.08;

      const hasBackward =
        localZ > 0.08;

      const hasLeft =
        localX < -0.08;

      const hasRight =
        localX > 0.08;


      if (
        hasForward &&
        !hasLeft &&
        !hasRight
      ) {

        moveMode =
          "forward";

      } else if (
        hasBackward &&
        !hasLeft &&
        !hasRight
      ) {

        moveMode =
          "backward";

      } else if (
        hasLeft &&
        !hasForward &&
        !hasBackward
      ) {

        moveMode =
          "strafe-left";

      } else if (
        hasRight &&
        !hasForward &&
        !hasBackward
      ) {

        moveMode =
          "strafe-right";

      } else {

        moveMode =
          "diagonal";

      }

    }


    // ==========================================================
    // NORMALIZE DIAGONAL INPUT
    // ==========================================================

    if (
      localX !== 0 &&
      localZ !== 0
    ) {

      const length =
        Math.sqrt(
          localX * localX +
          localZ * localZ
        );

      localX /=
        length;

      localZ /=
        length;

    }


    // ==========================================================
    // CONVERT HERO-RELATIVE MOVEMENT
    // TO WORLD MOVEMENT
    // ==========================================================
    //
    // HERO forward:
    //
    //   forwardX = sin(rotation)
    //   forwardZ = cos(rotation)
    //
    // HERO right:
    //
    //   rightX = cos(rotation)
    //   rightZ = -sin(rotation)
    //
    // ==========================================================

    const yaw =
      this._facing;


    const forwardX =
      Math.sin(yaw);

    const forwardZ =
      Math.cos(yaw);


    const rightX =
      Math.cos(yaw);

    const rightZ =
      -Math.sin(yaw);


    dx =
      rightX * localX +
      forwardX * localZ;

    dz =
      rightZ * localX +
      forwardZ * localZ;


    // ==========================================================
    // CALCULATE NEW POSITION
    // ==========================================================

    const newX =
      player.position.x +
      dx * speed;

    const newZ =
      player.position.z +
      dz * speed;


    // ==========================================================
    // CURRENT FLOOR HEIGHT
    // ==========================================================

    const collisionY =
      this._elevatorY !== null
        ? this._elevatorY
        : (
            this._floorY ??
            player.position.y ??
            1.3
          );


    // ==========================================================
    // X COLLISION
    // ==========================================================

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


    // ==========================================================
    // Z COLLISION
    // ==========================================================

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


    // ==========================================================
    // VERTICAL POSITION / WALK ANIMATION
    // ==========================================================

    if (
      this._elevatorY !== null
    ) {

      player.position.y =
        this._elevatorY;

    } else {

      const floorY =
        this._floorY ??
        1.3;


      if (
        moving
      ) {

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


    // ==========================================================
    // HOODIE
    // ==========================================================

    if (
      !this._giftReceived &&
      context.hoodieGifted
    ) {

      this._giftReceived =
        true;

      this.equipHoodie();

    }


    // ==========================================================
    // SHARE PLAYER
    // ==========================================================

    context.player =
      player;

  }

};
