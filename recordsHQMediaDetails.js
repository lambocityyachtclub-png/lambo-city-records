// recordsHQMediaDetails.js
// LAMBO CITY RECORDS — FLOOR 1 MEDIA DISPLAY
//
// Gives the existing Floor 1 video wall a live, muted visual feed.
// Playback is visual ambience only; the established Records HQ
// media interaction remains the user-initiated audio/video player.
// This module does not create another prompt, audio stream or screen.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const FLOOR1_REEL =
  "https://res.cloudinary.com/z99sdnqv/video/upload/HERO_-_ARTWORK_tdc7kv.mp4";

let video = null;
let texture = null;
let screen = null;

export default {
  init(scene) {
    if (!scene || video) return null;

    screen = scene.getObjectByName("floor1MediaDisplayScreen");
    if (!screen) return null;

    video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = FLOOR1_REEL;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "auto";

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    screen.material = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false
    });

    video.play().catch(() => {});
    return screen;
  },

  update() {
    if (video && video.paused && !document.hidden) {
      video.play().catch(() => {});
    }
  }
};
