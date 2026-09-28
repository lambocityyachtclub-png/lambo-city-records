// stageAudioZone.js
// LAMBO CITY
//
// GRAND STAGE PROXIMITY SYSTEM
//
// IMPORTANT:
// This system no longer starts "Let's Rage".
//
// heroPerformance.js is the single owner of the
// HERO performance and its performance music.
//
// This file only maintains the stage proximity state
// and keeps the Jumbotron media muted.
//
// That prevents two separate audio systems from
// fighting over the same performance track.

import StageScreenMedia from "./stageScreenMedia.js";


const ZONES = [

  {
    meshName: "stageScreenOuter",
    radius: 45
  }

];


let scene;

let externallyPaused = false;

const zoneState =
  ZONES.map(() => ({

    mesh: null,

    inZone: false,

    fade: 0

  }));


export default {


  init(scene_) {

    scene =
      scene_;

  },


  update(delta, context) {

    if (
      !scene ||
      externallyPaused
    ) {

      return;

    }


    const player =
      context.player;


    if (!player) {
      return;
    }


    ZONES.forEach(
      (zone, i) => {

        const state =
          zoneState[i];


        /*
          Find the existing Jumbotron.
        */

        if (!state.mesh) {

          state.mesh =
            scene.getObjectByName(
              zone.meshName
            );

          if (!state.mesh) {

            return;

          }

        }


        const dx =
          player.position.x -
          state.mesh.position.x;


        const dz =
          player.position.z -
          state.mesh.position.z;


        const distance =
          Math.sqrt(
            dx * dx +
            dz * dz
          );


        const inZone =
          distance <=
          zone.radius;


        state.inZone =
          inZone;


        /*
          Keep a simple proximity fade value
          available for future HUD/cinematic use.
        */

        const target =
          inZone ? 1 : 0;


        const step =
          delta / 1.5;


        if (
          state.fade < target
        ) {

          state.fade =
            Math.min(
              target,
              state.fade + step
            );

        } else if (
          state.fade > target
        ) {

          state.fade =
            Math.max(
              target,
              state.fade - step
            );

        }


        /*
          The Jumbotron's own loop remains visual-only.
        */

        StageScreenMedia.setVolume(
          0
        );

      }
    );

  },


  pause() {

    externallyPaused =
      true;

    StageScreenMedia.setVolume(
      0
    );

  },


  resume() {

    externallyPaused =
      false;

  },


  isInAnyZone() {

    return zoneState.some(
      state =>
        state.fade > 0.5
    );

  }

};
