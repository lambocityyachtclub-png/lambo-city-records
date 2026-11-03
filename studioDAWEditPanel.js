/*
 * LAMBO CITY RECORDS
 * SONG EDITOR PANEL — V2
 *
 * Dedicated recorded-audio editing workspace.
 * Reuses the existing multitrack session and clips.
 * Beat Lab remains a separate interface.
 */

export function createStudioDAWEditPanel({
  beatLab,
  onSwitchToBeatLab
} = {}) {
  if (!beatLab) {
    throw new Error("LAMBO CITY SONG EDITOR: Beat Lab session is required.");
  }

  return {
    root: null,
    onSwitchToBeatLab,

    mount() {
      if (this.root?.isConnected) return this.root;

      const multitrack = beatLab.ui?.querySelector("#lc-multitrack-workspace");
      if (!multitrack) {
        throw new Error("LAMBO CITY SONG EDITOR: shared multitrack session was not found.");
      }

      const root = document.createElement("section");
      root.id = "lc-daw-edit-panel";
      root.style.cssText = "width:100%;min-height:100%;box-sizing:border-box;display:grid;gap:14px;color:#f4f1eb";

      const header = document.createElement("header");
      header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 16px;border:1px solid #665438;border-radius:12px;background:linear-gradient(135deg,#1a1b20,#101219)";
      header.innerHTML = `
        <div>
          <div style="color:#d8b36e;font-size:10px;letter-spacing:2px">LAMBO CITY RECORDS · ARRANGEMENT</div>
          <h2 style="margin:6px 0 3px;font-size:clamp(20px,3vw,27px);letter-spacing:.5px">SONG EDITOR</h2>
          <div style="color:#a8a8b1;font-size:12px">Recorded audio · Waveform arrangement · Multitrack session</div>
        </div>
        <button type="button" data-switch-beatlab aria-label="Switch to Digital Beat Lab" style="min-height:46px;padding:10px 15px;border:1px solid #9b7948;border-radius:8px;background:#211d16;color:#f1d49c;font-weight:800;touch-action:manipulation">← DIGITAL BEAT LAB</button>
      `;

      header.querySelector("[data-switch-beatlab]").addEventListener("click", () => {
        this.onSwitchToBeatLab?.();
      });

      const intro = document.createElement("div");
      intro.style.cssText = "padding:0 2px;color:#a8a8b1;font-size:12px;line-height:1.6";
      intro.textContent = "Arrange your vocal takes, beat recordings, and master recordings on one shared timeline. Move clips across bars and play the session as a complete song.";

      root.append(header, intro, multitrack);
      this.root = root;
      return root;
    },

    destroy() {
      if (this.root) this.root.remove();
      this.root = null;
    }
  };
}

export default createStudioDAWEditPanel;
