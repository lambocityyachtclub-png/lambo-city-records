export default {

  keys: {},

  joystick: {
    x: 0,
    y: 0,
    active: false
  },

  _touchId: null,
  _centerX: 0,
  _centerY: 0,
  _radius: 55,

  _phoneOpen: false,
  _initialized: false,

  init() {

    if (this._initialized) {
      return;
    }

    this._initialized = true;


    /*
      ------------------------------------------------
      KEYBOARD
      ------------------------------------------------
    */

    window.addEventListener(
      "keydown",
      e => {

        const key =
          e.key.toLowerCase();

        this.keys[key] = true;

        if (
          key === "f" &&
          !e.repeat
        ) {

          this._togglePhone();

        }

      }
    );


    window.addEventListener(
      "keyup",
      e => {

        const key =
          e.key.toLowerCase();

        this.keys[key] = false;

      }
    );


    /*
      Make sure keys don't remain stuck
      if the browser/window loses focus.
    */

    window.addEventListener(
      "blur",
      () => {

        this.keys.w = false;
        this.keys.a = false;
        this.keys.s = false;
        this.keys.d = false;
        this.keys.shift = false;

      }
    );


    this._buildJoystick();

    this._buildMobileButtons();

  },


  /*
    ------------------------------------------------
    JOYSTICK
    ------------------------------------------------
  */

  _buildJoystick() {

    const self = this;

    const zone =
      document.createElement("div");

    zone.id =
      "lambo-city-joystick";

    zone.style.cssText = `
      position:fixed;
      bottom:30px;
      left:30px;
      width:130px;
      height:130px;
      z-index:300;
      pointer-events:auto;
      touch-action:none;
      user-select:none;
      -webkit-user-select:none;
    `;


    const base =
      document.createElement("div");

    base.style.cssText = `
      width:120px;
      height:120px;
      border-radius:50%;
      background:rgba(0,0,0,0.35);
      border:2px solid rgba(255,215,0,0.25);
      position:relative;
      touch-action:none;
      user-select:none;
      -webkit-user-select:none;
    `;


    const knob =
      document.createElement("div");

    knob.style.cssText = `
      width:46px;
      height:46px;
      border-radius:50%;
      background:linear-gradient(135deg,#9900ff,#ff00aa);
      box-shadow:0 0 18px rgba(153,0,255,0.7);
      position:absolute;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      pointer-events:none;
      touch-action:none;
    `;


    base.appendChild(knob);
    zone.appendChild(base);
    document.body.appendChild(zone);


    function resetJoystick() {

      self.joystick.x = 0;
      self.joystick.y = 0;
      self.joystick.active = false;

      self._touchId = null;

      knob.style.transform =
        "translate(-50%,-50%)";

    }


    function updateJoystick(clientX, clientY) {

      let dx =
        clientX -
        self._centerX;

      let dy =
        clientY -
        self._centerY;


      const dist =
        Math.sqrt(
          dx * dx +
          dy * dy
        );


      const maxR =
        self._radius;


      if (dist > maxR) {

        dx =
          (dx / dist) *
          maxR;

        dy =
          (dy / dist) *
          maxR;

      }


      self.joystick.x =
        dx / maxR;

      self.joystick.y =
        dy / maxR;


      knob.style.transform =
        `translate(
          calc(-50% + ${dx}px),
          calc(-50% + ${dy}px)
        )`;

    }


    zone.addEventListener(
      "touchstart",
      e => {

        e.preventDefault();

        if (
          self._touchId !== null
        ) {

          return;

        }


        const touch =
          e.changedTouches[0];

        if (!touch) {
          return;
        }


        self._touchId =
          touch.identifier;


        const rect =
          base.getBoundingClientRect();


        self._centerX =
          rect.left +
          rect.width / 2;

        self._centerY =
          rect.top +
          rect.height / 2;


        self.joystick.active =
          true;


        updateJoystick(
          touch.clientX,
          touch.clientY
        );

      },
      {
        passive:false
      }
    );


    window.addEventListener(
      "touchmove",
      e => {

        if (
          self._touchId === null
        ) {

          return;

        }


        let touch = null;


        for (
          let i = 0;
          i < e.touches.length;
          i++
        ) {

          if (
            e.touches[i].identifier ===
            self._touchId
          ) {

            touch =
              e.touches[i];

            break;

          }

        }


        if (!touch) {
          return;
        }


        e.preventDefault();


        updateJoystick(
          touch.clientX,
          touch.clientY
        );

      },
      {
        passive:false
      }
    );


    window.addEventListener(
      "touchend",
      e => {

        if (
          self._touchId === null
        ) {

          return;

        }


        for (
          let i = 0;
          i < e.changedTouches.length;
          i++
        ) {

          if (
            e.changedTouches[i].identifier ===
            self._touchId
          ) {

            resetJoystick();

            break;

          }

        }

      },
      {
        passive:false
      }
    );


    window.addEventListener(
      "touchcancel",
      e => {

        if (
          self._touchId === null
        ) {

          return;

        }


        for (
          let i = 0;
          i < e.changedTouches.length;
          i++
        ) {

          if (
            e.changedTouches[i].identifier ===
            self._touchId
          ) {

            resetJoystick();

            break;

          }

        }

      },
      {
        passive:false
      }
    );

  },


  /*
    ------------------------------------------------
    MOBILE ACTION BUTTONS
    ------------------------------------------------
  */

  _buildMobileButtons() {

    const self =
      this;


    const buttons =
      document.createElement("div");


    buttons.id =
      "lambo-city-mobile-buttons";


    buttons.style.cssText = `
      position:fixed;
      bottom:40px;
      right:30px;
      display:flex;
      flex-direction:column;
      gap:12px;
      z-index:300;
      pointer-events:auto;
    `;


    const eButton =
      this._makeBtn(
        "E",
        "#9900ff"
      );


    eButton.addEventListener(
      "pointerdown",
      e => {

        e.preventDefault();

        self.keys.e = true;

        clearTimeout(
          self._eTimer
        );


        self._eTimer =
          setTimeout(
            () => {

              self.keys.e = false;

            },
            200
          );

      }
    );


    const fButton =
      this._makeBtn(
        "F",
        "#ff00aa"
      );


    fButton.addEventListener(
      "pointerdown",
      e => {

        e.preventDefault();

        self._togglePhone();

      }
    );


    buttons.appendChild(
      eButton
    );

    buttons.appendChild(
      fButton
    );


    document.body.appendChild(
      buttons
    );

  },


  _makeBtn(label, color) {

    const btn =
      document.createElement("button");


    btn.type =
      "button";


    btn.textContent =
      label;


    btn.style.cssText = `
      width:54px;
      height:54px;
      border-radius:50%;
      background:${color};
      border:none;
      color:white;
      font-size:18px;
      font-weight:bold;
      cursor:pointer;
      opacity:0.85;
      touch-action:none;
      user-select:none;
      -webkit-user-select:none;
      -webkit-tap-highlight-color:transparent;
    `;


    btn.addEventListener(
      "pointerdown",
      e => {

        e.preventDefault();

        btn.style.transform =
          "scale(0.92)";

      }
    );


    const release =
      () => {

        btn.style.transform =
          "scale(1)";

      };


    btn.addEventListener(
      "pointerup",
      release
    );

    btn.addEventListener(
      "pointercancel",
      release
    );

    btn.addEventListener(
      "pointerleave",
      release
    );


    return btn;

  },


  /*
    ------------------------------------------------
    PHONE
    ------------------------------------------------
  */

  _togglePhone() {

    const existing =
      document.getElementById(
        "phone-ui"
      );


    if (existing) {

      existing.remove();

      this._phoneOpen =
        false;

      return;

    }


    this._phoneOpen =
      true;

    this._openPhone();

  },


  _openPhone() {

    const phone =
      document.createElement("div");


    phone.id =
      "phone-ui";


    phone.style.cssText = `
      position:fixed;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      width:280px;
      background:linear-gradient(180deg,#0a0020,#050010);
      border:2px solid rgba(255,215,0,0.4);
      border-radius:28px;
      z-index:400;
      pointer-events:all;
      box-shadow:0 0 60px rgba(153,0,255,0.4);
      overflow:hidden;
      font-family:Arial,sans-serif;
    `;


    const apps = [
      "🎵 MUSIC",
      "🏠 REAL ESTATE",
      "💎 NFT STUDIO",
      "📈 PORTFOLIO",
      "🎥 TIKTOK",
      "▶ YOUTUBE",
      "📸 INSTAGRAM",
      "🎓 COURSES"
    ];


    phone.innerHTML = `
      <div style="
        background:linear-gradient(135deg,#1a0040,#0a0020);
        padding:20px;
        text-align:center;
        border-bottom:1px solid rgba(255,215,0,0.15);
      ">
        <div style="
          color:#ffd700;
          font-size:9px;
          letter-spacing:3px;
        ">
          LAMBO CITY
        </div>

        <div style="
          color:white;
          font-size:24px;
          margin:6px 0;
        ">
          📱
        </div>

        <div style="
          color:#aaa;
          font-size:10px;
        ">
          CITIZEN PHONE
        </div>
      </div>

      <div style="
        padding:16px;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      ">
        ${apps.map(a => `
          <div style="
            background:rgba(255,255,255,0.04);
            border:1px solid rgba(255,255,255,0.08);
            border-radius:14px;
            padding:14px 8px;
            text-align:center;
            cursor:pointer;
          ">
            <div style="
              font-size:22px;
            ">
              ${a.split(" ")[0]}
            </div>

            <div style="
              color:white;
              font-size:9px;
              margin-top:5px;
              letter-spacing:1px;
            ">
              ${a.split(" ").slice(1).join(" ")}
            </div>
          </div>
        `).join("")}
      </div>

      <div style="
        padding:0 16px 20px;
        text-align:center;
      ">
        <button
          id="lambo-phone-close"
          style="
            background:rgba(255,255,255,0.08);
            border:1px solid rgba(255,255,255,0.15);
            border-radius:20px;
            color:white;
            padding:8px 30px;
            font-size:12px;
            cursor:pointer;
          "
        >
          CLOSE
        </button>
      </div>
    `;


    document.body.appendChild(
      phone
    );


    const close =
      document.getElementById(
        "lambo-phone-close"
      );


    if (close) {

      close.addEventListener(
        "pointerdown",
        e => {

          e.preventDefault();

          phone.remove();

          this._phoneOpen =
            false;

        }
      );

    }

  },


  update() {}

};
