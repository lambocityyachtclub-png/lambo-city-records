const PITCH_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

function noteKey(note) {
  return Math.round(Number(note.pitch)) + ":" + Math.round((Number(note.startBar) - 1) * 4);
}

export function createStudioDAWMidiEditor({ track, onBeforeChange, onChange } = {}) {
  const root = document.createElement("section");
  root.style.cssText = "display:grid;gap:7px;margin-top:10px;padding:10px;border:1px solid #665438;border-radius:8px;background:#0d1423;color:#f4f1eb";
  const heading = document.createElement("div");
  heading.textContent = "PIANO ROLL · 1 BAR / 16 STEPS";
  heading.style.cssText = "color:#d8b36e;font-size:10px;font-weight:900;letter-spacing:1px";
  root.appendChild(heading);
  const settings = document.createElement("div");
  settings.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:#a8b3c7;font-size:9px";
  const lengthLabel = document.createElement("label"); lengthLabel.textContent = "NOTE LENGTH ";
  const lengthSelect = document.createElement("select"); lengthSelect.dataset.noteLength = ""; lengthSelect.style.cssText = "min-height:28px;padding:4px;background:#20242e;color:#f4f1eb;border:1px solid #454958;border-radius:5px";
  [["0.125","1/8 BAR"],["0.25","1/4 BAR"],["0.5","1/2 BAR"],["1","1 BAR"]].forEach(([value,label]) => { const option=document.createElement("option");option.value=value;option.textContent=label;lengthSelect.appendChild(option); });
  lengthLabel.appendChild(lengthSelect);
  const waveLabel = document.createElement("label"); waveLabel.textContent = "TONE ";
  const waveSelect = document.createElement("select"); waveSelect.dataset.instrumentWave = ""; waveSelect.style.cssText = lengthSelect.style.cssText;
  [["triangle","TRIANGLE"],["sine","SINE"],["sawtooth","SAW"],["square","SQUARE"]].forEach(([value,label]) => { const option=document.createElement("option");option.value=value;option.textContent=label;waveSelect.appendChild(option); });
  waveSelect.value = ["sine","triangle","sawtooth","square"].includes(track?.instrumentWave) ? track.instrumentWave : "triangle";
  waveLabel.appendChild(waveSelect);
  settings.append(lengthLabel, waveLabel); root.appendChild(settings);
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:38px repeat(16,minmax(12px,1fr));gap:2px;overflow-x:auto";
  const notes = Array.isArray(track?.midiNotes) ? track.midiNotes : [];
  const active = new Set(notes.map(noteKey));
  for (let pitch = 72; pitch >= 48; pitch -= 1) {
    const label = document.createElement("span");
    label.textContent = PITCH_NAMES[pitch % 12] + Math.floor(pitch / 12 - 1);
    label.style.cssText = "display:grid;place-items:center;min-height:20px;font-size:8px;color:" + ([0,2,4,5,7,9,11].includes(pitch % 12) ? "#d7dbe3" : "#8a96aa");
    grid.appendChild(label);
    for (let step = 0; step < 16; step += 1) {
      const key = pitch + ":" + step;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.pitch = String(pitch);
      button.dataset.step = String(step);
      button.setAttribute("aria-label", "Toggle " + PITCH_NAMES[pitch % 12] + " step " + (step + 1));
      button.setAttribute("aria-pressed", String(active.has(key)));
      button.style.cssText = "min-width:0;min-height:20px;padding:0;border:1px solid #35445f;border-radius:2px;background:" + (active.has(key) ? "#d8b36e" : (step % 4 === 0 ? "#243552" : "#111d32")) + ";touch-action:manipulation";
      grid.appendChild(button);
    }
  }
  waveSelect.addEventListener("pointerdown", () => { if (track && typeof onBeforeChange === "function") onBeforeChange(track); });
  waveSelect.addEventListener("keydown", () => { if (track && typeof onBeforeChange === "function") onBeforeChange(track); });
  waveSelect.addEventListener("change", () => { if (track) { track.instrumentWave = waveSelect.value; if (typeof onChange === "function") onChange(track); } });
  root.appendChild(grid);
  const hint = document.createElement("div");
  hint.textContent = "Tap a cell to add or remove a note · 2-octave range · velocity 80%.";
  hint.style.cssText = "color:#8f9bb0;font-size:9px";
  root.appendChild(hint);
  grid.addEventListener("click", event => {
    const cell = event.target.closest("button[data-pitch]");
    if (!cell || !track) return;
    const pitch = Number(cell.dataset.pitch);
    const step = Number(cell.dataset.step);
    const key = pitch + ":" + step;
    track.midiNotes = Array.isArray(track.midiNotes) ? track.midiNotes : [];
    if (typeof onBeforeChange === "function") onBeforeChange(track);
    const index = track.midiNotes.findIndex(note => noteKey(note) === key);
    if (index >= 0) track.midiNotes.splice(index, 1);
    else track.midiNotes.push({
      id: "midi-" + track.id + "-" + pitch + "-" + step,
      pitch,
      startBar: 1 + step / 4,
      lengthBars: Number(lengthSelect.value) || 0.25,
      velocity: 0.8
    });
    cell.setAttribute("aria-pressed", String(index < 0));
    cell.style.background = index < 0 ? "#d8b36e" : (step % 4 === 0 ? "#243552" : "#111d32");
    if (typeof onChange === "function") onChange(track);
  });
  return root;
}

export default createStudioDAWMidiEditor;
