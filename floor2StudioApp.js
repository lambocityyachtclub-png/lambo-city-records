
import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

// LAMBO CITY RECORDS
// FLOOR 2 — STUDIO STATION CONTROLLER V2
// Preserves the existing studio and audio systems.

export default {
  init(scene, context) {
    this.scene = scene;
    this.context = context;
    this.camera = context?.camera;
    this.renderer = context?.renderer;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.panel = null;
    this.activeStation = null;

    const studio = scene?.getObjectByName(
      "recordsHQFloor2Studio"
    );

    if (!studio || !this.camera || !this.renderer) {
      console.warn("Floor 2 navigation unavailable.");
      return;
    }

    const stations = studio.userData?.studioStations;

    this.targets = [
      {
        id: "beatLab",
        title: "MPC / BEAT LAB",
        object: stations?.beatLab
      },
      {
        id: "piano",
        title: "PIANO",
        object: stations?.instrumentStation
      },
      {
        id: "drums",
        title: "DRUM STATION",
        object: stations?.drumStation
      },
      {
        id: "vocals",
        title: "VOCAL RECORDING",
        object: stations?.vocalBooth
      },
      {
        id: "mixing",
        title: "MIX CONTROL",
        object: stations?.controlRoom
      }
    ].filter(item => item.object);

    this.createController();

    this.handleClick = event => {
      if (this.panel) return;

      if (
        document.getElementById("lambo-city-beat-lab")
      ) return;

      const rect =
        this.renderer.domElement.getBoundingClientRect();

      if (!rect.width || !rect.height) return;

      this.pointer.x =
        ((event.clientX - rect.left) /
          rect.width) * 2 - 1;

      this.pointer.y =
        -((event.clientY - rect.top) /
          rect.height) * 2 + 1;

      this.raycaster.setFromCamera(
        this.pointer,
        this.camera
      );

      for (const station of this.targets) {
        const hits =
          this.raycaster.intersectObject(
            station.object,
            true
          );

        if (hits.length) {
          this.selectStation(station.id);
          return;
        }
      }
    };

    this.renderer.domElement.addEventListener(
      "click",
      this.handleClick
    );

    console.info(
      "LAMBO CITY Station Controller V2 ready."
    );
  },

  createController() {
    const root = document.createElement("div");

    root.id = "lambo-city-station-controller";

    root.style.cssText = `
      position:fixed;
      top:14px;
      left:50%;
      transform:translateX(-50%);
      z-index:9000;
      width:min(94%,680px);
      padding:12px;
      box-sizing:border-box;
      background:rgba(8,10,16,.94);
      border:1px solid #b18a4a;
      border-radius:12px;
      color:#fff;
      font-family:Arial,sans-serif;
      display:none;
    `;

    root.innerHTML = `
      <div style="
        color:#e6bb69;
        font-size:11px;
        letter-spacing:3px;
        margin-bottom:10px;
        text-align:center;
      ">
        LAMBO CITY RECORDS
      </div>

      <div style="
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:7px;
      ">
        ${[
          ["beatLab","MPC"],
          ["piano","PIANO"],
          ["drums","DRUMS"],
          ["vocals","VOCALS"],
          ["mixing","MIX"],
          ["freeRoam","FREE ROAM"]
        ].map(([id,label]) => `
          <button
            type="button"
            data-station="${id}"
            style="
              min-height:46px;
              background:#171923;
              color:#f5f4f0;
              border:1px solid #b18a4a;
              border-radius:7px;
              font-weight:bold;
              font-size:11px;
              cursor:pointer;
              touch-action:manipulation;
            "
          >${label}</button>
        `).join("")}
      </div>

      <div
        data-station-status
        style="
          color:#e6bb69;
          text-align:center;
          font-size:11px;
          margin-top:12px;
        "
      >
        SELECT A STUDIO STATION
      </div>
    `;

    root.addEventListener("click", event => {
      const button =
        event.target.closest("[data-station]");

      if (!button) return;

      this.selectStation(button.dataset.station);
    });

    document.body.appendChild(root);

    this.panel = root;
  },

  selectStation(id) {
    if (id === "freeRoam") {
      this.panel.style.display = "none";
      this.activeStation = null;

      const beatLab =
        this.context.systems.floor2StudioApp;

      if (beatLab?.ui) {
        beatLab.close();
      }

      return;
    }

    this.activeStation = id;

    const status =
      this.panel.querySelector("[data-station-status]");

    const beatLab =
      this.context.systems.floor2StudioApp;

    switch (id) {
      case "beatLab":
        status.textContent = "OPENING MPC / BEAT LAB";

        this.panel.style.display = "none";

        beatLab?.open();

        break;

      case "piano":
        status.textContent =
          "PIANO SELECTED — TAP THE PIANO KEYS";

        break;

      case "drums":
        status.textContent =
          "DRUMS SELECTED — TAP THE DRUM KIT";

        break;

      case "vocals":
        status.textContent =
          "VOCAL BOOTH SELECTED — RECORDING CONNECTION PENDING";

        break;

      case "mixing":
        status.textContent =
          "MIX CONTROL SELECTED — MIXER INTEGRATION PENDING";

        break;
    }
  },

  destroy() {
    if (this.handleClick && this.renderer) {
      this.renderer.domElement.removeEventListener(
        "click",
        this.handleClick
      );
    }

    this.panel?.remove();

    this.panel = null;
    this.handleClick = null;
    this.targets = [];
  },

  update() {}
};
