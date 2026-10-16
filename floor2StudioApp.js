
import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";
import StudioAudioEngine from
  "./studioAudioEngine.js";
import StudioSoundKit from "./studioSoundKit.js";
// LAMBO CITY RECORDS — FLOOR TWO STUDIO APP
// V1: Interactive 16-step Beat Lab.
// Uses the shared studio audio engine.

const STORAGE_KEY = "lambocity-floor2-beatlab-v1";

const TRACKS = [
  { id: "kick", label: "KICK" },
  { id: "snare", label: "SNARE" },
  { id: "hat", label: "HI-HAT" }
];

function makeDefaultPattern() {
  return {
    bpm: 100,
    steps: {
      kick: Array.from({ length: 16 }, (_, i) =>
        [0, 8].includes(i)
      ),
      snare: Array.from({ length: 16 }, (_, i) =>
        [4, 12].includes(i)
      ),
      hat: Array.from({ length: 16 }, (_, i) =>
        i % 2 === 0
      )
    }
  };
}

export default {
  init(scene, context) {
    this.scene = scene;
    this.camera = context?.camera;
    this.renderer = context?.renderer;
    this.pattern = makeDefaultPattern();
    this.soundProfile = "beatLab";
    this.audio = null;
    this.noiseBuffer = null;
    this.timer = null;
    this.playing = false;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.ui = null;
    this.style = null;

    if (!this.camera || !this.renderer) {
      console.warn(
        "LAMBO CITY Beat Lab: camera or renderer unavailable."
      );
      return;
    }

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.handleCanvasClick = (event) => {
      if (this.ui) return;

      const studio =
        this.scene.getObjectByName(
          "recordsHQFloor2Studio"
        );

      const beatLab =
        studio?.getObjectByName("floor2BeatLab");

      if (!beatLab) return;

      const rect =
        this.renderer.domElement.getBoundingClientRect();

      this.pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

      this.pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(
        this.pointer,
        this.camera
      );

      const hits =
        this.raycaster.intersectObject(beatLab, true);

      if (!hits.length) return;

      let object = hits[0].object;

      while (object && object !== studio) {
        if (
          object.userData?.studioStation === "beatLab"
        ) {
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
            <div style="color:#e6bb69;font-size:11px;
              letter-spacing:3px">LAMBO CITY RECORDS</div>
            <h1 style="font-size:clamp(23px,5vw,36px);
              margin:8px 0 4px">BEAT LAB</h1>
            <div style="color:#a8a8b1;font-size:13px">
              STUDIO SESSION 001 · 16-STEP SEQUENCER
            </div>
          </div>
          <button data-action="close" class="lc-action"
            style="font-size:15px">CLOSE ✕</button>
        </header>

        <section style="display:flex;gap:12px;align-items:center;
          flex-wrap:wrap;padding:20px 0">
          <button data-action="play" class="lc-action">
            ▶ PLAY
          </button>
          <button data-action="stop" class="lc-action">
            ■ STOP
          </button>
          <label style="display:flex;align-items:center;
            gap:10px;flex-wrap:wrap">
            <span style="color:#e6bb69;font-size:12px;
              letter-spacing:1px">TEMPO</span>
            <input data-bpm type="range" min="60" max="180"
              value="${this.pattern.bpm}" style="width:145px">
            <strong data-bpm-label>${this.pattern.bpm} BPM</strong>
          </label>
        </section>

        <section style="border:1px solid #34333a;border-radius:16px;
          padding:clamp(10px,2vw,20px);background:#11131a">
          <div style="display:flex;justify-content:space-between;
            gap:10px;flex-wrap:wrap;margin-bottom:16px">
            <strong>STEP SEQUENCER</strong>
            <span style="font-size:12px;color:#a8a8b1">
              Tap a square to toggle a beat
            </span>
          </div>
          <div data-grid></div>
          <div style="font-size:12px;color:#a8a8b1;margin-top:15px">
            Start with the kick, add the snare, then shape the hi-hats.
          </div>
        </section>

        <section style="display:flex;gap:10px;flex-wrap:wrap;
          padding:18px 0">
          <button data-action="save" class="lc-action">
            SAVE BEAT
          </button>
          <button data-action="load" class="lc-action">
            LOAD BEAT
          </button>
          <button data-action="clear" class="lc-action">
            CLEAR PATTERN
          </button>
        </section>

        <div data-status role="status" aria-live="polite"
          style="color:#e6bb69;min-height:24px;font-size:13px">
          Your studio is ready.
        </div>

        <footer style="margin-top:20px;padding-top:14px;
          border-top:1px solid #34333a;color:#888995;font-size:12px">
          LAMBO CITY DIGITAL STUDIO · V1
          <br>Browser-generated drum sounds. Save stores this beat
          in this browser on this device.
        </footer>
      </div>
    `;

    const style = document.createElement("style");

    style.textContent = `
      #lambo-city-beat-lab * { box-sizing:border-box; }
      #lambo-city-beat-lab .lc-action {
        background:#1b1d25;color:#f5f4f0;
        border:1px solid #5a4b31;border-radius:10px;
        padding:12px 15px;min-height:44px;
        font-weight:700;letter-spacing:.5px;
        cursor:pointer;touch-action:manipulation;
      }
      #lambo-city-beat-lab .lc-action:active {
        background:#40301a;
      }
      #lambo-city-beat-lab .lc-track {
        display:grid;
        grid-template-columns:66px repeat(16,minmax(12px,1fr));
        gap:clamp(2px,.65vw,6px);
        align-items:center;margin:13px 0;
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
      #lambo-city-beat-lab .lc-step.beat {
        outline:1px solid #777b88;
      }
      #lambo-city-beat-lab .lc-step.playhead {
        box-shadow:0 0 0 2px #f5f4f0;
      }
      @media(max-width:540px) {
        #lambo-city-beat-lab .lc-track {
          grid-template-columns:48px repeat(16,minmax(0,1fr));
          gap:2px;
        }
        #lambo-city-beat-lab .lc-track-label {
          font-size:8px;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(root);

    this.ui = root;
    this.style = style;

    this.renderGrid();

    root.addEventListener("click", (event) => {
      const stepButton =
        event.target.closest(".lc-step");

      if (stepButton) {
        const track = stepButton.dataset.track;
        const step = Number(stepButton.dataset.step);

        this.pattern.steps[track][step] =
          !this.pattern.steps[track][step];

        stepButton.classList.toggle(
          "on",
          this.pattern.steps[track][step]
        );

        stepButton.setAttribute(
          "aria-pressed",
          String(this.pattern.steps[track][step])
        );

        this.status("Pattern updated.");
        return;
      }

      const button =
        event.target.closest("[data-action]");

      if (!button) return;

      switch (button.dataset.action) {
        case "close":
          this.close();
          break;

        case "play":
          this.start();
          break;

        case "stop":
          this.stop();
          break;

        case "save":
          this.save();
          break;

        case "load":
          this.load();
          break;

        case "clear":
          this.stop();

          TRACKS.forEach(({ id }) =>
            this.pattern.steps[id].fill(false)
          );

          this.renderGrid();
          this.status("Pattern cleared.");
          break;
      }
    });

    root.querySelector("[data-bpm]").addEventListener(
      "input",
      (event) => {
        this.pattern.bpm = Number(event.target.value);

        root.querySelector(
          "[data-bpm-label]"
        ).textContent = `${this.pattern.bpm} BPM`;
      }
    );
  },

  renderGrid() {
    if (!this.ui) return;

    const grid = this.ui.querySelector("[data-grid]");

    grid.innerHTML = TRACKS.map(({ id, label }) => `
      <div class="lc-track">
        <div class="lc-track-label">${label}</div>
        ${Array.from({ length: 16 }, (_, step) => `
          <button type="button"
            class="lc-step
              ${this.pattern.steps[id][step] ? "on" : ""}
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
    if (this.ui) {
      const statusElement =
        this.ui.querySelector("[data-status]");

      if (statusElement) {
        statusElement.textContent = message;
      }
    }
  },

  // START: initialize and resume the verified shared audio engine.
  async start() {
    this.status("Starting shared studio audio...");

    try {
      // This creates the shared context if needed and resumes it.
      this.audio = await StudioAudioEngine.resume();

      if (!this.audio) {
        throw new Error(
          "The shared studio audio context was not created."
        );
      }

      if (this.audio.state !== "running") {
        this.status(
          `Audio is not running: ${this.audio.state}`
        );
        return;
      }

      if (!this.noiseBuffer) {
        this.noiseBuffer = this.createNoiseBuffer();
      }

      if (this.playing) {
        this.status("Beat already playing.");
        return;
      }

      this.playing = true;
      this.currentStep = 0;
      this.nextStepTime = this.audio.currentTime + 0.05;

      this.status(
        "Beat playing — shared audio engine running."
      );

      this.timer = window.setInterval(() => {
        if (!this.playing || !this.audio) return;

        try {
          // Schedule a short distance ahead for steady timing.
          while (
            this.nextStepTime <
            this.audio.currentTime + 0.1
          ) {
            this.scheduleStep(
              this.currentStep,
              this.nextStepTime
            );

            this.currentStep =
              (this.currentStep + 1) % 16;

            this.nextStepTime +=
              60 / this.pattern.bpm / 4;
          }
        } catch (error) {
          this.playing = false;

          if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
          }

          console.error(
            "LAMBO CITY sequencer error:",
            error
          );

          this.status(
            `SEQUENCER ERROR: ${error?.message || error}`
          );
        }
      }, 25);
    } catch (error) {
      this.playing = false;

      if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }

      console.error(
        "LAMBO CITY shared audio error:",
        error
      );

      this.status(
        `AUDIO ERROR: ${error?.message || error}`
      );
    }
  },

  stop() {
    this.playing = false;

    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.ui) {
      this.ui.querySelectorAll(".lc-step").forEach(
        (button) => button.classList.remove("playhead")
      );
    }

    this.status("Playback stopped.");
  },

  createNoiseBuffer() {
    const length = this.audio.sampleRate;

    const buffer = this.audio.createBuffer(
      1,
      length,
      this.audio.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  },

  scheduleStep(step, time) {
    TRACKS.forEach(({ id }) => {
      if (!this.pattern.steps[id][step]) return;

      if (id === "kick") this.playKick(time);
      if (id === "snare") this.playSnare(time);
      if (id === "hat") this.playHat(time);
    });

    if (this.ui) {
      this.ui.querySelectorAll(".lc-step").forEach(
        (button) => {
          button.classList.toggle(
            "playhead",
            Number(button.dataset.step) === step
          );
        }
      );
    }
  },

  playKick(time) {
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();

    osc.type = "sine";

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(
      45,
      time + 0.14
    );

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + 0.18
    );

    osc.connect(gain);

    // Route kick through its verified shared mixer channel.
    gain.connect(
      StudioAudioEngine.getTrackGain("kick")
    );

    osc.start(time);
    osc.stop(time + 0.19);
  },

  playSnare(time) {
    const noise = this.audio.createBufferSource();
    const filter = this.audio.createBiquadFilter();
    const gain = this.audio.createGain();

    noise.buffer = this.noiseBuffer;

    filter.type = "highpass";
    filter.frequency.value = 1400;

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + 0.16
    );

    noise.connect(filter);
    filter.connect(gain);

    // Route snare through its verified shared mixer channel.
    gain.connect(
      StudioAudioEngine.getTrackGain("snare")
    );

    noise.start(time);
    noise.stop(time + 0.17);
  },

  playHat(time) {
    const noise = this.audio.createBufferSource();
    const filter = this.audio.createBiquadFilter();
    const gain = this.audio.createGain();

    noise.buffer = this.noiseBuffer;

    filter.type = "highpass";
    filter.frequency.value = 7000;

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + 0.045
    );

    noise.connect(filter);
    filter.connect(gain);

    // Route hi-hat through its verified shared mixer channel.
    gain.connect(
      StudioAudioEngine.getTrackGain("hat")
    );

    noise.start(time);
    noise.stop(time + 0.05);
  },

  save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.pattern)
      );

      this.status("Beat saved in this browser.");
    } catch (error) {
      this.status(
        "Save failed. Check browser storage settings."
      );
    }
  },

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        this.status(
          "No saved beat found in this browser yet."
        );
        return;
      }

      const data = JSON.parse(saved);

      if (
        !Number.isFinite(data.bpm) ||
        !data.steps ||
        !TRACKS.every(({ id }) =>
          Array.isArray(data.steps[id]) &&
          data.steps[id].length === 16
        )
      ) {
        throw new Error("Invalid beat format");
      }

      this.pattern = {
        bpm: Math.max(60, Math.min(180, data.bpm)),
        steps: Object.fromEntries(
          TRACKS.map(({ id }) => [
            id,
            data.steps[id].map(Boolean)
          ])
        )
      };

      this.ui.querySelector("[data-bpm]").value =
        this.pattern.bpm;

      this.ui.querySelector(
        "[data-bpm-label]"
      ).textContent = `${this.pattern.bpm} BPM`;

      this.renderGrid();
      this.status("Saved beat loaded.");
    } catch (error) {
      console.error(
        "LAMBO CITY beat load error:",
        error
      );

      this.status("Could not load the saved beat.");
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

  update() {}
};
