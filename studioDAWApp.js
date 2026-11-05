/*
 * LAMBO CITY RECORDS
 * STANDALONE DAW APPLICATION — V1
 *
 * Connects:
 * - Modular DAW workspace
 * - Existing Floor 2 Beat Lab singleton
 * - Existing Beat Lab panel bridge
 *
 * Does not create another audio engine,
 * sequencer, sound kit, or song-project system.
 */

import StudioDAWWorkspace from "./studioDAWWorkspace.js";
import Floor2StudioApp from "./floor2StudioApp.js";
import MPCInterface from "./mpc-interface.js";
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioSoundKit from "./studioSoundKit.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import { createStudioDAWEditScreen } from "./studioDAWEditScreen.js";
import {
  createStudioDAWBeatLabPanel
} from "./studioDAWBeatLabPanel.js";
import { createStudioMixMasterApp } from "./studioMixMasterApp.js";


function createMPCPanel({ beatLab, workspace } = {}) {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:16px;width:100%;color:#f4f1eb";
  root.innerHTML = `
    <header style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
      <div>
        <div style="color:#e6bb69;font-size:11px;letter-spacing:2px">LAMBO CITY RECORDS · VINTAGE MPC</div>
        <h2 style="margin:7px 0;font-size:24px">MPC PERFORMANCE</h2>
        <p style="margin:0;color:#a8a8b1;font-size:13px">A focused 16-pad production surface connected to your current song.</p>
      </div>
      <button type="button" data-mpc-digital style="min-height:44px;padding:10px 14px;border:1px solid #80643a;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:bold">OPEN DIGITAL BEAT LAB</button>
    </header>
    <div style="display:flex;gap:8px;flex-wrap:wrap" data-mpc-tracks>
      <button type="button" data-track="kick">KICK</button>
      <button type="button" data-track="snare">SNARE</button>
      <button type="button" data-track="hat">HI-HAT</button>
    </div>
    <div data-mpc-pads style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;max-width:620px;margin:auto;width:100%"></div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <button type="button" data-mpc-play style="min-height:46px;padding:11px 18px;border:1px solid #80643a;border-radius:8px;background:#594321;color:white;font-weight:bold">▶ PLAY</button>
      <button type="button" data-mpc-stop style="min-height:46px;padding:11px 18px;border:1px solid #454958;border-radius:8px;background:#222631;color:white;font-weight:bold">■ STOP</button>
      <label style="display:flex;gap:8px;align-items:center;color:#e6bb69;font-size:12px">TEMPO
        <input data-mpc-tempo type="range" min="60" max="180" value="${beatLab?.pattern?.bpm || 100}">
        <strong data-mpc-tempo-label>${beatLab?.pattern?.bpm || 100} BPM</strong>
      </label>
      <button type="button" data-mpc-save style="min-height:42px;padding:10px 14px;border:1px solid #665438;border-radius:8px;background:#222631;color:white;font-weight:bold">SAVE BEAT</button>
    </div>
    <div data-mpc-status role="status" aria-live="polite" style="min-height:22px;color:#e6bb69;font-size:12px"></div>
    <div data-mpc-device-note style="color:#a8a8b1;font-size:12px;line-height:1.5"></div>
  `;

  let activeTrack = "kick";
  const pads = root.querySelector("[data-mpc-pads]");
  const status = message => {
    root.querySelector("[data-mpc-status]").textContent = message;
  };
  const touchAvailable =
    Number(navigator.maxTouchPoints || 0) > 0 ||
    ("ontouchstart" in window);
  root.querySelector("[data-mpc-device-note]").textContent = touchAvailable
    ? "Touchscreen pad control available. Mouse and trackpad input are also supported."
    : "For the most natural pad performance, use the Digital Beat Lab on this device. The MPC controls remain available here.";

  root.querySelectorAll("[data-track]").forEach(button => {
    button.style.cssText = "min-height:42px;padding:10px 16px;border:1px solid #665438;border-radius:8px;background:#222631;color:#f4f1eb;font-weight:bold";
    button.addEventListener("click", () => {
      activeTrack = button.dataset.track;
      renderPads();
    });
  });

  const renderPads = () => {
    pads.replaceChildren();
    const steps = beatLab?.pattern?.steps?.[activeTrack] || [];
    for (let index = 0; index < 16; index++) {
      const pad = document.createElement("button");
      pad.type = "button";
      pad.textContent = String(index + 1).padStart(2, "0");
      pad.setAttribute("aria-pressed", String(Boolean(steps[index])));
      pad.style.cssText = "aspect-ratio:1;min-height:58px;border:1px solid #80643a;border-radius:10px;background:" +
        (steps[index] ? "linear-gradient(145deg,#f1d49c,#a87531)" : "linear-gradient(145deg,#282b34,#11131a)") +
        ";color:" + (steps[index] ? "#17130d" : "#f4f1eb") +
        ";font-size:16px;font-weight:800;touch-action:manipulation;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)";
      pad.addEventListener("pointerdown", async event => {
        event.preventDefault();
        beatLab.pattern.steps[activeTrack][index] =
          !beatLab.pattern.steps[activeTrack][index];
        renderPads();

        try {
          const audio = await StudioAudioEngine.resume();
          if (!audio || audio.state !== "running") return;
          beatLab.audio = audio;
          if (!beatLab.noiseBuffer) {
            beatLab.noiseBuffer = beatLab.createNoiseBuffer();
          }
          beatLab.soundProfile = "mpc";
          StudioSoundKit.play(
            audio,
            "mpc",
            activeTrack,
            audio.currentTime,
            beatLab.noiseBuffer
          );
        } catch (error) {
          status("MPC audio could not start: " + (error?.message || error));
        }
      });
      pads.appendChild(pad);
    }
    root.querySelectorAll("[data-track]").forEach(button => {
      button.style.background = button.dataset.track === activeTrack ? "#594321" : "#222631";
      button.setAttribute("aria-pressed", String(button.dataset.track === activeTrack));
    });
  };

  root.querySelector("[data-mpc-play]").addEventListener("click", async () => {
    if (!beatLab) return;
    beatLab.soundProfile = "mpc";
    await beatLab.start();
    status("Vintage MPC pattern playing.");
  });
  root.querySelector("[data-mpc-stop]").addEventListener("click", () => {
    beatLab?.stop();
    status("MPC playback stopped.");
  });
  root.querySelector("[data-mpc-tempo]").addEventListener("input", event => {
    const bpm = Number(event.target.value);
    if (beatLab?.pattern) beatLab.pattern.bpm = bpm;
    root.querySelector("[data-mpc-tempo-label]").textContent = bpm + " BPM";
  });
  root.querySelector("[data-mpc-save]").addEventListener("click", () => {
    beatLab?.save();
    status("Current MPC beat saved.");
  });
  root.querySelector("[data-mpc-digital]").addEventListener("click", () => {
    workspace?.setView("beatlab");
  });

  if (beatLab) beatLab.soundProfile = "mpc";
  renderPads();
  return root;
}

function createDrumsPanel({ beatLab } = {}) {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:18px;width:100%;color:#f4f1eb";
  root.innerHTML = `
    <div>
      <div style="color:#e6bb69;font-size:11px;letter-spacing:2px">LAMBO CITY RECORDS · DRUM ROOM</div>
      <h2 style="margin:8px 0;font-size:24px">DRUM PERFORMANCE</h2>
      <p style="color:#a8a8b1;font-size:13px">Tap or click a drum pad to play through the shared studio audio engine.</p>
    </div>
    <div data-drum-pads style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:620px"></div>
    <div data-drum-status role="status" aria-live="polite" style="min-height:20px;color:#e6bb69;font-size:12px"></div>
  `;
  const pads = root.querySelector("[data-drum-pads]");
  const status = message => { root.querySelector("[data-drum-status]").textContent = message; };
  [
    ["KICK","kick"],["SNARE","snare"],
    ["HI-HAT","hat"],["TOM","tom"],
    ["CRASH","cymbal"]
  ].forEach(([label,sound]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.cssText = "min-height:100px;border:1px solid #80643a;border-radius:12px;background:linear-gradient(145deg,#292b34,#11131a);color:#f1d49c;font-size:15px;font-weight:800;touch-action:manipulation";
    button.addEventListener("pointerdown", async event => {
      event.preventDefault();
      try {
        const audio = await StudioAudioEngine.resume();
        if (!audio || audio.state !== "running") return;
        if (beatLab) {
          if (!beatLab.noiseBuffer && typeof beatLab.createNoiseBuffer === "function") {
            beatLab.noiseBuffer = beatLab.createNoiseBuffer();
          }
          beatLab.soundProfile = "mpc";
        }
        const channel = sound === "snare" ? "snare" : sound === "hat" || sound === "cymbal" ? "hat" : "kick";
        StudioSoundKit.play(audio, "mpc", channel, audio.currentTime, beatLab?.noiseBuffer || null);
        button.style.transform = "scale(.98)";
        status(label + " triggered.");
      } catch (error) {
        status("DRUM AUDIO ERROR: " + (error?.message || error));
      }
    });
    const release = () => { button.style.transform = ""; };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    pads.appendChild(button);
  });
  return root;
}

function createVocalsPanel({ beatLab } = {}) {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:18px;width:100%;color:#f4f1eb";
  root.innerHTML = [
    '<div><div style="color:#e6bb69;font-size:11px;letter-spacing:2px">LAMBO CITY RECORDS · VOCAL BOOTH</div>',
    '<h2 style="margin:8px 0;font-size:24px">VOCAL RECORDING</h2>',
    '<p style="color:#a8a8b1;font-size:13px;line-height:1.6">Record your microphone while the Beat Lab plays. Each take creates separate vocal, beat, and combined master recordings for the Edit workspace.</p></div>',
    '<div style="display:flex;flex-wrap:wrap;gap:10px">',
    '<button type="button" data-vocal-action="start-beat" style="min-height:44px;padding:11px 14px;border:1px solid #80643a;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:bold">PLAY BEAT</button>',
    '<button type="button" data-vocal-action="stop-beat" style="min-height:44px;padding:11px 14px;border:1px solid #454958;border-radius:8px;background:#222631;color:white;font-weight:bold">STOP BEAT</button>',
    '<button type="button" data-vocal-action="record" style="min-height:44px;padding:11px 14px;border:1px solid #80643a;border-radius:8px;background:#594321;color:white;font-weight:bold">● RECORD</button>',
    '<button type="button" data-vocal-action="stop-recording" style="min-height:44px;padding:11px 14px;border:1px solid #454958;border-radius:8px;background:#222631;color:white;font-weight:bold">■ STOP RECORDING</button></div>',
    '<section style="display:grid;gap:16px;padding:16px;border:1px solid #45404a;border-radius:12px;background:#151821">',
    '<strong style="color:#e6bb69;font-size:11px;letter-spacing:2px">VOCAL EFFECTS</strong>',
    '<label style="display:grid;gap:7px;color:#c9c7c1;font-size:12px">DELAY MIX <input data-vocal-effect="delay" type="range" min="0" max="1" step="0.01" value="' + (beatLab?.vocalEffectSettings?.delay ?? 0) + '" style="width:100%;accent-color:#e6bb69"></label>',
    '<label style="display:grid;gap:7px;color:#c9c7c1;font-size:12px">REVERB MIX <input data-vocal-effect="reverb" type="range" min="0" max="1" step="0.01" value="' + (beatLab?.vocalEffectSettings?.reverb ?? 0) + '" style="width:100%;accent-color:#e6bb69"></label></section>',
    '<div style="display:flex;flex-wrap:wrap;gap:10px">',
    '<button type="button" data-vocal-action="export-vocals" style="min-height:42px;padding:10px 13px;border:1px solid #665438;border-radius:8px;background:#222631;color:white;font-weight:bold">EXPORT VOCALS</button>',
    '<button type="button" data-vocal-action="export-mix" style="min-height:42px;padding:10px 13px;border:1px solid #665438;border-radius:8px;background:#222631;color:white;font-weight:bold">EXPORT MASTER MIX</button></div>',
    '<div data-vocal-status role="status" aria-live="polite" style="min-height:22px;color:#e6bb69;font-size:12px">Microphone workspace ready. Your browser will ask for microphone permission when you record.</div>'
  ].join("");

  const status = message => {
    const node = root.querySelector("[data-vocal-status]");
    if (node) node.textContent = message;
  };

  root.addEventListener("click", async event => {
    const button = event.target.closest("[data-vocal-action]");
    if (!button || !beatLab) return;
    try {
      switch (button.dataset.vocalAction) {
        case "start-beat":
          await beatLab.start();
          status("Beat playback started.");
          break;
        case "stop-beat":
          beatLab.stop();
          status("Beat playback stopped.");
          break;
        case "record":
          await beatLab.startRecording();
          status("Recording started. Perform into your microphone.");
          break;
        case "stop-recording":
          await beatLab.stopRecording();
          status("Take saved to the shared Multitrack workspace.");
          break;
        case "export-vocals":
          if (!beatLab.lastRecordedTake?.vocal?.size) {
            status("Record and stop a take before exporting vocals.");
            return;
          }
          beatLab.exportRecordingTrack("vocal");
          status("Vocal export requested. Check your browser downloads.");
          break;
        case "export-mix":
          if (!beatLab.lastRecordedTake?.mix?.size) {
            status("Record and stop a take before exporting the master mix.");
            return;
          }
          beatLab.exportRecordingTrack("mix");
          status("Master mix export requested. Check your browser downloads.");
          break;
      }
    } catch (error) {
      status("STUDIO ERROR: " + (error?.message || error));
    }
  });

  root.addEventListener("input", event => {
    const slider = event.target.closest("[data-vocal-effect]");
    if (!slider || !beatLab) return;
    const effect = slider.dataset.vocalEffect;
    const value = Number(slider.value);
    beatLab.vocalEffectSettings[effect] = value;
    if (beatLab.vocalEffects) {
      if (effect === "delay") beatLab.vocalEffects.setDelayMix(value);
      if (effect === "reverb") beatLab.vocalEffects.setReverbMix(value);
    }
    status(effect.toUpperCase() + " mix updated.");
  });
  return root;
}

function createPianoPanel() {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:18px;width:100%;color:#f4f1eb";
  root.innerHTML = [
    '<div><div style="color:#e6bb69;font-size:11px;letter-spacing:2px">LAMBO CITY RECORDS · INSTRUMENT ROOM</div>',
    '<h2 style="margin:8px 0;font-size:24px">PIANO & KEYS</h2>',
    '<p style="color:#a8a8b1;font-size:13px;line-height:1.6">Play notes with touch, mouse, or trackpad through the shared LAMBO CITY studio audio engine.</p></div>',
    '<div data-piano-keys style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px;min-height:180px;align-items:stretch"></div>',
    '<div style="color:#8f95a4;font-size:11px">C major · One octave · Synthesized studio instrument</div>'
  ].join("");
  const notes = [["C",261.63],["D",293.66],["E",329.63],["F",349.23],["G",392.00],["A",440.00],["B",493.88],["C",523.25]];
  const keys = root.querySelector("[data-piano-keys]");
  notes.forEach(([label,frequency]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", label + " piano note");
    button.style.cssText = "min-width:0;min-height:150px;border:1px solid #aeb3bd;border-radius:0 0 9px 9px;background:linear-gradient(#fff,#dfe2e8);color:#151821;font-size:13px;font-weight:bold;box-shadow:inset 0 -8px 0 rgba(0,0,0,.08);touch-action:manipulation";
    button.addEventListener("pointerdown", async event => {
      event.preventDefault();
      try {
        const audio = await StudioAudioEngine.resume();
        if (!audio || audio.state !== "running") return;
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
        envelope.gain.setValueAtTime(0.0001, audio.currentTime);
        envelope.gain.exponentialRampToValueAtTime(0.16, audio.currentTime + 0.025);
        oscillator.connect(envelope);
        envelope.connect(StudioAudioEngine.master || audio.destination);
        oscillator.start(audio.currentTime);
        button._studioActiveNote = { oscillator, envelope, audio };
        button.style.transform = "translateY(2px)";
      } catch (error) {
        console.error("LAMBO CITY piano audio error:", error);
      }
    });
    const release = () => {
      const note = button._studioActiveNote;
      if (note) {
        const now = note.audio.currentTime;
        note.envelope.gain.cancelScheduledValues(now);
        note.envelope.gain.setTargetAtTime(0.0001, now, 0.035);
        try { note.oscillator.stop(now + 0.16); } catch {}
        button._studioActiveNote = null;
      }
      button.style.transform = "";
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    keys.appendChild(button);
  });
  return root;
}

const StudioDAWApp = {
  root: null,
  workspace: null,
   beatLabPanel: null,
  editScreen: null,
  panelHost: null,
  handleOverlayClick: null,
  mixPanel: null,
  pianoPanel: null,
  mpcPanel: null,
  drumsPanel: null,
  standalone: false,

  open(initialView = "edit", options = {}) {
    if (this.root?.isConnected) {
      this.workspace?.setView(initialView);
      return this.root;
    }

    this.standalone = options.standalone === true;

    // Main application overlay.
    const root = document.createElement("div");

    root.id = "lambo-city-daw-app";

    root.style.cssText = `
      position:fixed;
      inset:0;
      z-index:20000;
      overflow:auto;
      background:#090a0e;
      color:#f4f1eb;
      font-family:Arial,sans-serif;
    `;

    // Application header and exit control.
    const header = document.createElement("header");

    header.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:12px 18px;
      border-bottom:1px solid #30313a;
      background:#101117;
    `;

    header.innerHTML = `
      <strong style="
        color:#e6bb69;
        font-size:12px;
        letter-spacing:2px;
      ">
        LAMBO CITY DIGITAL STUDIO
      </strong>

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" data-daw-return style="min-height:42px;padding:10px 13px;border:1px solid #665438;border-radius:7px;background:#171923;color:#f1d49c;font-weight:bold">${this.standalone ? "BACK TO LAMBO CITY" : "RETURN TO ROOM"}</button>
        ${this.standalone ? "" : '<button type="button" data-daw-end style="min-height:42px;padding:10px 13px;border:1px solid #80643a;border-radius:7px;background:#201c16;color:#f1d49c;font-weight:bold">END SESSION</button>'}
      </div>
    `;

    const workspaceMount = document.createElement("div");

    workspaceMount.id = "lc-daw-workspace-mount";

    // This container becomes the MPC workspace panel.
    this.panelHost = document.createElement("div");

    this.panelHost.id = "lc-daw-mpc-panel-host";

    root.appendChild(header);
    root.appendChild(workspaceMount);
    document.body.appendChild(root);

    this.root = root;

    // Catch both the application exit button and
    // the original Beat Lab CLOSE button.
    this.handleOverlayClick = event => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const returnToRoom = target.closest("[data-daw-return]") ||
        target.closest('#lambo-city-beat-lab [data-action="close"]');
      const endSession = target.closest("[data-daw-end]");

      if (returnToRoom || endSession) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const standalone = this.standalone;
        this.close();

        if (endSession) {
          window.__lamboCityEndFloor2Session?.();
        } else if (standalone) {
          window.location.href = "./";
        } else {
          window.__lamboCityReturnToFloor2Room?.();
        }
      }
    };

    root.addEventListener(
      "click",
      this.handleOverlayClick,
      true
    );

    try {
      // Build the modular DAW shell.
      this.workspace = StudioDAWWorkspace;

      this.workspace.mount({
        container: workspaceMount,
        panels: {},
        initialView,
        onViewChange: viewId => {
          const appHeader = root.querySelector(":scope > header");
          if (appHeader) appHeader.style.display = viewId === "edit" ? "none" : "flex";
          if (viewId === "mix") this.mixPanel?.refresh?.();
          if (viewId === "mpc" && !MPCInterface.isOpen()) {
            MPCInterface.open({
              beatLab: Floor2StudioApp,
              onClose: () => {
                if (this.workspace?.activeView === "mpc") {
                  this.workspace.setView("beatlab");
                }
              }
            });
          }
        }
      });

      // Dedicated MPC performance surface and a separate Digital Beat Lab.
      this.mpcPanel = createMPCPanel({
        beatLab: Floor2StudioApp,
        workspace: this.workspace
      });
      this.workspace.setPanel("mpc", this.mpcPanel);

      this.beatLabPanel = createStudioDAWBeatLabPanel({
        beatLab: Floor2StudioApp
      });
      this.beatLabPanel.onReturn = () => this.workspace?.setView("mpc");
      this.beatLabPanel.onSwitchToEdit = () => this.workspace?.setView("edit");
      this.beatLabPanel.mount(this.panelHost);
      this.workspace.setPanel("beatlab", this.panelHost);

      this.drumsPanel = createDrumsPanel({ beatLab: Floor2StudioApp });
      this.workspace.setPanel("drums", this.drumsPanel);

      // Connect the existing Multitrack Workspace
      // to the modular DAW EDIT tab.
      // Dedicated LAMBO CITY Records arrangement screen.
      // Uses the existing shared Multitrack Workspace and recording engine.
      this.editScreen = createStudioDAWEditScreen({
        beatLab: Floor2StudioApp,
        onExit: () => this.workspace?.setView("beatlab"),
        onPrevious: () => this.workspace?.setView("drums"),
        onNext: () => this.workspace?.setView("mix")
      });
      const editWorkspace = this.editScreen.mount();
      this.workspace.setPanel("edit", editWorkspace);
      this.mixPanel = createStudioMixMasterApp({
        beatLab: Floor2StudioApp,
        workspace: this.workspace
      });
      this.pianoPanel = createPianoPanel();
      this.workspace.setPanel("mix", this.mixPanel);
      this.workspace.setPanel("piano", this.pianoPanel);

      return root;
    } catch (error) {
      console.error(
        "LAMBO CITY DAW startup error:",
        error
      );

      this.close();

      throw error;
    }
  },

  close() {
    if (this.root && this.handleOverlayClick) {
      this.root.removeEventListener(
        "click",
        this.handleOverlayClick,
        true
      );
    }

    if (this.editScreen) {
      this.editScreen.destroy();
    }
    this.editScreen = null;

    if (this.beatLabPanel) {
      this.beatLabPanel.destroy();
    }

    if (this.workspace) {
      this.workspace.destroy();
    }

    if (this.root) {
      this.root.remove();
    }

    this.root = null;
    this.workspace = null;
    this.beatLabPanel = null;
    this.mixPanel = null;
    this.pianoPanel = null;
    this.mpcPanel = null;
    this.drumsPanel = null;
    this.panelHost = null;
    this.handleOverlayClick = null;
    this.standalone = false;
  }
};

export default StudioDAWApp;
