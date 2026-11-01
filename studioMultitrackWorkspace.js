
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

const TRACK_TYPES = [
  "audio",
  "midi",
  "instrument"
];

const StudioMultitrackWorkspace = {

  tracks: [],
  nextTrackId: 1,
  root: null,

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
          margin: 28px 0;
          padding: 20px;
          background: #101219;
          color: #f5f4f0;
          border: 1px solid #665438;
          border-radius: 16px;
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
          margin: 12px 0;
          padding: 13px;
          background: #191d27;
          border: 1px solid #343946;
          border-radius: 10px;
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
          min-height: 32px;
          padding: 5px 9px;
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
          display: flex;
          gap: 8px;
          min-height: 75px;
          overflow-x: auto;
          padding: 9px;
          background:
            repeating-linear-gradient(
              90deg,
              #343946 0,
              #343946 1px,
              transparent 1px,
              transparent 25%
            ),
            #10131a;
          border: 1px solid #343946;
          border-radius: 7px;
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
        LAMBO CITY RECORDS · RECORDING ENGINE V1
      </div>

      <h2>MULTITRACK WORKSPACE</h2>

      <p style="color:#a8a8b1;font-size:13px">
        Professional production. Expandable tracks.
        One LAMBO CITY recording environment.
      </p>

      <div class="lc-toolbar">
        <button type="button" data-action="add-clip">
          + ADD CLIP
        </button>
      </div>

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
        this.render();
        this.status(`${track.name} mute ${track.muted ? "on" : "off"}.`);
      }

      if (control === "solo") {
        track.solo = !track.solo;
        this.render();
        this.status(`${track.name} solo ${track.solo ? "on" : "off"}.`);
      }

      if (control === "arm") {
        track.armed = !track.armed;
        this.render();
        this.status(`${track.name} record arm ${track.armed ? "on" : "off"}.`);
      }

      if (control === "clip") {
        this.addClip(id);
      }
    });

    root.addEventListener("input", event => {
      if (!event.target.matches("[data-volume]")) return;

      const row = event.target.closest("[data-track-id]");
      const track = this.tracks.find(
        item => item.id === row?.dataset.trackId
      );

      if (!track) return;

      track.volume = Number(event.target.value);

      row.querySelector("[data-volume-label]").textContent =
        `${track.volume}%`;
    });

    this.render();

    return root;
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
    if (!take?.id || !take.beat || !take.vocal || !take.mix) {
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

    recordings.forEach((recording) => {
      let track = this.tracks.find(
        item => item.name === recording.trackName
      );

      if (!track) {
        track = this.createTrack("audio", recording.trackName);
      }

      track.clips.push({
        id: `${take.id}-${recording.trackName.toLowerCase().replace(/\s+/g, "-")}`,
        name: recording.clipName,
        blob: recording.blob,
        takeId: take.id,
        createdAt: new Date().toISOString()
      });
    });

    this.render();

    this.status("Recording added to Vocals, Beats, and Master Mix tracks.");
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
        ["clip", "+ CLIP", false],
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

      const timeline = document.createElement("div");
      timeline.className = "lc-timeline";

      if (track.clips.length === 0) {
        const empty = document.createElement("span");
        empty.className = "lc-empty";
        empty.textContent = "Empty timeline";
        timeline.appendChild(empty);
      }

      track.clips.forEach(clip => {
        const block = document.createElement("div");
        block.className = "lc-clip";
        block.textContent = clip.name;
        timeline.appendChild(block);
      });

      row.append(header, volume, timeline);
      list.appendChild(row);
    });
  },

  status(message) {
    const element = this.root?.querySelector("[data-status]");

    if (element) element.textContent = message;
  }
};

export default StudioMultitrackWorkspace;
