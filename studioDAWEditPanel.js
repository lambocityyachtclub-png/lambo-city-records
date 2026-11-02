
/*
 * LAMBO CITY RECORDS
 * DAW EDIT PANEL BRIDGE — V1
 *
 * Moves the EXISTING multitrack workspace
 * into the modular DAW EDIT tab.
 *
 * Does not create another track system.
 * Does not create another recording engine.
 */

export function createStudioDAWEditPanel({
  beatLab
} = {}) {
  if (!beatLab) {
    throw new Error(
      "LAMBO CITY DAW: Beat Lab instance is required."
    );
  }

  return {
    root: null,

    mount() {
      if (this.root?.isConnected) {
        return this.root;
      }

      const multitrack =
        beatLab.ui?.querySelector(
          "#lc-multitrack-workspace"
        );

      if (!multitrack) {
        throw new Error(
          "LAMBO CITY DAW: existing Multitrack Workspace was not found."
        );
      }

      const root = document.createElement("section");

      root.id = "lc-daw-edit-panel";

      root.style.cssText = `
        width:100%;
        min-height:100%;
        box-sizing:border-box;
      `;

      // Move the original multitrack workspace.
      // Keep its existing tracks and recording data.
      root.appendChild(multitrack);

      this.root = root;

      return root;
    },

    destroy() {
      if (this.root) {
        this.root.remove();
      }

      this.root = null;
    }
  };
}

export default createStudioDAWEditPanel;
