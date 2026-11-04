/*
 * LAMBO CITY RECORDS — PREMIUM DAW EDIT SCREEN
 *
 * New visual shell for the existing shared multitrack session.
 * Does not create a new audio engine, project model, or recording system.
 *
 * Mount:
 *   import { createStudioDAWEditScreen } from "./studioDAWEditScreen.js";
 *   const editScreen = createStudioDAWEditScreen({ beatLab });
 *   parent.appendChild(editScreen.mount());
 *
 * Existing wired functions reused:
 * StudioMultitrackWorkspace, StudioDAWTimeline, recording/playback,
 * track volume/pan/mute/solo/arm, add track, import audio, BPM.
 */

import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import { renderStudioDAWTimeline } from "./studioDAWTimeline.js";

const COLORS = {
  navy: "#0B1A4A",
  navy2: "#14275F",
  cyan: "#18D8FF",
  red: "#E0242B",
  steel: "#B8BCC4",
  gold: "#C9A24A"
};

function safeText(value) {
  return String(value == null ? "" : value);
}

function createButton(label, action, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (action) button.dataset.action = action;
  if (className) button.className = className;
  return button;
}

export function createStudioDAWEditScreen({ beatLab, onExit } = {}) {
  return {
    root: null,
    beatLab,
    onExit,

    mount() {
      if (this.root && this.root.isConnected) return this.root;

      const root = document.createElement("section");
      root.id = "lc-premium-daw-edit-screen";
      root.className = "lc-premium-edit";
      root.innerHTML = [
        '<style>',
        '#lc-premium-daw-edit-screen{--navy:#0B1A4A;--navy2:#14275F;--cyan:#18D8FF;--red:#E0242B;--steel:#B8BCC4;--gold:#C9A24A;width:100%;height:100%;min-height:680px;max-height:100%;overflow:hidden;box-sizing:border-box;padding:9px;background:linear-gradient(145deg,#07112f,#14275f 55%,#080f2a);border:2px solid var(--gold);border-radius:15px;color:#f3f7ff;font-family:Arial,sans-serif;display:flex;flex-direction:column;gap:8px;position:relative}',
        '#lc-premium-daw-edit-screen *{box-sizing:border-box}',
        '#lc-premium-daw-edit-screen button,#lc-premium-daw-edit-screen input{font:inherit}',
        '#lc-premium-daw-edit-screen button{cursor:pointer;touch-action:manipulation}',
        '#lc-premium-daw-edit-screen .lc-transport{flex:0 0 auto;min-height:78px;border:1px solid #eef0f4;border-radius:13px;background:linear-gradient(180deg,#e4e7ec,#929aa8 48%,#c9cdd4);box-shadow:inset 0 2px 3px #fff,0 5px 14px #0008;color:#101a34;display:flex;align-items:center;gap:9px;padding:8px 12px 8px 92px;position:relative}',
        '#lc-premium-daw-edit-screen .lc-logo{position:absolute;left:7px;top:-8px;width:84px;height:84px;border-radius:50%;border:4px solid var(--gold);background:radial-gradient(circle at 35% 28%,#3157a2,#07143a 68%);box-shadow:0 4px 12px #000b,inset 0 0 0 3px #e1d9b5;display:grid;place-items:center;text-align:center;color:#fff;font-size:8px;font-weight:900;letter-spacing:1px;line-height:1.2}',
        '#lc-premium-daw-edit-screen .lc-logo:before{content:"🏎️";display:block;font-size:27px;line-height:1.1}',
        '#lc-premium-daw-edit-screen .lc-logo span{display:block}',
        '#lc-premium-daw-edit-screen .lc-rec-well{padding:5px;border-radius:12px;background:#222733;border:1px solid #707987;box-shadow:inset 0 2px 6px #000}',
        '#lc-premium-daw-edit-screen .lc-rec{width:43px;height:43px;border-radius:50%;border:3px solid #e2e5eb;background:radial-gradient(circle at 35% 25%,#ff7478,#c90013 65%,#69000a);box-shadow:0 2px 5px #0009;color:white;font-size:17px}',
        '#lc-premium-daw-edit-screen .lc-lcd-wrap{display:grid;gap:3px;min-width:110px;text-align:center;font-size:9px;font-weight:900;letter-spacing:1px}',
        '#lc-premium-daw-edit-screen .lc-lcd{padding:9px 10px;border-radius:5px;background:#07152b;color:#8deaff;border:1px solid #526b82;font-family:monospace;font-size:15px;letter-spacing:1px;white-space:nowrap;box-shadow:inset 0 0 10px #000}',
        '#lc-premium-daw-edit-screen .lc-gridset{display:flex;gap:4px}',
        '#lc-premium-daw-edit-screen .lc-gridset button{width:31px;height:34px;border:1px solid #596171;border-radius:5px;background:repeating-linear-gradient(135deg,#10151e 0 4px,#303844 4px 7px);color:#d9e2ef;font-size:10px}',
        '#lc-premium-daw-edit-screen .lc-metal-icon{width:39px;height:39px;border:1px solid #6c7481;border-radius:9px;background:linear-gradient(145deg,#f9fafc,#9299a5);color:#15203b;font-size:18px;box-shadow:inset 0 1px #fff,0 2px 4px #0006}',
        '#lc-premium-daw-edit-screen .lc-spacer{flex:1}',
        '#lc-premium-daw-edit-screen .lc-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(250px,24%) minmax(0,1fr);gap:8px}',
        '#lc-premium-daw-edit-screen .lc-inspector{min-height:0;overflow:auto;padding:8px;border:1px solid #5a78a8;border-radius:10px;background:repeating-linear-gradient(0deg,transparent 0 25px,#1b4b7b22 25px 26px),linear-gradient(145deg,#14275f,#091638);box-shadow:inset 0 0 18px #020a24}',
        '#lc-premium-daw-edit-screen .lc-section-label{font-size:10px;letter-spacing:2px;color:#b9eaff;font-weight:900;margin:2px 0 8px}',
        '#lc-premium-daw-edit-screen .lc-strips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}',
        '#lc-premium-daw-edit-screen .lc-strip{min-width:0;padding:7px 5px;border:1px solid #aeb4c0;border-radius:8px;background:linear-gradient(135deg,#aeb4bf,#596475 24%,#1a2b55 25%,#071632 78%,#b4bac4 79%);box-shadow:0 3px 8px #0008;display:flex;flex-direction:column;gap:6px}',
        '#lc-premium-daw-edit-screen .lc-strip button{min-height:25px;padding:4px 3px;border-radius:4px;border:1px solid #5472a3;background:#122d65;color:#c9f4ff;font-size:9px;font-weight:800}',
        '#lc-premium-daw-edit-screen .lc-strip-name{padding:5px 2px;text-align:center;background:linear-gradient(90deg,#9d101a,#ef2936,#86101a);color:#fff;font-size:10px;font-weight:900;letter-spacing:1px;border:1px solid #ff7077}',
        '#lc-premium-daw-edit-screen .lc-eq-graphic{height:34px;border:1px solid #31598b;border-radius:4px;background:#06142f;display:flex;align-items:center;justify-content:center;color:var(--cyan);font-size:20px;letter-spacing:2px}',
        '#lc-premium-daw-edit-screen .lc-inserts{display:grid;gap:3px}',
        '#lc-premium-daw-edit-screen .lc-inserts span{padding:5px 3px;border-radius:3px;background:linear-gradient(90deg,#1353a2,#0878b9);border:1px solid #2ba5db;color:#dffaff;font-size:8px;text-align:center;font-weight:800}',
        '#lc-premium-daw-edit-screen .lc-mini-row{display:flex;align-items:center;justify-content:space-between;gap:3px;color:#d5e5ff;font-size:8px}',
        '#lc-premium-daw-edit-screen .lc-mini-row b{font-size:9px;color:#fff}',
        '#lc-premium-daw-edit-screen .lc-read{background:#16884b!important;border-color:#61d993!important;color:white!important}',
        '#lc-premium-daw-edit-screen .lc-knob{width:34px;height:34px;margin:1px auto;border-radius:50%;border:2px solid #e1e5ea;background:radial-gradient(circle at 35% 28%,#fff,#a4aab5 40%,#333d4c 75%);box-shadow:0 2px 4px #0009;position:relative}',
        '#lc-premium-daw-edit-screen .lc-knob:after{content:"";position:absolute;left:15px;top:3px;width:3px;height:8px;background:#e0242b;border-radius:2px}',
        '#lc-premium-daw-edit-screen .lc-meter-row{display:grid;grid-template-columns:1fr 12px;gap:4px;align-items:stretch;min-height:105px}',
        '#lc-premium-daw-edit-screen .lc-fader{writing-mode:vertical-lr;direction:rtl;width:100%;height:100px;accent-color:#c9a24a}',
        '#lc-premium-daw-edit-screen .lc-meter{border:1px solid #4e647d;border-radius:3px;background:linear-gradient(0deg,#148f4b 0 45%,#d9c21c 45% 76%,#db3c30 76%);box-shadow:inset 0 0 4px #000;position:relative}',
        '#lc-premium-daw-edit-screen .lc-ir{font-size:7px;color:#ffb04a;text-align:center;font-weight:900}',
        '#lc-premium-daw-edit-screen .lc-ms{display:flex;gap:4px}',
        '#lc-premium-daw-edit-screen .lc-ms button{flex:1;min-height:24px;background:#333d50;border-color:#69768c;color:#fff}',
        '#lc-premium-daw-edit-screen .lc-workarea{min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;border:1px solid #637ca4;border-radius:10px;background:#07132f;box-shadow:inset 0 0 22px #000}',
        '#lc-premium-daw-edit-screen .lc-edit-tools{flex:0 0 auto;display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:7px;background:linear-gradient(90deg,#541019,#a51d29,#4a1019);border-bottom:1px solid #d14b53}',
        '#lc-premium-daw-edit-screen .lc-edit-tools button{min-height:29px;padding:5px 8px;border:1px solid #7d8ca4;border-radius:5px;background:linear-gradient(#5c6574,#273247);color:#f1f4f8;font-size:10px;font-weight:800}',
        '#lc-premium-daw-edit-screen .lc-edit-tools button:disabled{opacity:.4}',
        '#lc-premium-daw-edit-screen .lc-track-tools{display:flex;justify-content:space-between;gap:6px;padding:5px 8px;background:linear-gradient(#bfc4cb,#727b89);color:#101a31}',
        '#lc-premium-daw-edit-screen .lc-track-tools button{min-height:28px;padding:4px 9px;border:1px solid #5f6876;border-radius:5px;background:linear-gradient(#f1f2f5,#aeb4bf);color:#17213a;font-size:11px;font-weight:900}',
        '#lc-premium-daw-edit-screen .lc-ruler-head{flex:0 0 auto;display:grid;grid-template-columns:minmax(118px,22%) minmax(0,1fr);background:#a61d29;border-bottom:1px solid #ec6c72}',
        '#lc-premium-daw-edit-screen .lc-ruler-head strong{padding:7px;color:#fff;font-size:9px;letter-spacing:1px}',
        '#lc-premium-daw-edit-screen .lc-lanes{min-height:0;overflow:auto;scrollbar-color:#1475bd #07142d;scrollbar-width:thin}',
        '#lc-premium-daw-edit-screen .lc-track-row{display:grid;grid-template-columns:minmax(118px,22%) minmax(0,1fr);min-height:98px;border-bottom:1px solid #2a4770;background:#0d1d43}',
        '#lc-premium-daw-edit-screen .lc-track-head{min-width:0;padding:7px;border-right:1px solid #58719b;background:linear-gradient(90deg,#10295b,#071532);display:flex;flex-direction:column;gap:6px}',
        '#lc-premium-daw-edit-screen .lc-track-title{display:flex;align-items:center;gap:6px;min-width:0;font-size:10px;font-weight:900;color:#fff}',
        '#lc-premium-daw-edit-screen .lc-track-color{width:5px;align-self:stretch;border-radius:3px;background:var(--cyan);flex:0 0 5px}',
        '#lc-premium-daw-edit-screen .lc-car-icon{width:22px;height:20px;border-radius:4px;background:#17427d;display:grid;place-items:center;font-size:13px;flex:0 0 22px}',
        '#lc-premium-daw-edit-screen .lc-track-title span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '#lc-premium-daw-edit-screen .lc-track-buttons{display:flex;gap:3px}',
        '#lc-premium-daw-edit-screen .lc-track-buttons button{min-width:24px;min-height:23px;padding:2px;border:1px solid #69748a;border-radius:4px;background:#30394a;color:#fff;font-size:9px;font-weight:900}',
        '#lc-premium-daw-edit-screen .lc-track-buttons button.active{background:#d21e2b;border-color:#ff6970;box-shadow:0 0 7px #e0242b}',
        '#lc-premium-daw-edit-screen .lc-track-mix{display:grid;grid-template-columns:minmax(0,1fr) 25px;gap:6px;align-items:center}',
        '#lc-premium-daw-edit-screen .lc-track-mix input{width:100%;min-width:0;accent-color:#e0242b;height:15px}',
        '#lc-premium-daw-edit-screen .lc-pan-mini{width:23px;height:23px;border-radius:50%;border:2px solid #b8bcc4;background:radial-gradient(circle,#dce0e7,#5d687b);position:relative}',
        '#lc-premium-daw-edit-screen .lc-track-timeline{min-width:0;overflow:hidden;padding:3px 0;background:#091735}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement{border:0;border-radius:0;background:#091735;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;scrollbar-color:#1475bd #091735}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-ruler{height:0;overflow:hidden;border:0}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-first-lane .lc-arrangement-ruler{height:30px;overflow:hidden;border-bottom:1px solid #d44b55;display:grid}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-first-lane .lc-arrangement-ruler button{height:30px;color:#fff;background:#a61d29;border-right:1px solid #e16a70}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-cyan-lane .lc-arrangement-waveform{filter:hue-rotate(130deg) saturate(1.8)}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-red-lane .lc-arrangement-waveform{filter:hue-rotate(-40deg) saturate(1.7)}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-lane{min-height:88px;background:repeating-linear-gradient(90deg,transparent 0,transparent 71px,#263c62 71px,#263c62 72px),repeating-linear-gradient(90deg,transparent 0,transparent 287px,#567092 287px,#567092 288px),#091735}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-clip{height:72px;top:7px;border:1px solid #20c9f4;border-radius:7px;background:linear-gradient(180deg,#0c6b91,#083b68);padding:0 7px 5px}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-clip-title{height:25px;color:#e8fbff;font-size:10px;padding:5px 2px}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-waveform{height:35px;background:#062d51}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-wave-empty{height:35px;color:#b3e7f4;background:#082b4b}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-clip.selected{border:2px solid #f8d889;box-shadow:0 0 0 1px #c9a24a,0 0 12px #18d8ff55}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-red-lane .lc-arrangement-clip{border-color:#e85a60;background:linear-gradient(180deg,#8e1827,#4d101e)}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-red-lane .lc-arrangement-waveform{background:#3b101a}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-red-lane .lc-arrangement-wave-empty{background:#32101a;color:#ffd5d8}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-playhead{background:#fff;box-shadow:0 0 7px #fff}',
        '#lc-premium-daw-edit-screen .lc-status{flex:0 0 auto;padding:6px 9px;min-height:25px;background:#08132b;border-top:1px solid #2a4770;color:#9deaff;font-size:10px}',
        '#lc-premium-daw-edit-screen .lc-session-menu{position:absolute;z-index:30;right:10px;top:83px;display:none;min-width:190px;padding:7px;border:1px solid var(--gold);border-radius:8px;background:#0b1839;box-shadow:0 8px 20px #000b}',
        '#lc-premium-daw-edit-screen .lc-session-menu.open{display:grid;gap:5px}',
        '#lc-premium-daw-edit-screen .lc-session-menu button{min-height:34px;text-align:left;background:#14275f;color:#fff;border:1px solid #48618d;border-radius:5px;padding:6px 9px;font-size:10px}',
        '@media(max-width:760px){#lc-premium-daw-edit-screen{min-height:620px;padding:5px}#lc-premium-daw-edit-screen .lc-main{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}#lc-premium-daw-edit-screen .lc-inspector{max-height:205px}#lc-premium-daw-edit-screen .lc-strips{grid-template-columns:repeat(2,minmax(0,1fr))}#lc-premium-daw-edit-screen .lc-workarea{min-height:420px}#lc-premium-daw-edit-screen .lc-transport{padding-left:80px;gap:5px;flex-wrap:wrap}#lc-premium-daw-edit-screen .lc-logo{width:72px;height:72px}#lc-premium-daw-edit-screen .lc-lcd{font-size:12px}}',
        '</style>',
        '<div class="lc-transport">',
        '<div class="lc-logo"><span>LAMBO CITY</span><span>RECORDS</span></div>',
        '<div class="lc-rec-well"><button class="lc-rec" data-action="record" aria-label="Record">●</button></div>',
        '<div class="lc-lcd-wrap"><span>CLOCK</span><div class="lc-lcd" data-clock>100 BPM / 4/4</div></div>',
        '<div class="lc-lcd-wrap"><span>GRID</span><div class="lc-gridset"><button type="button" title="Grid 1/4">¼</button><button type="button" title="Grid 1/8">⅛</button><button type="button" title="Grid 1/16">⅟₁₆</button></div></div>',
        '<div class="lc-spacer"></div>',
        '<button class="lc-metal-icon" data-action="session-menu" aria-label="Session menu">☰</button>',
        '<button class="lc-metal-icon" data-action="undo" aria-label="Undo">▱</button>',
        '<button class="lc-metal-icon" data-action="mixer-focus" aria-label="Mixer">☷</button>',
        '</div>',
        '<div class="lc-session-menu" data-session-menu>',
        '<button type="button" data-action="save-session">Save Session</button>',
        '<button type="button" data-action="open-session">Open Saved Session</button>',
        '<button type="button" data-action="new-session">New Session</button>',
        '<button type="button" data-action="export-wav">Export WAV</button>',
        '<button type="button" data-action="export-mp3">Export MP3</button>',
        '<button type="button" data-action="exit">Close EDIT</button>',
        '</div>',
        '<div class="lc-main">',
        '<aside class="lc-inspector"><div class="lc-section-label">▸ TRACK / MIXER</div><div class="lc-strips" data-mixer-strips></div></aside>',
        '<section class="lc-workarea">',
        '<div class="lc-edit-tools">',
        '<button type="button" disabled>t</button><button type="button" data-action="edit-menu">Edit ▾</button><button type="button" data-action="functions-menu">Functions ▾</button><button type="button" data-action="view-menu">View ▾</button>',
        '<button type="button" data-action="undo" title="Undo">↶</button><button type="button" data-action="redo" title="Redo">↷</button><button type="button" data-action="split" title="Split at playhead">✂</button><button type="button" data-action="duplicate" title="Duplicate selected region">▣</button><button type="button" data-action="delete-clip" title="Delete selected region">⌫</button>',
        '<button type="button" data-action="zoom-out">−</button><input data-zoom type="range" min="24" max="288" step="6" value="72" aria-label="Timeline zoom" style="width:75px;accent-color:#c9a24a"><button type="button" data-action="zoom-in">＋</button>',
        '<span class="lc-spacer"></span><button type="button" data-action="play">▶</button><button type="button" data-action="stop">■</button>',
        '</div>',
        '<div class="lc-track-tools"><div><button type="button" data-action="add-track">＋ TRACK</button> <button type="button" data-action="import-audio">⇧ IMPORT AUDIO</button><input data-audio-files type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm" multiple hidden></div><strong data-song-title>LAMBO CITY · UNTITLED SESSION</strong></div>',
        '<div class="lc-ruler-head"><strong>TRACKS / REGIONS</strong><strong data-ruler-label>BAR 01 — 128</strong></div>',
        '<div class="lc-lanes" data-lanes></div>',
        '<div class="lc-status" data-status role="status" aria-live="polite">EDIT session ready · Select a track and arm it to record.</div>',
        '</section></div>'
      ].join("");

      this.root = root;
      this.bindEvents();
      this.render();
      return root;
    },

    status(message) {
      const node = this.root && this.root.querySelector("[data-status]");
      if (node) node.textContent = safeText(message);
      if (typeof StudioMultitrackWorkspace.status === "function") {
        StudioMultitrackWorkspace.status(message);
      }
    },

    bindEvents() {
      const root = this.root;
      root.addEventListener("click", async event => {
        const trackControl = event.target.closest("[data-track-control]");
        if (trackControl && root.contains(trackControl)) {
          const trackRow = trackControl.closest("[data-track-id]");
          const track = StudioMultitrackWorkspace.tracks.find(item => item.id === trackRow?.dataset.trackId);
          if (!track) return;
          const key = trackControl.dataset.trackControl === "mute" ? "muted" : trackControl.dataset.trackControl === "solo" ? "solo" : "armed";
          StudioMultitrackWorkspace.recordHistory("Track " + key);
          track[key] = !track[key];
          if (key !== "armed" && StudioMultitrackWorkspace.arrangementPlayback) StudioMultitrackWorkspace.arrangementPlayback.syncTrackState(StudioMultitrackWorkspace.tracks);
          this.render();
          this.status(track.name + " " + key + (track[key] ? " on." : " off."));
          return;
        }
        const button = event.target.closest("[data-action]");
        if (!button || !root.contains(button)) return;
        const action = button.dataset.action;
        const workspace = StudioMultitrackWorkspace;

        try {
          if (action === "session-menu") {
            root.querySelector("[data-session-menu]").classList.toggle("open");
          } else if (action === "record") {
            await workspace.startArmedRecording({ vocalEffects: this.beatLab && this.beatLab.vocalEffects });
            this.status("Record command sent · arm one audio track first.");
          } else if (action === "play") {
            await workspace.playAll();
            this.status("Arrangement playback requested.");
          } else if (action === "stop") {
            workspace.stopAll();
            if (workspace.isTrackRecording()) await workspace.stopArmedRecording();
            this.status("Playback / recording stopped.");
          } else if (action === "add-track") {
            const name = window.prompt("Name the new track:", "New Audio Track");
            if (name === null) return;
            workspace.recordHistory("Add track");
            workspace.addTrack("audio", name);
            this.render();
            this.status("Track added.");
          } else if (action === "import-audio") {
            root.querySelector("[data-audio-files]").click();
          } else if (action === "undo") {
            workspace.undo();
            this.render();
          } else if (action === "redo") {
            workspace.redo();
            this.render();
          } else if (action === "split") {
            workspace.splitSelectedClip();
            this.render();
          } else if (action === "duplicate") {
            workspace.duplicateSelectedClip();
            this.render();
          } else if (action === "delete-clip") {
            workspace.deleteSelectedClip();
            this.render();
          } else if (action === "zoom-in") {
            workspace.setZoom(workspace.zoomBarWidth * 1.25);
            root.querySelector("[data-zoom]").value = String(workspace.zoomBarWidth);
            this.render();
          } else if (action === "zoom-out") {
            workspace.setZoom(workspace.zoomBarWidth / 1.25);
            root.querySelector("[data-zoom]").value = String(workspace.zoomBarWidth);
            this.render();
          } else if (action === "save-session") {
            const name = workspace.activeProjectName || window.prompt("Song name:", "Untitled Song") || "Untitled Song";
            const id = workspace.activeProjectId || ("lc-daw-" + (globalThis.crypto && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : Date.now()));
            await workspace.saveSession(id, name);
            this.status("Saved session: " + name);
            root.querySelector("[data-session-menu]").classList.remove("open");
            this.renderHeader();
          } else if (action === "open-session") {
            const projects = await workspace.listSavedSessions();
            if (!projects.length) {
              this.status("No saved sessions found in this browser.");
              return;
            }
            const options = projects.map((project, index) => (index + 1) + ". " + project.projectName).join("\n");
            const choice = Number(window.prompt("Enter the session number to open:\n" + options, "1"));
            if (!Number.isInteger(choice) || choice < 1 || choice > projects.length) return;
            if (!window.confirm("Open " + projects[choice - 1].projectName + "? Current unsaved work may be replaced.")) return;
            await workspace.loadSession(projects[choice - 1].projectId);
            this.render();
            this.status("Opened " + workspace.activeProjectName + ".");
          } else if (action === "new-session") {
            if (!window.confirm("Start a new session? Save your current work first if needed.")) return;
            workspace.activeProjectId = null;
            workspace.activeProjectName = "Untitled Song";
            workspace.resetSession();
            this.render();
          } else if (action === "export-wav" || action === "export-mp3") {
            this.status("Use the existing EDIT export controls in the main DAW panel for WAV / MP3 rendering. This screen keeps export entry in SESSION without duplicating the exporter.");
          } else if (action === "exit") {
            if (typeof this.onExit === "function") this.onExit();
            else this.status("Close EDIT from the studio navigation.");
          } else if (action === "mixer-focus") {
            root.querySelector(".lc-inspector").scrollIntoView({ behavior: "smooth", block: "nearest" });
          } else if (action === "edit-menu" || action === "functions-menu" || action === "view-menu") {
            this.status("This menu button is a visual toolbar placeholder; the current shared workspace exposes the specific edit actions shown beside it.");
          }
        } catch (error) {
          this.status("EDIT ERROR: " + (error && error.message ? error.message : error));
        }
      });

      root.addEventListener("input", event => {
        const workspace = StudioMultitrackWorkspace;
        if (event.target.matches("[data-zoom]")) {
          workspace.setZoom(Number(event.target.value));
          this.renderLanes();
          return;
        }
        const slider = event.target.closest("[data-track-volume], [data-track-pan]");
        if (!slider) return;
        const track = workspace.tracks.find(item => item.id === slider.dataset.trackId);
        if (!track) return;
        if (!slider.dataset.historyStarted) {
          workspace.recordHistory(slider.hasAttribute("data-track-volume") ? "Track volume" : "Track pan");
          slider.dataset.historyStarted = "1";
        }
        if (slider.hasAttribute("data-track-volume")) {
          track.volume = Number(slider.value);
          workspace.arrangementPlayback && workspace.arrangementPlayback.setTrackVolume(track.id, track.volume);
        } else {
          track.pan = Number(slider.value) / 100;
          workspace.arrangementPlayback && workspace.arrangementPlayback.setTrackPan(track.id, track.pan);
        }
        workspace.scheduleProjectAutosave();
        const label = root.querySelector('[data-mixer-value="' + track.id + '"]');
        if (label) label.textContent = slider.hasAttribute("data-track-volume") ? Math.round(track.volume) + "%" : Math.round(track.pan * 100);
      });

      root.addEventListener("change", event => {
        if (event.target.matches("[data-tempo]")) {
          StudioMultitrackWorkspace.setTempo(Number(event.target.value));
          this.renderHeader();
          this.status("Tempo set to " + StudioMultitrackWorkspace.tempo + " BPM.");
        }
        if (event.target.matches("[data-track-volume], [data-track-pan]")) {
          delete event.target.dataset.historyStarted;
        }
      });

      root.querySelector("[data-audio-files]").addEventListener("change", async event => {
        const files = Array.from(event.target.files || []);
        if (files.length) {
          await StudioMultitrackWorkspace.importAudioFiles(files);
          this.render();
        }
        event.target.value = "";
      });
    },

    renderHeader() {
      const workspace = StudioMultitrackWorkspace;
      const title = this.root.querySelector("[data-song-title]");
      const tempo = this.root.querySelector("[data-tempo]");
      const zoom = this.root.querySelector("[data-zoom]");
      if (title) title.textContent = safeText(workspace.activeProjectName || "Untitled Song").toUpperCase();
      if (tempo) tempo.value = String(workspace.tempo);
      if (zoom) zoom.value = String(workspace.zoomBarWidth);
    },

    renderMixer() {
      const host = this.root.querySelector("[data-mixer-strips]");
      host.replaceChildren();
      const tracks = StudioMultitrackWorkspace.tracks.slice(0, 2);
      tracks.forEach((track, index) => {
        const strip = document.createElement("div");
        strip.className = "lc-strip";
        const inserts = index === 0
          ? ["Channel EQ", "Compressor", "Compressor", "Overdrive", "Chroma"]
          : ["Compressor", "Chroma"];
        strip.innerHTML = [
          '<button type="button">SETTING</button>',
          '<div class="lc-eq-graphic">' + (index === 0 ? '⌁╱⌁' : 'EQ') + '</div>',
          '<div class="lc-mini-row"><b>' + (index === 0 ? "Input 3" : "Bus 25") + '</b><span>◉</span></div>',
          '<div class="lc-inserts">' + inserts.map(name => '<span>' + name + '</span>').join("") + '</div>',
          '<div class="lc-mini-row"><b>' + (index === 0 ? "B 32" : "SEND") + '</b><span>●</span></div>',
          '<div class="lc-mini-row"><b>' + (index === 0 ? "B 25" : "STEREO OUT") + '</b><span>↗</span></div>',
          '<button type="button">GROUP</button>',
          '<button type="button" class="lc-read">READ</button>',
          '<div class="lc-mini-row"><b>' + (index === 0 ? "-64" : "⚠") + '</b><span>' + (index === 0 ? "17.0" : "1.0") + '</span></div>',
          '<div class="lc-knob" aria-hidden="true"></div>',
          '<div class="lc-meter-row"><input class="lc-fader" type="range" min="0" max="100" value="' + Number(track.volume) + '" data-track-volume data-track-id="' + track.id + '" aria-label="' + track.name + ' volume"><div class="lc-meter"></div></div>',
          '<div class="lc-ir">IR</div>',
          '<div class="lc-ms"><button type="button" data-mixer-toggle="mute" data-track-id="' + track.id + '">M</button><button type="button" data-mixer-toggle="solo" data-track-id="' + track.id + '">S</button></div>',
          '<div class="lc-strip-name">' + safeText(track.name).slice(0, 14).toUpperCase() + '</div>'
        ].join("");
        const pan = document.createElement("input");
        pan.type = "range";
        pan.min = "-100";
        pan.max = "100";
        pan.value = String(Math.round((track.pan || 0) * 100));
        pan.dataset.trackPan = "";
        pan.dataset.trackId = track.id;
        pan.setAttribute("aria-label", track.name + " pan");
        pan.style.cssText = "width:100%;accent-color:#c9a24a;height:12px";
        strip.insertBefore(pan, strip.querySelector(".lc-knob"));
        const volume = strip.querySelector("[data-track-volume]");
        volume.dataset.trackId = track.id;
        host.appendChild(strip);
      });
      host.querySelectorAll("[data-mixer-toggle]").forEach(button => {
        button.addEventListener("click", () => {
          const track = StudioMultitrackWorkspace.tracks.find(item => item.id === button.dataset.trackId);
          if (!track) return;
          StudioMultitrackWorkspace.recordHistory("Mixer " + button.dataset.mixerToggle);
          const key = button.dataset.mixerToggle === "mute" ? "muted" : "solo";
          track[key] = !track[key];
          StudioMultitrackWorkspace.arrangementPlayback && StudioMultitrackWorkspace.arrangementPlayback.syncTrackState(StudioMultitrackWorkspace.tracks);
          button.classList.toggle("active", track[key]);
          this.status(track.name + " " + key + (track[key] ? " on." : " off."));
        });
      });
      if (!tracks.length) {
        const empty = document.createElement("div");
        empty.className = "lc-section-label";
        empty.textContent = "Add audio tracks to populate the mixer.";
        host.appendChild(empty);
      }
    },

    renderLanes() {
      const host = this.root.querySelector("[data-lanes]");
      host.replaceChildren();
      const workspace = StudioMultitrackWorkspace;
      workspace.tracks.forEach((track, index) => {
        const row = document.createElement("div");
        row.className = "lc-track-row";
        row.dataset.trackId = track.id;
        const color = index < 3 ? COLORS.cyan : COLORS.red;
        const icon = index === 0 ? "🐂" : index === 1 ? "🏎️" : index === 2 ? "🚘" : index === 8 ? "♫" : "🏁";
        const head = document.createElement("div");
        head.className = "lc-track-head";
        head.innerHTML = [
          '<div class="lc-track-title"><i class="lc-track-color" style="background:' + color + '"></i><span class="lc-car-icon">' + icon + '</span><span title="' + safeText(track.name) + '">' + safeText(track.name) + '</span></div>',
          '<div class="lc-track-buttons">',
          '<button type="button" data-track-control="mute" class="' + (track.muted ? "active" : "") + '">M</button>',
          '<button type="button" data-track-control="solo" class="' + (track.solo ? "active" : "") + '">S</button>',
          '<button type="button" data-track-control="arm" class="' + (track.armed ? "active" : "") + '">R</button>',
          '</div>',
          '<div class="lc-track-mix"><input type="range" min="0" max="100" value="' + Number(track.volume) + '" data-track-volume data-track-id="' + track.id + '" aria-label="' + safeText(track.name) + ' volume"><div class="lc-pan-mini" title="Pan ' + Math.round(Number(track.pan || 0) * 100) + '"></div></div>'
        ].join("");
        const lane = document.createElement("div");
        lane.className = "lc-track-timeline" + (index === 0 ? " lc-first-lane" : "") + (index < 3 ? " lc-cyan-lane" : " lc-red-lane");
        const timeline = document.createElement("div");
        lane.appendChild(timeline);
        renderStudioDAWTimeline({
          container: timeline,
          track: track,
          barWidth: workspace.zoomBarWidth,
          selectedClipId: workspace.selectedClipId,
          playheadBar: workspace.playheadBar,
          onSelect: clip => {
            workspace.selectClip(track.id, clip);
            host.querySelectorAll(".lc-arrangement-clip").forEach(node => {
              node.classList.toggle("selected", node.dataset.clipId === workspace.selectedClipId);
            });
          },
          onEditStart: () => workspace.recordHistory("Move / trim audio region"),
          onChange: clip => {
            workspace.scheduleProjectAutosave();
            this.status(clip.name + " updated at bar " + clip.startBar + ".");
          },
          onPlayheadChange: bar => {
            workspace.playheadBar = bar;
            this.renderLanes();
          }
        });
        row.append(head, lane);
        host.appendChild(row);
      });
      if (!workspace.tracks.length) {
        const empty = document.createElement("div");
        empty.className = "lc-status";
        empty.textContent = "No tracks yet. Add a track or import an audio file.";
        host.appendChild(empty);
      }
      const ruler = this.root.querySelector("[data-ruler-label]");
      if (ruler) ruler.textContent = "BAR 01 — 128 · PLAYHEAD " + String(workspace.playheadBar).padStart(2, "0");
    },

    render() {
      if (!this.root) return;
      this.renderHeader();
      this.renderMixer();
      this.renderLanes();
    },

    destroy() {
      if (this.root) this.root.remove();
      this.root = null;
    }
  };
}

export default createStudioDAWEditScreen;
