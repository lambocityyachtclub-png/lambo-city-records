// stageVideo.js
// Overlays a real YouTube iframe onto the stage LED screen mesh, matching
// its exact world position/rotation/perspective every frame — same technique
// Three.js's own CSS3DRenderer uses. Playback is 100% native user-click,
// no autoplay, no synthetic triggers — YouTube Content ID / royalty
// tracking stays valid.
//
// SAFARI NOTE: iframes nested inside CSS 3D transforms are a known trouble spot
// in WebKit. This version adds forced GPU-layer promotion (translateZ(0),
// backface-visibility, will-change) and explicit pixel sizing to work around it.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// ---- CONFIG: swap the track here, nothing else needs to change ----
const TRACK = {
  videoId: "9mNaRK-CnQk",
  title: "Track Title",        // ← replace with the actual song title
  artist: "Hero",
  label: "Lambo City Records",
};

const SCREEN_MESH_NAME = "stageScreenOuter"; // must match the .name set in world.js
const SCREEN_WORLD_WIDTH = 28;  // matches screen BoxGeometry width in world.js
const SCREEN_WORLD_HEIGHT = 14; // matches screen BoxGeometry height in world.js
const ACTIVATION_DISTANCE = 220; // only do the heavy per-frame CSS3D work this close to the stage

let scene, screenMesh;
let built = false;
let outerEl, cameraEl, videoEl, iframeEl, labelEl;
const tmpVec3 = new THREE.Vector3(); // reused every frame to avoid GC churn on iPad

function epsilon(v) {
  return Math.abs(v) < 1e-10 ? 0 : v;
}

function getCameraCSSMatrix(m) {
  const e = m.elements;
  return (
    "matrix3d(" +
    epsilon(e[0]) + "," + epsilon(-e[1]) + "," + epsilon(e[2]) + "," + epsilon(e[3]) + "," +
    epsilon(e[4]) + "," + epsilon(-e[5]) + "," + epsilon(e[6]) + "," + epsilon(e[7]) + "," +
    epsilon(e[8]) + "," + epsilon(-e[9]) + "," + epsilon(e[10]) + "," + epsilon(e[11]) + "," +
    epsilon(e[12]) + "," + epsilon(-e[13]) + "," + epsilon(e[14]) + "," + epsilon(e[15]) +
    ")"
  );
}

function getObjectCSSMatrix(m) {
  const e = m.elements;
  return (
    "translate(-50%,-50%)matrix3d(" +
    epsilon(e[0]) + "," + epsilon(e[1]) + "," + epsilon(e[2]) + "," + epsilon(e[3]) + "," +
    epsilon(-e[4]) + "," + epsilon(-e[5]) + "," + epsilon(-e[6]) + "," + epsilon(-e[7]) + "," +
    epsilon(e[8]) + "," + epsilon(e[9]) + "," + epsilon(e[10]) + "," + epsilon(e[11]) + "," +
    epsilon(e[12]) + "," + epsilon(e[13]) + "," + epsilon(e[14]) + "," + epsilon(e[15]) +
    ")"
  );
}

function set3DStyle(el) {
  el.style.transformStyle = "preserve-3d";
  el.style.webkitTransformStyle = "preserve-3d";
}

function forceCompositingLayer(el) {
  // Standard Safari/WebKit fix: forces the browser to treat this element as its
  // own GPU-composited layer, which resolves a known class of bugs where iframes
  // nested inside 3D-transformed ancestors silently fail to render in WebKit.
  el.style.webkitBackfaceVisibility = "hidden";
  el.style.backfaceVisibility = "hidden";
  el.style.willChange = "transform";
}

function setTransform(el, value) {
  el.style.transform = value;
  el.style.webkitTransform = value;
}

function buildDOM() {
  // Outer wrapper — fullscreen, invisible, never blocks clicks on the rest of the page
  outerEl = document.createElement("div");
  outerEl.style.position = "fixed";
  outerEl.style.top = "0";
  outerEl.style.left = "0";
  outerEl.style.width = "100%";
  outerEl.style.height = "100%";
  // NOTE: no overflow:hidden here on purpose — it can cause WebKit to flatten/clip
  // nested 3D-transformed content unpredictably, including silently dropping iframes.
  outerEl.style.pointerEvents = "none";
  outerEl.style.zIndex = "5"; // above the WebGL canvas, below HUD (raise HUD z-index if needed)
  set3DStyle(outerEl); // REQUIRED on Safari for nested 3D transforms to render at all

  // Camera-space wrapper — receives the camera's CSS matrix each frame
  cameraEl = document.createElement("div");
  cameraEl.style.position = "absolute";
  cameraEl.style.top = "0";
  cameraEl.style.left = "0";
  set3DStyle(cameraEl);
  forceCompositingLayer(cameraEl);
  outerEl.appendChild(cameraEl);

  // Video object — receives the screen mesh's CSS matrix each frame
  videoEl = document.createElement("div");
  videoEl.style.position = "absolute";
  videoEl.style.top = "0";
  videoEl.style.left = "0";
  videoEl.style.width = SCREEN_WORLD_WIDTH + "px";
  videoEl.style.height = SCREEN_WORLD_HEIGHT + "px";
  videoEl.style.pointerEvents = "auto";
  set3DStyle(videoEl);
  forceCompositingLayer(videoEl);
  cameraEl.appendChild(videoEl);

  // Real official YouTube iframe — unmodified embed, no autoplay.
  // Explicit pixel width/height (not 100%) — percentage sizing inside a 3D
  // transform context can resolve ambiguously in WebKit.
  iframeEl = document.createElement("iframe");
  iframeEl.style.position = "absolute";
  iframeEl.style.top = "0";
  iframeEl.style.left = "0";
  iframeEl.style.width = SCREEN_WORLD_WIDTH + "px";
  iframeEl.style.height = SCREEN_WORLD_HEIGHT + "px";
  iframeEl.style.border = "0";
  forceCompositingLayer(iframeEl);
  iframeEl.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframeEl.allowFullscreen = true;
  iframeEl.src =
    `https://www.youtube.com/embed/${TRACK.videoId}` +
    `?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1`;
  videoEl.appendChild(iframeEl);

  // Attribution label — separate simple element, positioned above the screen
  labelEl = document.createElement("div");
  labelEl.style.position = "fixed";
  labelEl.style.pointerEvents = "none";
  labelEl.style.color = "#fff";
  labelEl.style.fontFamily = "sans-serif";
  labelEl.style.fontSize = "13px";
  labelEl.style.fontWeight = "600";
  labelEl.style.textShadow = "0 0 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)";
  labelEl.style.whiteSpace = "nowrap";
  labelEl.style.transform = "translate(-50%, -100%)";
  labelEl.style.zIndex = "6";
  labelEl.textContent = `${TRACK.artist} — "${TRACK.title}" · ${TRACK.label}`;

  document.body.appendChild(outerEl);
  document.body.appendChild(labelEl);

  built = true;
}

function hideAll() {
  if (outerEl) outerEl.style.display = "none";
  if (labelEl) labelEl.style.display = "none";
}

export default {
  init(scene_) {
    scene = scene_;
  },

  update(delta, context) {
    if (!scene) return;

    if (!screenMesh) {
      screenMesh = scene.getObjectByName(SCREEN_MESH_NAME);
      if (!screenMesh) return; // world.js hasn't tagged the mesh yet — see diff below
    }

    const camera = context.camera;
    const renderer = context.renderer;
    if (!camera || !renderer) return;

    // PERFORMANCE GATE: skip all the expensive CSS3D math unless the player
    // is actually near the stage.
    const player = context.player;
    if (player) {
      const dx = player.position.x - screenMesh.position.x;
      const dz = player.position.z - screenMesh.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > ACTIVATION_DISTANCE * ACTIVATION_DISTANCE) {
        if (built) hideAll();
        return;
      }
    }

    if (!built) buildDOM();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;

    // Cull when the screen is behind the camera to avoid inverted/huge transforms
    screenMesh.getWorldPosition(tmpVec3);
    tmpVec3.applyMatrix4(camera.matrixWorldInverse);
    if (tmpVec3.z > 0) {
      hideAll();
      return;
    }
    outerEl.style.display = "block";
    labelEl.style.display = "block";

    const fov = camera.projectionMatrix.elements[5] * heightHalf;

    outerEl.style.perspective = fov + "px";
    outerEl.style.webkitPerspective = fov + "px";

    const cameraCSSMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
    setTransform(
      cameraEl,
      `translateZ(${fov}px)${cameraCSSMatrix}translate(${widthHalf}px,${heightHalf}px)`
    );

    screenMesh.updateMatrixWorld();
    setTransform(videoEl, getObjectCSSMatrix(screenMesh.matrixWorld));

    // Position the attribution label just above the screen, in plain 2D space
    tmpVec3.copy(screenMesh.position);
    tmpVec3.y += SCREEN_WORLD_HEIGHT / 2 + 1.2;
    const projected = tmpVec3.project(camera);
    if (projected.z < 1) {
      labelEl.style.left = ((projected.x * 0.5 + 0.5) * width) + "px";
      labelEl.style.top = ((-projected.y * 0.5 + 0.5) * height) + "px";
      labelEl.style.display = "block";
    } else {
      labelEl.style.display = "none";
    }
  },

  // Call this from your phone/HUD/admin system to swap the track later —
  // fully modular, no need to touch this file or any other system.
  setTrack(videoId, title, artist, label) {
    TRACK.videoId = videoId;
    if (title) TRACK.title = title;
    if (artist) TRACK.artist = artist;
    if (label) TRACK.label = label;
    if (iframeEl) {
      iframeEl.src =
        `https://www.youtube.com/embed/${TRACK.videoId}` +
        `?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1`;
    }
    if (labelEl) {
      labelEl.textContent = `${TRACK.artist} — "${TRACK.title}" · ${TRACK.label}`;
    }
  },
};
