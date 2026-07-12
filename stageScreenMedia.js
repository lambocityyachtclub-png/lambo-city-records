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
  "https://res.cloudinary.com/z99sdnqv/video/upload/HERO_-_ARTWORK_tdc7kv.mp4",
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

    // FIX: the screen's original material color/emissive were both bright
    // purple (from world.js), which tints and washes out any texture placed
    // on top of it. Setting color to white removes the tint so the video
    // shows its true colors, and a small emissiveIntensity keeps a subtle
    // glow without washing the picture out.
    screen.material.color.setHex(0xffffff);
    screen.material.emissive.setHex(0x330055);
    screen.material.emissiveIntensity = 0.15;
    screen.material.needsUpdate = true;

    playNext();
  },
  update() {},
};
