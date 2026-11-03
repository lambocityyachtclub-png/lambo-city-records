
/*
 * LAMBO CITY RECORDS
 * PROFESSIONAL MULTITRACK WORKSPACE V1
 *
 * Dynamic track architecture.
 * No fixed four-track limit.
 * Separate from the existing Beat Lab.
 *
 * Audio recording and MIDI processing
 * will be connected in the next milestone.
 */
import {
  renderStudioDAWTimeline
} from "./studioDAWTimeline.js";

import StudioAudioEngine from "./studioAudioEngine.js";

import {
  createStudioDAWArrangementPlayback
} from "./studioDAWArrangementPlayback.js";
const MAX_PORTABLE_SESSION_BYTES = 48000000;

async function encodeAudioBlob(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function decodeAudioBlob(data, mimeType = "audio/webm") {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType || "application/octet-stream" });
}

const TRACK_TYPES = [
  "audio",
  "midi",
  "instrument"
];

const StudioMultitrackWorkspace = {

  tracks: [],
  nextTrackId: 1,
  root: null,
  tempo: 100,
  arrangementPlayback: null,

  setTempo(value) {
    const bpm = Number(value);

    if (!Number.isFinite(bpm)) return;

    this.tempo = Math.max(60, Math.min(180, bpm));
  },

  getArrangementPlayback() {
    if (!this.arrangementPlayback) {
      this.arrangementPlayback =
        createStudioDAWArrangementPlayback({
          getAudioContext: () =>
            StudioAudioEngine.resume(),

          getOutput: context =>
            StudioAudioEngine.master ||
            context.destination,

          getTempo: () => this.tempo,

          onStatus: message =>
            this.status(message)
        });
    }

    return this.arrangementPlayback;
  },

  createTrack(type = "audio", name = "") {
    
    if (!TRACK_TYPES.includes(type)) {
      throw new Error("Unsupported track type.");
    }

    const id = `lc-track-${this.nextTrackId++}`;

    const track = {
      id,
      name: name.trim() || `Track ${this.nextTrackId - 1}`,
      type,
      volume: 80,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      clips: []
    };

    this.tracks.push(track);

    return track;
  },

  addTrack(type = "audio", name = "") {
    const track = this.createTrack(type, name);
    this.render();
    this.status(`${track.name} created.`);
    return track;
  },

  async exportSession() {
    let encodedBytes = 0;
    const tracks = [];
    for (const track of this.tracks) {
      const clips = [];
      for (const clip of (track.clips || [])) {
        if (!(clip.blob instanceof Blob) || !clip.blob.size) continue;
        encodedBytes += clip.blob.size;
        if (encodedBytes > MAX_PORTABLE_SESSION_BYTES) {
          throw new Error("Session audio exceeds the 48 MB portable audio limit. Export fewer or shorter audio clips.");
        }
        clips.push({
          id: clip.id,
          name: clip.name || "Audio Clip",
          startBar: Number(clip.startBar) || 1,
          lengthBars: Number(clip.lengthBars) || 4,
          duration: Number(clip.duration) || 0,
          mimeType: clip.blob.type || "application/octet-stream",
          data: await encodeAudioBlob(clip.blob),
          takeId: clip.takeId || null,
          createdAt: clip.createdAt || null
        });
      }
      tracks.push({
        id: track.id,
        name: track.name,
        type: TRACK_TYPES.includes(track.type) ? track.type : "audio",
        volume: Math.max(0, Math.min(100, Number(track.volume) || 0)),
        pan: Math.max(-1, Math.min(1, Number(track.pan) || 0)),
        muted: Boolean(track.muted),
        solo: Boolean(track.solo),
        armed: Boolean(track.armed),
        clips
      });
    }
    return {
      format: "lambo-city-daw-session",
      version: 1,
      tempo: this.tempo,
      tracks
    };
  },

  importSession(session) {
    if (!session || session.format !== "lambo-city-daw-session" ||
        session.version !== 1 || !Array.isArray(session.tracks)) {
      throw new Error("The portable DAW session is invalid.");
    }
    this.stopAll();
    this.tempo = Math.max(60, Math.min(180, Number(session.tempo) || 100));
    this.tracks = session.tracks.map((savedTrack, index) => ({
      id: savedTrack.id || `lc-track-import-${index + 1}`,
      name: String(savedTrack.name || `Track ${index + 1}`),
      type: TRACK_TYPES.includes(savedTrack.type) ? savedTrack.type : "audio",
      volume: Math.max(0, Math.min(100, Number(savedTrack.volume) || 0)),
      pan: Math.max(-1, Math.min(1, Number(savedTrack.pan) || 0)),
      muted: Boolean(savedTrack.muted),
      solo: Boolean(savedTrack.solo),
      armed: Boolean(savedTrack.armed),
      clips: (savedTrack.clips || []).map(clip => ({
        id: clip.id,
        name: clip.name || "Audio Clip",
        startBar: Math.max(1, Number(clip.startBar) || 1),
        lengthBars: Math.max(1, Number(clip.lengthBars) || 4),
        duration: Number(clip.duration) || 0,
        blob: decodeAudioBlob(clip.data, clip.mimeType),
        takeId: clip.takeId || null,
        createdAt: clip.createdAt || null
      }))
    }));
    const ids = this.tracks.map(track => Number(track.id.match(/(\\d+)$/)?.[1]) || 0);
    this.nextTrackId = Math.max(0, ...ids) + 1;
    this.render();
    this.status("Portable session loaded with " + this.tracks.length + " track(s).");
    return true;
  },



  removeTrack(id) {
    const index = this.tracks.findIndex(
      track => track.id === id
    );

    if (index === -1) return;

    const track = this.tracks[index];
    this.tracks.splice(index, 1);

    this.render();
    this.status(`${track.name} deleted.`);
  },

  renameTrack(id, name) {
    const track = this.tracks.find(
      item => item.id === id
    );

    if (!track || !name.trim()) return;

    track.name = name.trim();
    this.render();
    this.status("Track renamed.");
  },

  mount(parent) {
    if (!parent) {
      throw new Error(
        "Multitrack workspace container unavailable."
      );
    }

    if (parent.querySelector("#lc-multitrack-workspace")) {
      return this.root;
    }

    // Prevent duplicate tracks if the workspace is reopened.
    if (this.tracks.length === 0) {
      this.createTrack("audio", "Vocals");
      this.createTrack("audio", "Drums");
      this.createTrack("instrument", "Instruments");
      this.createTrack("audio", "Beats");
    }

    const root = document.createElement("section");

    root.id = "lc-multitrack-workspace";

    root.innerHTML = `
      <style>
        #lc-multitrack-workspace {
          margin: 0;
          padding: 16px;
          background: linear-gradient(145deg,#11151d,#0b0e14);
          color: #f5f4f0;
          border: 1px solid #343946;
          border-radius: 12px;
          font-family: Arial, sans-serif;
        }

        #lc-multitrack-workspace * {
          box-sizing: border-box;
        }

        #lc-multitrack-workspace h2 {
          margin: 8px 0;
          font-size: 24px;
        }

        #lc-multitrack-workspace .lc-eyebrow {
          color: #e6bb69;
          font-size: 11px;
          letter-spacing: 2px;
        }

        #lc-multitrack-workspace .lc-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0;
        }

        #lc-multitrack-workspace button,
        #lc-multitrack-workspace input,
        #lc-multitrack-workspace select {
          font: inherit;
        }

        #lc-multitrack-workspace button {
          min-height: 40px;
          padding: 9px 13px;
          background: #222631;
          color: white;
          border: 1px solid #665438;
          border-radius: 8px;
          cursor: pointer;
          touch-action: manipulation;
        }

        #lc-multitrack-workspace button.active {
          background: #594321;
          border-color: #e6bb69;
        }

        #lc-multitrack-workspace .lc-add-form {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        #lc-multitrack-workspace input,
        #lc-multitrack-workspace select {
          width: 100%;
          min-width: 0;
          min-height: 42px;
          padding: 9px;
          color: white;
          background: #20242e;
          border: 1px solid #454958;
          border-radius: 7px;
        }

        #lc-multitrack-workspace .lc-track {
          margin: 10px 0;
          padding: 11px;
          background: #151a23;
          border: 1px solid #343946;
          border-radius: 9px;
        }

        #lc-multitrack-workspace .lc-track-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        #lc-multitrack-workspace .lc-track-name {
          font-size: 13px;
          font-weight: bold;
          color: #e6bb69;
        }

        #lc-multitrack-workspace .lc-track-type {
          color: #999fad;
          font-size: 10px;
          text-transform: uppercase;
        }

        #lc-multitrack-workspace .lc-track-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        #lc-multitrack-workspace .lc-track-controls button {
          min-height: 34px;
          padding: 6px 9px;
          font-size: 10px;
        }

        #lc-multitrack-workspace .lc-volume {
          display: grid;
          grid-template-columns: 65px minmax(0, 1fr) 35px;
          align-items: center;
          gap: 8px;
          margin: 12px 0;
          color: #a8a8b1;
          font-size: 11px;
        }

        #lc-multitrack-workspace .lc-volume input {
          accent-color: #e6bb69;
          padding: 0;
          min-height: 20px;
        }

       #lc-multitrack-workspace .lc-timeline {
  display: block;
  min-height: 110px;
  overflow: visible;
  padding: 0;
  background: transparent;
  border: 0;
}

        #lc-multitrack-workspace .lc-clip {
          flex: 0 0 120px;
          min-height: 55px;
          padding: 10px;
          background: #b99a62;
          color: #111;
          border-radius: 5px;
          font-size: 11px;
          font-weight: bold;
        }

        #lc-multitrack-workspace .lc-empty {
          align-self: center;
          color: #777f90;
          font-size: 11px;
        }

        #lc-multitrack-workspace .lc-status {
          margin-top: 18px;
          min-height: 22px;
          color: #e6bb69;
          font-size: 12px;
        }

        @media(max-width:600px) {
          #lc-multitrack-workspace .lc-add-form {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="lc-eyebrow">
        LAMBO CITY RECORDS · SONG EDITOR SESSION
      </div>

      <h2>SESSION TRACKS</h2>

      <p style="color:#a8a8b1;font-size:13px">
        Your recorded vocals, beats, and mix stems arranged on one shared song timeline.
      </p>

      <div class="lc-add-form">
        <input
          type="text"
          data-new-name
          placeholder="Track name (optional)"
          aria-label="New track name"
        >

        <select data-new-type aria-label="Track type">
          <option value="audio">Audio Track</option>
          <option value="midi">MIDI Track</option>
          <option value="instrument">Instrument Track</option>
        </select>

        <button type="button" data-action="add-track">
          + ADD TRACK
        </button>
        <button type="button" data-action="import-audio">
          IMPORT AUDIO
        </button>
        <input type="file" data-audio-files accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm" multiple hidden>
      </div>

      <div data-track-list></div>

      <div class="lc-status" data-status role="status">
        Workspace ready.
      </div>
    `;

    parent.appendChild(root);
    this.root = root;

    root.addEventListener("click", event => {
      const button = event.target.closest("button");

      if (!button || !root.contains(button)) return;

      const action = button.dataset.action;

      if (action === "add-track") {
        const name = root.querySelector("[data-new-name]").value;
        const type = root.querySelector("[data-new-type]").value;

        this.addTrack(type, name);

        root.querySelector("[data-new-name]").value = "";
        return;
      }

      if (action === "import-audio") {
        root.querySelector("[data-audio-files]").click();
        return;
      }

      if (action === "add-clip") {
        const firstTrack = this.tracks[0];

        if (firstTrack) {
          this.addClip(firstTrack.id);
        }

        return;
      }

      const trackRow = button.closest("[data-track-id]");
      if (!trackRow) return;

      const id = trackRow.dataset.trackId;
      const track = this.tracks.find(item => item.id === id);

      if (!track) return;

      const control = button.dataset.control;

      if (control === "delete") {
        this.removeTrack(id);
      }

      if (control === "rename") {
        const name = window.prompt(
          "Enter the new track name:",
          track.name
        );

        if (name !== null) {
          this.renameTrack(id, name);
        }
      }

      if (control === "mute") {
        track.muted = !track.muted;
        this.arrangementPlayback?.syncTrackState(this.tracks);
        this.render();
        this.status(`${track.name} mute ${track.muted ? "on" : "off"}.`);
      }

      if (control === "solo") {
        track.solo = !track.solo;
        this.arrangementPlayback?.syncTrackState(this.tracks);
        this.render();
        this.status(`${track.name} solo ${track.solo ? "on" : "off"}.`);
      }

      if (control === "arm") {
        track.armed = !track.armed;
        this.render();
        this.status(`${track.name} record arm ${track.armed ? "on" : "off"}.`);
      }

    });

    root.querySelector("[data-audio-files]").addEventListener("change", event => {
      const files = Array.from(event.target.files || []);
      if (files.length) void this.importAudioFiles(files);
      event.target.value = "";
    });

    root.addEventListener("input", event => {
      if (!event.target.matches("[data-volume], [data-pan]")) return;

      const row = event.target.closest("[data-track-id]");
      const track = this.tracks.find(
        item => item.id === row?.dataset.trackId
      );

      if (!track) return;

      if (event.target.matches("[data-volume]")) {
        track.volume = Number(event.target.value);
        row.querySelector("[data-volume-label]").textContent = `${track.volume}%`;
        this.arrangementPlayback?.setTrackVolume(track.id, track.volume);
      } else {
        track.pan = Number(event.target.value) / 100;
        const label = row.querySelector("[data-pan-label]");
        if (label) label.textContent = track.pan === 0
          ? "C"
          : (track.pan < 0 ? "L " : "R ") + Math.round(Math.abs(track.pan) * 100);
        this.arrangementPlayback?.setTrackPan(track.id, track.pan);
      }
    });

    this.render();

    return root;
  },

  async importAudioFiles(files = []) {
    const audioFiles = files.filter(file => file instanceof Blob && file.size > 0);
    if (!audioFiles.length) return;

    try {
      const context = await StudioAudioEngine.resume();
      for (const file of audioFiles) {
        const bytes = await file.arrayBuffer();
        const buffer = await context.decodeAudioData(bytes.slice(0));
        const baseName = file.name.replace(/\.[^.]+$/, "") || "Imported Audio";
        const track = this.createTrack("audio", baseName);
        const bars = Math.max(1, Math.min(32, Math.ceil(buffer.duration / (240 / this.tempo))));
        track.clips.push({
          id: track.id + "-import-1",
          name: file.name,
          blob: file,
          takeId: null,
          startBar: 1,
          lengthBars: bars,
          duration: buffer.duration,
          createdAt: new Date().toISOString()
        });
      }
      this.render();
      this.status(audioFiles.length + " audio file(s) imported into separate session track(s).");
    } catch (error) {
      this.status("AUDIO IMPORT ERROR: " + (error?.message || error));
    }
  },

   addClip(id) {
    const track = this.tracks.find(item => item.id === id);

    if (!track) return;

    track.clips.push({
      id: `${id}-clip-${track.clips.length + 1}`,
      name: `${track.name} Clip ${track.clips.length + 1}`,
      blob: null,
      takeId: null
    });

    this.render();
    this.status(`${track.name} clip added.`);
  },


  addRecordingTake(take) {
    if (
      !take?.id ||
      !take.beat ||
      !take.vocal ||
      !take.mix
    ) {
      throw new Error("The completed recording take is incomplete.");
    }

    const recordings = [
      {
        trackName: "Vocals",
        clipName: "Vocal Recording",
        blob: take.vocal
      },
      {
        trackName: "Beats",
        clipName: "Beat Lab Recording",
        blob: take.beat
      },
      {
        trackName: "Master Mix",
        clipName: "Combined Master Recording",
        blob: take.mix
      }
    ];

    recordings.forEach(recording => {
      let track = this.tracks.find(
        item => item.name === recording.trackName
      );

      if (!track) {
        track = this.createTrack("audio", recording.trackName);
      }

      const clip = {
        id: `${take.id}-${recording.trackName.toLowerCase().replace(/\s+/g, "-")}`,
        name: recording.clipName,
        blob: recording.blob,
        takeId: take.id,
        createdAt: new Date().toISOString(),
        objectUrl: null
      };

      if (clip.blob.size > 0) {
        clip.objectUrl = URL.createObjectURL(clip.blob);
      }

      track.clips.push(clip);
    });

    this.render();

    this.status(
      "Vocal, Beat Lab, and Master Mix recordings added."
    );
  },
  
  isPlaying() {
    const players = Array.from(
      this.root?.querySelectorAll("[data-track-list] audio") || []
    );

    return Boolean(this.arrangementPlayback?.playing) ||
      players.some(
        player => !player.paused && !player.ended
      );
  },

  async playAll() {
    this.stopAll();

    if (!this.tracks.some(track =>
      track.clips?.some(clip =>
        clip.blob && clip.blob.size > 0
      )
    )) {
      this.status("No recorded audio clips available.");
      return;
    }

    await this.getArrangementPlayback().play(
      this.tracks
    );
  },

  stopAll() {
    if (this.arrangementPlayback) {
      this.arrangementPlayback.stop();
    }

    const players = this.root?.querySelectorAll(
      "[data-track-list] audio"
    ) || [];

    players.forEach(player => {
      player.pause();
      player.currentTime = 0;
    });

    this.status("Multitrack playback stopped.");
  },

  togglePlayback() {
    if (this.isPlaying()) {
      this.stopAll();
    } else {
      void this.playAll();
    }
  },
  render() {
    if (!this.root) return;

    const list = this.root.querySelector("[data-track-list]");

    if (!list) return;

    list.replaceChildren();

    this.tracks.forEach(track => {
      const row = document.createElement("div");

      row.className = "lc-track";
      row.dataset.trackId = track.id;

      const header = document.createElement("div");
      header.className = "lc-track-header";

      const identity = document.createElement("div");

      const name = document.createElement("div");
      name.className = "lc-track-name";
      name.textContent = track.name;

      const type = document.createElement("div");
      type.className = "lc-track-type";
      type.textContent = `${track.type} track`;

      identity.append(name, type);

      const controls = document.createElement("div");
      controls.className = "lc-track-controls";

      [
        ["mute", "MUTE", track.muted],
        ["solo", "SOLO", track.solo],
        ["arm", "REC ARM", track.armed],
        ["rename", "RENAME", false],
        ["delete", "DELETE", false]
      ].forEach(([control, label, active]) => {
        const button = document.createElement("button");

        button.type = "button";
        button.dataset.control = control;
        button.textContent = label;

        if (active) button.classList.add("active");

        controls.appendChild(button);
      });

      header.append(identity, controls);

      const volume = document.createElement("div");
      volume.className = "lc-volume";

      const volumeName = document.createElement("span");
      volumeName.textContent = "VOLUME";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.value = String(track.volume);
      slider.dataset.volume = "";

      const volumeLabel = document.createElement("span");
      volumeLabel.dataset.volumeLabel = "";
      volumeLabel.textContent = `${track.volume}%`;

      volume.append(volumeName, slider, volumeLabel);

      const pan = document.createElement("div");
      pan.className = "lc-volume";
      const panName = document.createElement("span");
      panName.textContent = "PAN";
      const panSlider = document.createElement("input");
      panSlider.type = "range";
      panSlider.min = "-100";
      panSlider.max = "100";
      panSlider.value = String(Math.round((track.pan || 0) * 100));
      panSlider.dataset.pan = "";
      const panLabel = document.createElement("span");
      panLabel.dataset.panLabel = "";
      panLabel.textContent = !track.pan ? "C" : (track.pan < 0 ? "L " : "R ") + Math.round(Math.abs(track.pan) * 100);
      pan.append(panName, panSlider, panLabel);

     const timeline = document.createElement("div");
timeline.className = "lc-timeline";

renderStudioDAWTimeline({
  container: timeline,
  track,

  onChange: clip => {
    this.status(
      `${clip.name} moved to bar ${clip.startBar}.`
    );
  }
});
      

      row.append(header, volume, pan, timeline);
      list.appendChild(row);
    });
  },

  status(message) {
    const element = this.root?.querySelector("[data-status]");

    if (element) element.textContent = message;
  }
};

export default StudioMultitrackWorkspace;
