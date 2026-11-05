let THREE = null;
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioSoundKit from "./studioSoundKit.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";

const COLORS = { navy: 0x142b52, navyLight: 0x254675, gold: 0xd6ad62, glow: 0xffbd55 };
const DRUM_HITS = [
  { label: "BASS", sound: "kick", category: "bass" },
  { label: "SNARE", sound: "snare", category: "snare" },
  { label: "RACK TOM", sound: "tom", category: "toms" },
  { label: "FLOOR TOM", sound: "tom", category: "toms" },
  { label: "HI-HAT", sound: "hat", category: "cymbals" },
  { label: "CRASH", sound: "cymbal", category: "cymbals" },
  { label: "RIDE", sound: "cymbal", category: "cymbals" }
];

export function createLiveDrummerPanel({ beatLab } = {}) {
  const root = document.createElement("section");
  root.className = "lc-live-drummer";
  const bpm = Math.max(60, Math.min(180, Number(StudioMultitrackWorkspace.tempo) || Number(beatLab?.pattern?.bpm) || 110));
  root.style.cssText = "min-height:calc(100vh - 150px);display:grid;grid-template-rows:auto 1fr auto auto;gap:14px;padding:clamp(12px,2vw,24px);border-radius:14px;color:#f4f6fb;background:radial-gradient(ellipse at 50% 30%,#284a79 0%,#1e3a6b 44%,#16294d 100%);font-family:Arial,sans-serif;box-sizing:border-box;overflow:hidden";
  root.innerHTML =
    '<header style="display:grid;grid-template-columns:48px 1fr 72px;align-items:start;gap:12px">' +
      '<button type="button" data-drum-menu aria-label="Performance menu" style="width:46px;height:46px;border:1px solid #7188a7;border-radius:12px;background:#102343;color:#fff;font-size:22px">☰</button>' +
      '<div style="text-align:center"><div style="font-size:10px;letter-spacing:2.5px;color:#bdc8d8;font-weight:800">PERFORMANCE SCORE</div>' +
        '<div style="max-width:340px;margin:5px auto 6px;padding:5px 18px 8px;border-radius:10px;background:rgba(7,18,37,.78);border:1px solid rgba(210,177,112,.28)"><strong data-drum-score style="font-size:40px;line-height:1">0</strong><div data-score-progress style="height:3px;margin-top:7px;border-radius:5px;background:rgba(255,255,255,.12)"></div></div>' +
        '<div style="font-size:11px;letter-spacing:1.4px;color:#c6d0df"><span style="color:#9caac0">LEVEL 4:</span> <strong style="color:#f0c36c">FUNK FRENZY</strong></div></div>' +
      '<div style="padding:8px 5px;border-radius:10px;background:rgba(7,18,37,.78);text-align:center;border:1px solid rgba(255,255,255,.1)"><strong data-drum-bpm style="font-size:25px">' + bpm + '</strong><div style="font-size:9px;letter-spacing:1px;color:#b7c3d5">BPM</div></div>' +
    '</header>' +
    '<div style="display:grid;grid-template-columns:minmax(0,1fr) 66px;gap:12px;min-height:280px">' +
      '<div style="position:relative;display:grid;grid-template-rows:auto 1fr;gap:12px;padding:clamp(10px,2vw,24px);border-radius:16px;background:linear-gradient(180deg,rgba(12,30,57,.1),rgba(5,17,36,.42));border-bottom:7px solid #102342;box-shadow:inset 0 -20px 35px rgba(3,10,24,.22)">' +
        '<div style="text-align:center;color:#c5d2e3;font-size:10px;letter-spacing:2px">LIVE PERFORMANCE · TOUCH TO PLAY</div>' +
        '<div data-hit-grid style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:center"></div></div>' +
      '<aside style="display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:9px 7px;border-radius:12px;background:rgba(7,18,37,.78);border:1px solid rgba(255,255,255,.1);text-align:center"><div style="font-size:10px;color:#c8d3e1">TEMPO</div><div style="display:flex;justify-content:center;align-items:center;min-height:150px"><input data-drum-tempo type="range" min="60" max="180" value="' + bpm + '" style="width:145px;transform:rotate(-90deg);accent-color:#e1b967"></div><div style="font-size:10px;color:#c8d3e1">BPM</div></aside>' +
    '</div>' +
    '<footer style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px;border-radius:13px;background:rgba(7,18,37,.84);border:1px solid rgba(255,255,255,.1)">' +
      '<button type="button" data-drum-category="bass">●<small>BASS</small></button><button type="button" data-drum-category="snare">◉<small>SNARE</small></button><button type="button" data-drum-category="toms">▣<small>TOMS</small></button><button type="button" data-drum-category="cymbals">◌<small>CYMBALS</small></button>' +
    '</footer><div data-drum-status role="status" aria-live="polite" style="font-size:11px;color:#d4dfef;text-align:center;min-height:16px">Ready · Score is local to this performance.</div>';
  const style = document.createElement("style");
  style.textContent = ".lc-live-drummer [data-drum-category]{min-height:56px;border:1px solid rgba(170,190,218,.2);border-radius:9px;background:transparent;color:#b9c7da;font-size:20px;display:grid;gap:2px;place-items:center;touch-action:manipulation}.lc-live-drummer [data-drum-category] small{font-size:9px;letter-spacing:1px}.lc-live-drummer [data-drum-category][aria-pressed=true]{background:linear-gradient(145deg,#f1d18a,#b98a3e);color:#1a2230;border-color:#ffe2a3}.lc-live-drummer [data-drum-hit]{min-height:72px;border:1px solid rgba(238,196,112,.65);border-radius:50%;background:radial-gradient(circle at 35% 28%,#49668b,#142a4a 65%,#0b1930);color:#f4d38c;font-weight:900;font-size:11px;box-shadow:0 7px 18px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.2);touch-action:manipulation}.lc-live-drummer [data-drum-hit]:active{background:radial-gradient(circle,#f7d58c,#b98a3e);color:#16233b;transform:scale(.96)}@media(max-width:620px){.lc-live-drummer [data-hit-grid]{grid-template-columns:repeat(2,minmax(0,1fr))!important}.lc-live-drummer [data-drum-hit]{min-height:58px}.lc-live-drummer{min-height:calc(100vh - 190px)!important}}";
  root.prepend(style);
  const hitGrid = root.querySelector("[data-hit-grid]");
  const status = root.querySelector("[data-drum-status]");
  let score = 0;
  let selectedCategory = "bass";
  let noiseBuffer = beatLab?.noiseBuffer || null;
  const updateScore = () => {
    root.querySelector("[data-drum-score]").textContent = score.toLocaleString();
    const progress = Math.min(100, score % 1000 / 10);
    root.querySelector("[data-score-progress]").style.background =
      "linear-gradient(90deg,#d8b267 0%,#d8b267 " + progress + "%,rgba(255,255,255,.12) " + progress + "%)";
    window.dispatchEvent(new CustomEvent("lc-live-drummer-score", { detail: { score, level: 4 } }));
  };
  const hit = async (sound, label) => {
    try {
      const audio = await StudioAudioEngine.resume();
      if (!audio || audio.state !== "running") throw new Error("Studio audio is not running.");
      if (beatLab) {
        if (!noiseBuffer && typeof beatLab.createNoiseBuffer === "function") noiseBuffer = beatLab.createNoiseBuffer();
        beatLab.soundProfile = "mpc";
        beatLab.noiseBuffer = noiseBuffer;
      }
      const at = audio.currentTime;
      if (sound === "tom") {
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(145, at);
        oscillator.frequency.exponentialRampToValueAtTime(58, at + 0.22);
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.exponentialRampToValueAtTime(0.22, at + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
        oscillator.connect(envelope);
        envelope.connect(StudioAudioEngine.getTrackGain("kick"));
        oscillator.start(at);
        oscillator.stop(at + 0.30);
      } else if (sound === "cymbal" && noiseBuffer) {
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const envelope = audio.createGain();
        source.buffer = noiseBuffer;
        filter.type = "highpass";
        filter.frequency.value = 6200;
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.linearRampToValueAtTime(0.13, at + 0.012);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.62);
        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(StudioAudioEngine.getTrackGain("hat"));
        source.start(at);
        source.stop(at + 0.65);
      } else {
        const channel = sound === "snare" ? "snare" : "hat";
        StudioSoundKit.play(audio, "mpc", channel, at, noiseBuffer, StudioAudioEngine.getTrackGain(channel));
      }
      const bpm = Math.max(60, Number(StudioMultitrackWorkspace.getTempoAtBar(StudioMultitrackWorkspace.playheadBar)) || Number(StudioMultitrackWorkspace.tempo) || 110);
      const beatSeconds = 60 / bpm;
      const playback = StudioMultitrackWorkspace.arrangementPlayback;
      const clock = playback?.playing && Number.isFinite(playback.playbackStartTime)
        ? audio.currentTime - playback.playbackStartTime
        : audio.currentTime;
      const phase = ((clock % beatSeconds) + beatSeconds) % beatSeconds;
      const distance = Math.min(phase, beatSeconds - phase);
      const points = distance <= 0.075 ? 100 : distance <= 0.16 ? 75 : 50;
      score += points;
      updateScore();
      status.textContent = label + " · " + (points === 100 ? "ON BEAT" : points === 75 ? "GOOD TIMING" : "HIT") + " · +" + points;
      window.dispatchEvent(new CustomEvent("lc-live-drum-hit", { detail: { sound, score, points } }));
    } catch (error) {
      status.textContent = "DRUM AUDIO ERROR · " + (error?.message || error);
    }
  };
  const renderHits = () => {
    hitGrid.replaceChildren();
    DRUM_HITS.filter(item => item.category === selectedCategory).forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.drumHit = item.sound;
      button.textContent = item.label;
      button.setAttribute("aria-label", "Play " + item.label);
      button.addEventListener("pointerdown", event => { event.preventDefault(); hit(item.sound, item.label); });
      hitGrid.appendChild(button);
    });
    root.querySelectorAll("[data-drum-category]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.drumCategory === selectedCategory));
    });
  };
  root.querySelectorAll("[data-drum-category]").forEach(button => button.addEventListener("click", () => {
    selectedCategory = button.dataset.drumCategory;
    renderHits();
  }));
  root.querySelector("[data-drum-tempo]").addEventListener("input", event => {
    const value = Number(event.target.value);
    StudioMultitrackWorkspace.setTempo(value);
    if (beatLab?.pattern) beatLab.pattern.bpm = value;
    root.querySelector("[data-drum-bpm]").textContent = String(value);
    status.textContent = "Session tempo set to " + value + " BPM.";
  });
  root.querySelector("[data-drum-menu]").addEventListener("click", () => {
    status.textContent = "FUNK FRENZY · Select a category, then play a drum surface.";
  });
  renderHits();
  return root;
}

function makeMaterial(color, emissive = 0x000000, intensity = 0) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.72, roughness: 0.28, emissive, emissiveIntensity: intensity });
}

export default {
  station: null,
  rings: [],
  hitHandler: null,
  async init(scene) {
    THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    const studio = scene?.getObjectByName("recordsHQFloor2Studio");
    const station = studio?.getObjectByName("floor2DrumStation");
    if (!station) {
      console.warn("LAMBO CITY Live Drummer: existing drum station is unavailable.");
      return;
    }
    this.station = station;
    if (station.userData.liveDrummerVisualsReady) return;
    station.userData.liveDrummerVisualsReady = true;
    const shell = makeMaterial(COLORS.navy, 0x081a36, 0.16);
    const shellAlt = makeMaterial(COLORS.navyLight, 0x0b1e3a, 0.12);
    const cymbal = new THREE.MeshStandardMaterial({ color: 0xb78b48, metalness: 0.92, roughness: 0.22 });
    const brass = makeMaterial(0xd5b36c, 0x4d3210, 0.18);
    station.traverse(object => {
      if (!object.isMesh) return;
      if (object.userData?.drumSound === "kick" || object.userData?.drumSound === "tom") object.material = shell;
      if (object.userData?.drumSound === "snare") object.material = shellAlt;
      if (object.userData?.drumSound === "hat" || object.userData?.drumSound === "cymbal") object.material = cymbal;
      if (/Stand|Base/.test(object.name || "")) object.material = brass;
    });
    const ringSpecs = [
      ["kick",0,0.78,0.48,0.28],["snare",-0.78,1.16,0.08,0.20],
      ["tom",-0.05,1.42,-0.18,0.19],["tom",0.48,1.52,-0.28,0.18],["tom",0.72,1.12,-0.08,0.22],
      ["hat",-1.12,1.48,-0.05,0.24],["cymbal",-0.95,1.72,-0.55,0.28],
      ["cymbal",1.13,1.77,-0.48,0.30],["cymbal",-1.55,1.92,-0.72,0.26],["cymbal",1.55,1.92,-0.72,0.26]
    ];
    ringSpecs.forEach(([sound,x,y,z,radius]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius,0.018,6,32),
        new THREE.MeshBasicMaterial({ color: COLORS.glow, transparent: true, opacity: 0.72 }));
      ring.rotation.x = sound === "kick" ? 0 : -Math.PI / 2;
      ring.position.set(x,y,z);
      ring.userData.drumSound = sound;
      ring.userData.pulse = 0;
      station.add(ring);
      this.rings.push(ring);
    });
    const secondTom = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.20,28),shell);
    secondTom.name = "floor2LiveDrummerRackTomTwo";
    secondTom.position.set(0.48,1.38,-0.28);
    secondTom.userData.drumSound = "tom";
    station.add(secondTom);
    const electronicPad = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.07,0.30),makeMaterial(0x111722,0x162c4b,0.2));
    electronicPad.name = "floor2LiveDrummerElectronicPad";
    electronicPad.userData.drumSound = "snare";
    electronicPad.position.set(1.55,1.12,-0.1);
    station.add(electronicPad);
    const addExtraCymbal = (name,x,y,z,tilt=0) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(.022,.03,1.62,10),brass);
      stand.name = name + "Stand";
      stand.position.set(x,y-.72,z);
      station.add(stand);
      const cym = new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,.025,36),cymbal);
      cym.name = name;
      cym.userData.drumSound = "cymbal";
      cym.position.set(x,y,z);
      cym.rotation.z = tilt;
      station.add(cym);
    };
    addExtraCymbal("floor2LiveDrummerLeftCrashTwo",-1.55,1.92,-.72,-.12);
    addExtraCymbal("floor2LiveDrummerRightCrashTwo",1.55,1.92,-.72,.16);
    const rimSpecs = [
      [-.78,1.13,.08,.32],[-.05,1.37,-.18,.28],[.48,1.33,-.28,.25],[.72,1.08,-.08,.33]
    ];
    rimSpecs.forEach(([x,y,z,radius]) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius,.018,6,28),brass);
      rim.rotation.x = Math.PI/2;
      rim.position.set(x,y,z);
      station.add(rim);
    });
    this.hitHandler = event => {
      const sound = event.detail?.sound;
      this.rings.forEach(ring => {
        if (ring.userData.drumSound === sound || (sound === "tom" && ring.userData.drumSound === "tom")) ring.userData.pulse = 1;
      });
    };
    window.addEventListener("lc-live-drum-hit", this.hitHandler);
  },
  update(delta) {
    const decay = Math.max(0, Number(delta) || 0) * 3.8;
    this.rings.forEach(ring => {
      ring.userData.pulse = Math.max(0, ring.userData.pulse - decay);
      ring.material.opacity = 0.30 + ring.userData.pulse * 0.68;
      ring.scale.setScalar(1 + ring.userData.pulse * 0.18);
    });
  },
  destroy() {
    if (this.hitHandler) window.removeEventListener("lc-live-drum-hit", this.hitHandler);
    this.hitHandler = null;
    this.rings = [];
    if (this.station) this.station.userData.liveDrummerVisualsReady = false;
  }
};
