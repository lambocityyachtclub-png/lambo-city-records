
import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

import StudioAudioEngine from
  "./studioAudioEngine.js";

// LAMBO CITY RECORDS
// FLOOR TWO — MODULAR DRUM STATION
//
// Adds the drum kit to the existing studio.
// Does not rebuild the room or create a second audio engine.
// Drum sounds use the existing kick, snare, and hat channels.

function makeMaterial(color, metalness = 0.25, roughness = 0.38) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness
  });
}

export default {
  init(scene, context) {
    this.scene = scene;
    this.camera = context?.camera;
    this.renderer = context?.renderer;
    this.audio = null;
    this.noiseBuffer = null;

    const studio = scene?.getObjectByName(
      "recordsHQFloor2Studio"
    );

    if (!studio) {
      console.error(
        "LAMBO CITY drums: existing Floor 2 studio was not found."
      );
      return;
    }

    if (!this.camera || !this.renderer) {
      console.error(
        "LAMBO CITY drums: camera or renderer is unavailable."
      );
      return;
    }

    // Prevent accidental duplicate kits if init is called again.
    if (studio.getObjectByName("floor2DrumStation")) {
      console.warn("LAMBO CITY drum station already exists.");
      return;
    }

    const black = makeMaterial(0x10131b, 0.65, 0.3);
    const dark = makeMaterial(0x252a35, 0.5, 0.36);
    const gold = makeMaterial(0xe6bb69, 0.82, 0.25);
    const white = makeMaterial(0xe8e6df, 0.12, 0.32);
    const red = makeMaterial(0x8e2430, 0.3, 0.32);

    const station = new THREE.Group();
    station.name = "floor2DrumStation";

    // Positioned along the room's right side, near the piano.
    // Coordinates are relative to the existing studio group.
    station.position.set(5.05, 0, 2.25);

    const addCylinder = (
      name,
      radius,
      height,
      material,
      x,
      y,
      z,
      rotationX = 0,
      sound = null
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          radius,
          radius,
          height,
          24
        ),
        material
      );

      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.rotation.x = rotationX;

      if (sound) {
        mesh.userData.drumSound = sound;
      }

      station.add(mesh);
      return mesh;
    };

    const addBox = (
      name,
      width,
      height,
      depth,
      material,
      x,
      y,
      z
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
      );

      mesh.name = name;
      mesh.position.set(x, y, z);
      station.add(mesh);
      return mesh;
    };

    // Kick drum — the cylinder faces forward into the room.
    addCylinder(
      "floor2KickDrum",
      0.53,
      0.48,
      black,
      0,
      0.65,
      0.48,
      Math.PI / 2,
      "kick"
    );

    // Front face accent.
    addCylinder(
      "floor2KickDrumFace",
      0.43,
      0.025,
      red,
      0,
      0.65,
      0.735,
      Math.PI / 2,
      "kick"
    );

    // Snare drum.
    addCylinder(
      "floor2SnareDrum",
      0.32,
      0.16,
      white,
      -0.78,
      1.02,
      0.08,
      0,
      "snare"
    );

    // Rack tom.
    addCylinder(
      "floor2RackTom",
      0.28,
      0.22,
      red,
      -0.05,
      1.25,
      -0.18,
      0,
      "tom"
    );

    // Floor tom.
    addCylinder(
      "floor2FloorTom",
      0.33,
      0.34,
      dark,
      0.72,
      0.91,
      -0.08,
      0,
      "tom"
    );

    // Hi-hat stand and cymbals.
    addCylinder(
      "floor2HiHatStand",
      0.035,
      1.25,
      black,
      -1.12,
      0.69,
      -0.05
    );

    addCylinder(
      "floor2HiHatCymbal",
      0.32,
      0.035,
      gold,
      -1.12,
      1.42,
      -0.05,
      0,
      "hat"
    );

    // Crash cymbal and stand.
    addCylinder(
      "floor2CrashStand",
      0.03,
      1.48,
      black,
      -0.95,
      0.83,
      -0.55
    );

    addCylinder(
      "floor2CrashCymbal",
      0.40,
      0.035,
      gold,
      -0.95,
      1.65,
      -0.55,
      0,
      "cymbal"
    );

    // Ride cymbal and stand.
    addCylinder(
      "floor2RideStand",
      0.03,
      1.55,
      black,
      1.13,
      0.85,
      -0.48
    );

    addCylinder(
      "floor2RideCymbal",
      0.43,
      0.035,
      gold,
      1.13,
      1.70,
      -0.48,
      0,
      "cymbal"
    );

    // Simple stand supports.
    [-1.12, -0.95, 1.13].forEach((x) => {
      addCylinder(
        "floor2CymbalStandBase",
        0.16,
        0.035,
        black,
        x,
        0.10,
        x === -0.95 ? -0.55 : (x === 1.13 ? -0.48 : -0.05)
      );
    });

    // Gold floor footprint.
    addBox(
      "floor2DrumRiser",
      2.85,
      0.08,
      2.35,
      black,
      0,
      0.06,
      0.12
    );

    // LAMBO CITY station label.
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 160;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd36a";
    ctx.fillText("DRUM STATION", 384, 80);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 0.72),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })
    );

    sign.name = "floor2DrumStationLabel";
    sign.position.set(0, 2.35, -0.78);
    station.add(sign);

    studio.add(station);

    // Keep the existing studio's station registry in sync.
    if (studio.userData.studioStations) {
      studio.userData.studioStations.drumStation = station;
    }

    this.station = station;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.handleClick = (event) => {
      const rect =
        this.renderer.domElement.getBoundingClientRect();

      if (!rect.width || !rect.height) return;

      this.pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

      this.pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(
        this.pointer,
        this.camera
      );

      const hits =
        this.raycaster.intersectObject(station, true);

      if (!hits.length) return;

      // Use the nearest hit's tagged drum surface.
      let object = hits[0].object;
      let sound = null;

      while (object && object !== station) {
        if (object.userData?.drumSound) {
          sound = object.userData.drumSound;
          break;
        }

        object = object.parent;
      }

      if (sound) {
        this.playDrum(sound);
      }
    };

    this.renderer.domElement.addEventListener(
      "click",
      this.handleClick
    );
  },

  async playDrum(sound) {
    try {
      // Reuse the same audio context and mixer as the Beat Lab.
      this.audio = await StudioAudioEngine.resume();

      if (!this.audio || this.audio.state !== "running") {
        return;
      }

      const now = this.audio.currentTime;
      const channelName =
        sound === "snare" ? "snare" :
        sound === "hat" || sound === "cymbal" ? "hat" :
        "kick";

      const output =
        StudioAudioEngine.getTrackGain(channelName);

      if (sound === "kick") {
        const osc = this.audio.createOscillator();
        const gain = this.audio.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(
          48,
          now + 0.18
        );

        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          now + 0.22
        );

        osc.connect(gain);
        gain.connect(output);
        osc.start(now);
        osc.stop(now + 0.23);
        return;
      }

      if (sound === "tom") {
        const osc = this.audio.createOscillator();
        const gain = this.audio.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(
          85,
          now + 0.20
        );

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          now + 0.25
        );

        osc.connect(gain);
        gain.connect(output);
        osc.start(now);
        osc.stop(now + 0.26);
        return;
      }

      if (!this.noiseBuffer) {
        this.noiseBuffer = this.createNoiseBuffer();
      }

      const noise = this.audio.createBufferSource();
      const filter = this.audio.createBiquadFilter();
      const gain = this.audio.createGain();

      noise.buffer = this.noiseBuffer;

      if (sound === "snare") {
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          now + 0.17
        );
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        noise.start(now);
        noise.stop(now + 0.18);
        return;
      }

      // Hi-hat and cymbal use the shared hat channel.
      filter.type = "highpass";
      filter.frequency.setValueAtTime(
        sound === "cymbal" ? 4200 : 6500,
        now
      );

      const duration = sound === "cymbal" ? 0.32 : 0.065;
      gain.gain.setValueAtTime(
        sound === "cymbal" ? 0.28 : 0.20,
        now
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + duration
      );

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      noise.start(now);
      noise.stop(now + duration + 0.01);
    } catch (error) {
      console.error(
        "LAMBO CITY drum audio error:",
        error
      );
    }
  },

  createNoiseBuffer() {
    const length = this.audio.sampleRate;
    const buffer = this.audio.createBuffer(
      1,
      length,
      this.audio.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  },

  update() {}
};
