export default {
  keys: {},
  joystick: { x: 0, y: 0, active: false },
  _touchId: null,
  _centerX: 0,
  _centerY: 0,
  _radius: 55,

  init() {
    var self = this;

    window.addEventListener('keydown', function(e) {
      self.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'f') self._togglePhone();
    });
    window.addEventListener('keyup', function(e) {
      self.keys[e.key.toLowerCase()] = false;
    });

    this._buildJoystick();
    this._buildMobileButtons();
  },

  _buildJoystick() {
    var self = this;
    var zone = document.createElement('div');
    zone.style.cssText = `
      position:fixed;bottom:30px;left:30px;
      width:130px;height:130px;
      z-index:300;pointer-events:all;
    `;

    var base = document.createElement('div');
    base.style.cssText = `
      width:120px;height:120px;border-radius:50%;
      background:rgba(0,0,0,0.35);
      border:2px solid rgba(255,215,0,0.25);
      box-shadow:0 0 20px rgba(153,0,255,0.15);
      position:relative;
    `;

    var knob = document.createElement('div');
    knob.style.cssText = `
      width:46px;height:46px;border-radius:50%;
      background:radial-gradient(circle at 35% 35%, #cc44ff, #6600aa);
      box-shadow:0 0 18px rgba(153,0,255,0.7);
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      transition:box-shadow 0.1s;
    `;

    base.appendChild(knob);
    zone.appendChild(base);
    document.body.appendChild(zone);

    zone.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var t = e.changedTouches[0];
      self._touchId = t.identifier;
      var rect = base.getBoundingClientRect();
      self._centerX = rect.left + rect.width / 2;
      self._centerY = rect.top  + rect.height / 2;
      self.joystick.active = true;
      knob.style.boxShadow = '0 0 25px rgba(153,0,255,0.9)';
    }, { passive: false });

    window.addEventListener('touchmove', function(e) {
      if (!self.joystick.active) return;
      var t = null;
      for (var i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === self._touchId) { t = e.touches[i]; break; }
      }
      if (!t) return;
      e.preventDefault();

      var dx = t.clientX - self._centerX;
      var dy = t.clientY - self._centerY;
      var dist = Math.sqrt(dx*dx + dy*dy);
      var maxR = self._radius;

      if (dist > maxR) { dx = (dx/dist)*maxR; dy = (dy/dist)*maxR; }

      // DEAD ZONE — inner 12%
      var normalized = dist / maxR;
      if (normalized < 0.12) { dx = 0; dy = 0; normalized = 0; }

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
          knob.style.boxShadow = '0 0 18px rgba(153,0,255,0.7)';
          break;
        }
      }
    });
  },

  _buildMobileButtons() {
    var self = this;
    var btns = document.createElement('div');
    btns.style.cssText = `
      position:fixed;bottom:40px;right:30px;
      display:flex;flex-direction:column;gap:14px;
      z-index:300;pointer-events:all;
    `;

    var eBtn = this._makeBtn('E', 'rgba(153,0,255,0.85)', function() {
      self.keys['e'] = true;
      setTimeout(function() { self.keys['e'] = false; }, 200);
    });

    var fBtn = this._makeBtn('F', 'rgba(255,0,170,0.85)', function() {
      self._togglePhone();
    });

    // SPRINT BUTTON
    var sprintBtn = this._makeBtn('⚡', 'rgba(255,170,0,0.85)', function() {
      self.keys['shift'] = true;
      setTimeout(function() { self.keys['shift'] = false; }, 1000);
    });

    btns.appendChild(sprintBtn);
    btns.appendChild(eBtn);
    btns.appendChild(fBtn);
    document.body.appendChild(btns);
  },

  _makeBtn(label, color, fn) {
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      width:56px;height:56px;border-radius:50%;
      background:${color};border:none;
      color:white;font-size:20px;font-weight:bold;
      box-shadow:0 4px 15px rgba(0,0,0,0.4);
      cursor:pointer;opacity:0.9;
      backdrop-filter:blur(4px);
    `;
    btn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      btn.style.transform = 'scale(0.92)';
      fn();
    }, { passive: false });
    btn.addEventListener('touchend', function() {
      btn.style.transform = 'scale(1)';
    });
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
      border-radius:28px;
      z-index:400;pointer-events:all;
      box-shadow:0 0 60px rgba(153,0,255,0.4);
      overflow:hidden;font-family:Arial,sans-serif;
    `;
    phone.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a0040,#0a0020);
        padding:20px;text-align:center;
        border-bottom:1px solid rgba(255,215,0,0.15);">
        <div style="color:#ffd700;font-size:9px;letter-spacing:3px;">LAMBO CITY</div>
        <div style="color:white;font-size:24px;margin:6px 0;">📱</div>
        <div style="color:#aaa;font-size:10px;">CITIZEN PHONE</div>
      </div>
      <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${this._phoneApp('🎵','MUSIC')}
        ${this._phoneApp('🏠','REAL ESTATE')}
        ${this._phoneApp('💎','NFT STUDIO')}
        ${this._phoneApp('📈','PORTFOLIO')}
        ${this._phoneApp('🎥','TIKTOK')}
        ${this._phoneApp('▶','YOUTUBE')}
        ${this._phoneApp('📸','INSTAGRAM')}
        ${this._phoneApp('🎓','COURSES')}
      </div>
      <div style="padding:0 16px 20px;text-align:center;">
        <button onclick="document.getElementById('phone-ui').remove()" style="
          background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.15);
          border-radius:20px;color:white;
          padding:8px 30px;font-size:12px;cursor:pointer;
          letter-spacing:1px;
        ">CLOSE</button>
      </div>
    `;
    document.body.appendChild(phone);
  },

  _phoneApp(icon, label) {
    return `
      <div style="
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:14px;padding:14px 8px;
        text-align:center;cursor:pointer;
      ">
        <div style="font-size:22px;">${icon}</div>
        <div style="color:white;font-size:9px;margin-top:5px;letter-spacing:1px;">${label}</div>
      </div>
    `;
  },

  update() {}
};
