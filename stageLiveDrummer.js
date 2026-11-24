// stageLiveDrummer.js
// A lightweight on-stage drummer visual. It creates no audio and no lights;
// the sticks, arms, kick pedal and drum accents follow HERO's media playhead.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import StageMusic from "./stageMusic.js";

const STAGE = { x: 0, y: 1.8, z: -80.8 };
const PROVISIONAL_BPM = 126;
const BEAT = 60 / PROVISIONAL_BPM;

let root = null;
let leftArm = null;
let rightArm = null;
let leftStick = null;
let rightStick = null;
let kickPedal = null;
let snareAccent = null;
let kickAccent = null;
let hiHatAccent = null;
let lastBeat = -1;

function makeMesh(geometry, material, name, parent, position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export default {
  init(scene) {
    if (!scene || scene.getObjectByName("lamboCityStageLiveDrummer")) return;

    root = new THREE.Group();
    root.name = "lamboCityStageLiveDrummer";
    root.position.set(STAGE.x, STAGE.y, STAGE.z);
    scene.add(root);

    const dark = new THREE.MeshStandardMaterial({ color: 0x17191e, roughness: 0.62 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc79b43, metalness: 0.82, roughness: 0.28 });
    const skin = new THREE.MeshStandardMaterial({ color: 0x8a563b, roughness: 0.78 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.7 });
    const drum = new THREE.MeshStandardMaterial({ color: 0x252833, metalness: 0.72, roughness: 0.34 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xc6a06a, metalness: 0.72, roughness: 0.24 });
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xd7bd83, roughness: 0.6 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xffc45e, emissive: 0x5a2b00, emissiveIntensity: 0.15 });

    // Seated player silhouette, facing the audience at the front of the stage.
    makeMesh(new THREE.BoxGeometry(0.78, 0.9, 0.46), shirt, "drummerTorso", root, [0, 1.55, -0.12]);
    makeMesh(new THREE.SphereGeometry(0.28, 12, 10), skin, "drummerHead", root, [0, 2.2, -0.12]);
    makeMesh(new THREE.BoxGeometry(0.62, 0.12, 0.58), dark, "drummerSeat", root, [0, 0.92, -0.22]);

    // Kick drum and pedal are centered in front of the seated drummer.
    makeMesh(new THREE.CylinderGeometry(0.58, 0.58, 0.62, 20), drum, "stageKickDrum", root, [0, 0.78, 0.72]).rotation.x = Math.PI / 2;
    kickAccent = makeMesh(new THREE.CircleGeometry(0.43, 20), accent, "stageKickDrumHead", root, [0, 0.78, 1.045]);
    makeMesh(new THREE.CylinderGeometry(0.27, 0.27, 0.36, 16), drum, "stageSnareDrum", root, [-0.9, 1.18, 0.42]).rotation.x = Math.PI / 2;
    makeMesh(new THREE.CylinderGeometry(0.25, 0.25, 0.42, 16), drum, "stageRackTomLeft", root, [-0.42, 1.65, 0.55]).rotation.x = Math.PI / 2;
    makeMesh(new THREE.CylinderGeometry(0.25, 0.25, 0.42, 16), drum, "stageRackTomRight", root, [0.42, 1.65, 0.55]).rotation.x = Math.PI / 2;
    makeMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.42, 16), drum, "stageFloorTom", root, [0.95, 1.02, -0.05]).rotation.x = Math.PI / 2;

    // Cymbals on slim stands; meshes are cheap and share materials.
    const cymbal = (name, x, y, z, radius) => {
      const plate = makeMesh(new THREE.CylinderGeometry(radius, radius, 0.035, 18), gold, name, root, [x, y, z]);
      plate.rotation.x = 0.08;
      makeMesh(new THREE.CylinderGeometry(0.025, 0.025, y - 0.12, 7), dark, name + "Stand", root, [x, (y + 0.12) / 2, z]);
      return plate;
    };
    hiHatAccent = cymbal("stageHiHat", -1.28, 1.95, 0.56, 0.34);
    cymbal("stageCrashCymbal", 1.32, 2.32, 0.2, 0.48);
    cymbal("stageRideCymbal", 0.95, 2.08, -0.65, 0.42);

    // Shoulder pivots and visible sticks are independently animated.
    leftArm = new THREE.Group();
    leftArm.position.set(-0.42, 1.92, 0.02);
    root.add(leftArm);
    makeMesh(new THREE.CylinderGeometry(0.12, 0.14, 0.58, 9), shirt, "drummerLeftUpperArm", leftArm, [0, -0.28, 0]);
    makeMesh(new THREE.SphereGeometry(0.11, 8, 7), skin, "drummerLeftHand", leftArm, [0, -0.56, 0.08]);
    leftStick = makeMesh(new THREE.CylinderGeometry(0.018, 0.022, 0.66, 6), stickMat, "drummerLeftStick", leftArm, [0.05, -0.65, 0.32]);
    leftStick.rotation.x = -0.45;

    rightArm = new THREE.Group();
    rightArm.position.set(0.42, 1.92, 0.02);
    root.add(rightArm);
    makeMesh(new THREE.CylinderGeometry(0.12, 0.14, 0.58, 9), shirt, "drummerRightUpperArm", rightArm, [0, -0.28, 0]);
    makeMesh(new THREE.SphereGeometry(0.11, 8, 7), skin, "drummerRightHand", rightArm, [0, -0.56, 0.08]);
    rightStick = makeMesh(new THREE.CylinderGeometry(0.018, 0.022, 0.66, 6), stickMat, "drummerRightStick", rightArm, [-0.05, -0.65, 0.32]);
    rightStick.rotation.x = -0.45;

    kickPedal = makeMesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), gold, "stageKickPedal", root, [0, 0.34, 1.15]);
    snareAccent = root.getObjectByName("stageSnareDrum");
    if (snareAccent) {
      snareAccent.material = drum.clone();
      snareAccent.material.emissive = new THREE.Color(0x3b1a00);
      snareAccent.material.emissiveIntensity = 0.08;
    }
  },

  update(delta, context) {
    if (!root || !leftArm || !rightArm) return;
    const clock = context?.systems?.stageMusic?.getPlaybackClock?.() || StageMusic.getPlaybackClock();
    const playing = !!clock.playing;
    if (!playing) {
      leftArm.rotation.set(0, 0, 0);
      rightArm.rotation.set(0, 0, 0);
      kickPedal.rotation.x = 0;
      return;
    }

    const songTime = clock.currentTime;
    const beatPosition = songTime / BEAT;
    const beatIndex = Math.floor(beatPosition);
    const phase = beatPosition - beatIndex;
    const hit = Math.exp(-phase * 18);

    // Alternating snare/tom strokes, eighth-note hi-hat, and kick pedal.
    const leftStroke = Math.max(0, Math.sin((beatPosition + 0.5) * Math.PI));
    const rightStroke = Math.max(0, Math.sin(beatPosition * Math.PI));
    leftArm.rotation.x = -0.18 - leftStroke * 0.95;
    rightArm.rotation.x = -0.18 - rightStroke * 0.95;
    leftArm.rotation.z = 0.12 + Math.sin(beatPosition * Math.PI) * 0.08;
    rightArm.rotation.z = -0.12 - Math.sin(beatPosition * Math.PI) * 0.08;
    leftStick.rotation.x = -0.45 - leftStroke * 0.45;
    rightStick.rotation.x = -0.45 - rightStroke * 0.45;
    kickPedal.rotation.x = -Math.max(0, Math.sin((beatPosition % 2) * Math.PI)) * 0.42;

    const barBeat = beatIndex % 4;
    const kick = barBeat === 0 || barBeat === 2;
    const snare = barBeat === 1 || barBeat === 3;
    kickAccent.material.emissiveIntensity = 0.12 + (kick ? hit * 0.55 : 0);
    snareAccent.material.emissiveIntensity = 0.08 + (snare ? hit * 0.48 : 0);
    hiHatAccent.rotation.z = Math.sin(songTime * Math.PI / BEAT * 2) * 0.06;
    hiHatAccent.material.emissive = new THREE.Color(0x4a2a05);
    hiHatAccent.material.emissiveIntensity = 0.08 + Math.max(0, Math.sin(beatPosition * Math.PI * 2)) * 0.22;
    lastBeat = beatIndex;
  },
};
