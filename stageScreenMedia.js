// stageScreenMedia.js
// Plays your own self-hosted video file(s) directly on the stage LED screen
// mesh as a real WebGL texture — always-on ambient visual, separate from the
// tracked YouTube performance opened via the [E] prompt in stageVideo.js.
//
// This is NOT connected to YouTube and doesn't count toward royalty-tracked
// plays — it's purely the visual loop shown on the jumbotron itself. The
// official, tracked play still happens through stageVideo.js's modal.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const SCREEN_MESH_NAME = "stageScreenInner"; // the brighter inner screen panel from world.js

// ---- CONFIG: add as many videos as you want, they'll cycle in order ----
const VIDEO_PLAYLIST = [
  "/assets/videos/tour-clip-1.mp4",
  // "/assets/videos/tour-clip-2.mp4",
  // "/assets/videos/tour-clip-3.mp4",
];

let screen, video, playlistIndex = 0;

function playNext() {
  if (!video || VIDEO_PLAYLIST.length === 0) return;
  video.src = VIDEO_PLAYLIST[playlistIndex];
  video.play().catch(() => {});
  playlistIndex = (playlistIndex + 1) % VIDEO_PLAYLIST.length;
}

export default {
  init(scene) {
    screen = scene.getObjectByName(SCREEN_MESH_NAME);
    if (!screen) return;
    if (VIDEO_PLAYLIST.length === 0) return;

    video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.addEventListener("ended", playNext);

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    screen.material.map = videoTexture;
    screen.material.emissiveIntensity = 0.5;
    screen.material.needsUpdate = true;

    playNext();
  },
  update() {},
};
