
import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

import StudioAudioEngine from
  "./studioAudioEngine.js";

// LAMBO CITY RECORDS
// FLOOR TWO — INTERACTIVE PIANO STATION
// Uses the shared studio audio engine.
// Preserves the existing 3D room and instruments.

const NOTES = [
  261.63, 293.66, 329.63, 349.23,
  392.00, 440.00, 493.88, 523.25,
  587.33, 659.25, 698.46, 783.99,
  880.00, 987.77, 1046.50, 1174.66
];

export default {
  init(scene, context) {
    this.scene = scene;
    this.camera = context?.camera;
    this.renderer = context?.renderer;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.activeNotes = new Set();

    if (!this.camera || !this.renderer) {
      console.warn(
        "LAMBO CITY Piano: camera or renderer unavailable."
      );
      return;
    }

    this.handleClick = (event) => {
      const studio = this.scene.getObjectByName(
        "recordsHQFloor2Studio"
      );

      const piano = studio?.getObjectByName(
        "floor2InstrumentStation"
      );

      if (!piano) return;

      const rect =
        this.renderer.domElement.getBoundingClientRect();

      this.pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

      this.pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(
        this.pointer,
        this.camera
      );

      const hits =
        this.raycaster.intersectObject(piano, true);

      if (!hits.length) return;

      // Convert the hit position into piano-station space.
      piano.updateWorldMatrix(true, false);

      const localHit = piano.worldToLocal(
        hits[0].point.clone()
      );

      // Existing keys run along the station's local Z axis.
      const index = Math.max(
        0,
        Math.min(
          NOTES.length - 1,
          Math.round((localHit.z + 1.9) / 0.22)
        )
      );

      this.playNote(NOTES[index]);
    };

    this.renderer.domElement.addEventListener(
      "click",
      this.handleClick
    );
  },

  async playNote(frequency) {
    try {
      const audio = await StudioAudioEngine.resume();

      if (!audio || audio.state !== "running") {
        return;
      }

      // Route the piano through the existing master chain.
      const output = StudioAudioEngine.master;

      if (!output) return;

      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(
        frequency,
        now
      );

      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(
        0.22,
        now + 0.025
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.75
      );

      oscillator.connect(envelope);
      envelope.connect(output);

      oscillator.start(now);
      oscillator.stop(now + 0.8);
    } catch (error) {
      console.error(
        "LAMBO CITY piano audio error:",
        error
      );
    }
  },

  update() {}
};
