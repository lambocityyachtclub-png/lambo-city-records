import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

import StudioAudioEngine from "./studioAudioEngine.js";
import StudioSoundKit from "./studioSoundKit.js";
import StudioAudioExport from "./studioAudioExport.js";

import {
  createSongProject,
  saveSongProject,
  loadSongProject,
  listSongProjects,
  addPatternToProject,
  addClipToSection
} from "./studioSongProject.js";
import {
  exportSongProjectPackage,
  importSongProjectPackage
} from "./studioProjectPackage.js";
// LAMBO CITY RECORDS — FLOOR TWO STUDIO APP
// 16-step Beat Lab using the shared studio audio engine.
// The 3D studio and station are owned by recordsHQFloor2Studio.js.

const STORAGE_KEY = "lambocity-floor2-beatlab-v1";
const STEP_COUNT = 16;
const MIN_BPM = 60;
const MAX_BPM = 180;

const TRACKS = [
  { id: "kick", label: "KICK" },
  { id: "snare", label: "SNARE" },
  { id: "hat", label: "HI-HAT" }
];

function makeDefaultPattern() {
  return {
    bpm: 100,
    steps: {
      kick: Array.from({ length: STEP_COUNT }, (_, i) =>
        [0, 8].includes(i)
      ),
      snare: Array.from({ length: STEP_COUNT }, (_, i) =>
        [4, 12].includes(i)
      ),
      hat: Array.from({ length: STEP_COUNT }, (_, i) =>
        i % 2 === 0
      )
    }
  };
}

function normalizePattern(data) {
  if (
    !data ||
    !Number.isFinite(Number(data.bpm)) ||
    !data.steps ||
    !TRACKS.every(({ id }) =>
      Array.isArray(data.steps[id]) &&
      data.steps[id].length === STEP_COUNT
    )
  ) {
    throw new Error("Invalid beat format");
  }

  return {
    bpm: Math.max(MIN_BPM, Math.min(MAX_BPM, Number(data.bpm))),
    steps: Object.fromEntries(
      TRACKS.map(({ id }) => [
        id,
        data.steps[id].map(Boolean)
      ])
    )
  };
}

export default {
  init(scene, context) {
    this.scene = scene;
    this.camera = context?.camera;
    this.renderer = context?.renderer;
    this.pattern = makeDefaultPattern();
this.soundProfile = "beatLab";
this.currentProject = null;
    this.audio = null;
    this.noiseBuffer = null;
    this.timer = null;
    this.playing = false;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.ui = null;
    this.style = null;
    this.raycaster = null;
    this.pointer = null;
    this.handleCanvasClick = null;

    if (!this.camera || !this.renderer?.domElement) {
      console.warn(
        "LAMBO CITY Beat Lab: camera or renderer unavailable."
      );
      return;
    }

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.handleCanvasClick = (event) => {
      if (this.ui) return;

      const studio = this.scene?.getObjectByName(
        "recordsHQFloor2Studio"
      );
      const beatLab = studio?.getObjectByName("floor2BeatLab");
      if (!studio || !beatLab) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      this.pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObject(beatLab, true);
      if (!hits.length) return;

      let object = hits[0].object;
      while (object && object !== studio) {
        if (object.userData?.studioStation === "beatLab") {
          this.open();
          return;
        }
        object = object.parent;
      }
    };

    this.renderer.domElement.addEventListener(
      "click",
      this.handleCanvasClick
    );
  },

  open() {
    if (this.ui) return;

    const root = document.createElement("div");
    root.id = "lambo-city-beat-lab";
    root.style.cssText = `
      position:fixed; inset:0; z-index:10000;
      overflow:auto; overscroll-behavior:contain;
      background:linear-gradient(145deg,#10131c,#050609 70%);
      color:#f5f4f0; font-family:Arial,sans-serif;
      padding:clamp(12px,3vw,30px);
      box-sizing:border-box; touch-action:pan-y;
      -webkit-overflow-scrolling:touch;
    `;

    root.innerHTML = `
      <div style="max-width:1050px;margin:auto">
        <header style="display:flex;justify-content:space-between;
          align-items:center;gap:12px;flex-wrap:wrap;
          border-bottom:1px solid #34333a;padding-bottom:16px">
          <div>
            <div style="color:#e6bb69;font-size:11px;letter-spacing:3px">
              LAMBO CITY RECORDS
            </div>
            <h1 style="font-size:clamp(23px,5vw,36px);margin:8px 0 4px">
              BEAT LAB
            </h1>
            <div style="color:#a8a8b1;font-size:13px">
              STUDIO SESSION 001 · 16-STEP SEQUENCER
            </div>
          </div>
          <button type="button" data-action="close" class="lc-action">
            CLOSE ✕
          </button>
        </header>

        <section class="lc-controls">
          <button type="button" data-action="play" class="lc-action">
            ▶ PLAY
          </button>
          <button type="button" data-action="stop" class="lc-action">
            ■ STOP
          </button>
          <label class="lc-control-label">
            <span>TEMPO</span>
            <input data-bpm type="range" min="${MIN_BPM}" max="${MAX_BPM}"
              value="${this.pattern.bpm}" style="width:145px">
            <strong data-bpm-label>${this.pattern.bpm} BPM</strong>
          </label>
          <label class="lc-control-label">
            <span>SOUND</span>
            <select data-sound-profile>
              <option value="beatLab">DIGITAL</option>
              <option value="mpc">VINTAGE MPC</option>
            </select>
          </label>
        </section>

        <section class="lc-sequencer">
          <div class="lc-sequencer-heading">
            <strong>STEP SEQUENCER</strong>
            <span>Tap a square to toggle a beat</span>
          </div>
          <div data-grid></div>
          <div class="lc-hint">
            Start with the kick, add the snare, then shape the hi-hats.
          </div>
        </section>

 
<section class="lc-arranger">
  <div class="lc-arranger-heading">
    <div>
      <div class="lc-eyebrow">SONG WORKSPACE</div>
      <h2>SONG ARRANGER</h2>
      <p>Build your song from saved beat patterns.</p>
    </div>
  </div>

  <div class="lc-arranger-project" data-project-status>
    Save or load a song project to begin arranging.
  </div>

  <div class="lc-arranger-controls">
    <button type="button" data-action="add-pattern" class="lc-action">
      + SAVE BEAT AS PATTERN
    </button>
  </div>

  <div class="lc-arranger-controls">
    <label>
      <span>SONG SECTION</span>
      <select data-arranger-section></select>
    </label>

    <label>
      <span>BEAT PATTERN</span>
      <select data-arranger-pattern></select>
    </label>
  </div>

  <div class="lc-arranger-controls">
    <label>
      <span>START BAR</span>
      <input data-arranger-start type="number"
        min="0" max="999" value="0">
    </label>

    <label>
      <span>LENGTH (BARS)</span>
      <input data-arranger-length type="number"
        min="1" max="999" value="4">
    </label>

    <button type="button" data-action="add-clip" class="lc-action">
      + ADD TO SONG
    </button>
  </div>

  <div data-arranger-list class="lc-arranger-list">
    Your song arrangement will appear here.
  </div>
</section>

<section class="lc-actions">
  <button type="button" data-action="record" class="lc-action">
    ● RECORD AUDIO
  </button>

  <button type="button" data-action="stop-recording" class="lc-action">
    ■ STOP RECORDING
  </button>

  <button type="button" data-action="export-audio" class="lc-action">
    EXPORT AUDIO
  </button>

  <button type="button" data-action="save" class="lc-action">
    SAVE BEAT
  </button>

  <button type="button" data-action="load" class="lc-action">
    LOAD BEAT
  </button>

  <button type="button" data-action="save-song" class="lc-action">
    SAVE SONG PROJECT
  </button>

  <button type="button" data-action="load-song" class="lc-action">
    LOAD SONG PROJECT
  </button>

  <button type="button" data-action="export-song" class="lc-action">
    EXPORT SONG PROJECT
  </button>

  <button type="button" data-action="import-song" class="lc-action">
    IMPORT SONG PROJECT
  </button>

  <button type="button" data-action="clear" class="lc-action">
    CLEAR PATTERN
  </button>
</section>



        <div data-status role="status" aria-live="polite" class="lc-status">
          Your studio is ready.
        </div>

        <footer class="lc-footer">
          LAMBO CITY DIGITAL STUDIO · V1
          <br>Browser-generated drum sounds. Save stores this beat in this browser on this device.
        </footer>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #lambo-city-beat-lab * { box-sizing:border-box; }
      #lambo-city-beat-lab .lc-action {
        background:#1b1d25;color:#f5f4f0;border:1px solid #5a4b31;
        border-radius:10px;padding:12px 15px;min-height:44px;
        font-weight:700;letter-spacing:.5px;cursor:pointer;
        touch-action:manipulation;
      }
      #lambo-city-beat-lab .lc-action:active { background:#40301a; }
      #lambo-city-beat-lab .lc-controls,
      #lambo-city-beat-lab .lc-actions {
        display:flex;gap:12px;align-items:center;flex-wrap:wrap;
        padding:20px 0;
      }
      #lambo-city-beat-lab .lc-control-label {
        display:flex;align-items:center;gap:10px;flex-wrap:wrap;
      }
      #lambo-city-beat-lab .lc-control-label span {
        color:#e6bb69;font-size:12px;letter-spacing:1px;
      }
      #lambo-city-beat-lab [data-sound-profile] {
        background:#1b1d25;color:#f5f4f0;border:1px solid #5a4b31;
        border-radius:8px;padding:10px;min-height:44px;
      }
      #lambo-city-beat-lab .lc-sequencer {
        border:1px solid #34333a;border-radius:16px;
        padding:clamp(10px,2vw,20px);background:#11131a;
      }
      #lambo-city-beat-lab .lc-sequencer-heading {
        display:flex;justify-content:space-between;gap:10px;
        flex-wrap:wrap;margin-bottom:16px;
      }
      #lambo-city-beat-lab .lc-sequencer-heading span,
      #lambo-city-beat-lab .lc-hint {
        font-size:12px;color:#a8a8b1;
      }
      #lambo-city-beat-lab .lc-hint { margin-top:15px; }
      #lambo-city-beat-lab .lc-track {
        display:grid;grid-template-columns:66px repeat(16,minmax(12px,1fr));
        gap:clamp(2px,.65vw,6px);align-items:center;margin:13px 0;
      }
      #lambo-city-beat-lab .lc-track-label {
        font-size:10px;font-weight:700;color:#e6bb69;
      }
      #lambo-city-beat-lab .lc-step {
        width:100%;min-width:0;height:clamp(25px,5vw,42px);
        padding:0;border:1px solid #343744;border-radius:5px;
        background:#22252f;touch-action:manipulation;
      }
      #lambo-city-beat-lab .lc-step.on {
        background:#e6bb69;border-color:#ffe1a1;
      }
      #lambo-city-beat-lab .lc-step.beat { outline:1px solid #777b88; }
      #lambo-city-beat-lab .lc-step.playhead {
        box-shadow:0 0 0 2px #f5f4f0;
      }
      #lambo-city-beat-lab .lc-status {
        color:#e6bb69;min-height:24px;font-size:13px;
      }
      #lambo-city-beat-lab .lc-footer {
        margin-top:20px;padding-top:14px;border-top:1px solid #34333a;
        color:#888995;font-size:12px;
      }
      
#lambo-city-beat-lab .lc-arranger {
  margin: 20px 0;
  padding: clamp(14px, 2vw, 22px);
  border: 1px solid #5a4b31;
  border-radius: 16px;
  background: linear-gradient(145deg, #191a20, #101116);
}

#lambo-city-beat-lab .lc-arranger-heading h2 {
  margin: 7px 0;
  font-size: 21px;
}

#lambo-city-beat-lab .lc-arranger-heading p,
#lambo-city-beat-lab .lc-arranger-project {
  color: #a8a8b1;
  font-size: 13px;
}

#lambo-city-beat-lab .lc-eyebrow,
#lambo-city-beat-lab .lc-arranger-controls label span {
  display: block;
  color: #e6bb69;
  font-size: 11px;
  letter-spacing: 1px;
  margin-bottom: 7px;
}

#lambo-city-beat-lab .lc-arranger-controls {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

#lambo-city-beat-lab .lc-arranger-controls label {
  flex: 1 1 130px;
}

#lambo-city-beat-lab .lc-arranger-controls select,
#lambo-city-beat-lab .lc-arranger-controls input {
  width: 100%;
  min-height: 44px;
  padding: 10px;
  color: #f5f4f0;
  background: #1b1d25;
  border: 1px solid #5a4b31;
  border-radius: 8px;
  font-size: 14px;
}

#lambo-city-beat-lab .lc-arranger-project {
  margin-top: 12px;
}

#lambo-city-beat-lab .lc-arranger-list {
  display: grid;
  gap: 9px;
  margin-top: 18px;
}

#lambo-city-beat-lab .lc-arranger-item {
  padding: 12px;
  border: 1px solid #34333a;
  border-radius: 9px;
  background: #11131a;
  color: #f5f4f0;
  font-size: 13px;
}

      @media(max-width:540px) {
        #lambo-city-beat-lab .lc-track {
          grid-template-columns:48px repeat(16,minmax(0,1fr));gap:2px;
        }
        #lambo-city-beat-lab .lc-track-label { font-size:8px; }
        #lambo-city-beat-lab .lc-sequencer-heading span { font-size:11px; }
      }
    `;

    
document.head.appendChild(style);
document.body.appendChild(root);
this.ui = root;
this.style = style;

// TEMPORARY DIAGNOSTIC: direct studio audio test
const testButton = document.createElement("button");
testButton.type = "button";
testButton.className = "lc-action";
testButton.textContent = "TEST SOUND";

testButton.addEventListener("click", () => {
  void this.testSound();
});

root.querySelector(".lc-controls")?.appendChild(testButton);


    this.renderGrid();

    root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const stepButton = target.closest(".lc-step");
      if (stepButton) {
        const track = stepButton.dataset.track;
        const step = Number(stepButton.dataset.step);

        if (
          !this.pattern.steps[track] ||
          !Number.isInteger(step) ||
          step < 0 ||
          step >= STEP_COUNT
        ) return;

        this.pattern.steps[track][step] =
          !this.pattern.steps[track][step];

        stepButton.classList.toggle("on", this.pattern.steps[track][step]);
        stepButton.setAttribute(
          "aria-pressed",
          String(this.pattern.steps[track][step])
        );
        this.status("Pattern updated.");
        return;
      }

      const button = target.closest("[data-action]");
      if (!button) return;

      switch (button.dataset.action) {
        case "close":
          this.close();
          break;
        case "play":
          void this.start();
          break;
        case "stop":
          this.stop();
          break;
          

        case "record":
          void this.startRecording();
          break;
        case "stop-recording":
          void this.stopRecording();
          break;
        case "export-audio":
          this.exportRecording();
          break;


       
        case "save":
          this.save();
          break;
        case "load":
          this.load();
          break;
        case "save-song":
          this.saveSongProject();
          break;
        case "load-song":
          this.loadSongProject();
          break;
        case "export-song":
          this.exportSongProject();
          break;
        
        case "import-song":
          this.importSongProject();
          break;

        case "add-pattern":
          this.addArrangerPattern();
          break;

        case "add-clip":
          this.addArrangerClip();
          break;

        case "clear":

          this.stop();
          TRACKS.forEach(({ id }) => this.pattern.steps[id].fill(false));
          this.renderGrid();
          this.status("Pattern cleared.");
          break;
      }
    });

    root.querySelector("[data-bpm]").addEventListener("input", (event) => {
      const bpm = Number(event.target.value);
      if (!Number.isFinite(bpm)) return;
      this.pattern.bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
      root.querySelector("[data-bpm-label]").textContent =
        `${this.pattern.bpm} BPM`;
    });

    root.querySelector("[data-sound-profile]").value = this.soundProfile;
    root.querySelector("[data-sound-profile]").addEventListener(
      "change",
      (event) => {
        this.soundProfile =
          event.target.value === "mpc" ? "mpc" : "beatLab";
        this.status(
          this.soundProfile === "mpc"
            ? "Vintage MPC sound selected."
            : "Digital sound selected."
        );
      }
    );
  },

  renderGrid() {
    if (!this.ui) return;
    const grid = this.ui.querySelector("[data-grid]");
    if (!grid) return;

    grid.innerHTML = TRACKS.map(({ id, label }) => `
      <div class="lc-track">
        <div class="lc-track-label">${label}</div>
        ${Array.from({ length: STEP_COUNT }, (_, step) => `
          <button type="button"
            class="lc-step ${this.pattern.steps[id][step] ? "on" : ""}
              ${step % 4 === 0 ? "beat" : ""}"
            data-track="${id}" data-step="${step}"
            aria-label="${label}, step ${step + 1}"
            aria-pressed="${this.pattern.steps[id][step]}">
          </button>
        `).join("")}
      </div>
    `).join("");
  },

  status(message) {
    const statusElement = this.ui?.querySelector("[data-status]");
    if (statusElement) statusElement.textContent = message;
  },


 
  renderArranger() {
    if (!this.ui) return;

    const project = this.currentProject;
    const sectionSelect = this.ui.querySelector("[data-arranger-section]");
    const patternSelect = this.ui.querySelector("[data-arranger-pattern]");
    const projectStatus = this.ui.querySelector("[data-project-status]");
    const list = this.ui.querySelector("[data-arranger-list]");

    if (!sectionSelect || !patternSelect || !projectStatus || !list) return;

    sectionSelect.replaceChildren();
    patternSelect.replaceChildren();
    list.replaceChildren();

    list.style.cssText = `
      display:grid;
      gap:16px;
      margin-top:18px;
      overflow-x:auto;
      padding-bottom:8px;
    `;

    if (!project) {
      projectStatus.textContent =
        "Save or load a song project to begin arranging.";
      list.textContent = "No active song project.";
      return;
    }

    const sections = project.arrangement?.sections || [];
    const patterns = project.patterns || [];

    projectStatus.textContent =
      `Editing: ${project.metadata?.title || "Untitled Song"} · ${patterns.length} beat pattern(s)`;

    sections.forEach((section) => {
      const option = document.createElement("option");
      option.value = section.id;
      option.textContent = section.name;
      sectionSelect.appendChild(option);
    });

    patterns.forEach((pattern) => {
      const option = document.createElement("option");
      option.value = pattern.id;
      option.textContent = pattern.name;
      patternSelect.appendChild(option);
    });

    if (!sections.length) {
      list.textContent = "This project has no song sections yet.";
      return;
    }

    const trackDefinitions = [
      { id: "kick", label: "KICK" },
      { id: "snare", label: "SNARE" },
      { id: "hat", label: "HI-HAT" }
    ];

    sections.forEach((section) => {
      const clips = section.clips || [];

      const totalBars = Math.max(
        Number(section.bars) || 4,
        1,
        ...clips.map((clip) =>
          Math.max(0, Number(clip.startBar) || 0) +
          Math.max(1, Number(clip.lengthBars) || 1)
        )
      );

      const card = document.createElement("div");
      card.style.cssText = `
        min-width:100%;
        padding:14px;
        border:1px solid #51452f;
        border-radius:12px;
        background:#101116;
      `;

      const heading = document.createElement("div");
      heading.textContent =
        `${section.name.toUpperCase()} · ${totalBars} BARS`;

      heading.style.cssText = `
        color:#e6bb69;
        font-size:12px;
        font-weight:700;
        letter-spacing:1.5px;
        margin-bottom:12px;
      `;

      card.appendChild(heading);

      const gridColumns =
        `64px repeat(${totalBars}, minmax(42px, 1fr))`;

      const ruler = document.createElement("div");
      ruler.style.cssText = `
        display:grid;
        grid-template-columns:${gridColumns};
        gap:3px;
        min-width:${64 + totalBars * 42}px;
        margin-bottom:5px;
      `;

      const rulerLabel = document.createElement("div");
      rulerLabel.textContent = "BAR";
      rulerLabel.style.cssText =
        "font-size:9px;color:#888995;align-self:center;";
      ruler.appendChild(rulerLabel);

      for (let bar = 0; bar < totalBars; bar++) {
        const marker = document.createElement("div");
        marker.textContent = String(bar + 1);
        marker.style.cssText = `
          color:#a8a8b1;
          font-size:10px;
          text-align:center;
          padding:5px 0;
          border-bottom:1px solid #45434a;
        `;
        ruler.appendChild(marker);
      }

      card.appendChild(ruler);

      trackDefinitions.forEach((track) => {
        const row = document.createElement("div");

        row.style.cssText = `
          display:grid;
          grid-template-columns:${gridColumns};
          gap:3px;
          min-width:${64 + totalBars * 42}px;
          min-height:38px;
          margin-top:5px;
        `;

        const label = document.createElement("div");
        label.textContent = track.label;
        label.style.cssText = `
          display:flex;
          align-items:center;
          color:#c9c3b7;
          font-size:9px;
          font-weight:700;
        `;

        row.appendChild(label);

        for (let bar = 0; bar < totalBars; bar++) {
          const cell = document.createElement("div");
          cell.style.cssText = `
            grid-column:${bar + 2};
            grid-row:1;
            border-left:1px solid #34343d;
            background:${bar % 4 === 0 ? "#191a22" : "#14151c"};
            min-height:38px;
          `;
          row.appendChild(cell);
        }

        clips.forEach((clip) => {
          const pattern = patterns.find(
            (entry) => entry.id === clip.patternId
          );

          if (!pattern) return;

          const startBar = Math.max(
            0,
            Number(clip.startBar) || 0
          );

          const lengthBars = Math.max(
            1,
            Number(clip.lengthBars) || 1
          );

          const block = document.createElement("div");

          block.style.cssText = `
            grid-column:${startBar + 2} / span ${lengthBars};
            grid-row:1;
            z-index:1;
            align-self:stretch;
            min-width:0;
            margin:3px 1px;
            padding:4px;
            overflow:hidden;
            border:1px solid #b18a4b;
            border-radius:5px;
            background:#40321e;
            color:#fff1d1;
          `;

          block.title =
            `${pattern.name} · ${track.label} · Bar ${startBar + 1} · ${lengthBars} bars`;

          const name = document.createElement("div");
          name.textContent = pattern.name;
          name.style.cssText = `
            font-size:9px;
            font-weight:700;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          `;

          block.appendChild(name);

          const steps = pattern.steps?.[track.id] || [];

          const stepDisplay = document.createElement("div");
          stepDisplay.style.cssText = `
            display:flex;
            gap:2px;
            margin-top:4px;
            height:5px;
          `;

          steps.forEach((active) => {
            const mark = document.createElement("span");
            mark.style.cssText = `
              flex:1;
              min-width:1px;
              border-radius:2px;
              background:${active ? "#f3cf83" : "#716047"};
              opacity:${active ? "1" : "0.35"};
            `;
            stepDisplay.appendChild(mark);
          });

          block.appendChild(stepDisplay);
          row.appendChild(block);
        });

        card.appendChild(row);
      });

      const footer = document.createElement("div");
      footer.textContent = clips.length
        ? `${clips.length} beat clip(s) in this section`
        : "Empty section · Add a beat pattern above";

      footer.style.cssText = `
        color:#888995;
        font-size:10px;
        margin-top:10px;
      `;

      card.appendChild(footer);
      list.appendChild(card);
    });
  },

     

  addArrangerPattern() {
    if (!this.currentProject) {
      this.status("Save or load a song project first.");
      return;
    }

    const name = window.prompt("Name this beat pattern:");
    if (name === null) return;

    const cleanName = name.trim();
    if (!cleanName) {
      this.status("Enter a pattern name.");
      return;
    }

    try {
      addPatternToProject(this.currentProject, this.pattern, cleanName);
      saveSongProject(this.currentProject);
      this.renderArranger();
      this.status(`Pattern "${cleanName}" saved to this song.`);
    } catch (error) {
      console.error("Arranger pattern error:", error);
      this.status(`PATTERN ERROR: ${error?.message || error}`);
    }
  },

  addArrangerClip() {
    const project = this.currentProject;

    if (!project) {
      this.status("Save or load a song project first.");
      return;
    }

    const sectionId = this.ui.querySelector("[data-arranger-section]")?.value;
    const patternId = this.ui.querySelector("[data-arranger-pattern]")?.value;
    const startBar = Number(this.ui.querySelector("[data-arranger-start]")?.value);
    const lengthBars = Number(this.ui.querySelector("[data-arranger-length]")?.value);

    if (
      !sectionId ||
      !patternId ||
      !Number.isInteger(startBar) ||
      startBar < 0 ||
      !Number.isInteger(lengthBars) ||
      lengthBars < 1
    ) {
      this.status("Choose a pattern, section, and valid bar lengths.");
      return;
    }

    try {
      addClipToSection(project, sectionId, patternId, startBar, lengthBars);
      saveSongProject(project);
      this.renderArranger();
      this.status("Beat pattern added to the song arrangement.");
    } catch (error) {
      console.error("Arranger clip error:", error);
      this.status(`ARRANGEMENT ERROR: ${error?.message || error}`);
    }
  },


async testSound() {
  try {
    this.status("Starting Web Audio output test...");

    const audio = await StudioAudioEngine.resume();

    const playTone = (frequency, output, startTime) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.12,
        startTime + 0.04
      );
      gain.gain.setValueAtTime(
        0.12,
        startTime + 0.45
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + 0.55
      );

      oscillator.connect(gain);
      gain.connect(output);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    };

    if (!StudioAudioEngine.master) {
      throw new Error("Shared studio master output is missing.");
    }

    const start = audio.currentTime + 0.15;

    // First tone: direct browser audio output.
    playTone(440, audio.destination, start);

    // Second tone: shared LAMBO CITY studio mixer.
    playTone(880, StudioAudioEngine.master, start + 0.9);

    window.setTimeout(() => {
      this.status(
        `Test complete · Context: ${audio.state} · ` +
        `Clock: ${audio.currentTime.toFixed(2)} · ` +
        `Sample rate: ${audio.sampleRate} Hz · ` +
        `Master gain: ${StudioAudioEngine.master.gain.value}`
      );
    }, 1800);

  } catch (error) {
    console.error("LAMBO CITY audio diagnostic:", error);
    this.status(`TEST ERROR: ${error?.message || error}`);
  }
},



  async start() {
    if (this.playing) {
      this.status("Beat already playing.");
      return;
    }

    this.status("Starting shared studio audio...");

    try {
     
      this.audio = await StudioAudioEngine.resume();

if (!this.audio || this.audio.state !== "running") {
  throw new Error("Shared studio audio did not start.");
}

     


      if (!this.noiseBuffer) this.noiseBuffer = this.createNoiseBuffer();

      this.playing = true;
      this.currentStep = 0;
      this.nextStepTime = this.audio.currentTime + 0.05;

      this.status(
        `Playing · ${this.pattern.bpm} BPM · ${this.soundProfile === "mpc" ? "Vintage MPC" : "Digital"}`
      );

      this.timer = window.setInterval(() => {
        if (!this.playing || !this.audio) return;

        try {
          while (this.nextStepTime < this.audio.currentTime + 0.1) {
            this.scheduleStep(this.currentStep, this.nextStepTime);
            this.currentStep = (this.currentStep + 1) % STEP_COUNT;
            this.nextStepTime += 60 / this.pattern.bpm / 4;
          }
        } catch (error) {
          console.error("LAMBO CITY sequencer error:", error);
          this.stop();
          this.status(`SEQUENCER ERROR: ${error?.message || error}`);
        }
      }, 25);
    } catch (error) {
      this.stop();
      console.error("LAMBO CITY shared audio error:", error);
      this.status(`AUDIO ERROR: ${error?.message || error}`);
    }
  },

  stop() {
    this.playing = false;

    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }

    this.ui?.querySelectorAll(".lc-step").forEach((button) => {
      button.classList.remove("playhead");
    });

    this.status("Playback stopped.");
  },

 
  async startRecording() {
    try {
      if (this.pendingAudioExportBlob) {
        this.status(
          "Export your previous recording before starting another."
        );
        return;
      }

      this.audio = await StudioAudioEngine.resume();

      if (!this.audio || this.audio.state !== "running") {
        throw new Error("Studio audio is not running.");
      }

      StudioAudioExport.start(this.audio);

      this.status(
        "Recording audio… Tap STOP RECORDING when finished."
      );
    } catch (error) {
      console.error("LAMBO CITY recording error:", error);
      this.status(`RECORDING ERROR: ${error?.message || error}`);
    }
  },

  async stopRecording() {
    try {
      const blob = await StudioAudioExport.stop();

      this.pendingAudioExportBlob = blob;

      this.status(
        "Recording finished. Tap EXPORT AUDIO to download it."
      );
    } catch (error) {
      console.error("LAMBO CITY recording stop error:", error);
      this.status(`STOP RECORDING ERROR: ${error?.message || error}`);
    }
  },

  exportRecording() {
    try {
      if (!this.pendingAudioExportBlob) {
        this.status("Stop a recording before exporting audio.");
        return;
      }

      StudioAudioExport.download(this.pendingAudioExportBlob);

      this.pendingAudioExportBlob = null;

      this.status(
        "Audio exported successfully. Check your browser downloads."
      );
    } catch (error) {
      console.error("LAMBO CITY audio export error:", error);
      this.status(`AUDIO EXPORT ERROR: ${error?.message || error}`);
    }
  },


  createNoiseBuffer() {
    if (!this.audio) {
      throw new Error("Cannot create drum noise before audio starts.");
    }

    const length = this.audio.sampleRate;
    const buffer = this.audio.createBuffer(1, length, this.audio.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  },

  scheduleStep(step, time) {
    TRACKS.forEach(({ id }) => {
      if (this.pattern.steps[id][step]) {
        
StudioSoundKit.play(
  this.audio,
  this.soundProfile,
  id,
  time,
  this.noiseBuffer
);

      }
    });

    if (this.ui) {
      this.ui.querySelectorAll(".lc-step").forEach((button) => {
        button.classList.toggle(
          "playhead",
          Number(button.dataset.step) === step
        );
      });
    }
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.pattern));
      this.status("Beat saved in this browser.");
    } catch (error) {
      console.error("LAMBO CITY beat save error:", error);
      this.status("Save failed. Check browser storage settings.");
    }
  },

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        this.status("No saved beat found in this browser yet.");
        return;
      }

      this.pattern = normalizePattern(JSON.parse(saved));

      const bpmInput = this.ui?.querySelector("[data-bpm]");
      const bpmLabel = this.ui?.querySelector("[data-bpm-label]");

      if (bpmInput) bpmInput.value = String(this.pattern.bpm);
      if (bpmLabel) bpmLabel.textContent = `${this.pattern.bpm} BPM`;

      this.renderGrid();
      this.status("Saved beat loaded.");
    } catch (error) {
      console.error("LAMBO CITY beat load error:", error);
      this.status("Could not load the saved beat.");
    }
  },

  saveSongProject() {
  const title = window.prompt("Name this song project:");

  if (title === null) return;

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    this.status("Enter a song-project name before saving.");
    return;
  }

  try {
    const project = createSongProject({
      title: cleanTitle,
      pattern: this.pattern,
      soundProfile: this.soundProfile
    });

    saveSongProject(project);

    // Make the newly saved project active.
    this.currentProject = project;

    // Refresh the song arranger.
    this.renderArranger();

    this.status(
      `Song project "${cleanTitle}" saved and ready to arrange.`
    );
  } catch (error) {
    console.error("LAMBO CITY song-project save error:", error);

    this.status(
      `SONG PROJECT SAVE ERROR: ${error?.message || error}`
    );
  }
},
  loadSongProject() {
  try {
    const projects = listSongProjects();

    if (!projects.length) {
      this.status("No saved song projects found in this browser.");
      return;
    }

    const menu = projects
      .map((project, index) =>
        `${index + 1}. ${project.title}`
      )
      .join("\n");

    const choice = window.prompt(
      `Choose a song project by number:\n\n${menu}`
    );

    if (choice === null) return;

    const index = Number(choice) - 1;

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= projects.length
    ) {
      this.status("Invalid song-project selection.");
      return;
    }

    const project = loadSongProject(projects[index].id);

    if (!project) {
      this.status("That song project could not be found.");
      return;
    }

    const savedPattern = project.patterns?.[0];

    if (!savedPattern) {
      this.status("This project has no saved beat pattern.");
      return;
    }

    // Restore the active project and its beat.
    this.currentProject = project;
    this.pattern = normalizePattern(savedPattern);

    this.soundProfile =
      project.settings?.soundProfile === "mpc"
        ? "mpc"
        : "beatLab";

    const bpmInput = this.ui?.querySelector("[data-bpm]");
    const bpmLabel = this.ui?.querySelector("[data-bpm-label]");
    const soundSelect =
      this.ui?.querySelector("[data-sound-profile]");

    if (bpmInput) {
      bpmInput.value = String(this.pattern.bpm);
    }

    if (bpmLabel) {
      bpmLabel.textContent = `${this.pattern.bpm} BPM`;
    }

    if (soundSelect) {
      soundSelect.value = this.soundProfile;
    }

    // Refresh both the sequencer and arranger.
    this.renderGrid();
    this.renderArranger();

    this.status(
      `Song project "${project.metadata?.title || "Untitled Song"}" loaded.`
    );
  } catch (error) {
    console.error("LAMBO CITY song-project load error:", error);

    this.status(
      `SONG PROJECT LOAD ERROR: ${error?.message || error}`
    );
  }
},

 
  exportSongProject() {
    try {
      const projects = listSongProjects();

      if (!projects.length) {
        this.status("Save a song project before exporting.");
        return;
      }

      const menu = projects
        .map((project, index) => `${index + 1}. ${project.title}`)
        .join("\n");

      const choice = window.prompt(
        `EXPORT SONG PROJECT\n\n${menu}\n\nEnter a project number or exact song title:`
      );

      if (choice === null) return;

      const selection = choice.trim();

      if (!selection) {
        this.status("No song project was selected.");
        return;
      }

      let selectedProject;

      if (/^\d+$/.test(selection)) {
        const index = Number(selection) - 1;

        if (index >= 0 && index < projects.length) {
          selectedProject = projects[index];
        }
      } else {
        const matches = projects.filter(
          (project) =>
            project.title.trim().toLowerCase() ===
            selection.toLowerCase()
        );

        if (matches.length > 1) {
          this.status(
            "Multiple songs have that title. Select using its list number."
          );
          return;
        }

        if (matches.length === 1) {
          selectedProject = matches[0];
        }
      }

      if (!selectedProject) {
        this.status(
          "Song not found. Enter a listed number or exact song title."
        );
        return;
      }

      const project = loadSongProject(selectedProject.id);

      if (!project) {
        this.status("The selected song project could not be loaded.");
        return;
      }

      const packageText = exportSongProjectPackage(project);

      const blob = new Blob(
        [packageText],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const title = project.metadata?.title || "Untitled Song";

      const safeName = title
        .replace(/[^a-z0-9 _-]/gi, "")
        .trim()
        .replace(/\s+/g, "-") || "lambo-city-song";

      link.href = url;
      link.download = `${safeName}.lcp`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      this.status(
        `Exported "${title}" as a complete LAMBO CITY project.`
      );
    } catch (error) {
      console.error("LAMBO CITY project export error:", error);
      this.status(`PROJECT EXPORT ERROR: ${error?.message || error}`);
    }
  },



   importSongProject() {
    try {
      const input = document.createElement("input");

      input.type = "file";
      input.accept = ".lcp,.json,application/json";

      input.onchange = async () => {
        const file = input.files?.[0];

        if (!file) return;

        try {
          if (file.size > 1000000) {
            this.status("Project file is too large to import.");
            return;
          }

          const fileText = await file.text();

          let project;

          // NEW FORMAT: Complete LAMBO CITY .lcp project
          try {
            project = importSongProjectPackage(fileText);
          } catch (packageError) {
            // OLD FORMAT: Legacy single-pattern JSON project
            const data = JSON.parse(fileText);

            if (
              data.format !== "lambo-city-song-project" ||
              data.schemaVersion !== 1 ||
              !data.title ||
              !data.pattern?.steps
            ) {
              throw packageError;
            }

            project = createSongProject({
              title: data.title,
              pattern: data.pattern,
              soundProfile: data.soundProfile || "beatLab"
            });
          }

          // Give the imported project a fresh ID
          // so it cannot overwrite an existing saved project.
          project.id =
            `song-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

          if (project.metadata) {
            project.metadata.updatedAt = new Date().toISOString();
          }

          saveSongProject(project);

          this.currentProject = project;

                   const firstPattern = project.patterns?.[0];

          this.soundProfile =
            project.settings?.soundProfile === "mpc"
              ? "mpc"
              : "beatLab";

          if (firstPattern) {
            this.pattern = normalizePattern(firstPattern);

            const bpmInput = this.ui?.querySelector("[data-bpm]");
            const bpmLabel = this.ui?.querySelector("[data-bpm-label]");
            const soundSelect =
              this.ui?.querySelector("[data-sound-profile]");

            if (bpmInput) {
              bpmInput.value = String(this.pattern.bpm);
            }

            if (bpmLabel) {
              bpmLabel.textContent = `${this.pattern.bpm} BPM`;
            }

            if (soundSelect) {
              soundSelect.value = this.soundProfile;
            }

            this.renderGrid();
          }

          this.renderArranger();

          this.status(
            `Imported "${project.metadata?.title || "Untitled Song"}". Your project is ready.`
          );

        } catch (error) {
          console.error("LAMBO CITY project import error:", error);

          this.status(
            `PROJECT IMPORT ERROR: ${error?.message || error}`
          );
        }
      };

      input.click();

    } catch (error) {
      console.error("LAMBO CITY import setup error:", error);

      this.status(
        `IMPORT ERROR: ${error?.message || error}`
      );
    }
  },

  close() {
    this.stop();

    if (this.ui) {
      this.ui.remove();
      this.ui = null;
    }

    if (this.style) {
      this.style.remove();
      this.style = null;
    }
  },

  destroy() {
    this.close();

    if (this.handleCanvasClick && this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener(
        "click",
        this.handleCanvasClick
      );
    }

    this.handleCanvasClick = null;
    this.raycaster = null;
    this.pointer = null;
  },

  update() {}
};
