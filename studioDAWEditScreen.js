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
import StudioRecordingEngine from "./studioRecordingEngine.js";
import { renderStudioDAWTimeline } from "./studioDAWTimeline.js";
import { renderStudioSessionToWav, downloadStudioWav, renderStudioSessionToMp3, downloadStudioMp3 } from "./studioDAWExport.js";
import { createSongProject, saveSongProject } from "./studioSongProject.js";
import { exportSongProjectPackage, importSongProjectPackage } from "./studioProjectPackage.js";
import StudioMPCSampler from "./studioMPCSampler.js";
import StudioMPCLibrary from "./studioMPCLibrary.js";

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

export function createStudioDAWEditScreen({ beatLab, onExit, onPrevious, onNext } = {}) {
  return {
    root: null,
    inputMeterFrame: null,
    beatLab,
    onExit,
    onPrevious,
    onNext,

    mount() {
      if (this.root && this.root.isConnected) return this.root;

      const root = document.createElement("section");
      root.id = "lc-premium-daw-edit-screen";
      root.className = "lc-premium-edit";
      root.innerHTML = [
        '<style>',
        '#lc-premium-daw-edit-screen{--navy:#0B1A4A;--navy2:#14275F;--cyan:#18D8FF;--red:#E0242B;--steel:#B8BCC4;--gold:#C9A24A;width:100%;height:100%;min-height:0;max-height:none;overflow:hidden;box-sizing:border-box;padding:9px;background:linear-gradient(145deg,#07112f,#14275f 55%,#080f2a);border:2px solid var(--gold);border-radius:15px;color:#f3f7ff;font-family:Arial,sans-serif;display:flex;flex-direction:column;gap:8px;position:relative}',
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
        '#lc-premium-daw-edit-screen .lc-transport-control{width:auto;min-width:58px;height:43px;padding:0 9px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:12px;font-weight:900;white-space:nowrap}',
        '#lc-premium-daw-edit-screen .lc-transport-control[data-action=play]{background:linear-gradient(180deg,#dff9e9,#71b98b);border-color:#e5fff0;color:#082b17}',
        '#lc-premium-daw-edit-screen .lc-transport-control[data-action=stop]{background:linear-gradient(180deg,#f5e1e1,#bd777b);border-color:#ffe5e5;color:#3c080c}',
        '#lc-premium-daw-edit-screen .lc-transport-control[data-action=toggle-metronome]{background:linear-gradient(180deg,#e4e8ef,#929baa);border-color:#f4f6fa;color:#17213a}#lc-premium-daw-edit-screen .lc-transport-control[data-action=toggle-metronome].active{background:linear-gradient(180deg,#f1d49c,#b8863b);border-color:#fff0c9;color:#241805}',
        '#lc-premium-daw-edit-screen .lc-rec-wrap{display:grid;justify-items:center;gap:2px;flex:0 0 auto}',
        '#lc-premium-daw-edit-screen .lc-rec-label{font-size:8px;font-weight:900;letter-spacing:1px;color:#4b1018}',
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
         '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-clip.is-comp{border-color:#e6bb69;background:linear-gradient(180deg,#80602c,#3f2d13)}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-red-lane .lc-arrangement-clip{border-color:#e85a60;background:linear-gradient(180deg,#8e1827,#4d101e)}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-red-lane .lc-arrangement-waveform{background:#3b101a}',
        '#lc-premium-daw-edit-screen .lc-track-timeline.lc-red-lane .lc-arrangement-wave-empty{background:#32101a;color:#ffd5d8}',
        '#lc-premium-daw-edit-screen .lc-track-timeline .lc-arrangement-playhead{background:#fff;box-shadow:0 0 7px #fff}',
        '#lc-premium-daw-edit-screen .lc-status{flex:0 0 auto;padding:6px 9px;min-height:25px;background:#08132b;border-top:1px solid #2a4770;color:#9deaff;font-size:10px}',
        '#lc-premium-daw-edit-screen .lc-arrangement-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:5px 9px;background:#0a142d;border-bottom:1px solid #263e68;color:#aebbd0;font-size:9px}#lc-premium-daw-edit-screen .lc-arrangement-controls label{display:flex;align-items:center;gap:3px}#lc-premium-daw-edit-screen .lc-arrangement-controls input,#lc-premium-daw-edit-screen .lc-arrangement-controls select{width:48px;min-height:25px;padding:2px 4px;background:#101d3d;color:#f4f1eb;border:1px solid #53698f;border-radius:4px;font-size:9px}#lc-premium-daw-edit-screen .lc-arrangement-controls button{min-height:25px;padding:3px 7px;background:#182d52;color:#e8edf8;border:1px solid #607ba6;border-radius:4px;font-size:9px}#lc-premium-daw-edit-screen .lc-arrangement-controls button.active{border-color:#e6bb69;color:#f8d889}',
        '#lc-premium-daw-edit-screen .lc-input-meter{display:inline-block;width:54px;height:9px;overflow:hidden;border:1px solid #56708f;border-radius:4px;background:#07152b;vertical-align:middle}#lc-premium-daw-edit-screen .lc-input-meter i{display:block;width:100%;height:100%;background:linear-gradient(90deg,#12a66a 0 65%,#d5c52a 82%,#e33a36);transform:scaleX(.015);transform-origin:left center}#lc-premium-daw-edit-screen .lc-record-options{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:6px 10px;background:#0c1732;border-bottom:1px solid #263e68;color:#aebbd0;font-size:9px}#lc-premium-daw-edit-screen .lc-record-options label{display:flex;align-items:center;gap:4px}#lc-premium-daw-edit-screen .lc-record-options input,#lc-premium-daw-edit-screen .lc-record-options select{width:54px;min-height:28px;background:#101d3d;color:#f4f1eb;border:1px solid #53698f;border-radius:4px;padding:3px}#lc-premium-daw-edit-screen .lc-record-options select{width:62px}#lc-premium-daw-edit-screen .lc-record-options input[type=checkbox]{width:15px;min-height:15px;accent-color:#d8b36e}#lc-premium-daw-edit-screen .lc-session-menu{position:absolute;z-index:30;right:10px;top:83px;display:none;min-width:190px;padding:7px;border:1px solid var(--gold);border-radius:8px;background:#0b1839;box-shadow:0 8px 20px #000b}',
        '#lc-premium-daw-edit-screen .lc-session-menu.open{display:grid;gap:5px}',
        '#lc-premium-daw-edit-screen .lc-session-menu button{min-height:34px;text-align:left;background:#14275f;color:#fff;border:1px solid #48618d;border-radius:5px;padding:6px 9px;font-size:10px}',
        '@media(max-width:760px){#lc-premium-daw-edit-screen{min-height:620px;padding:5px}#lc-premium-daw-edit-screen .lc-main{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}#lc-premium-daw-edit-screen .lc-inspector{max-height:205px}#lc-premium-daw-edit-screen .lc-strips{grid-template-columns:repeat(2,minmax(0,1fr))}#lc-premium-daw-edit-screen .lc-workarea{min-height:420px}#lc-premium-daw-edit-screen .lc-transport{padding-left:80px;gap:5px;flex-wrap:wrap}#lc-premium-daw-edit-screen .lc-logo{width:72px;height:72px}#lc-premium-daw-edit-screen .lc-lcd{font-size:12px}}',
        '</style>',
        '<div class="lc-transport">',
        '<div class="lc-logo"><span>LAMBO CITY</span><span>RECORDS</span></div>',
        '<div class="lc-rec-wrap"><div class="lc-rec-well"><button class="lc-rec" data-action="record" aria-label="Record to armed audio track" title="Record to the armed audio track">●</button></div><span class="lc-rec-label">RECORD</span></div>',
        '<button class="lc-metal-icon lc-transport-control" data-action="play" aria-label="Play arrangement" title="Play">▶ PLAY</button>',
        '<button class="lc-metal-icon lc-transport-control" data-action="stop" aria-label="Stop playback and recording" title="Stop playback and save the take">■ STOP</button>',
        '<button class="lc-metal-icon lc-transport-control" data-action="toggle-metronome" aria-label="Toggle metronome click" title="Toggle tempo-synchronized metronome" aria-pressed="false">CLICK OFF</button>',
        '<div class="lc-lcd-wrap"><span>CLOCK</span><div class="lc-lcd" data-clock>100 BPM / 4/4</div><span data-save-state aria-live="polite">SAVED</span></div>',
        '<div class="lc-lcd-wrap"><span>GRID</span><div class="lc-gridset"><button type="button" title="Grid 1/4">¼</button><button type="button" title="Grid 1/8">⅛</button><button type="button" title="Grid 1/16">⅟₁₆</button></div></div>',
        '<button class="lc-metal-icon" data-action="previous-view" aria-label="Previous studio interface">←</button>',
        '<button class="lc-metal-icon" data-action="next-view" aria-label="Next studio interface">→</button>',
        '<div class="lc-spacer"></div>',
        '<button class="lc-metal-icon" data-action="session-menu" aria-label="Session menu">☰</button>',
        '<button class="lc-metal-icon" data-action="undo" aria-label="Undo">▱</button>',
        '<button class="lc-metal-icon" data-action="mixer-focus" aria-label="Mixer">☷</button>',
        '</div>',
        '<div class="lc-record-options" aria-label="Recording setup"><label>COUNT-IN <select data-count-in><option value="1" selected>1 BAR · 4 BEATS</option><option value="0">OFF</option><option value="2">2 BARS</option><option value="4">4 BARS</option></select></label><label>PUNCH IN <input data-punch-in type="number" min="1" max="128" placeholder="LIVE"></label><label>PUNCH OUT <input data-punch-out type="number" min="1" max="128" placeholder="OFF"></label><label>INPUT <select data-input-device><option value="">Default microphone</option></select></label><label>LATENCY ms <input data-input-latency type="number" min="0" max="500" step="1" value="0" aria-label="Microphone latency compensation in milliseconds"></label><label class="lc-input-meter-wrap">INPUT <span class="lc-input-meter"><i data-input-meter></i></span></label><label title="Use headphones when monitoring a live microphone to prevent feedback"><input data-input-monitor type="checkbox"> MONITOR · HEADPHONES</label></div>',
        '<div class="lc-arrangement-controls" aria-label="Arrangement controls"><label>MARKER <input data-marker-name placeholder="Verse / Hook" maxlength="32"></label><label>BAR <input data-marker-bar type="number" min="1" max="128" value="1"></label><button type="button" data-action="add-marker">+ MARKER</button><label>CYCLE <input data-loop-start type="number" min="1" max="127" value="1"> → <input data-loop-end type="number" min="2" max="129" value="9"></label><button type="button" data-action="set-cycle">SET RANGE</button><button type="button" data-action="toggle-cycle">CYCLE OFF</button><label>TEMPO AT BAR <input data-tempo-bar type="number" min="1" max="128" value="1"></label><label>BPM <input data-tempo-value type="number" min="20" max="300" value="100"></label><button type="button" data-action="add-tempo-point">+ TEMPO</button><label>METER AT BAR <input data-meter-bar type="number" min="1" max="128" value="1"></label><select data-meter-value aria-label="Time signature"><option>4/4</option><option>3/4</option><option>2/4</option><option>5/4</option><option>6/4</option><option>7/4</option><option>6/8</option><option>9/8</option><option>12/8</option></select><button type="button" data-action="add-meter-point">+ METER</button><button type="button" data-action="toggle-follow">FOLLOW ON</button><button type="button" data-action="toggle-multi">MULTI OFF</button></div>',
        '<div class="lc-session-menu" data-session-menu>',
        '<button type="button" data-action="save-session">Save Session</button>',
        '<button type="button" data-action="open-session">Open Saved Session</button>',
        '<button type="button" data-action="session-versions">Version History / Restore</button>',
        '<button type="button" data-action="new-session">New Session</button>',
        '<button type="button" data-action="export-wav">Export WAV</button>',
        '<button type="button" data-action="export-mp3">Export MP3</button>',
        '<button type="button" data-action="export-session">Export Session File</button>',
        '<button type="button" data-action="import-session">Import Session File</button>',
        '<button type="button" data-action="delete-session">Delete Saved Session</button>',
        '<button type="button" data-action="exit">Close EDIT</button>',
        '<input data-session-file type="file" accept=".lcp,.lcsession,.json,application/json" hidden>',
        '</div>',
        '<div class="lc-main">',
        '<aside class="lc-inspector"><div class="lc-section-label">▸ TRACK / MIXER</div><div class="lc-strips" data-mixer-strips></div></aside>',
        '<section class="lc-workarea">',
        '<div class="lc-edit-tools">',
        '<button type="button" disabled>t</button><button type="button" data-action="edit-menu">Edit ▾</button><button type="button" data-action="functions-menu">Functions ▾</button><button type="button" data-action="view-menu">View ▾</button>',
        '<button type="button" data-action="undo" title="Undo">↶</button><button type="button" data-action="redo" title="Redo">↷</button><button type="button" data-action="split" title="Split at playhead">✂</button><button type="button" data-action="duplicate" title="Duplicate selected region">▣</button><button type="button" data-action="delete-clip" title="Delete selected region">⌫</button><button type="button" data-action="comp-take" title="Place selected take section into the non-destructive comp lane">COMP TAKE</button>',
        '<button type="button" data-action="zoom-out">−</button><input data-zoom type="range" min="24" max="288" step="6" value="72" aria-label="Timeline zoom" style="width:75px;accent-color:#c9a24a"><button type="button" data-action="zoom-in">＋</button><select data-snap aria-label="Timeline snap" style="max-width:105px;background:#101d3d;color:#e8edf8;border:1px solid #7184a8;border-radius:5px;padding:5px"><option value="bars">BAR</option><option value="beats">BEAT</option><option value="subdivisions">1/16</option><option value="seconds">SEC</option><option value="off">FREE</option></select><button type="button" data-action="slip-mode" title="Toggle slip editing">SLIP OFF</button>',
        '<span class="lc-spacer"></span>',
        '</div>',
        '<div class="lc-track-tools"><div><button type="button" data-action="add-track">＋ TRACK</button> <button type="button" data-action="add-midi-track">＋ MIDI</button> <button type="button" data-action="import-audio">⇧ IMPORT AUDIO</button><input data-audio-files type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm" multiple hidden></div><strong data-song-title>LAMBO CITY · UNTITLED SESSION</strong></div>',
        '<div class="lc-ruler-head"><strong>TRACKS / REGIONS</strong><strong data-ruler-label>BAR 01 — 128</strong></div>',
        '<div class="lc-lanes" data-lanes></div>',
        '<div class="lc-status" data-status role="status" aria-live="polite">EDIT session ready · Select a track and arm it to record.</div>',
        '</section></div>'
      ].join("");

      this.root = root;
      StudioMultitrackWorkspace.root = root;
      StudioMultitrackWorkspace.onRender = () => this.render();
      this.beforeUnloadHandler = event => {
        if (!StudioMultitrackWorkspace.dirty || StudioMultitrackWorkspace.saveState === "saved") return;
        event.preventDefault();
        event.returnValue = "LAMBO CITY has unsaved session changes.";
        return event.returnValue;
      };
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
      this.bindEvents();
      this.render();
      void this.refreshInputDevices();
      void StudioMultitrackWorkspace.findLatestRecovery().then(async checkpoint => {
        if (!this.root?.isConnected) return;
        if (checkpoint) {
          const restore = window.confirm("LAMBO CITY found an interrupted session: " + checkpoint.projectName + " (" + checkpoint.trackCount + " tracks). Restore the latest recovery checkpoint?");
          if (restore) {
            await StudioMultitrackWorkspace.recoverUnsavedSession(checkpoint.projectId);
            this.render();
            return;
          }
        }
        if (!StudioMultitrackWorkspace.activeProjectId && StudioMultitrackWorkspace.activeProjectName === "Untitled Song") this.showSongNamePrompt();
      }).catch(error => {
        this.status("Recovery check unavailable: " + (error?.message || error));
        if (!StudioMultitrackWorkspace.activeProjectId && StudioMultitrackWorkspace.activeProjectName === "Untitled Song") this.showSongNamePrompt();
      });
      return root;
    },

    showSongNamePrompt() {
      if (!this.root || this.root.querySelector("[data-song-name-overlay]")) return;
      const overlay = document.createElement("div");
      overlay.dataset.songNameOverlay = "";
      overlay.style.cssText = "position:absolute;inset:0;z-index:40;display:grid;place-items:center;padding:20px;background:rgba(3,8,24,.78);backdrop-filter:blur(8px)";
      overlay.innerHTML = '<section style="width:min(440px,100%);padding:26px;border:1px solid #C9A24A;border-radius:14px;background:linear-gradient(145deg,#172b63,#08132f);box-shadow:0 18px 50px #000b;color:#fff"><div style="color:#18D8FF;font-size:10px;font-weight:900;letter-spacing:2px">LAMBO CITY RECORDS · NEW SESSION</div><h2 style="margin:10px 0 6px;font-size:22px">Name your song or beat</h2><p style="margin:0 0 18px;color:#b8c8e4;font-size:12px;line-height:1.5">Give this session a name. You can change it later from SESSION.</p><input data-song-name-input type="text" maxlength="80" value="" placeholder="Enter song name" style="width:100%;min-height:46px;padding:11px;border:1px solid #6682b2;border-radius:7px;background:#06132d;color:#fff;font-size:16px"><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:15px"><button type="button" data-song-name-skip style="min-height:40px;padding:9px 13px;border:1px solid #68799b;border-radius:7px;background:#17264a;color:#d9e4f7">SKIP</button><button type="button" data-song-name-start style="min-height:40px;padding:9px 15px;border:1px solid #e7c36d;border-radius:7px;background:linear-gradient(#e7c36d,#9b702b);color:#111a31;font-weight:900">START SESSION</button></div></section>';
      const input = overlay.querySelector("[data-song-name-input]");
      const finish = useName => {
        const name = useName ? input.value.trim() : "";
        StudioMultitrackWorkspace.activeProjectName = (name || "Untitled Song").slice(0, 80);
        StudioMultitrackWorkspace.scheduleProjectAutosave();
        overlay.remove();
        this.renderHeader();
        this.status("Session ready · " + StudioMultitrackWorkspace.activeProjectName);
      };
      overlay.querySelector("[data-song-name-start]").addEventListener("click", () => finish(true));
      overlay.querySelector("[data-song-name-skip]").addEventListener("click", () => finish(false));
      input.addEventListener("keydown", event => {
        if (event.key === "Enter") finish(true);
      });
      this.root.appendChild(overlay);
      input.focus();
    },

    async refreshInputDevices() {
      const select = this.root?.querySelector("[data-input-device]");
      if (!select || !navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === "audioinput");
        const selected = StudioMultitrackWorkspace.inputDeviceId || "";
        select.replaceChildren();
        const fallback = document.createElement("option");
        fallback.value = "";
        fallback.textContent = "Default microphone";
        select.appendChild(fallback);
        devices.forEach((device, index) => {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.textContent = device.label || "Microphone " + (index + 1);
          select.appendChild(option);
        });
        if (selected && !devices.some(device => device.deviceId === selected)) {
          StudioMultitrackWorkspace.inputDeviceId = "";
          StudioMultitrackWorkspace.inputLatencyMs = Math.max(0, Number(StudioMultitrackWorkspace.inputLatencyByDevice[""]) || 0);
        }
        select.value = StudioMultitrackWorkspace.inputDeviceId || "";
        const latency = this.root.querySelector("[data-input-latency]");
        if (latency) latency.value = String(StudioMultitrackWorkspace.inputLatencyByDevice[selected] ?? StudioMultitrackWorkspace.inputLatencyMs ?? 0);
      } catch (error) {
        this.status("INPUT DEVICE LIST UNAVAILABLE · " + (error?.message || error));
      }
    },

    startInputMeter() {
      this.stopInputMeter();
      const meter = this.root?.querySelector("[data-input-meter]");
      const tick = () => {
        if (!this.root || !StudioMultitrackWorkspace.isTrackRecording()) {
          this.stopInputMeter();
          return;
        }
        const level = StudioRecordingEngine.getInputLevel();
        if (meter?.isConnected) meter.style.transform = "scaleX(" + Math.max(.015, level) + ")";
        this.inputMeterFrame = requestAnimationFrame(tick);
      };
      this.inputMeterFrame = requestAnimationFrame(tick);
    },

    stopInputMeter() {
      if (this.inputMeterFrame !== null) cancelAnimationFrame(this.inputMeterFrame);
      this.inputMeterFrame = null;
      const meter = this.root?.querySelector("[data-input-meter]");
      if (meter) meter.style.transform = "scaleX(.015)";
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
      root.tabIndex = 0;
      root.addEventListener("pointerdown", event => {
        if (event.target.closest("input,textarea,select,button")) return;
        root.focus({ preventScroll: true });
      });
      this.keydownHandler = event => {
        // The EDIT screen can remain mounted while other studio stations are
        // shown. Only handle shortcuts while EDIT is actually visible.
        if (!root.isConnected || root.getClientRects().length === 0 || event.repeat) return;
        const target = event.target;
        // Never steal keystrokes from text entry, selects, editable content,
        // or focused buttons (which retain their native keyboard behavior).
        if (target && (target.matches("input,textarea,select") || target.isContentEditable)) return;
        if (target && target.closest("button")) return;
        const workspace = StudioMultitrackWorkspace;
        const key = String(event.key || "").toLowerCase();
        const modifier = event.metaKey || event.ctrlKey;
        let handled = false;
        if (!modifier && key === "enter") {
          event.preventDefault();
          workspace.stopAll();
          workspace.playheadBar = 1;
          this.renderHeader();
          this.renderLanes();
          this.status("Playhead returned to the beginning · stopped.");
          handled = true;
        } else if (modifier && key === "z") {
          if (event.shiftKey) workspace.redo();
          else workspace.undo();
          handled = true;
        } else if (modifier && key === "y") {
          workspace.redo();
          handled = true;
        } else if (modifier && key === "d" && workspace.selectedClipId) {
          workspace.duplicateSelectedClip();
          handled = true;
        } else if ((key === "delete" || key === "backspace") && workspace.selectedClipId) {
          workspace.deleteSelectedClip();
          handled = true;
        } else if (key === "s" && workspace.selectedClipId) {
          workspace.splitSelectedClip();
          handled = true;
        }
        if (handled) this.render();
      };
      window.addEventListener("keydown", this.keydownHandler);
      root.addEventListener("click", async event => {
        const trackControl = event.target.closest("[data-track-control]");
        if (trackControl && root.contains(trackControl)) {
          const trackRow = trackControl.closest("[data-track-id]");
          const track = StudioMultitrackWorkspace.tracks.find(item => item.id === trackRow?.dataset.trackId);
          if (!track) return;
          const key = trackControl.dataset.trackControl === "mute" ? "muted" : trackControl.dataset.trackControl === "solo" ? "solo" : "armed";
          StudioMultitrackWorkspace.recordHistory("Track " + key);
          const linked = track.groupId ? StudioMultitrackWorkspace.tracks.filter(item => item.groupId === track.groupId) : [track];
          linked.forEach(item => { item[key] = !track[key]; });
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
          if (action === "add-marker") {
            const name = root.querySelector("[data-marker-name]").value.trim();
            const bar = Number(root.querySelector("[data-marker-bar]").value || workspace.playheadBar);
            if (workspace.addMarker(name, bar)) root.querySelector("[data-marker-name]").value = "";
            this.render();
          } else if (action === "set-cycle") {
            workspace.setLoopRange(Number(root.querySelector("[data-loop-start]").value), Number(root.querySelector("[data-loop-end]").value), true);
            this.render();
          } else if (action === "toggle-cycle") {
            workspace.setLoopRange(workspace.loopRange.startBar, workspace.loopRange.endBar, !workspace.loopRange.enabled);
            this.render();
          } else if (action === "add-tempo-point") {
            workspace.addTempoChange(Number(root.querySelector("[data-tempo-bar]").value), Number(root.querySelector("[data-tempo-value]").value));
            this.render();
          } else if (action === "add-meter-point") {
            workspace.addTimeSignatureChange(Number(root.querySelector("[data-meter-bar]").value), root.querySelector("[data-meter-value]").value);
            this.render();
          } else if (action === "toggle-follow") {
            workspace.toggleFollowPlayhead(); this.renderHeader();
          } else if (action === "toggle-multi") {
            workspace.toggleMultiSelect(); this.renderHeader();
          } else if (action === "track-group") {
            const row = button.closest("[data-track-id]"); const track = workspace.tracks.find(item => item.id === row?.dataset.trackId);
            const name = window.prompt("Track folder / group name:", track?.groupName || "Rhythm Section");
            if (name !== null && name.trim()) workspace.assignTrackGroup(track.id, name);
            this.render();
          } else if (action === "toggle-track-group") {
            const row = button.closest("[data-track-id]"); workspace.toggleTrackGroup(row?.dataset.trackId);
            this.render();
          } else if (action === "session-menu") {
            root.querySelector("[data-session-menu]").classList.toggle("open");
          } else if (action === "record") {
            await workspace.startArmedRecording({ vocalEffects: this.beatLab && this.beatLab.vocalEffects, countInBars: Number(root.querySelector("[data-count-in]")?.value || 0), punchInBar: root.querySelector("[data-punch-in]")?.value || null, punchOutBar: root.querySelector("[data-punch-out]")?.value || null, monitorInput: Boolean(root.querySelector("[data-input-monitor]")?.checked) });
            await this.refreshInputDevices();
            if (workspace.isTrackRecording()) this.startInputMeter();
            if (!workspace.pendingRecording && !workspace.isTrackRecording()) this.status("Recording did not start. Arm exactly one AUDIO track using its R button, then press RECORD again.");
          } else if (action === "play") {
            await workspace.playAll();
            this.status(workspace.isPlaying() ? "Playback running." : "Nothing to play yet. Record or import audio into a track first.");
          } else if (action === "toggle-metronome") {
            workspace.toggleMetronome();
            this.renderHeader();
          } else if (action === "stop") {
            workspace.stopAll();
            if (workspace.pendingRecording) workspace.cancelScheduledRecording();
            if (workspace.isTrackRecording()) await workspace.stopArmedRecording();
            this.stopInputMeter();
            await this.refreshInputDevices();
            this.status("Playback / recording stopped.");
          } else if (action === "add-track") {
            const name = window.prompt("Name the new track:", "New Audio Track");
            if (name === null) return;
            workspace.recordHistory("Add track");
            workspace.addTrack("audio", name);
            this.render();
            this.status("Track added.");
          } else if (action === "add-midi-track") {
            workspace.recordHistory("Add MIDI track");
            const midiTrack = workspace.addTrack("midi", "MIDI " + (workspace.tracks.filter(track => track.type === "midi").length + 1));
            midiTrack.midiNotes = [];
            this.render();
            this.status("MIDI track added · open MIX & MASTER to edit its piano roll.");
          } else if (action === "import-audio") {
            root.querySelector("[data-audio-files]").click();
          } else if (action === "undo") {
            workspace.undo();
            this.render();
          } else if (action === "redo") {
            workspace.redo();
            this.render();
          } else if (action === "comp-take") {
            workspace.compSelectedTake();
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
          } else if (action === "slip-mode") {
            workspace.slipMode = !workspace.slipMode;
            button.textContent = workspace.slipMode ? "SLIP ON" : "SLIP OFF";
            button.classList.toggle("active", workspace.slipMode);
            this.status(workspace.slipMode ? "Slip editing enabled." : "Region move editing enabled.");
          } else if (action === "save-session") {
            const name = workspace.activeProjectName || window.prompt("Song name:", "Untitled Song") || "Untitled Song";
            const id = workspace.activeProjectId || ("lc-daw-" + (globalThis.crypto && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : Date.now()));
            await workspace.saveSession(id, name);
            this.status("Saved session: " + name);
            root.querySelector("[data-session-menu]").classList.remove("open");
            this.renderHeader();
          } else if (action === "open-session") {
            if (!await this.confirmReplaceUnsaved(workspace, "open another session")) return;
            const projects = await workspace.listSavedSessions();
            if (!projects.length) {
              this.status("No saved sessions found in this browser.");
              return;
            }
            const options = projects.map((project, index) => (index + 1) + ". " + project.projectName).join("\n");
            const choice = Number(window.prompt("Enter the session number to open:\n" + options, "1"));
            if (!Number.isInteger(choice) || choice < 1 || choice > projects.length) return;
            await workspace.loadSession(projects[choice - 1].projectId);
            this.render();
            this.status("Opened " + workspace.activeProjectName + ".");
          } else if (action === "new-session") {
            if (!await this.confirmReplaceUnsaved(workspace, "start a new session")) return;
            workspace.activeProjectId = null;
            workspace.activeProjectName = "Untitled Song";
            workspace.undoStack = [];
            workspace.redoStack = [];
            workspace.resetSession();
            this.render();
            this.showSongNamePrompt();
          } else if (action === "export-wav") {
            button.disabled = true;
            try {
              const wav = await renderStudioSessionToWav({ tracks: workspace.tracks, tempo: workspace.tempo, timeSignature: workspace.timeSignature, tempoChanges: workspace.tempoChanges, timeSignatureChanges: workspace.timeSignatureChanges, masterSettings: workspace.masterSettings });
              downloadStudioWav(wav, workspace.activeProjectName || "lambo-city-song");
              this.status("WAV master exported.");
            } finally { button.disabled = false; }
          } else if (action === "export-mp3") {
            button.disabled = true;
            try {
              const mp3 = await renderStudioSessionToMp3({ tracks: workspace.tracks, tempo: workspace.tempo, timeSignature: workspace.timeSignature, tempoChanges: workspace.tempoChanges, timeSignatureChanges: workspace.timeSignatureChanges });
              downloadStudioMp3(mp3, workspace.activeProjectName || "lambo-city-song");
              this.status("MP3 master exported at 192 kbps.");
            } finally { button.disabled = false; }
          } else if (action === "session-versions") {
            if (!workspace.activeProjectId) { this.status("Save this session once to create version history."); return; }
            const versions = await workspace.listSessionVersions();
            if (!versions.length) { this.status("No saved versions are available yet."); return; }
            const options = versions.map((version, index) => (index + 1) + ". " + new Date(version.createdAt).toLocaleString() + " · " + version.label).join("\\n");
            const choice = Number(window.prompt("Choose a restore point:\\n" + options, "1"));
            if (!Number.isInteger(choice) || choice < 1 || choice > versions.length) return;
            if (!await this.confirmReplaceUnsaved(workspace, "restore a previous version")) return;
            await workspace.restoreSessionVersion(versions[choice - 1].versionId);
            this.render();
          } else if (action === "export-session") {
            button.disabled = true;
            try {
              const dawSession = await workspace.exportSession();
              const activePattern = this.beatLab?.pattern;
              let project = this.beatLab?.currentProject?.schemaVersion === 1
                ? JSON.parse(JSON.stringify(this.beatLab.currentProject))
                : createSongProject({
                    title: workspace.activeProjectName || "Untitled Song",
                    pattern: activePattern,
                    soundProfile: this.beatLab?.soundProfile || "beatLab"
                  });

              project.metadata = {
                ...(project.metadata || {}),
                title: workspace.activeProjectName || project.metadata?.title || "Untitled Song",
                updatedAt: new Date().toISOString()
              };
              project.settings = {
                ...(project.settings || {}),
                bpm: dawSession.tempo,
                soundProfile: this.beatLab?.soundProfile === "mpc" ? "mpc" : "beatLab"
              };
              if (!Array.isArray(project.patterns)) project.patterns = [];
              if (!project.arrangement || !Array.isArray(project.arrangement.sections)) {
                project.arrangement = createSongProject({ title: project.metadata.title }).arrangement;
              }

              if (activePattern?.steps) {
                // The portable project importer restores the first saved pattern
                // as the active Beat Lab pattern. Put the current pattern first
                // while preserving its ID so arrangement clips remain connected.
                const activeSteps = JSON.stringify(activePattern.steps);
                const existingIndex = project.patterns.findIndex(pattern =>
                  JSON.stringify(pattern.steps) === activeSteps
                );
                const activeEntry = existingIndex >= 0
                  ? project.patterns.splice(existingIndex, 1)[0]
                  : {
                      id: "pattern-" + Date.now(),
                      name: "Current Beat",
                      steps: JSON.parse(activeSteps)
                    };
                activeEntry.bpm = Math.max(60, Math.min(180, Number(dawSession.tempo) || Number(activePattern.bpm) || 100));
                project.patterns.unshift(activeEntry);
              }

              project.dawSession = dawSession;
              project.mpcSamplerState = StudioMPCSampler.exportState();
              const sampleIds = [
                ...(project.mpcPerformance?.events || []).map(event => event.sampleId),
                ...Object.values(project.mpcSamplerState.assignments || {})
              ].filter(Boolean);
              project.mpcAssets = await StudioMPCSampler.exportAssets(sampleIds);
              project.mpcLibraryAssignments = StudioMPCLibrary.exportAssignments();
              project.mpcLibrarySounds = StudioMPCLibrary.exportAssignedSounds();

              const packageText = exportSongProjectPackage(project);
              const blob = new Blob([packageText], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              const safeName = project.metadata.title.replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, "-") || "lambo-city-song";
              link.href = url;
              link.download = safeName + ".lcp";
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.setTimeout(() => URL.revokeObjectURL(url), 1000);
              this.status("Complete LAMBO CITY project exported · .lcp");
            } finally {
              button.disabled = false;
            }
          } else if (action === "import-session") {
            root.querySelector("[data-session-file]").click();
          } else if (action === "delete-session") {
            if (!workspace.activeProjectId) { this.status("Save this session before deleting it from the library."); return; }
            if (!window.confirm("Permanently delete this saved session from this browser?")) return;
            await workspace.removeSavedSession(workspace.activeProjectId);
            workspace.activeProjectId = null;
            this.status("Saved session deleted. The open arrangement remains in memory.");
            root.querySelector("[data-session-menu]").classList.remove("open");
          } else if (action === "previous-view") {
            if (typeof this.onPrevious === "function") this.onPrevious();
          } else if (action === "next-view") {
            if (typeof this.onNext === "function") this.onNext();
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
        if (event.target.matches("[data-input-device]")) {
          const selected = event.target.value || "";
          workspace.inputDeviceId = selected;
          workspace.inputLatencyMs = Math.max(0, Math.min(500, Number(workspace.inputLatencyByDevice[selected]) || 0));
          const latency = root.querySelector("[data-input-latency]");
          if (latency) latency.value = String(workspace.inputLatencyMs);
          workspace.scheduleProjectAutosave();
          this.status("Recording input changed · " + (event.target.selectedOptions[0]?.textContent || "Default microphone") + ".");
        }
        if (event.target.matches("[data-input-latency]")) {
          workspace.inputLatencyMs = Math.max(0, Math.min(500, Number(event.target.value) || 0));
          workspace.inputLatencyByDevice[workspace.inputDeviceId || ""] = workspace.inputLatencyMs;
          workspace.scheduleProjectAutosave();
          this.status("Input timing compensation · " + workspace.inputLatencyMs + " ms.");
        }
        if (event.target.matches("[data-snap]")) {
          workspace.snapMode = ["bars", "beats", "subdivisions", "seconds", "off"].includes(event.target.value) ? event.target.value : "bars";
          this.renderLanes();
          workspace.scheduleProjectAutosave();
          this.status("Snap mode · " + event.target.value.toUpperCase() + ".");
        }
        if (event.target.matches("[data-tempo]")) {
          StudioMultitrackWorkspace.setTempo(Number(event.target.value));
          this.renderHeader();
          this.status("Tempo set to " + StudioMultitrackWorkspace.tempo + " BPM.");
        }
        if (event.target.matches("[data-track-volume], [data-track-pan]")) {
          delete event.target.dataset.historyStarted;
        }
      });

      root.querySelector("[data-session-file]").addEventListener("change", async event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
          if (!await this.confirmReplaceUnsaved(workspace, "import a project file")) { event.target.value = ""; return; }
          if (file.size > 60000000) throw new Error("Project file exceeds the 60 MB import limit.");
          const fileText = await file.text();
          let project = null;

          try {
            project = importSongProjectPackage(fileText);
          } catch (packageError) {
            let legacySession;
            try { legacySession = JSON.parse(fileText); }
            catch { throw packageError; }
            if (!workspace.validateSessionData(legacySession)) throw packageError;
            workspace.importSession(legacySession);
            workspace.activeProjectName = legacySession.projectName || "Imported Song";
            workspace.activeProjectId = null;
            workspace.dirty = true;
            workspace.scheduleProjectAutosave();
            this.render();
            this.status("Imported legacy session · auto-save pending.");
            event.target.value = "";
            return;
          }

          if (project.dawSession && !workspace.validateSessionData(project.dawSession)) {
            throw new Error("The DAW session inside this project file failed validation.");
          }

          project.id = "song-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
          project.metadata.updatedAt = new Date().toISOString();

          if (Array.isArray(project.mpcAssets) && project.mpcAssets.length) {
            await StudioMPCSampler.importAssets(project.mpcAssets);
          }
          if (project.mpcSamplerState) StudioMPCSampler.importState(project.mpcSamplerState);
          if (project.mpcLibrarySounds) StudioMPCLibrary.importAssignedSounds(project.mpcLibrarySounds);
          if (project.mpcLibraryAssignments) StudioMPCLibrary.importAssignments(project.mpcLibraryAssignments);

          if (project.dawSession) {
            workspace.importSession(project.dawSession);
          } else {
            workspace.resetSession({ tempo: project.settings?.bpm || 100 });
          }

          const title = project.metadata.title || "Imported Song";
          workspace.activeProjectName = title;
          workspace.activeProjectId = null;

          const storedProject = { ...project };
          delete storedProject.dawSession;
          delete storedProject.mpcAssets;
          delete storedProject.mpcSamplerState;
          delete storedProject.mpcLibraryAssignments;
          delete storedProject.mpcLibrarySounds;
          saveSongProject(storedProject);

          if (this.beatLab) {
            this.beatLab.currentProject = storedProject;
            const firstPattern = project.patterns?.[0];
            if (firstPattern) this.beatLab.pattern = JSON.parse(JSON.stringify(firstPattern));
            this.beatLab.soundProfile = project.settings?.soundProfile === "mpc" ? "mpc" : "beatLab";
            const bpmInput = this.beatLab.ui?.querySelector?.("[data-bpm]");
            const bpmLabel = this.beatLab.ui?.querySelector?.("[data-bpm-label]");
            const soundSelect = this.beatLab.ui?.querySelector?.("[data-sound-profile]");
            if (bpmInput) bpmInput.value = String(workspace.tempo);
            if (bpmLabel) bpmLabel.textContent = workspace.tempo + " BPM";
            if (soundSelect) soundSelect.value = this.beatLab.soundProfile;
          }

          await workspace.saveSession(project.id, title, { createVersion: false });
          this.render();
          this.status("Imported complete LAMBO CITY project · " + title);
        } catch (error) {
          this.status("PROJECT IMPORT ERROR: " + (error && error.message ? error.message : error));
        }
        event.target.value = "";
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

    async confirmReplaceUnsaved(workspace, targetLabel) {
      if (!workspace.dirty) return true;
      const saveFirst = window.confirm("This session has unsaved changes. Save them before " + targetLabel + "? Choose Cancel to keep working.");
      if (saveFirst) {
        const id = workspace.activeProjectId || ("lc-daw-" + (globalThis.crypto?.randomUUID?.() || Date.now()));
        await workspace.saveSession(id, workspace.activeProjectName || "Untitled Song");
        return true;
      }
      return window.confirm("Discard the unsaved changes and continue to " + targetLabel + "? This cannot be undone.");
    },

    renderHeader() {
      const workspace = StudioMultitrackWorkspace;
      const title = this.root.querySelector("[data-song-title]");
      const tempo = this.root.querySelector("[data-tempo]");
      const zoom = this.root.querySelector("[data-zoom]");
      if (title) title.textContent = safeText(workspace.activeProjectName || "Untitled Song").toUpperCase();
      const saveState = this.root.querySelector("[data-save-state]");
      if (saveState) saveState.textContent = ({ saved: "SAVED", pending: "AUTO-SAVE PENDING", saving: "SAVING…", error: "SAVE ERROR" })[workspace.saveState] || "SAVED";
      if (tempo) tempo.value = String(workspace.tempo);
      if (zoom) zoom.value = String(workspace.zoomBarWidth);
      const snap = this.root.querySelector("[data-snap]");
      if (snap) snap.value = workspace.snapMode || "bars";
      const meter = this.root.querySelector("[data-clock]");
      if (meter) meter.textContent = Math.round(workspace.getTempoAtBar(workspace.playheadBar)) + " BPM / " + (()=>{const m=workspace.getTimeSignatureAtBar(workspace.playheadBar);return m.numerator+"/"+m.denominator;})() + " · BAR " + Math.floor(workspace.playheadBar);
      const click=this.root.querySelector('[data-action="toggle-metronome"]');if(click){click.textContent=workspace.metronomeSettings?.enabled?"CLICK ON":"CLICK OFF";click.classList.toggle("active",Boolean(workspace.metronomeSettings?.enabled));click.setAttribute("aria-pressed",String(Boolean(workspace.metronomeSettings?.enabled)));}
      const loopStart=this.root.querySelector("[data-loop-start]"),loopEnd=this.root.querySelector("[data-loop-end]"),cycle=this.root.querySelector('[data-action="toggle-cycle"]');
      if(loopStart)loopStart.value=String(workspace.loopRange.startBar);if(loopEnd)loopEnd.value=String(workspace.loopRange.endBar);
      if(cycle){cycle.textContent=workspace.loopRange.enabled?"CYCLE ON":"CYCLE OFF";cycle.classList.toggle("active",Boolean(workspace.loopRange.enabled));}
      const follow=this.root.querySelector('[data-action="toggle-follow"]');if(follow){follow.textContent=workspace.followPlayhead?"FOLLOW ON":"FOLLOW OFF";follow.classList.toggle("active",Boolean(workspace.followPlayhead));}
      const multi=this.root.querySelector('[data-action="toggle-multi"]');if(multi){multi.textContent=workspace.multiSelectMode?"MULTI ON":"MULTI OFF";multi.classList.toggle("active",Boolean(workspace.multiSelectMode));}
      const tempoBar=this.root.querySelector("[data-tempo-bar]"),tempoValue=this.root.querySelector("[data-tempo-value]"),meterBar=this.root.querySelector("[data-meter-bar]"),meterValue=this.root.querySelector("[data-meter-value]");
      const markerBar=this.root.querySelector("[data-marker-bar]");if(markerBar)markerBar.value=String(Math.floor(workspace.playheadBar));
      if(tempoBar)tempoBar.value=String(Math.floor(workspace.playheadBar));if(tempoValue)tempoValue.value=String(Math.round(workspace.getTempoAtBar(workspace.playheadBar)));if(meterBar)meterBar.value=String(Math.floor(workspace.playheadBar));
      if(meterValue){const meter=workspace.getTimeSignatureAtBar(workspace.playheadBar);meterValue.value=meter.numerator+"/"+meter.denominator;}
      const slip = this.root.querySelector('[data-action="slip-mode"]');
      if (slip) { slip.textContent = workspace.slipMode ? "SLIP ON" : "SLIP OFF"; slip.classList.toggle("active", Boolean(workspace.slipMode)); }
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
        if (track.groupId && track.groupCollapsed && workspace.tracks.findIndex(item => item.groupId === track.groupId) !== index) return;
        const row = document.createElement("div");
        row.className = "lc-track-row";
        row.dataset.trackId = track.id;
        const color = index < 3 ? COLORS.cyan : COLORS.red;
        const icon = index === 0 ? "🐂" : index === 1 ? "🏎️" : index === 2 ? "🚘" : index === 8 ? "♫" : "🏁";
        const head = document.createElement("div");
        head.className = "lc-track-head";
        head.innerHTML = [
          '<div class="lc-track-title"><i class="lc-track-color" style="background:' + color + '"></i><span class="lc-car-icon">' + icon + '</span><span title="' + safeText(track.name) + '">' + safeText(track.name) + '</span></div>',
          '<div class="lc-track-buttons"><button type="button" data-action="track-group" title="Assign this track to a folder/group">' + (track.groupName ? 'GROUP · ' + safeText(track.groupName) : 'GROUP +') + '</button>' + (track.groupId ? '<button type="button" data-action="toggle-track-group" title="Collapse or expand track folder">' + (track.groupCollapsed ? '▸' : '▾') + '</button>' : ''),
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
          snapMode: workspace.snapMode,
          tempo: workspace.tempo,
          slipMode: workspace.slipMode,
          selectedClipId: workspace.selectedClipId,
          selectedClipIds: workspace.selectedRegionIds,
          markers: workspace.markers,
          loopRange: workspace.loopRange,
          tempoChanges: workspace.tempoChanges,
          timeSignatureChanges: workspace.timeSignatureChanges,
          timeSignature: workspace.timeSignature,
          playheadBar: workspace.playheadBar,
          onSelect: (clip, event) => {
            const selected = workspace.selectClip(track.id, clip, event);
            host.querySelectorAll(".lc-arrangement-clip").forEach(node => {
              node.classList.toggle("selected", workspace.selectedRegionIds.includes(node.dataset.clipId));
            });
            return selected;
          },
          onEditStart: label => workspace.recordHistory(label || "Edit audio region"),
          onChange: clip => {
            workspace.arrangementPlayback?.stop();
            workspace.scheduleProjectAutosave();
            this.renderLanes();
            this.status(clip.name + " updated at bar " + clip.startBar + ".");
          },
          onPlayheadChange: bar => {
            workspace.playheadBar = bar;
            this.renderHeader();
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
      this.stopInputMeter();
      if (this.keydownHandler) window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
      if (this.beforeUnloadHandler) window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
      if (StudioMultitrackWorkspace.root === this.root) { StudioMultitrackWorkspace.root = null; StudioMultitrackWorkspace.onRender = null; }
      if (this.root) this.root.remove();
      this.root = null;
    }
  };
}

export default createStudioDAWEditScreen;
