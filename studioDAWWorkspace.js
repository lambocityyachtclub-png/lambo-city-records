
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

const VIEWS = [
  { id: "edit", label: "EDIT" },
  { id: "mix", label: "MIX" },
  { id: "mpc", label: "MPC" },
  { id: "piano", label: "PIANO" },
  { id: "vocals", label: "VOCALS" }
];

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

    const validView = VIEWS.some(
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

      <nav
        class="lc-daw-navigation"
        aria-label="Studio workspaces"
      >
        ${VIEWS.map(view => `
          <button
            type="button"
            class="lc-daw-tab"
            data-daw-view="${view.id}"
            aria-pressed="${
              view.id === this.activeView
            }"
          >
            ${view.label}
          </button>
        `).join("")}
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
        <span>MODULAR WORKSPACE V1</span>
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
        display: flex;
        gap: 5px;
        padding: 12px 16px;
        overflow-x: auto;
        border-bottom: 1px solid var(--lc-border);
        background: #0e0f14;
        -webkit-overflow-scrolling: touch;
      }

      #lambo-city-daw-workspace .lc-daw-tab {
        flex: 1 0 auto;
        min-width: 76px;
        min-height: 46px;
        padding: 12px 16px;
        border: 1px solid transparent;
        border-radius: 7px;
        color: #a7a8b0;
        background: transparent;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        cursor: pointer;
        touch-action: manipulation;
      }

      #lambo-city-daw-workspace .lc-daw-tab:hover {
        color: var(--lc-text);
        background: #20212a;
      }

      #lambo-city-daw-workspace .lc-daw-tab[aria-pressed="true"] {
        color: var(--lc-gold-light);
        background: #292319;
        border-color: #80643a;
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

        #lambo-city-daw-workspace .lc-daw-tab {
          min-width: 70px;
          padding: 10px;
        }
      }
    `;

    root.addEventListener("click", event => {
      const button = event.target.closest(
        "[data-daw-view]"
      );

      if (!button || !root.contains(button)) return;

      this.setView(button.dataset.dawView);
    });

    this.handleClick = null;

    container.appendChild(this.style);
    container.appendChild(root);

    this.root = root;

    this.setView(this.activeView);

    return root;
  },

  setView(viewId) {
    const view = VIEWS.find(
      item => item.id === viewId
    );

    if (!view || !this.root) return false;

    this.activeView = viewId;

    const panel = this.root.querySelector(
      "[data-daw-panel]"
    );

    this.root.querySelectorAll(
      "[data-daw-view]"
    ).forEach(button => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.dawView === viewId)
      );
    });

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
    if (!VIEWS.some(view => view.id === viewId)) {
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

