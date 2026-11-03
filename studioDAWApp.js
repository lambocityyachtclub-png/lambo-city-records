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
import Floor2InstrumentApp from "./floor2InstrumentApp.js";
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import {
  createStudioDAWEditPanel
} from "./studioDAWEditPanel.js";
import {
  createStudioDAWBeatLabPanel
} from "./studioDAWBeatLabPanel.js";


function createMixPanel({ beatLab, workspace } = {}) {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:18px;width:100%;color:#f4f1eb;";
  root.innerHTML = [
    '<div><div style="color:#e6bb69;font-size:11px;letter-spacing:2px">LAMBO CITY RECORDS · MIX ROOM</div>',
    '<h2 style="margin:8px 0;font-size:24px">MIX & MASTER OUTPUT</h2>',
    '<p style="color:#a8a8b1;font-size:13px;line-height:1.6">Balance recorded tracks, control studio output, and export your current master mix.</p></div>',
    '<section style="padding:16px;border:1px solid #45404a;border-radius:12px;background:#151821">',
    '<label style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center"><strong style="font-size:12px;color:#e6bb69">STUDIO MASTER LEVEL</strong><strong data-master-label>100%</strong>',
    '<input data-master-volume type="range" min="0" max="100" value="100" style="grid-column:1/-1;width:100%;accent-color:#e6bb69"></label></section>',
    '<div><div style="margin-bottom:10px;color:#e6bb69;font-size:11px;letter-spacing:2px">TRACK MIXER</div><div data-mix-tracks style="display:grid;gap:10px"></div></div>',
    '<div style="display:flex;flex-wrap:wrap;gap:10px"><button type="button" data-mix-action="edit" style="min-height:44px;padding:11px 15px;border:1px solid #80643a;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:bold">OPEN EDIT TIMELINE</button>',
    '<button type="button" data-mix-action="export" style="min-height:44px;padding:11px 15px;border:1px solid #80643a;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:bold">EXPORT MASTER MIX</button></div>',
    '<div data-mix-status role="status" aria-live="polite" style="min-height:22px;color:#e6bb69;font-size:12px">Mixer ready.</div>'
  ].join("");

  const list = root.querySelector("[data-mix-tracks]");
  const status = message => {
    const node = root.querySelector("[data-mix-status]");
    if (node) node.textContent = message;
  };

  const renderTracks = () => {
    list.replaceChildren();
    const tracks = StudioMultitrackWorkspace.tracks;
    if (!tracks.length) {
      const empty = document.createElement("p");
      empty.textContent = "Open the Edit workspace to initialize the session tracks.";
      empty.style.color = "#a8a8b1";
      list.appendChild(empty);
      return;
    }
    tracks.forEach(track => {
      const row = document.createElement("section");
      row.style.cssText = "display:grid;gap:10px;padding:13px;border:1px solid #343946;border-radius:10px;background:#191d27";
      const heading = document.createElement("div");
      heading.style.cssText = "display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap";
      const name = document.createElement("strong");
      name.textContent = track.name;
      name.style.cssText = "color:#e6bb69;font-size:13px";
      const controls = document.createElement("div");
      controls.style.cssText = "display:flex;gap:6px";
      [["mute","MUTE",track.muted],["solo","SOLO",track.solo]].forEach(([control,label,active]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.trackControl = control;
        button.dataset.trackId = track.id;
        button.textContent = label;
        button.setAttribute("aria-pressed", String(Boolean(active)));
        button.style.cssText = "min-height:32px;padding:6px 10px;border:1px solid #665438;border-radius:7px;background:" + (active ? "#594321" : "#222631") + ";color:white;font-size:10px;font-weight:bold";
        controls.appendChild(button);
      });
      heading.append(name, controls);
      const volume = document.createElement("label");
      volume.style.cssText = "display:grid;grid-template-columns:58px 1fr 38px;gap:8px;align-items:center;color:#a8a8b1;font-size:11px";
      const volumeName = document.createElement("span");
      volumeName.textContent = "LEVEL";
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.value = String(track.volume);
      slider.dataset.trackVolume = track.id;
      slider.style.cssText = "width:100%;accent-color:#e6bb69";
      const value = document.createElement("span");
      value.dataset.trackVolumeLabel = track.id;
      value.textContent = track.volume + "%";
      volume.append(volumeName, slider, value);
      row.append(heading, volume);
      list.appendChild(row);
    });
  };

  renderTracks();
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-mix-action], [data-track-control]");
    if (!button) return;
    if (button.dataset.mixAction === "edit") {
      workspace?.setView("edit");
      return;
    }
    if (button.dataset.mixAction === "export") {
      if (!beatLab?.lastRecordedTake?.mix?.size) {
        status("Record a take before exporting the master mix.");
        return;
      }
      beatLab.exportRecordingTrack("mix");
      status("Master mix export requested. Check your browser downloads.");
      return;
    }
    const track = StudioMultitrackWorkspace.tracks.find(item => item.id === button.dataset.trackId);
    if (!track) return;
    if (button.dataset.trackControl === "mute") track.muted = !track.muted;
    if (button.dataset.trackControl === "solo") track.solo = !track.solo;
    renderTracks();
    status(track.name + ": " + (track.muted ? "muted" : "active") + (track.solo ? " · solo" : "") + ".");
  });

  root.addEventListener("input", event => {
    const slider = event.target.closest("[data-track-volume]");
    if (slider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === slider.dataset.trackVolume);
      if (!track) return;
      track.volume = Number(slider.value);
      const label = root.querySelector('[data-track-volume-label="' + track.id + '"]');
      if (label) label.textContent = track.volume + "%";
      return;
    }
    if (event.target.matches("[data-master-volume]")) {
      const value = Number(event.target.value);
      const label = root.querySelector("[data-master-label]");
      if (label) label.textContent = value + "%";
      const master = StudioAudioEngine.master;
      const audio = StudioAudioEngine.context;
      if (master?.gain && audio) {
        master.gain.setTargetAtTime(value / 100, audio.currentTime, 0.025);
        status("Studio master level set to " + value + "%.");
      } else {
        status("Start studio audio before adjusting the master output.");
      }
    }
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
    '<p style="color:#a8a8b1;font-size:13px;line-height:1.6">Play notes with touch, mouse, or trackpad. This keyboard uses the same LAMBO CITY studio audio engine as the Beat Lab and drum station.</p></div>',
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
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      void Floor2InstrumentApp.playNote(frequency);
      button.style.transform = "translateY(2px)";
    });
    const release = () => { button.style.transform = ""; };
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
  editPanel: null,
  panelHost: null,
  handleOverlayClick: null,
  mixPanel: null,
  vocalsPanel: null,
  pianoPanel: null,

  open(initialView = "edit") {
    if (this.root?.isConnected) {
      this.workspace?.setView(initialView);
      return this.root;
    }

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

      <button
        type="button"
        data-daw-exit
        style="
          min-height:42px;
          padding:10px 16px;
          border:1px solid #80643a;
          border-radius:7px;
          background:#201c16;
          color:#f1d49c;
          font-weight:bold;
          cursor:pointer;
        "
      >
        EXIT STUDIO ✕
      </button>
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

      if (
        target.closest("[data-daw-exit]") ||
        target.closest('#lambo-city-beat-lab [data-action="close"]')
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        this.close();
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
        panels: {
          mpc: this.panelHost
        },
         initialView
      });

      // Create a bridge to the EXISTING Beat Lab instance.
      this.beatLabPanel = createStudioDAWBeatLabPanel({
        beatLab: Floor2StudioApp
      });

      // Mount the existing Beat Lab inside the MPC workspace.
           this.beatLabPanel.mount(this.panelHost);

      // Connect the existing Multitrack Workspace
      // to the modular DAW EDIT tab.
      this.editPanel = createStudioDAWEditPanel({
        beatLab: Floor2StudioApp
      });

      const editWorkspace = this.editPanel.mount();
      this.workspace.setPanel("edit", editWorkspace);
      this.mixPanel = createMixPanel({
        beatLab: Floor2StudioApp,
        workspace: this.workspace
      });
      this.vocalsPanel = createVocalsPanel({ beatLab: Floor2StudioApp });
      this.pianoPanel = createPianoPanel();
      this.workspace.setPanel("mix", this.mixPanel);
      this.workspace.setPanel("vocals", this.vocalsPanel);
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

       if (this.editPanel) {
      this.editPanel.destroy();
    }

    this.editPanel = null;

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
    this.vocalsPanel = null;
    this.pianoPanel = null;
    this.panelHost = null;
    this.handleOverlayClick = null;
  }
};

export default StudioDAWApp;
