
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/*
 * LAMBO CITY RECORDS
 * FLOOR 2 — STUDIO NAVIGATION V1
 *
 * Coordinates navigation for existing Floor 2 stations.
 * Does not replace the piano, drum, or Beat Lab systems.
 *
 * This first version opens a station information panel.
 * Actual recording, mixing, mastering, and archive workspaces
 * will be connected in later milestones.
 */

export default {
  init(scene, context) {
    this.scene = scene;
    this.camera = context?.camera;
    this.renderer = context?.renderer;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.panel = null;

    const studio = scene?.getObjectByName(
      "recordsHQFloor2Studio"
    );

    if (!studio || !this.camera || !this.renderer?.domElement) {
      console.warn(
        "LAMBO CITY Studio Navigation: Floor 2 or camera unavailable."
      );
      return;
    }

    const stations = studio.userData?.studioStations;

    if (!stations) {
      console.warn(
        "LAMBO CITY Studio Navigation: station registry unavailable."
      );
      return;
    }

    this.targets = [
      {
        object: stations.vocalBooth,
        title: "VOCAL RECORDING",
        description:
          "Vocal recording workspace. Microphone input and multitrack recording integration are planned for this station."
      },
      {
        object: stations.recordingEditing,
        title: "RECORDING & EDITING",
        description:
          "Recording and editing workspace. This station will connect to the shared LAMBO CITY Studio project."
      },
      {
        object: stations.controlRoom,
        title: "MIXING CONSOLE",
        description:
          "Main mixing workspace. Track levels, effects, and mixing controls will connect here."
      },
      {
        object: stations.mastering,
        title: "MASTERING",
        description:
          "Mastering workspace. Final song processing and export controls will connect here."
      },
      {
        object: stations.songArchive,
        title: "SONG ARCHIVE",
        description:
          "Your saved LAMBO CITY song projects will be accessible here."
      },
      {
        object: stations.mobileStudio,
        title: "MOBILE STUDIO",
        description:
          "A compact workspace for creating and recording through your device."
      }
    ].filter(item => item.object);

    this.handleClick = event => {
      // Do not intercept clicks while another Studio interface is open.
      if (document.getElementById("lambo-city-beat-lab")) return;
      if (this.panel) return;

      const rect = this.renderer.domElement.getBoundingClientRect();

      if (!rect.width || !rect.height) return;

      this.pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

      this.pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(
        this.pointer,
        this.camera
      );

      for (const station of this.targets) {
        const hits = this.raycaster.intersectObject(
          station.object,
          true
        );

        if (hits.length) {
          this.openPanel(station);
          return;
        }
      }
    };

    this.renderer.domElement.addEventListener(
      "click",
      this.handleClick
    );

    console.info(
      "LAMBO CITY Floor 2 Navigation V1 ready:",
      this.targets.map(item => item.title)
    );
  },

  openPanel(station) {
    if (this.panel) return;

    const panel = document.createElement("div");

    panel.id = "lambo-city-studio-navigation";

    panel.style.cssText = `
      position:fixed;
      inset:0;
      z-index:10001;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      box-sizing:border-box;
      background:rgba(0,0,0,0.82);
      color:#f5f4f0;
      font-family:Arial,sans-serif;
    `;

    panel.innerHTML = `
      <section style="
        width:min(100%,560px);
        padding:28px;
        box-sizing:border-box;
        background:linear-gradient(145deg,#171923,#08090d);
        border:1px solid #b18a4a;
        border-radius:14px;
        box-shadow:0 20px 70px rgba(0,0,0,.55);
      ">
        <div style="
          color:#e6bb69;
          font-size:11px;
          letter-spacing:3px;
        ">
          LAMBO CITY RECORDS
        </div>

        <h2 style="
          margin:12px 0;
          font-size:clamp(22px,5vw,30px);
        ">
          ${station.title}
        </h2>

        <p style="
          color:#c3c3ca;
          line-height:1.65;
          font-size:14px;
        ">
          ${station.description}
        </p>

        <p style="
          color:#e6bb69;
          font-size:12px;
          line-height:1.5;
        ">
          WORKSPACE CONNECTION: NEXT DEVELOPMENT MILESTONE
        </p>

        <button type="button" data-close-studio style="
          width:100%;
          padding:14px;
          margin-top:12px;
          border:1px solid #e6bb69;
          border-radius:8px;
          background:#171923;
          color:#f5f4f0;
          font-weight:bold;
          cursor:pointer;
        ">
          RETURN TO STUDIO
        </button>
      </section>
    `;

    panel.addEventListener("click", event => {
      if (
        event.target === panel ||
        event.target.closest("[data-close-studio]")
      ) {
        this.closePanel();
      }
    });

    document.body.appendChild(panel);
    this.panel = panel;
  },

  closePanel() {
    if (!this.panel) return;

    this.panel.remove();
    this.panel = null;
  },

  destroy() {
    this.closePanel();

    if (this.handleClick && this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener(
        "click",
        this.handleClick
      );
    }

    this.handleClick = null;
    this.targets = [];
  },

  update() {}
};
