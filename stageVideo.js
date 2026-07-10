// stageVideo.js
// Overlays a real YouTube iframe onto the stage LED screen mesh, matching
// its exact world position/rotation/perspective every frame — same technique
// Three.js's own CSS3DRenderer uses. Playback is 100% native user-click,
// no autoplay, no synthetic triggers — YouTube Content ID / royalty
// tracking stays valid.

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

let scene, screenMesh;
let built = false;
let outerEl, cameraEl, videoEl, iframeEl, labelEl;

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

function buildDOM() {
  // Outer wrapper — fullscreen, invisible, never blocks clicks on the rest of the page
  outerEl = document.createElement("div");
  outerEl.style.position = "fixed";
  outerEl.style.top = "0";
  outerEl.style.left = "0";
  outerEl.style.width = "100%";
  outerEl.style.height = "100%";
  outerEl.style.overflow = "hidden";
  outerEl.style.pointerEvents = "none";
  outerEl.style.zIndex = "5"; // above the WebGL canvas, below HUD (raise HUD z-index if needed)

  // Camera-space wrapper — receives the camera's CSS matrix each frame
  cameraEl = document.createElement("div");
  cameraEl.style.position = "absolute";
  cameraEl.style.top = "0";
  cameraEl.style.left = "0";
  cameraEl.style.transformStyle = "preserve-3d";
  outerEl.appendChild(cameraEl);

  // Video object — receives the screen mesh's CSS matrix each frame
  videoEl = document.createElement("div");
  videoEl.style.position = "absolute";
  videoEl.style.top = "0";
  videoEl.style.left = "0";
  videoEl.style.width = SCREEN_WORLD_WIDTH + "px";
  videoEl.style.height = SCREEN_WORLD_HEIGHT + "px";
  videoEl.style.transformStyle = "preserve-3d";
  videoEl.style.pointerEvents = "auto";
  cameraEl.appendChild(videoEl);

  // Real official YouTube iframe — unmodified embed, no autoplay
  iframeEl = document.createElement("iframe");
  iframeEl.width = "100%";
  iframeEl.height = "100%";
  iframeEl.style.border = "0";
  iframeEl.allow = "encrypted-media; picture-in-picture";
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

    if (!built) buildDOM();

    const camera = context.camera;
    const renderer = context.renderer;
    if (!camera || !renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;

    // Cull when the screen is behind the camera to avoid inverted/huge transforms
    const camSpace = screenMesh.getWorldPosition(new (screenMesh.position.constructor)())
      .applyMatrix4(camera.matrixWorldInverse);
    if (camSpace.z > 0) {
      outerEl.style.display = "none";
      labelEl.style.display = "none";
      return;
    }
    outerEl.style.display = "block";
    labelEl.style.display = "block";

    const fov = camera.projectionMatrix.elements[5] * heightHalf;

    outerEl.style.perspective = fov + "px";

    const cameraCSSMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
    cameraEl.style.transform =
      `translateZ(${fov}px)${cameraCSSMatrix}translate(${widthHalf}px,${heightHalf}px)`;

    screenMesh.updateMatrixWorld();
    videoEl.style.transform = getObjectCSSMatrix(screenMesh.matrixWorld);

    // Position the attribution label just above the screen, in plain 2D space
    const labelWorldPos = screenMesh.position.clone();
    labelWorldPos.y += SCREEN_WORLD_HEIGHT / 2 + 1.2;
    const projected = labelWorldPos.project(camera);
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
