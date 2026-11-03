
/*
 * LAMBO CITY RECORDS
 * DAW BEAT LAB PANEL BRIDGE — V1
 *
 * Mounts the EXISTING Floor 2 Beat Lab inside
 * the modular DAW workspace.
 *
 * Does NOT create:
 * - A second sequencer
 * - A second audio engine
 * - A second sound kit
 * - A second song-project system
 *
 * The existing Floor 2 Beat Lab remains the
 * owner of playback, recording and project data.
 */

export function createStudioDAWBeatLabPanel({
  beatLab
} = {}) {
  if (!beatLab) {
    throw new Error(
      "LAMBO CITY DAW: existing Beat Lab instance is required."
    );
  }

  return {
    root: null,
    container: null,
    mounted: false,
    handleClose: null,
    onSwitchToEdit: null,

    mount(container) {
      if (!container) {
        throw new Error(
          "LAMBO CITY DAW: Beat Lab panel container is required."
        );
      }

      if (this.mounted && this.root?.isConnected) {
        container.appendChild(this.root);
        this.container = container;
        return this.root;
      }

      // Open the existing Beat Lab.
      // Its original sequencer and controls are preserved.
      beatLab.open();

      const existingUI = beatLab.ui;

      if (!existingUI) {
        throw new Error(
          "LAMBO CITY DAW: existing Beat Lab interface did not open."
        );
      }

      // Create the panel host.
      const host = document.createElement("section");

      host.id = "lc-daw-beat-lab-panel";

      host.style.cssText = `
        width:100%;
        min-height:100%;
        box-sizing:border-box;
      `;

      const switchBar = document.createElement("div");
      switchBar.style.cssText = "display:flex;gap:9px;flex-wrap:wrap;margin:0 0 12px";
      const returnButton = document.createElement("button");
      returnButton.type = "button";
      returnButton.textContent = "← RETURN TO MPC";
      returnButton.style.cssText = "min-height:42px;padding:10px 14px;border:1px solid #665438;border-radius:8px;background:#171923;color:#f1d49c;font-weight:bold;touch-action:manipulation";
      returnButton.addEventListener("click", () => this.onReturn?.());
      const editorButton = document.createElement("button");
      editorButton.type = "button";
      editorButton.textContent = "SONG EDITOR →";
      editorButton.setAttribute("aria-label", "Switch to Song Editor");
      editorButton.style.cssText = "min-height:42px;padding:10px 14px;border:1px solid #9b7948;border-radius:8px;background:#211d16;color:#f1d49c;font-weight:bold;touch-action:manipulation";
      editorButton.addEventListener("click", () => this.onSwitchToEdit?.());
      switchBar.append(returnButton, editorButton);
      host.appendChild(switchBar);

      // Move the existing interface into the Digital Beat Lab view.
      // Keep the sequencer and transport, hide unrelated recording,
      // vocal-effects and song-arranger sections from this focused view.
      host.appendChild(existingUI);

      existingUI.querySelector(".lc-arranger")?.style.setProperty("display", "none");
      existingUI.querySelectorAll(".lc-actions").forEach(node => {
        node.style.display = "none";
      });

      // Convert the old full-screen overlay into
      // a responsive embedded workspace panel.
      existingUI.style.position = "relative";
      existingUI.style.inset = "auto";
      existingUI.style.zIndex = "auto";
      existingUI.style.width = "100%";
      existingUI.style.minHeight = "100%";
      existingUI.style.height = "auto";
      existingUI.style.padding = "12px";
      existingUI.style.overflow = "visible";
      existingUI.style.boxSizing = "border-box";

      // The existing CLOSE control returns to the
      // normal Floor 2 experience through beatLab.close().
      this.handleClose = (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const closeButton = target.closest(
          '[data-action="close"]'
        );

        if (!closeButton) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        this.unmount({
          closeBeatLab: true
        });
      };

      existingUI.addEventListener(
        "click",
        this.handleClose,
        true
      );

      container.appendChild(host);

      this.root = host;
      this.container = container;
      this.mounted = true;

      return host;
    },

    unmount({
      closeBeatLab = false
    } = {}) {
      if (this.root) {
        const existingUI = beatLab.ui;

        if (existingUI && this.handleClose) {
          existingUI.removeEventListener(
            "click",
            this.handleClose,
            true
          );
        }

        // Close through the original application
        // so its playback and keyboard cleanup run.
        if (closeBeatLab && beatLab.ui) {
          beatLab.close();
        } else if (existingUI) {
          // Restore the original full-screen positioning
          // if the panel is detached without closing.
          existingUI.style.position = "fixed";
          existingUI.style.inset = "0";
          existingUI.style.zIndex = "10000";
          existingUI.style.width = "";
          existingUI.style.minHeight = "";
          existingUI.style.height = "";
          existingUI.style.padding = "";
          existingUI.style.overflow = "auto";
        }

        this.root.remove();
      }

      this.root = null;
      this.container = null;
      this.handleClose = null;
      this.mounted = false;
    },

    destroy() {
      this.unmount({
        closeBeatLab: true
      });
    }
  };
}

export default createStudioDAWBeatLabPanel;

