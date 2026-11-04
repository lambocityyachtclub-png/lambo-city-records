/*
 * LAMBO CITY RECORDS — MIX & MASTER APPLICATION
 * Separate interface; operates on the shared EDIT session and audio engine.
 */
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import { createStudioDAWMidiEditor } from "./studioDAWMidiEditor.js";
import { renderStudioSessionToWav, downloadStudioWav, renderStudioSessionToMp3, downloadStudioMp3 } from "./studioDAWExport.js";

export function createStudioMixMasterApp({ beatLab, workspace } = {}) {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:18px;width:100%;color:#f4f1eb;";
  root.innerHTML = [
    '<div><div style="color:#e6bb69;font-size:11px;letter-spacing:2px">LAMBO CITY RECORDS · MIX ROOM</div>',
    '<h2 style="margin:8px 0;font-size:24px">MIX & MASTER OUTPUT</h2>',
    '<p style="color:#a8a8b1;font-size:13px;line-height:1.6">Balance recorded tracks, control studio output, and export your current master mix.</p></div>',
    '<section style="padding:16px;border:1px solid #45404a;border-radius:12px;background:#151821">',
    '<label style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center"><strong style="font-size:12px;color:#e6bb69">STUDIO MASTER LEVEL</strong><strong data-master-label>100%</strong>',
    '<input data-master-volume type="range" min="0" max="100" value="100" style="grid-column:1/-1;width:100%;accent-color:#e6bb69"></label>',
    '<label style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:14px"><strong style="font-size:12px;color:#e6bb69">STEREO WIDTH</strong><strong data-width-label>100%</strong><input data-stereo-width type="range" min="0" max="200" value="100" style="grid-column:1/-1;width:100%;accent-color:#e6bb69"></label>',
    '<label style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:14px"><strong style="font-size:12px;color:#e6bb69">MASTER COMPRESSION</strong><strong data-master-comp-label>3:1</strong><input data-master-comp type="range" min="1" max="8" step="0.1" value="3" style="grid-column:1/-1;width:100%;accent-color:#e6bb69"></label></section>',
    '<div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" data-mix-action="add-bus" style="min-height:38px;padding:8px 11px;border:1px solid #80643a;border-radius:7px;background:#201c16;color:#f1d49c;font-weight:bold">＋ CREATE BUS</button><button type="button" data-mix-action="export-stems" style="min-height:38px;padding:8px 11px;border:1px solid #80643a;border-radius:7px;background:#201c16;color:#f1d49c;font-weight:bold">EXPORT ALL STEMS</button></div>',
    '<div><div style="margin-bottom:10px;color:#e6bb69;font-size:11px;letter-spacing:2px">TRACK MIXER · ROUTING · AUTOMATION · MIDI</div><div data-mix-tracks style="display:grid;gap:10px"></div></div>',
    '<div style="display:flex;flex-wrap:wrap;gap:10px"><button type="button" data-mix-action="edit" style="min-height:44px;padding:11px 15px;border:1px solid #80643a;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:bold">OPEN EDIT TIMELINE</button>',
    '<button type="button" data-mix-action="export" style="min-height:44px;padding:11px 15px;border:1px solid #80643a;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:bold">EXPORT MASTER WAV</button><button type="button" data-mix-action="export-mp3" style="min-height:44px;padding:11px 15px;border:1px solid #80643a;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:bold">EXPORT MASTER MP3</button></div>',
    '<div data-mix-status role="status" aria-live="polite" style="min-height:22px;color:#e6bb69;font-size:12px">Mixer ready.</div>'
  ].join("");

  const list = root.querySelector("[data-mix-tracks]");
  const masterSlider = root.querySelector("[data-master-volume]");
  const masterLabel = root.querySelector("[data-master-label]");
  const widthSlider = root.querySelector("[data-stereo-width]");
  const widthLabel = root.querySelector("[data-width-label]");
  const masterCompSlider = root.querySelector("[data-master-comp]");
  const masterCompLabel = root.querySelector("[data-master-comp-label]");
  if (masterCompSlider && StudioAudioEngine.compressor) masterCompSlider.value = String(StudioMultitrackWorkspace.masterSettings?.compressionRatio ?? StudioAudioEngine.compressor.ratio.value ?? 3);
  if (widthSlider) widthSlider.value = String(StudioMultitrackWorkspace.masterSettings?.stereoWidth ?? 100);
  if (widthLabel && widthSlider) widthLabel.textContent = widthSlider.value + "%";
  if (masterCompLabel && masterCompSlider) masterCompLabel.textContent = Number(masterCompSlider.value).toFixed(1) + ":1";
  const currentMaster = Math.round((StudioAudioEngine.master?.gain?.value ?? 1) * 100);
  if (masterSlider) masterSlider.value = String(StudioMultitrackWorkspace.masterSettings?.volume ?? currentMaster);
  if (masterLabel) masterLabel.textContent = (masterSlider?.value ?? currentMaster) + "%";
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
      row.dataset.trackId = track.id;
      row.style.cssText = "display:grid;gap:10px;padding:13px;border:1px solid #343946;border-radius:10px;background:#191d27";
      const heading = document.createElement("div");
      heading.style.cssText = "display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap";
      const name = document.createElement("strong");
      name.textContent = track.name;
      name.style.cssText = "color:#e6bb69;font-size:13px";
      const controls = document.createElement("div");
      controls.style.cssText = "display:flex;gap:6px";
      (track.type === "bus" ? [["mute","MUTE",track.muted]] : [["mute","MUTE",track.muted],["solo","SOLO",track.solo]]).forEach(([control,label,active]) => {
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
      [
        ["delayMix","DELAY MIX",0,100,1],
        ["delayTime","DELAY TIME",50,1500,10],
        ["delayFeedback","FEEDBACK",0,75,1],
        ["reverbMix","REVERB MIX",0,100,1],
        ["reverbDecay","REVERB DECAY",300,6000,100]
      ].forEach(([key,label,min,max,step]) => {
        const control = document.createElement("label");
        control.style.cssText = "display:grid;grid-template-columns:90px 1fr 42px;gap:8px;align-items:center;margin-top:9px;color:#a8a8b1;font-size:10px";
        const caption = document.createElement("span"); caption.textContent = label;
        const slider = document.createElement("input");
        slider.type = "range"; slider.min = String(min); slider.max = String(max); slider.step = String(step);
        const current = Number(track.effects?.[key] ?? (key === "delayTime" ? 0.28 : key === "delayFeedback" ? 0.25 : key === "reverbDecay" ? 2.2 : 0));
        slider.value = String(key === "delayTime" || key === "reverbDecay" ? Math.round(current * 1000) : Math.round(current * 100));
        slider.dataset.trackEffect = key; slider.dataset.trackId = track.id;
        slider.style.cssText = "width:100%;accent-color:#e6bb69";
        const value = document.createElement("span"); value.dataset.effectLabel = key + "-" + track.id;
        value.textContent = key === "delayTime" ? Math.round(current * 1000) + " ms" :
          key === "reverbDecay" ? current.toFixed(1) + " s" : Math.round(current * 100) + "%";
        control.append(caption, slider, value); inserts.appendChild(control);
      });
      if (/vocal/i.test(track.name)) {
        const pitch = track.effects?.pitchCorrection || { enabled: false, root: 0, scale: "major", amount: 100, speedMs: 25 };
        track.effects = { ...(track.effects || {}), pitchCorrection: pitch };
        const pitchPanel = document.createElement("section");
        pitchPanel.style.cssText = "display:grid;gap:9px;margin-top:14px;padding:11px;border:1px solid #665438;border-radius:8px;background:#191710";
        const pitchTitle = document.createElement("div");
        pitchTitle.textContent = "VOCAL PITCH CORRECTION";
        pitchTitle.style.cssText = "font-size:10px;font-weight:800;letter-spacing:1px;color:#d8b36e";
        const enabledLabel = document.createElement("label");
        enabledLabel.style.cssText = "display:flex;gap:9px;align-items:center;color:#f4f1eb;font-size:11px";
        const enabled = document.createElement("input");
        enabled.type = "checkbox";
        enabled.checked = Boolean(pitch.enabled);
        enabled.dataset.pitchSetting = "enabled";
        enabled.dataset.trackId = track.id;
        enabledLabel.append(enabled, "ENABLE PITCH CORRECTION");
        const keyScale = document.createElement("div");
        keyScale.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px";
        const keySelect = document.createElement("select");
        keySelect.dataset.pitchSetting = "root";
        keySelect.dataset.trackId = track.id;
        keySelect.style.cssText = "min-height:36px;padding:6px;background:#20242e;color:#f4f1eb;border:1px solid #454958;border-radius:6px";
        ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"].forEach((name,index) => {
          const option = document.createElement("option"); option.value = String(index); option.textContent = "KEY · " + name; keySelect.appendChild(option);
        });
        keySelect.value = String(pitch.root ?? 0);
        const scaleSelect = document.createElement("select");
        scaleSelect.dataset.pitchSetting = "scale";
        scaleSelect.dataset.trackId = track.id;
        scaleSelect.style.cssText = keySelect.style.cssText;
        [["major","MAJOR"],["minor","MINOR"],["chromatic","CHROMATIC"]].forEach(([value,label]) => {
          const option = document.createElement("option"); option.value = value; option.textContent = label; scaleSelect.appendChild(option);
        });
        scaleSelect.value = pitch.scale || "major";
        keyScale.append(keySelect, scaleSelect);
        pitchPanel.append(pitchTitle, enabledLabel, keyScale);
        [["amount","CORRECTION",0,100,1,"%"],["speedMs","SPEED",0,120,1," ms"]].forEach(([key,label,min,max,step,unit]) => {
          const control = document.createElement("label");
          control.style.cssText = "display:grid;grid-template-columns:78px 1fr 44px;gap:7px;align-items:center;color:#a8a8b1;font-size:10px";
          const caption = document.createElement("span"); caption.textContent = label;
          const slider = document.createElement("input");
          slider.type = "range"; slider.min = String(min); slider.max = String(max); slider.step = String(step);
          slider.value = String(Math.round(Number(pitch[key] ?? (key === "amount" ? 100 : 25))));
          slider.dataset.pitchSetting = key; slider.dataset.trackId = track.id;
          slider.style.cssText = "width:100%;accent-color:#e6bb69";
          const value = document.createElement("span");
          value.dataset.pitchValue = key + "-" + track.id;
          value.textContent = slider.value + unit;
          control.append(caption, slider, value); pitchPanel.appendChild(control);
        });
        inserts.appendChild(pitchPanel);
      }
      row.append(heading, volume, pan, inserts);
      const routing = document.createElement("details");
      routing.style.cssText = "padding:9px 10px;border:1px solid #343946;border-radius:8px;background:#12151d;color:#d8b36e";
      const routingTitle = document.createElement("summary");
      routingTitle.textContent = "OUTPUT ROUTING · SENDS";
      routingTitle.style.cssText = "font-size:10px;font-weight:800;letter-spacing:1px;cursor:pointer";
      routing.appendChild(routingTitle);
      const outputLabel = document.createElement("label");
      outputLabel.style.cssText = "display:grid;grid-template-columns:70px 1fr;gap:8px;align-items:center;margin-top:10px;color:#a8a8b1;font-size:10px";
      outputLabel.append("OUTPUT");
      const outputSelect = document.createElement("select");
      outputSelect.dataset.trackOutput = track.id;
      outputSelect.style.cssText = "min-height:34px;padding:6px;background:#20242e;color:#f4f1eb;border:1px solid #454958;border-radius:6px";
      const mainOption = document.createElement("option"); mainOption.value = ""; mainOption.textContent = "STEREO OUT"; outputSelect.appendChild(mainOption);
      if (track.type !== "bus") StudioMultitrackWorkspace.tracks.filter(bus => bus.type === "bus" && bus.id !== track.id).forEach(bus => {
        const option = document.createElement("option"); option.value = bus.id; option.textContent = bus.name; outputSelect.appendChild(option);
      });
      outputSelect.value = track.outputBusId || "";
      if (track.type === "bus") outputSelect.disabled = true;
      outputLabel.appendChild(outputSelect); routing.appendChild(outputLabel);
      if (track.type !== "bus") StudioMultitrackWorkspace.tracks.filter(bus => bus.type === "bus" && bus.id !== track.id).forEach(bus => {
        const sendLabel = document.createElement("label");
        sendLabel.style.cssText = "display:grid;grid-template-columns:70px 1fr 35px;gap:8px;align-items:center;margin-top:9px;color:#a8a8b1;font-size:10px";
        const caption = document.createElement("span"); caption.textContent = "SEND · " + bus.name.slice(0, 10);
        const send = document.createElement("input"); send.type = "range"; send.min = "0"; send.max = "100"; send.value = String(track.sends?.find(item => item.busId === bus.id)?.level || 0);
        send.dataset.trackSend = bus.id; send.dataset.trackId = track.id; send.style.cssText = "width:100%;accent-color:#e6bb69";
        const sendValue = document.createElement("span"); sendValue.textContent = send.value + "%";
        sendLabel.append(caption, send, sendValue); routing.appendChild(sendLabel);
      });
      row.appendChild(routing);

      const automation = document.createElement("details");
      automation.style.cssText = "padding:9px 10px;border:1px solid #343946;border-radius:8px;background:#12151d;color:#d8b36e";
      const automationTitle = document.createElement("summary");
      automationTitle.textContent = "VOLUME AUTOMATION";
      automationTitle.style.cssText = "font-size:10px;font-weight:800;letter-spacing:1px;cursor:pointer";
      automation.appendChild(automationTitle);
      const automationControls = document.createElement("div");
      automationControls.style.cssText = "display:grid;grid-template-columns:70px 1fr auto;gap:7px;align-items:center;margin-top:10px";
      const barInput = document.createElement("input");
      barInput.type = "number"; barInput.min = "1"; barInput.max = "128"; barInput.step = "1";
      barInput.value = "1"; barInput.dataset.automationBar = track.id;
      barInput.setAttribute("aria-label", "Automation bar");
      const levelInput = document.createElement("input");
      levelInput.type = "number"; levelInput.min = "0"; levelInput.max = "100"; levelInput.step = "1";
      levelInput.value = String(track.volume); levelInput.dataset.automationLevel = track.id;
      levelInput.setAttribute("aria-label", "Automation volume");
      const addPoint = document.createElement("button");
      addPoint.type = "button"; addPoint.dataset.addVolumePoint = track.id;
      addPoint.textContent = "ADD POINT";
      addPoint.style.cssText = "min-height:34px;padding:6px 9px;border:1px solid #665438;border-radius:6px;background:#222631;color:#f1d49c;font-size:10px;font-weight:700";
      automationControls.append(barInput, levelInput, addPoint);
      automation.appendChild(automationControls);
      const points = document.createElement("div");
      points.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-top:9px";
      (track.automation?.volume || []).forEach((point, pointIndex) => {
        const item = document.createElement("span");
        item.style.cssText = "display:flex;align-items:center;gap:5px;padding:5px 7px;border:1px solid #454958;border-radius:6px;color:#c9c7c1;font-size:10px";
        item.textContent = "BAR " + point.bar + " · " + point.value + "%";
        const remove = document.createElement("button");
        remove.type = "button"; remove.dataset.removeVolumePoint = track.id;
        remove.dataset.pointIndex = String(pointIndex); remove.textContent = "×";
        remove.style.cssText = "min-height:22px;padding:0 5px;border:0;background:transparent;color:#e6bb69;font-size:14px";
        item.appendChild(remove); points.appendChild(item);
      });
      automation.appendChild(points);
      row.appendChild(automation);
      if (track.type === "midi" || track.type === "instrument") {
        row.appendChild(createStudioDAWMidiEditor({ track, onBeforeChange: () => StudioMultitrackWorkspace.recordHistory("Edit MIDI notes"), onChange: () => { StudioMultitrackWorkspace.scheduleProjectAutosave(); status(track.name + " MIDI notes updated."); } }));
      }
      list.appendChild(row);
    });
  };

  renderTracks();
  root.addEventListener("pointerdown", event => {
    const control = event.target.closest("[data-eq-band], [data-comp-ratio], [data-track-effect], [data-pitch-setting], [data-track-volume], [data-track-pan], [data-track-send], [data-stereo-width], [data-master-comp], [data-master-volume]");
    if (control) StudioMultitrackWorkspace.recordHistory("Adjust mixer control");
  });
  root.addEventListener("keydown", event => {
    const control = event.target.closest("[data-eq-band], [data-comp-ratio], [data-track-effect], [data-pitch-setting], [data-track-volume], [data-track-pan], [data-track-send], [data-stereo-width], [data-master-comp], [data-master-volume]");
    if (control && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) StudioMultitrackWorkspace.recordHistory("Adjust mixer control");
  });

  root.addEventListener("click", async event => {
    const addPoint = event.target.closest("[data-add-volume-point]");
    if (addPoint) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === addPoint.dataset.addVolumePoint);
      const row = addPoint.closest("[data-track-id]");
      if (!track || !row) return;
      const bar = Math.max(1, Math.min(128, Number(row.querySelector("[data-automation-bar]").value) || 1));
      const value = Math.max(0, Math.min(100, Number(row.querySelector("[data-automation-level]").value) || 0));
      track.automation = track.automation || { volume: [] };
      const existing = track.automation.volume.find(point => point.bar === bar);
      StudioMultitrackWorkspace.recordHistory("Add volume automation point");
      if (existing) existing.value = value;
      else track.automation.volume.push({ bar, value });
      track.automation.volume.sort((a, b) => a.bar - b.bar);
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      renderTracks();
      status(track.name + " volume automation updated.");
      return;
    }
    const removePoint = event.target.closest("[data-remove-volume-point]");
    if (removePoint) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === removePoint.dataset.removeVolumePoint);
      if (!track?.automation?.volume) return;
      StudioMultitrackWorkspace.recordHistory("Remove volume automation point");
      track.automation.volume.splice(Number(removePoint.dataset.pointIndex), 1);
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      renderTracks();
      status(track.name + " automation point removed.");
      return;
    }
    const button = event.target.closest("[data-mix-action], [data-track-control]");
    if (!button) return;
    if (button.dataset.mixAction === "add-bus") {
      const busCount = StudioMultitrackWorkspace.tracks.filter(item => item.type === "bus").length + 1;
      StudioMultitrackWorkspace.recordHistory("Create routing bus");
      StudioMultitrackWorkspace.addTrack("bus", "BUS " + busCount);
      renderTracks();
      status("Routing bus created. Assign tracks using OUTPUT ROUTING.");
      return;
    }
    if (button.dataset.mixAction === "export-stems") {
      const tracks = StudioMultitrackWorkspace.tracks.filter(track => track.type !== "bus" && (track.clips?.some(clip => clip.blob?.size) || track.midiNotes?.length));
      if (!tracks.length) { status("No audio or MIDI tracks are available to export."); return; }
      for (const track of tracks) {
        const busIds = new Set([track.outputBusId, ...(track.sends || []).map(send => send.busId)].filter(Boolean));
        const stemTracks = [track, ...StudioMultitrackWorkspace.tracks.filter(item => item.type === "bus" && busIds.has(item.id))];
        const wav = await renderStudioSessionToWav({ tracks: stemTracks, tempo: StudioMultitrackWorkspace.tempo, timeSignature: StudioMultitrackWorkspace.timeSignature, tempoChanges: StudioMultitrackWorkspace.tempoChanges, timeSignatureChanges: StudioMultitrackWorkspace.timeSignatureChanges, masterSettings: StudioMultitrackWorkspace.masterSettings });
        downloadStudioWav(wav, (StudioMultitrackWorkspace.activeProjectName || "lambo-city-song") + "-" + track.name + "-stem");
      }
      status(tracks.length + " individual WAV stem(s) exported.");
      return;
    }
    if (button.dataset.mixAction === "edit") {
      workspace?.setView("edit");
      return;
    }
    if (button.dataset.mixAction === "export" || button.dataset.mixAction === "export-mp3") {
      button.disabled = true;
      try {
        const options = { tracks: StudioMultitrackWorkspace.tracks, tempo: StudioMultitrackWorkspace.tempo, timeSignature: StudioMultitrackWorkspace.timeSignature, tempoChanges: StudioMultitrackWorkspace.tempoChanges, timeSignatureChanges: StudioMultitrackWorkspace.timeSignatureChanges, masterSettings: StudioMultitrackWorkspace.masterSettings };
        if (button.dataset.mixAction === "export-mp3") {
          const mp3 = await renderStudioSessionToMp3(options);
          downloadStudioMp3(mp3, StudioMultitrackWorkspace.activeProjectName || "lambo-city-song");
          status("Final MP3 master exported.");
        } else {
          const wav = await renderStudioSessionToWav(options);
          downloadStudioWav(wav, StudioMultitrackWorkspace.activeProjectName || "lambo-city-song");
          status("Final WAV master exported.");
        }
      } finally { button.disabled = false; }
      return;
    }
    const track = StudioMultitrackWorkspace.tracks.find(item => item.id === button.dataset.trackId);
    if (!track) return;
    StudioMultitrackWorkspace.recordHistory("Mixer " + button.dataset.trackControl);
    if (button.dataset.trackControl === "mute") track.muted = !track.muted;
    if (button.dataset.trackControl === "solo") track.solo = !track.solo;
    StudioMultitrackWorkspace.scheduleProjectAutosave();
    StudioMultitrackWorkspace.arrangementPlayback?.syncTrackState(StudioMultitrackWorkspace.tracks);
    renderTracks();
    status(track.name + ": " + (track.muted ? "muted" : "active") + (track.solo ? " · solo" : "") + ".");
  });

  root.addEventListener("change", event => {
    const outputSelect = event.target.closest("[data-track-output]");
    if (outputSelect) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === outputSelect.dataset.trackOutput);
      if (!track) return;
      StudioMultitrackWorkspace.recordHistory("Change track output routing");
      track.outputBusId = outputSelect.value || null;
      StudioMultitrackWorkspace.arrangementPlayback?.stop();
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      status(track.name + " routed to " + (outputSelect.selectedOptions[0]?.textContent || "Stereo Out") + " · press play to rebuild routing.");
      return;
    }
    const inputSelect = event.target.closest("[data-track-input]");
    if (inputSelect) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === inputSelect.dataset.trackInput);
      if (!track) return;
      track.inputSource = inputSelect.value;
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      status(track.name + " input set to " + inputSelect.options[inputSelect.selectedIndex].text + ".");
      return;
    }
    const sendSlider = event.target.closest("[data-track-send]");
    if (sendSlider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === sendSlider.dataset.trackId);
      if (!track) return;
      track.sends = Array.isArray(track.sends) ? track.sends : [];
      const busId = sendSlider.dataset.trackSend;
      const level = Number(sendSlider.value);
      const existing = track.sends.find(item => item.busId === busId);
      if (existing) existing.level = level;
      else if (level > 0) track.sends.push({ busId, level });
      const label = sendSlider.parentElement?.querySelector("span:last-child"); if (label) label.textContent = level + "%";
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      return;
    }
    const pitchControl = event.target.closest("[data-pitch-setting]");
    if (!pitchControl) return;
    const track = StudioMultitrackWorkspace.tracks.find(item => item.id === pitchControl.dataset.trackId);
    if (!track) return;
    const settings = { ...(track.effects?.pitchCorrection || { enabled: false, root: 0, scale: "major", amount: 100, speedMs: 25 }) };
    const key = pitchControl.dataset.pitchSetting;
    settings[key] = key === "enabled" ? pitchControl.checked : key === "scale" ? pitchControl.value : Number(pitchControl.value);
    track.effects = { ...(track.effects || {}), pitchCorrection: settings };
    StudioMultitrackWorkspace.scheduleProjectAutosave();
    void StudioMultitrackWorkspace.arrangementPlayback?.setTrackEffects(track.id, { pitchCorrection: settings })
      .catch(error => status("PITCH CORRECTION: " + (error?.message || error)));
    status(settings.enabled ? "Vocal pitch correction enabled · " + ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"][settings.root] + " " + settings.scale + "." : "Vocal pitch correction bypassed.");
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
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      return;
    }
    const pitchSlider = event.target.closest('input[type="range"][data-pitch-setting]');
    if (pitchSlider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === pitchSlider.dataset.trackId);
      if (!track) return;
      const key = pitchSlider.dataset.pitchSetting;
      const settings = { ...(track.effects?.pitchCorrection || { enabled: false, root: 0, scale: "major", amount: 100, speedMs: 25 }), [key]: Number(pitchSlider.value) };
      track.effects = { ...(track.effects || {}), pitchCorrection: settings };
      const label = root.querySelector('[data-pitch-value="' + key + "-" + track.id + '"]');
      if (label) label.textContent = pitchSlider.value + (key === "speedMs" ? " ms" : "%");
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      void StudioMultitrackWorkspace.arrangementPlayback?.setTrackEffects(track.id, { pitchCorrection: settings })
        .catch(error => status("PITCH CORRECTION: " + (error?.message || error)));
      return;
    }
    const effectSlider = event.target.closest("[data-track-effect]");
    if (effectSlider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === effectSlider.dataset.trackId);
      if (!track) return;
      const key = effectSlider.dataset.trackEffect;
      const raw = Number(effectSlider.value);
      const value = key === "delayTime" || key === "reverbDecay" ? raw / 1000 : raw / 100;
      track.effects = { ...(track.effects || {}), [key]: value };
      const label = root.querySelector('[data-effect-label="' + key + "-" + track.id + '"]');
      if (label) label.textContent = key === "delayTime" ? Math.round(value * 1000) + " ms" :
        key === "reverbDecay" ? value.toFixed(1) + " s" : Math.round(value * 100) + "%";
      StudioMultitrackWorkspace.arrangementPlayback?.setTrackEffects(track.id, { [key]: value });
      StudioMultitrackWorkspace.scheduleProjectAutosave();
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
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      return;
    }
    const slider = event.target.closest("[data-track-volume], [data-track-pan]");
    if (slider) {
      const track = StudioMultitrackWorkspace.tracks.find(item => item.id === (slider.dataset.trackVolume || slider.dataset.trackPan));
      if (!track) return;
      if (slider.matches("[data-track-volume]")) {
        track.volume = Number(slider.value);
        const label = root.querySelector('[data-track-volume-label="' + track.id + '"]');
        if (label) label.textContent = track.volume + "%";
        StudioMultitrackWorkspace.arrangementPlayback?.setTrackVolume(track.id, track.volume);
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      } else {
        track.pan = Number(slider.value) / 100;
        const label = root.querySelector('[data-track-pan-label="' + track.id + '"]');
        if (label) label.textContent = track.pan === 0 ? "C" : (track.pan < 0 ? "L " : "R ") + Math.round(Math.abs(track.pan) * 100);
        StudioMultitrackWorkspace.arrangementPlayback?.setTrackPan(track.id, track.pan);
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      }
      return;
    }
    if (event.target.matches("[data-stereo-width]")) {
      const value = Number(event.target.value);
      if (widthLabel) widthLabel.textContent = value + "%";
      StudioAudioEngine.setStereoWidth(value);
      StudioMultitrackWorkspace.masterSettings = { ...(StudioMultitrackWorkspace.masterSettings || {}), stereoWidth: value };
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      status("Stereo width set to " + value + "%.");
      return;
    }
    if (event.target.matches("[data-master-comp]")) {
      const value = Number(event.target.value);
      StudioAudioEngine.setMasterCompressionRatio(value);
      StudioMultitrackWorkspace.masterSettings = { ...(StudioMultitrackWorkspace.masterSettings || {}), compressionRatio: value };
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      if (masterCompLabel) masterCompLabel.textContent = value.toFixed(1) + ":1";
      status("Master compression ratio set to " + value.toFixed(1) + ":1.");
      return;
    }
    if (event.target.matches("[data-master-volume]")) {
      const value = Number(event.target.value);
      const label = root.querySelector("[data-master-label]");
      if (label) label.textContent = value + "%";
      StudioAudioEngine.setMasterVolume(value / 100);
      StudioMultitrackWorkspace.masterSettings = { ...(StudioMultitrackWorkspace.masterSettings || {}), volume: value };
      StudioMultitrackWorkspace.scheduleProjectAutosave();
      status("Studio master level set to " + value + "%.");
    }
  });
  root.refresh = renderTracks;
  return root;
}



export default createStudioMixMasterApp;
