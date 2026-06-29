export default {
  keys: {},
  joystick: { x: 0, y: 0, active: false },
  _joystickEl: null,
  _knobEl: null,
  _touchId: null,
  _centerX: 0,
  _centerY: 0,
  _radius: 55,

  init() {
    // KEYBOARD
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'f') this._togglePhone();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // MOBILE JOYSTICK
    this._buildJoystick();
    this._buildMobileButtons();
  },

  _buildJoystick() {
    var zone = document.createElement('div');
    zone.id = 'joystick-zone';
    zone.style.cssText = `
      position:fixed;bottom:30px;left:30px;
      width:120px;height:120px;
      z-index:300;pointer-events:all;
    `;

    var base = document.createElement('div');
    base.style.cssText = `
      width:110px;height:110px;
      border-radius:50%;
      background:rgba(0,0,0,0.4);
      border:2px solid rgba(255,215,0,0.3);
      box-shadow:0 0 20px rgba(153,0,255,0.2);
      position:relative;
    `;

    var knob = document.createElement('div');
    knob.style.cssText = `
      width:42px;height:42px;
      border-radius:50%;
      background:linear-gradient(135deg,#9900ff,#ff00aa);
      box-shadow:0 0 15px rgba(153,0,255,0.6);
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      transition:box-shadow 0.1s;
    `;

    base.appendChild(knob);
    zone.appendChild(base);
    document.body.appendChild(zone);

    this._joystickEl = base;
    this._knobEl = knob;

    var self = this;

    zone.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var t = e.changedTouches[0];
      self._touchId = t.identifier;
      var rect = base.getBoundingClientRect();
      self._centerX = rect.left + rect.width / 2;
      self._centerY = rect.top + rect.height / 2;
      self.joystick.active = true;
    }, { passive: false });

    window.addEventListener('touchmove', function(e) {
      if (!self.joystick.active) return;
      var t = null;
      for (var i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === self._touchId) {
          t = e.touches[i]; break;
        }
      }
      if (!t) return;
      e.preventDefault();

      var dx = t.clientX - self._centerX;
      var dy = t.clientY - self._centerY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var maxR = self._radius;

      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }

      self.joystick.x = dx / maxR;
      self.joystick.y = dy / maxR;

      knob.style.transform =
        'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    }, { passive: false });

    window.addEventListener('touchend', function(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === self._touchId) {
          self.joystick.x = 0;
          self.joystick.y = 0;
          self.joystick.active = false;
          self._touchId = null;
          knob.style.transform = 'translate(-50%,-50%)';
          break;
        }
      }
    });
  },

  _buildMobileButtons() {
    // INTERACT + PHONE buttons for mobile
    var btns = document.createElement('div');
    btns.style.cssText = `
      position:fixed;bottom:40px;right:30px;
      display:flex;flex-direction:column;gap:12px;
      z-index:300;pointer-events:all;
    `;

    var self = this;

    var interactBtn = this._makeBtn('E', '#9900ff', function() {
      self.keys['e'] = true;
      setTimeout(function() { self.keys['e'] = false; }, 200);
    });

    var phoneBtn = this._makeBtn('F', '#ff00aa', function() {
      self._togglePhone();
    });

    btns.appendChild(interactBtn);
    btns.appendChild(phoneBtn);
    document.body.appendChild(btns);
  },

  _makeBtn(label, color, fn) {
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      width:54px;height:54px;border-radius:50%;
      background:${color};border:none;
      color:white;font-size:18px;font-weight:bold;
      box-shadow:0 0 15px ${color}88;
      cursor:pointer;opacity:0.85;
    `;
    btn.addEventListener('touchstart', function(e) {
      e.preventDefault(); fn();
    }, { passive: false });
    btn.addEventListener('click', fn);
    return btn;
  },

  _phoneOpen: false,
  _togglePhone() {
    this._phoneOpen = !this._phoneOpen;
    var existing = document.getElementById('phone-ui');
    if (existing) { existing.remove(); return; }
    this._openPhone();
  },

  _openPhone() {
    var phone = document.createElement('div');
    phone.id = 'phone-ui';
    phone.style.cssText = `
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:280px;
      background:linear-gradient(180deg,#0a0020,#050010);
      border:2px solid rgba(255,215,0,0.4);
      border-radius:28px;padding:0;
      z-index:400;pointer-events:all;
      box-shadow:0 0 60px rgba(153,0,255,0.4);
      overflow:hidden;
    `;

    phone.innerHTML = `
      <div style="
        background:linear-gradient(135deg,#1a0040,#0a0020);
        padding:20px;text-align:center;
        border-bottom:1px solid rgba(255,215,0,0.2);
      ">
        <div style="color:#ffd700;font-size:10px;letter-spacing:3px;margin-bottom:4px;">
          LAMBO CITY
        </div>
        <div style="color:white;font-size:22px;font-weight:bold;">📱</div>
        <div style="color:#aaa;font-size:11px;margin-top:4px;">CITIZEN PHONE</div>
      </div>

      <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${phoneApp('🎵','MUSIC','#9900ff')}
        ${phoneApp('🏠','REAL ESTATE','#00ccff')}
        ${phoneApp('💎','NFT STUDIO','#ff00aa')}
        ${phoneApp('📈','PORTFOLIO','#00ff88')}
        ${phoneApp('🎥','TIKTOK','#ff0050')}
        ${phoneApp('▶','YOUTUBE','#ff0000')}
        ${phoneApp('📸','INSTAGRAM','#e1306c')}
        ${phoneApp('🎓','COURSES','#ffd700')}
      </div>

      <div style="padding:0 16px 16px;">
        <div style="
          background:rgba(255,215,0,0.08);
          border:1px solid rgba(255,215,0,0.2);
          border-radius:12px;padding:12px;text-align:center;
        ">
          <div style="color:#ffd700;font-size:10px;letter-spacing:2px;">REPUTATION</div>
          <div style="color:white;font-size:20px;font-weight:bold;margin:4px 0;">LEGEND</div>
          <div style="width:100%;height:5px;background:#222;border-radius:3px;overflow:hidden;">
            <div style="width:72%;height:100%;
              background:linear-gradient(90deg,#9900ff,#ff00aa);border-radius:3px;"></div>
          </div>
        </div>
      </div>

      <div style="padding:0 16px 20px;text-align:center;">
        <button onclick="document.getElementById('phone-ui').remove()" style="
          background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);
          border-radius:20px;color:white;padding:8px 30px;
          font-size:12px;cursor:pointer;letter-spacing:1px;
        ">CLOSE</button>
      </div>
    `;

    document.body.appendChild(phone);

    function phoneApp(icon, label, color) {
      return `
        <div onclick="showAppMsg('${label}')" style="
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:14px;padding:12px 8px;
          text-align:center;cursor:pointer;
          transition:all 0.2s;
        " onmouseover="this.style.background='rgba(${hexToRgb(color)},0.15)'"
           onmouseout="this.style.background='rgba(255,255,255,0.05)'">
          <div style="font-size:20px;">${icon}</div>
          <div style="color:white;font-size:9px;margin-top:4px;letter-spacing:1px;">${label}</div>
        </div>
      `;
    }

    function hexToRgb(hex) {
      var r = parseInt(hex.slice(1,3),16);
      var g = parseInt(hex.slice(3,5),16);
      var b = parseInt(hex.slice(5,7),16);
      return r+','+g+','+b;
    }

    window.showAppMsg = function(label) {
      var msg = document.createElement('div');
      msg.style.cssText = `
        position:fixed;top:30%;left:50%;
        transform:translateX(-50%);
        background:rgba(0,0,0,0.9);
        border:1px solid rgba(255,215,0,0.4);
        border-radius:12px;padding:16px 24px;
        color:white;text-align:center;
        z-index:600;font-family:Arial,sans-serif;
        pointer-events:none;
      `;
      var messages = {
        'MUSIC':        '🎵 Lambo City Radio — Coming Soon',
        'REAL ESTATE':  '🏠 Digital Real Estate — Earn Boarding Pass First',
        'NFT STUDIO':   '💎 NFT Studio — VIP Members Only',
        'PORTFOLIO':    '📈 Portfolio unlocks at Yacht Club',
        'TIKTOK':       '🎥 @lambocity — 2.4M Followers',
        'YOUTUBE':      '▶ Lambo City Records — 890K Subs',
        'INSTAGRAM':    '📸 @lambocityofficial — 3.2M',
        'COURSES':      '🎓 Road to $100K — Available on KDP'
      };
      msg.innerHTML = `
        <div style="color:#ffd700;font-size:12px;margin-bottom:6px;">${label}</div>
        <div style="color:#aaa;font-size:11px;">${messages[label] || 'Coming Soon'}</div>
      `;
      document.body.appendChild(msg);
      setTimeout(function() { msg.remove(); }, 2500);
    };
  },

  update() {}
};
