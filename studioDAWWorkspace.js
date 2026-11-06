
/*
 * LAMBO CITY RECORDS
 * MODULAR DAW WORKSPACE — V1
 *
 * Main visual workspace shell.
 * Independent of Three.js and the audio engine.
 *
 * Responsibilities:
 * - DAW navigation
 * - Responsive workspace layout
 * - Mounting existing production panels
 * - Switching between production views
 *
 * Does not create a second audio engine.
 * Does not replace existing Beat Lab functionality.
 */

// The complete producer workflow. Mix & Master is a first-class destination,
// not a footer-only secondary tool. Live Drummer remains an optional mode.
const VIEWS = [
  { id: "edit", label: "EDITING" },
  { id: "mpc", label: "MPC" },
  { id: "piano", label: "PIANO / CITY SYNTH" },
  { id: "vocals", label: "VOCAL BOOTH" },
  { id: "beatlab", label: "BEAT LAB" },
  { id: "mix", label: "MIX & MASTER" }
];

const SECONDARY_VIEWS = [
  { id: "drums", label: "LIVE DRUMMER" }
];

const ALL_VIEWS = [...VIEWS, ...SECONDARY_VIEWS];

const StudioDAWWorkspace = {
  root: null,
  container: null,
  panels: {},
  activeView: "edit",
  onViewChange: null,
  handleClick: null,
  style: null,

  mount({
    container,
    panels = {},
    initialView = "edit",
    onViewChange = null
  } = {}) {
    if (!container) {
      throw new Error(
        "LAMBO CITY DAW: workspace container is required."
      );
    }

    if (this.root) {
      this.destroy();
    }

    this.container = container;
    this.panels = panels;
    this.onViewChange = onViewChange;

    const validView = ALL_VIEWS.some(
      view => view.id === initialView
    );

    this.activeView = validView
      ? initialView
      : "edit";

    const root = document.createElement("section");

    root.id = "lambo-city-daw-workspace";
    root.className = "lc-daw";

    root.innerHTML = `
      <header class="lc-daw-header">

        <div class="lc-daw-brand">
          <div class="lc-daw-eyebrow">
            LAMBO CITY RECORDS
          </div>

          <h1>STUDIO</h1>

          <div class="lc-daw-subtitle">
            PROFESSIONAL MUSIC WORKSPACE
          </div>
        </div>

        <div class="lc-daw-session">
          <span class="lc-daw-session-label">
            WORKSPACE
          </span>

          <strong data-daw-active-label>
            EDIT
          </strong>
        </div>

      </header>

      <nav class="lc-daw-navigation" aria-label="Studio workspace navigation">
        <button type="button" class="lc-daw-step-arrow" data-daw-step="-1" aria-label="Previous workspace">←</button>
        <div class="lc-daw-current-view" aria-live="polite">
          <span>STUDIO</span>
          <strong data-daw-navigation-label>EDITING</strong>
          <span>SWIPE LEFT OR RIGHT</span>
        </div>
        <button type="button" class="lc-daw-step-arrow" data-daw-step="1" aria-label="Next workspace">→</button>
      </nav>

      <main class="lc-daw-main">

        <div class="lc-daw-panel-heading">
          <div>
            <div class="lc-daw-eyebrow">
              PRODUCTION WORKSPACE
            </div>

            <h2 data-daw-panel-title>
              EDIT
            </h2>
          </div>

          <div class="lc-daw-live-indicator">
            <span></span>
            SESSION WORKSPACE
          </div>
        </div>

        <div
          class="lc-daw-panel"
          data-daw-panel
        ></div>

      </main>

      <footer class="lc-daw-footer">
        <span>LAMBO CITY DIGITAL STUDIO</span>
      </footer>
    `;

    this.style = document.createElement("style");

    this.style.textContent = `
      #lambo-city-daw-workspace {
        --lc-gold: #d9ad62;
        --lc-gold-light: #f1d49c;
        --lc-background: #090a0e;
        --lc-panel: #12141b;
        --lc-border: #30313a;
        --lc-text: #f4f1eb;
        --lc-muted: #9698a3;

        width: 100%;
        min-height: 100%;
        color: var(--lc-text);
        background:
          radial-gradient(
            ellipse at top,
            #20202a 0%,
            #101117 45%,
            #090a0e 100%
          );
        font-family: Arial, sans-serif;
        box-sizing: border-box;
      }

      #lambo-city-daw-workspace *,
      #lambo-city-daw-workspace *::before,
      #lambo-city-daw-workspace *::after {
        box-sizing: border-box;
      }

      #lambo-city-daw-workspace .lc-daw-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        flex-wrap: wrap;
        padding: 20px;
        border-bottom: 1px solid var(--lc-border);
      }

      #lambo-city-daw-workspace .lc-daw-eyebrow {
        color: var(--lc-gold);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 2.5px;
      }

      #lambo-city-daw-workspace .lc-daw-brand h1 {
        margin: 5px 0;
        font-size: clamp(25px, 5vw, 36px);
        letter-spacing: 3px;
      }

      #lambo-city-daw-workspace .lc-daw-subtitle {
        color: var(--lc-muted);
        font-size: 10px;
        letter-spacing: 1.5px;
      }

      #lambo-city-daw-workspace .lc-daw-session {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 12px 16px;
        border: 1px solid var(--lc-border);
        border-radius: 8px;
        background: #15161d;
      }

      #lambo-city-daw-workspace .lc-daw-session-label {
        color: var(--lc-muted);
        font-size: 9px;
        letter-spacing: 1.5px;
      }

      #lambo-city-daw-workspace .lc-daw-session strong {
        color: var(--lc-gold-light);
        font-size: 13px;
        letter-spacing: 1px;
      }

      #lambo-city-daw-workspace .lc-daw-navigation {
        display:flex;align-items:center;justify-content:space-between;gap:18px;
        padding:12px 20px;border-bottom:1px solid var(--lc-border);background:#0e0f14;touch-action:pan-y;
      }
      #lambo-city-daw-workspace .lc-daw-step-arrow {
        flex:0 0 48px;width:48px;min-height:44px;border:1px solid #80643a;
        border-radius:9px;background:#201c16;color:var(--lc-gold-light);
        font-size:25px;font-weight:700;cursor:pointer;touch-action:manipulation;
      }
      #lambo-city-daw-workspace .lc-daw-step-arrow:disabled { opacity:.28;cursor:default; }
      #lambo-city-daw-workspace .lc-daw-current-view {
        display:grid;justify-items:center;gap:3px;flex:1;min-width:0;
        color:var(--lc-muted);font-size:8px;font-weight:800;letter-spacing:1.7px;
        text-align:center;pointer-events:none;
      }
      #lambo-city-daw-workspace .lc-daw-current-view strong {
        color:var(--lc-gold-light);font-size:11px;letter-spacing:1.2px;
      }

      #lambo-city-daw-workspace .lc-daw-main {
        padding: 20px;
      }

      #lambo-city-daw-workspace .lc-daw-panel-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      #lambo-city-daw-workspace .lc-daw-panel-heading h2 {
        margin: 6px 0 0;
        font-size: 21px;
        letter-spacing: 1px;
      }

      #lambo-city-daw-workspace .lc-daw-live-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--lc-muted);
        font-size: 9px;
        letter-spacing: 1px;
      }

      #lambo-city-daw-workspace .lc-daw-live-indicator span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--lc-gold);
      }

      #lambo-city-daw-workspace .lc-daw-panel {
        min-height: 420px;
        padding: 16px;
        overflow: auto;
        border: 1px solid var(--lc-border);
        border-radius: 12px;
        background: rgba(12, 13, 18, .88);
      }

      #lambo-city-daw-workspace .lc-daw-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 350px;
        padding: 25px;
        text-align: center;
      }

      #lambo-city-daw-workspace .lc-daw-empty strong {
        color: var(--lc-gold-light);
        font-size: 15px;
        letter-spacing: 1.5px;
      }

      #lambo-city-daw-workspace .lc-daw-empty p {
        max-width: 380px;
        margin-top: 12px;
        color: var(--lc-muted);
        font-size: 13px;
        line-height: 1.7;
      }

      #lambo-city-daw-workspace.lc-daw-edit-mode {
        height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden;
      }
      #lambo-city-daw-workspace.lc-daw-edit-mode .lc-daw-header,
      #lambo-city-daw-workspace.lc-daw-edit-mode .lc-daw-panel-heading,
      #lambo-city-daw-workspace.lc-daw-edit-mode .lc-daw-footer { display:none; }
      #lambo-city-daw-workspace.lc-daw-edit-mode .lc-daw-navigation {
        display:flex;
        position:relative;
        z-index:4;
        flex:0 0 auto;
        padding:8px 12px;
        border-bottom:1px solid rgba(217,173,98,.28);
        background:rgba(9,10,14,.96);
      }
      #lambo-city-daw-workspace.lc-daw-edit-mode .lc-daw-main { flex:1;min-height:0;padding:0; }
      #lambo-city-daw-workspace.lc-daw-edit-mode .lc-daw-panel { height:100%;min-height:0;padding:0;overflow:hidden;border:0;border-radius:0;background:transparent; }
      #lambo-city-daw-workspace .lc-daw-secondary-tools {
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
      }
      #lambo-city-daw-workspace .lc-daw-secondary-tools button {
        min-height:34px;
        padding:7px 11px;
        border:1px solid rgba(217,173,98,.55);
        border-radius:7px;
        background:linear-gradient(145deg,#242630,#111319);
        color:#e8c88e;
        font:700 10px Arial,sans-serif;
        letter-spacing:.8px;
        cursor:pointer;
      }
      #lambo-city-daw-workspace .lc-daw-secondary-tools button:active {
        transform:translateY(1px);
      }

      #lambo-city-daw-workspace .lc-daw-footer {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        padding: 16px 20px;
        border-top: 1px solid var(--lc-border);
        color: var(--lc-muted);
        font-size: 9px;
        letter-spacing: 1.3px;
      }

      @media (max-width: 600px) {
        #lambo-city-daw-workspace .lc-daw-header {
          padding: 15px;
        }

        #lambo-city-daw-workspace .lc-daw-main {
          padding: 12px;
        }

        #lambo-city-daw-workspace .lc-daw-panel {
          min-height: 360px;
          padding: 10px;
        }

        #lambo-city-daw-workspace .lc-daw-navigation { gap:10px; padding:10px 12px; }
        #lambo-city-daw-workspace .lc-daw-step-arrow { flex-basis:44px; width:44px; }
        #lambo-city-daw-workspace .lc-daw-flow-track { gap:5px; }
      }
    `;

    root.addEventListener("click", event => {
      const button = event.target.closest("[data-daw-step]");
      if (!button || !root.contains(button) || button.disabled) return;
      const currentIndex = VIEWS.findIndex(view => view.id === this.activeView);
      if (currentIndex < 0) return;
      const direction = Number(button.dataset.dawStep) < 0 ? -1 : 1;
      const nextIndex = (currentIndex + direction + VIEWS.length) % VIEWS.length;
      this.setView(VIEWS[nextIndex].id);
    });

    this.handleClick = null;

    // Touch-friendly horizontal navigation is bound only to the workflow
    // rail, never to the instrument panels, sliders, piano keys, or faders.
    const workflowNav = root.querySelector(".lc-daw-navigation");
    let workflowStartX = null;
    workflowNav?.addEventListener("pointerdown", event => {
      workflowStartX = event.clientX;
    });
    workflowNav?.addEventListener("pointerup", event => {
      if (workflowStartX === null) return;
      const deltaX = event.clientX - workflowStartX;
      workflowStartX = null;
      if (Math.abs(deltaX) < 42) return;
      const index = VIEWS.findIndex(view => view.id === this.activeView);
      if (index < 0) return;
      const direction = deltaX < 0 ? 1 : -1;
      const nextIndex = (index + direction + VIEWS.length) % VIEWS.length;
      event.preventDefault();
      this.setView(VIEWS[nextIndex].id);
    });
    workflowNav?.addEventListener("pointercancel", () => {
      workflowStartX = null;
    });

    container.appendChild(this.style);
    container.appendChild(root);

    this.root = root;

    this.setView(this.activeView);

    return root;
  },

  setView(viewId) {
    const view = ALL_VIEWS.find(item => item.id === viewId);
    if (!view || !this.root) return false;

    this.activeView = viewId;
    this.root.classList.toggle("lc-daw-edit-mode", viewId === "edit");
    const currentIndex = VIEWS.findIndex(item => item.id === viewId);
    const previous = this.root.querySelector('[data-daw-step="-1"]');
    const next = this.root.querySelector('[data-daw-step="1"]');
    if (previous) previous.disabled = currentIndex < 0;
    if (next) next.disabled = currentIndex < 0;
    const navigationLabel = this.root.querySelector("[data-daw-navigation-label]");
    if (navigationLabel) navigationLabel.textContent = view.label;

    const panel = this.root.querySelector("[data-daw-panel]");

    this.root.querySelector(
      "[data-daw-active-label]"
    ).textContent = view.label;

    this.root.querySelector(
      "[data-daw-panel-title]"
    ).textContent = view.label;

    panel.replaceChildren();

    const suppliedPanel = this.panels[viewId];

    if (suppliedPanel instanceof HTMLElement) {
      panel.appendChild(suppliedPanel);
    } else {
      const empty = document.createElement("div");

      empty.className = "lc-daw-empty";

      empty.innerHTML = `
        <strong>${view.label} WORKSPACE</strong>
        <p>
          This production area is reserved for its
          dedicated LAMBO CITY component.
          Its existing production systems will be
          connected during the next integration steps.
        </p>
      `;

      panel.appendChild(empty);
    }

    if (typeof this.onViewChange === "function") {
      this.onViewChange(viewId);
    }

    return true;
  },

  setPanel(viewId, element) {
    if (!ALL_VIEWS.some(view => view.id === viewId)) {
      throw new Error("Unknown DAW workspace view.");
    }

    if (!(element instanceof HTMLElement)) {
      throw new Error("A valid workspace panel is required.");
    }

    this.panels[viewId] = element;

    if (this.activeView === viewId) {
      this.setView(viewId);
    }
  },

  destroy() {
    if (this.root) {
      this.root.remove();
    }

    if (this.style) {
      this.style.remove();
    }

    this.root = null;
    this.style = null;
    this.container = null;
    this.panels = {};
    this.onViewChange = null;
    this.handleClick = null;
  }
};

export default StudioDAWWorkspace;

