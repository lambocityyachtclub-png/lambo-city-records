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
import Floor2DrumStation from "./floor2DrumStation.js";
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioSoundKit from "./studioSoundKit.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import {
  createStudioDAWEditPanel
} from "./studioDAWEditPanel.js";
import {
  createStudioDAWBeatLabPanel
} from "./studioDAWBeatLabPanel.js";


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

function createDrumsPanel() {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:18px;width:100%;color:#f4f1eb";
  root.innerHTML = `
    <div>
      <div style="color:#e6bb69;font-size:11px;letter-spacing:2px">LAMBO CITY RECORDS · DRUM ROOM</div>
      <h2 style="margin:8px 0;font-size:24px">DRUM PERFORMANCE</h2>
      <p style="color:#a8a8b1;font-size:13px">Tap or click a drum pad to play through the shared studio mixer.</p>
    </div>
    <div data-drum-pads style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:620px"></div>
  `;
  const pads = root.querySelector("[data-drum-pads]");
  [
    ["KICK","kick"],["SNARE","snare"],
    ["HI-HAT","hat"],["TOM","tom"],
    ["CRASH","cymbal"]
  ].forEach(([label,sound]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.cssText = "min-height:100px;border:1px solid #80643a;border-radius:12px;background:linear-gradient(145deg,#292b34,#11131a);color:#f1d49c;font-size:15px;font-weight:800;touch-action:manipulation";
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      void Floor2DrumStation.playDrum(sound);
      button.style.transform = "scale(.98)";
    });
    const release = () => { button.style.transform = ""; };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    pads.appendChild(button);
  });
  return root;
}

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
  const masterSlider = root.querySelector("[data-master-volume]");
  const masterLabel = root.querySelector("[data-master-label]");
  const currentMaster = Math.round((StudioAudioEngine.master?.gain?.value ?? 1) * 100);
  if (masterSlider) masterSlider.value = String(currentMaster);
  if (masterLabel) masterLabel.textContent = currentMaster + "%";
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
      const pan = document.createElement("label");
      pan.style.cssText = "display:grid;grid-template-columns:58px 1fr 38px;gap:8px;align-items:center;color:#a8a8b1;font-size:11px";
      const panName = document.createElement("span");
      panName.textContent = "PAN";
      const panSlider = document.createElement("input");
      panSlider.type = "range";
      panSlider.min = "-100";
      panSlider.max = "100";
      panSlider.value = String(Math.round((track.pan || 0) * 100));
      panSlider.dataset.trackPan = track.id;
      panSlider.style.cssText = "width:100%;accent-color:#e6bb69";
      const panValue = document.createElement("span");
      panValue.dataset.trackPanLabel = track.id;
      panValue.textContent = !track.pan ? "C" : (track.pan < 0 ? "L " : "R ") + Math.round(Math.abs(track.pan) * 100);
      pan.append(panName, panSlider, panValue);
      const inserts = document.createElement("details");
      inserts.style.cssText = "padding:9px 10px;border:1px solid #343946;border-radius:8px;background:#12151d;color:#d8b36e";
      const insertsTitle = document.createElement("summary");
      insertsTitle.textContent = "INSERT FX · EQ / COMPRESSION";
      insertsTitle.style.cssText = "font-size:10px;font-weight:800;letter-spacing:1px;cursor:pointer";
      inserts.appendChild(insertsTitle);
      const inputLabel = document.createElement("label");
      inputLabel.style.cssText = "display:grid;grid-template-columns:92px 1fr;gap:8px;align-items:center;margin-top:10px;color:#a8a8b1;font-size:10px";
      inputLabel.append("INPUT SOURCE");
      const inputSelect = document.createElement("select");
      inputSelect.dataset.trackInput = track.id;
      inputSelect.style.cssText = "width:100%;min-height:34px;padding:6px;background:#20242e;color:#f4f1eb;border:1px solid #454958;border-radius:6px";
      [["mic","MICROPHONE"],["beatlab","DIGITAL BEAT LAB"],["mpc","MPC OUTPUT"]].forEach(([value,label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        inputSelect.appendChild(option);
      });
      inputSelect.value = track.inputSource || "mic";
      inputLabel.appendChild(inputSelect);
      inserts.appendChild(inputLabel);
      [["low","LOW"],["mid","MID"],["high","HIGH"]].forEach(([band,label]) => {
        const control = document.createElement("label");
        control.style.cssText = "display:grid;grid-template-columns:52px 1fr 42px;gap:8px;align-items:center;margin-top:9px;color:#a8a8b1;font-size:10px";
        const caption = document.createElement("span");
        caption.textContent = label;
        const eqSlider = document.createElement("input");
        eqSlider.type = "range";
        eqSlider.min = "-12";
        eqSlider.max = "12";
        eqSlider.step = "0.5";
        eqSlider.value = String(track.eq?.[band] || 0);
        eqSlider.dataset.eqBand = band;
        eqSlider.dataset.trackId = track.id;
        eqSlider.style.cssText = "width:100%;accent-color:#e6bb69";
        const eqValue = document.createElement("span");
        eqValue.textContent = (Number(track.eq?.[band]) || 0) + " dB";
        eqValue.dataset.eqLabel = band + "-" + track.id;
        control.append(caption, eqSlider, eqValue);
        inserts.appendChild(control);
      });
      const compControl = document.createElement("label");
      compControl.style.cssText = "display:grid;grid-template-columns:90px 1fr 35px;gap:8px;align-items:center;margin-top:9px;color:#a8a8b1;font-size:10px";
      compControl.append("COMP RATIO");
      const compSlider = document.createElement("input");
      compSlider.type = "range";
      compSlider.min = "1";
      compSlider.max = "8";
      compSlider.step = "0.1";
      compSlider.value = String(track.compression?.ratio ?? 1);
      compSlider.dataset.compRatio = track.id;
      compSlider.style.cssText = "width:100%;accent-color:#e6bb69";
      const compValue = document.createElement("span");
      compValue.textContent = Number(track.compression?.ratio ?? 1).toFixed(1) + ":1";
      compValue.dataset.compLabel = track.id;
      compControl.append(compSlider, compValue);
      inserts.appendChild(compControl);
      row.append(heading, volume, pan, inserts);
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
    StudioMultitrackWorkspace.arrangementPlayback?.syncTrackState(StudioMultitrackWorkspace.tracks);
    renderTracks();
    status(track.name + ": " + (track.muted ? "muted" : "active") + (track.solo ? " · solo" : "") + ".");
  });

  root.addEventListener("change", event => {
    const inputSelect = event.target.closest("[data-track-input]");
    if (!inputSelect) return;
    const track = StudioMultitrackWorkspace.tracks.find(item => item.id === inputSelect.dataset.trackInput);
    if (!track) return;
    track.inputSource = inputSelect.value;
    status(track.name + " input set to " + inputSelect.options[inputSelect.selectedIndex].text + ".");
  });
  root.addEventListener("input", event => {
    const eqSlider = event.target.closest("[data-eq-band]");
    if (eqSlider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === eqSlider.dataset.trackId);
      if (!track) return;
      const band = eqSlider.dataset.eqBand;
      track.eq = { ...(track.eq || {}), [band]: Number(eqSlider.value) };
      const label = root.querySelector('[data-eq-label="' + band + "-" + track.id + '"]');
      if (label) label.textContent = track.eq[band] + " dB";
      StudioMultitrackWorkspace.arrangementPlayback?.setTrackEQ(track.id, band, track.eq[band]);
      return;
    }
    const compSlider = event.target.closest("[data-comp-ratio]");
    if (compSlider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === compSlider.dataset.compRatio);
      if (!track) return;
      track.compression = { ...(track.compression || {}), ratio: Number(compSlider.value) };
      const label = root.querySelector('[data-comp-label="' + track.id + '"]');
      if (label) label.textContent = track.compression.ratio.toFixed(1) + ":1";
      StudioMultitrackWorkspace.arrangementPlayback?.setTrackCompression(track.id, track.compression.ratio);
      return;
    }
    const slider = event.target.closest("[data-track-volume], [data-track-pan]");
    if (slider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === slider.dataset.trackVolume);
      if (!track) return;
      if (slider.matches("[data-track-volume]")) {
        track.volume = Number(slider.value);
        const label = root.querySelector('[data-track-volume-label="' + track.id + '"]');
        if (label) label.textContent = track.volume + "%";
        StudioMultitrackWorkspace.arrangementPlayback?.setTrackVolume(track.id, track.volume);
      } else {
        track.pan = Number(slider.value) / 100;
        const label = root.querySelector('[data-track-pan-label="' + track.id + '"]');
        if (label) label.textContent = track.pan === 0 ? "C" : (track.pan < 0 ? "L " : "R ") + Math.round(Math.abs(track.pan) * 100);
        StudioMultitrackWorkspace.arrangementPlayback?.setTrackPan(track.id, track.pan);
      }
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
  root.refresh = renderTracks;
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
  mpcPanel: null,
  drumsPanel: null,

  open(initialView = "edit") {
    if (this.root?.isConnected) {
      this.workspace?.setView(initialView);
      const nav = this.workspace?.root?.querySelector(".lc-daw-navigation");
      if (nav) nav.style.display = ["mpc","beatlab","piano","drums","vocals"].includes(initialView) ? "none" : "flex";
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

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" data-daw-return style="min-height:42px;padding:10px 13px;border:1px solid #665438;border-radius:7px;background:#171923;color:#f1d49c;font-weight:bold">RETURN TO ROOM</button>
        <button type="button" data-daw-end style="min-height:42px;padding:10px 13px;border:1px solid #80643a;border-radius:7px;background:#201c16;color:#f1d49c;font-weight:bold">END SESSION</button>
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

        this.close();

        if (endSession) {
          window.__lamboCityEndFloor2Session?.();
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
          if (viewId === "mix") this.mixPanel?.refresh?.();
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

      this.drumsPanel = createDrumsPanel();
      this.workspace.setPanel("drums", this.drumsPanel);

      // Connect the existing Multitrack Workspace
      // to the modular DAW EDIT tab.
      this.editPanel = createStudioDAWEditPanel({
        beatLab: Floor2StudioApp,
        onSwitchToBeatLab: () => this.workspace?.setView("beatlab")
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

      const nav = this.workspace.root?.querySelector(".lc-daw-navigation");
      if (nav && ["mpc","beatlab","piano","drums","vocals"].includes(initialView)) {
        nav.style.display = "none";
      }

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
    this.mpcPanel = null;
    this.drumsPanel = null;
    this.panelHost = null;
    this.handleOverlayClick = null;
  }
};

export default StudioDAWApp;
