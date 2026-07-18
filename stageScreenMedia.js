// stageScreenMedia.js
// Plays your own self-hosted video file(s) directly on the stage LED screen
// mesh as a real WebGL texture — always-on ambient visual, separate from the
// tracked YouTube performance opened via the [E] prompt in stageVideo.js.
//
// This is NOT connected to YouTube and doesn't count toward royalty-tracked
// plays — it's purely the visual loop shown on the jumbotron itself. The
// official, tracked play still happens through stageVideo.js's modal.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const INNER_SCREEN_NAME = "stageScreenInner"; // the video panel itself
const OUTER_SCREEN_NAME = "stageScreenOuter"; // the frame/bezel around it

// ---- CONFIG: add as many videos as you want, they'll cycle in order ----
const VIDEO_PLAYLIST = [
  "https://res.cloudinary.com/z99sdnqv/video/upload/Hollywood_Hero_-_Hollywood_LCYC_Music_Video_cnpk9n.mp4",
];

let video, playlistIndex = 0;

function playNext() {
  if (!video || VIDEO_PLAYLIST.length === 0) return;
  video.src = VIDEO_PLAYLIST[playlistIndex];
  video.play().catch(() => {});
  playlistIndex = (playlistIndex + 1) % VIDEO_PLAYLIST.length;
}

export default {
  init(scene) {
    const inner = scene.getObjectByName(INNER_SCREEN_NAME);
    const outer = scene.getObjectByName(OUTER_SCREEN_NAME);
    if (!inner) return;
    if (VIDEO_PLAYLIST.length === 0) return;

    video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.addEventListener("ended", playNext);

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    inner.material.color.setHex(0x000000);
    inner.material.map = null;
    inner.material.emissive.setHex(0xffffff);
    inner.material.emissiveMap = videoTexture;
    inner.material.emissiveIntensity = 1.0;
    inner.material.needsUpdate = true;

    if (outer) {
      outer.material.color.setHex(0x0a0a0a);
      outer.material.emissive.setHex(0x000000);
      outer.material.emissiveIntensity = 0;
      outer.material.needsUpdate = true;
    }

    playNext();
  },
  update() {},
  setVolume(v) {
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, v));
    video.muted = clamped <= 0.001;
    video.volume = clamped;
  },
};
