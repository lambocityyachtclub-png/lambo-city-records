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
import {
  createStudioDAWBeatLabPanel
} from "./studioDAWBeatLabPanel.js";

const StudioDAWApp = {
  root: null,
  workspace: null,
  beatLabPanel: null,
  panelHost: null,
  handleOverlayClick: null,

  open() {
    if (this.root?.isConnected) return this.root;

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
        initialView: "mpc"
      });

      // Create a bridge to the EXISTING Beat Lab instance.
      this.beatLabPanel = createStudioDAWBeatLabPanel({
        beatLab: Floor2StudioApp
      });

      // Mount the existing Beat Lab inside the MPC workspace.
      this.beatLabPanel.mount(this.panelHost);

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
    this.panelHost = null;
    this.handleOverlayClick = null;
  }
};

export default StudioDAWApp;
