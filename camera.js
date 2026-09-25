import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

let camera;
let cinTime = 0;

const HQ_CENTER_X = 28;
const HQ_CENTER_Z = 22;

function getHQFloor(y) {

  if (y < 8) {
    return 1;
  }

  if (y < 16.2) {
    return 2;
  }

  if (y < 23.8) {
    return 3;
  }

  return 4;
}

function isInsideHQ(player) {

  const x =
    player.position.x;

  const z =
    player.position.z;

  return (
    x >= 19 &&
    x <= 37 &&
    z >= 12.5 &&
    z <= 29.5
  );

}

export default {

  init() {

    camera =
      new THREE.PerspectiveCamera(
        65,
        window.innerWidth /
          window.innerHeight,
        0.1,
        2000
      );

    camera.position.set(
      0,
      16,
      30
    );

    camera.lookAt(
      0,
      2,
      0
    );


    window.addEventListener(
      "resize",
      () => {

        camera.aspect =
          window.innerWidth /
          window.innerHeight;

        camera.updateProjectionMatrix();

      }
    );


    return camera;

  },


  update(delta, context) {

    const player =
      context.player;

    if (!player) {
      return;
    }


    cinTime += delta;


    const insideHQ =
      isInsideHQ(player);


    // ==========================================================
    // NORMAL WORLD CAMERA
    // ==========================================================

    if (!insideHQ) {

      const drift =
        Math.sin(
          cinTime * 0.25
        ) *
        1.2;


      const tx =
        player.position.x +
        drift;

      const ty =
        player.position.y +
        13;

      const tz =
        player.position.z +
        22;


      camera.position.x +=
        (tx - camera.position.x) *
        0.06;

      camera.position.y +=
        (ty - camera.position.y) *
        0.06;

      camera.position.z +=
        (tz - camera.position.z) *
        0.06;


      camera.lookAt(
        player.position.x,
        player.position.y + 2,
        player.position.z - 5
      );


      return;

    }


    // ==========================================================
    // RECORDS HQ CAMERA
    // ==========================================================

    const floor =
      getHQFloor(
        player.position.y
      );


    // More intimate interior framing.
    //
    // The higher HERO goes, the more the camera follows
    // the actual floor instead of looking down from far above.

    let heightOffset = 7.5;
    let distanceOffset = 13;


    if (floor === 2) {

      heightOffset = 7.0;
      distanceOffset = 13;

    }


    if (floor === 3) {

      heightOffset = 7.0;
      distanceOffset = 13;

    }


    if (floor === 4) {

      heightOffset = 6.8;
      distanceOffset = 12;

    }


    const interiorDrift =
      Math.sin(
        cinTime * 0.22
      ) *
      0.7;


    const tx =
      player.position.x +
      interiorDrift;


    const ty =
      player.position.y +
      heightOffset;


    const tz =
      player.position.z +
      distanceOffset;


    camera.position.x +=
      (tx - camera.position.x) *
      0.055;

    camera.position.y +=
      (ty - camera.position.y) *
      0.055;

    camera.position.z +=
      (tz - camera.position.z) *
      0.055;


    // Look slightly downward into the actual floor
    // rather than several meters above HERO.

    camera.lookAt(
      player.position.x,
      player.position.y + 1.8,
      player.position.z - 4.5
    );

  },


  getCamera() {
    return camera;
  }

};
