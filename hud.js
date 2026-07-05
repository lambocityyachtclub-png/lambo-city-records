export default {
  _boardingPassShown: false,
  _repProgress: 72,
  _xp: 12450,
  _xpMax: 25000,
  _level: 25,
  _coins: 250750,
  _diamonds: 1250,
  _radioPlaying: true,
  _radioProgress: 0,
  _radioInterval: null,

  init() {
    this._buildHUD();
    this._startRadio();
  },

  _buildHUD() {
    const old = document.getElementById('hud');
    if (old) old.remove();

    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:100;
      font-family:'Arial',sans-serif;
    `;
    document.body.appendChild(hud);

    this._buildTopLeft(hud);
    this._buildTopCenter(hud);
    this._buildTopRight(hud);
    this._buildBottomLeft(hud);
    this._buildBottomRight(hud);
    this._buildActionBar(hud);
    this._buildObjectives(hud);
  },

  // ── TOP LEFT — Player Card ──────────────────────────
  _buildTopLeft(hud) {
    const tl = document.createElement('div');
    tl.style.cssText = `
      position:absolute;top:16px;left:16px;
      display:flex;flex-direction:column;gap:6px;
    `;

    // LAMBO CITY RECORDS logo
    tl.innerHTML += `
      <div style="
        color:#ff00aa;font-size:13px;font-weight:bold;
        letter-spacing:1px;text-shadow:0 0 10px rgba(255,0,170,0.6);
        margin-bottom:2px;
      ">
        LAMBO CITY<br>
        <span style="color:#ff00aa;font-size:10px;font-style:italic;">RECORDS</span>
      </div>
    `;

    // PLAYER CARD
    const card = document.createElement('div');
    card.style.cssText = `
      background:rgba(0,0,0,0.7);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:10px;padding:10px 14px;
      display:flex;align-items:center;gap:10px;
      backdrop-filter:blur(6px);
      min-width:220px;
    `;
    card.innerHTML = `
      <div style="
        width:44px;height:44px;border-radius:8px;
        background:linear-gradient(135deg,#1a0040,#330066);
        border:2px solid #ffd700;
        display:flex;align-items:center;justify-content:center;
        font-size:20px;flex-shrink:0;
      ">🎤</div>
      <div style="flex:1;">
        <div style="
          color:white;font-size:13px;font-weight:bold;
          letter-spacing:1px;
        ">HERO</div>
        <div style="
          color:#aaa;font-size:9px;letter-spacing:1px;
          margin-bottom:4px;
        ">LVL ${this._level} &nbsp;
          <span style="color:#ffd700;">⬡ ${this._level}</span>
          &nbsp;
          <span style="color:#aaa;">${this._xp.toLocaleString()} / ${this._xpMax.toLocaleString()} XP</span>
        </div>
        <div style="
          width:100%;height:5px;background:rgba(255,255,255,0.1);
          border-radius:3px;overflow:hidden;
        ">
          <div style="
            width:${(this._xp/this._xpMax*100).toFixed(0)}%;height:100%;
            background:linear-gradient(90deg,#ffd700,#ff8800);
            border-radius:3px;
          "></div>
        </div>
      </div>
    `;
    tl.appendChild(card);

    // CURRENCY ROW
    const currency = document.createElement('div');
    currency.style.cssText = `
      display:flex;gap:8px;
    `;
    currency.innerHTML = `
      <div style="
        background:rgba(0,0,0,0.65);
        border:1px solid rgba(255,215,0,0.3);
        border-radius:8px;padding:6px 12px;
        display:flex;align-items:center;gap:6px;
        backdrop-filter:blur(4px);
      ">
        <div style="
          width:18px;height:18px;border-radius:50%;
          background:linear-gradient(135deg,#ffd700,#ff8800);
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:bold;color:#000;
        ">LC</div>
        <span id="hud-coins" style="color:white;font-size:12px;font-weight:bold;">
          ${this._coins.toLocaleString()}
        </span>
      </div>
      <div style="
        background:rgba(0,0,0,0.65);
        border:1px solid rgba(0,200,255,0.3);
        border-radius:8px;padding:6px 12px;
        display:flex;align-items:center;gap:6px;
        backdrop-filter:blur(4px);
      ">
        <span style="color:#00ccff;font-size:14px;">💎</span>
        <span id="hud-diamonds" style="color:white;font-size:12px;font-weight:bold;">
          ${this._diamonds.toLocaleString()}
        </span>
      </div>
    `;
    tl.appendChild(currency);

    // REPUTATION BAR
    const rep = document.createElement('div');
    rep.style.cssText = `
      background:rgba(0,0,0,0.65);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:8px;padding:8px 12px;
      backdrop-filter:blur(4px);
    `;
    rep.innerHTML = `
      <div style="
        display:flex;justify-content:space-between;
        margin-bottom:5px;
      ">
        <span style="color:#aaa;font-size:9px;letter-spacing:2px;">REPUTATION</span>
        <span style="color:#ffd700;font-size:9px;letter-spacing:1px;font-weight:bold;">LEGEND</span>
      </div>
      <div style="
        width:100%;height:6px;background:rgba(255,255,255,0.1);
        border-radius:3px;overflow:hidden;
      ">
        <div id="rep-bar" style="
          width:${this._repProgress}%;height:100%;
          background:linear-gradient(90deg,#9900ff,#ff00aa);
          border-radius:3px;
          box-shadow:0 0 8px rgba(153,0,255,0.6);
        "></div>
      </div>
    `;
    tl.appendChild(rep);

    hud.appendChild(tl);
  },

  // ── TOP CENTER — Compass ────────────────────────────
  _buildTopCenter(hud) {
    const tc = document.createElement('div');
    tc.style.cssText = `
      position:absolute;top:16px;left:50%;
      transform:translateX(-50%);
      display:flex;flex-direction:column;
      align-items:center;gap:4px;
    `;
    tc.innerHTML = `
      <div style="
        background:rgba(0,0,0,0.65);
        border:1px solid rgba(255,255,255,0.1);
        border-radius:8px;padding:6px 16px;
        backdrop-filter:blur(4px);
      ">
        <div style="
          display:flex;gap:16px;
          color:#888;font-size:10px;letter-spacing:2px;
          align-items:center;
        ">
          <span>W</span>
          <span>NW</span>
          <span style="color:#ffd700;font-size:12px;font-weight:bold;
            text-shadow:0 0 8px rgba(255,215,0,0.6);">N</span>
          <span>NE</span>
          <span>E</span>
        </div>
        <div style="
          color:#ffd700;font-size:11px;text-align:center;
          margin-top:2px;letter-spacing:1px;
        " id="compass-heading">347°</div>
      </div>
      <div style="
        background:rgba(0,0,0,0.65);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:6px;padding:4px 12px;
        color:#aaa;font-size:10px;letter-spacing:1px;
        backdrop-filter:blur(4px);
      " id="hud-time">7:45 PM</div>
    `;
    hud.appendChild(tc);
  },

  // ── TOP RIGHT — Radio + Player Count ───────────────
  _buildTopRight(hud) {
    const tr = document.createElement('div');
    tr.style.cssText = `
      position:absolute;top:16px;right:16px;
      display:flex;flex-direction:column;gap:8px;
      align-items:flex-end;
    `;

    // PLAYER COUNT
    tr.innerHTML = `
      <div style="
        display:flex;gap:12px;align-items:center;
        color:#aaa;font-size:11px;
      ">
        <span>👥 <span style="color:white;">73</span></span>
        <span>🏆 <span style="color:white;">8</span></span>
        <span style="
          background:rgba(0,0,0,0.65);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:6px;padding:4px 10px;
          color:white;font-size:11px;
          backdrop-filter:blur(4px);
        " id="hud-clock">7:45 PM</span>
      </div>
    `;

    // RADIO CARD
    const radio = document.createElement('div');
    radio.style.cssText = `
      background:rgba(0,0,0,0.75);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:10px;padding:10px 14px;
      min-width:220px;
      backdrop-filter:blur(6px);
    `;
    radio.innerHTML = `
      <div style="
        color:#aaa;font-size:9px;letter-spacing:2px;
        margin-bottom:6px;
      ">LAMBO CITY RADIO</div>
      <div style="
        display:flex;align-items:center;gap:10px;
      ">
        <div style="flex:1;">
          <div style="
            width:100%;height:3px;background:rgba(255,255,255,0.1);
            border-radius:2px;overflow:hidden;margin-bottom:6px;
          ">
            <div id="radio-wave" style="
              width:0%;height:100%;
              background:linear-gradient(90deg,#9900ff,#ff00aa,#9900ff);
              background-size:200%;
              border-radius:2px;
            "></div>
          </div>
          <div style="color:white;font-size:11px;font-weight:bold;">
            HERO - FLY AWAY
          </div>
        </div>
        <button id="radio-toggle" style="
          background:rgba(255,255,255,0.1);
          border:1px solid rgba(255,255,255,0.15);
          border-radius:6px;padding:5px 10px;
          color:white;font-size:12px;cursor:pointer;
          pointer-events:all;
        ">⏸</button>
      </div>
    `;
    tr.appendChild(radio);
    hud.appendChild(tr);

    // Radio button listener
    setTimeout(() => {
      const btn = document.getElementById('radio-toggle');
      if (!btn) return;
      btn.addEventListener('click', () => {
        this._radioPlaying = !this._radioPlaying;
        btn.textContent = this._radioPlaying ? '⏸' : '▶';
      });
    }, 300);
  },

  // ── OBJECTIVES PANEL ────────────────────────────────
  _buildObjectives(hud) {
    const obj = document.createElement('div');
    obj.style.cssText = `
      position:absolute;top:120px;right:16px;
      background:rgba(0,0,0,0.72);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:10px;padding:12px 16px;
      min-width:240px;
      backdrop-filter:blur(6px);
      pointer-events:none;
    `;

    const objectives = [
      { text: 'GO TO THE YACHT CLUB',     color: '#9900ff', done: false },
      { text: 'MEET HERO AT THE STAGE',   color: '#ffd700', done: false },
      { text: 'COLLECT 10 LAMBO COINS',   color: '#ffd700', done: false, progress: '7/10' },
      { text: 'WIN THE GRAND PRIX RACE',  color: '#aaa',    done: false },
      { text: 'UNLOCK VIP ACCESS',        color: '#ff00aa', done: false, sub: 'LAMBO' },
    ];

    obj.innerHTML = `
      <div style="
        color:white;font-size:11px;font-weight:bold;
        letter-spacing:2px;margin-bottom:10px;
        border-bottom:1px solid rgba(255,255,255,0.08);
        padding-bottom:8px;
      ">OBJECTIVES</div>
      ${objectives.map(o => `
        <div style="
          display:flex;align-items:center;gap:8px;
          margin-bottom:8px;
        ">
          <div style="
            width:6px;height:6px;border-radius:50%;
            background:${o.color};
            box-shadow:0 0 6px ${o.color};
            flex-shrink:0;
          "></div>
          <div style="flex:1;">
            <div style="color:white;font-size:10px;letter-spacing:0.5px;">
              ${o.text}
              ${o.progress ? `<span style="color:#aaa;"> ${o.progress}</span>` : ''}
            </div>
            ${o.sub ? `<div style="color:${o.color};font-size:9px;letter-spacing:1px;margin-top:1px;">${o.sub}</div>` : ''}
          </div>
        </div>
      `).join('')}
    `;
    hud.appendChild(obj);
  },

  // ── BOTTOM LEFT — Minimap ───────────────────────────
  _buildBottomLeft(hud) {
    const bl = document.createElement('div');
    bl.style.cssText = `
      position:absolute;bottom:80px;left:16px;
    `;
    bl.innerHTML = `
      <div style="
        background:rgba(0,0,0,0.75);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:10px;overflow:hidden;
        width:220px;
        backdrop-filter:blur(6px);
      ">
        <canvas id="minimap" width="220" height="160"
          style="display:block;"></canvas>
        <div style="
          padding:6px 10px;
          border-top:1px solid rgba(255,255,255,0.08);
        ">
          <div style="color:white;font-size:11px;font-weight:bold;
            letter-spacing:1px;">LAMBO CITY</div>
          <div style="
            display:flex;justify-content:space-between;
            align-items:center;margin-top:2px;
          ">
            <div>
              <div style="color:#ffd700;font-size:10px;
                letter-spacing:1px;">MARINA DISTRICT</div>
              <div style="color:#888;font-size:9px;">SUNSET BLVD</div>
            </div>
            <div style="
              display:flex;align-items:center;gap:4px;
            ">
              <div style="
                width:6px;height:6px;border-radius:50%;
                background:#00ff88;
                box-shadow:0 0 6px #00ff88;
              "></div>
              <span style="color:#00ff88;font-size:9px;">36ms</span>
            </div>
          </div>
        </div>
      </div>
    `;
    hud.appendChild(bl);
    this._drawMinimap(null);
  },

  // ── BOTTOM RIGHT — Lambo Coin Balance ───────────────
  _buildBottomRight(hud) {
    const br = document.createElement('div');
    br.style.cssText = `
      position:absolute;bottom:80px;right:16px;
      display:flex;flex-direction:column;
      align-items:flex-end;gap:8px;
    `;
    br.innerHTML = `
      <div style="
        background:rgba(0,0,0,0.75);
        border:1px solid rgba(255,215,0,0.3);
        border-radius:10px;padding:10px 16px;
        display:flex;align-items:center;gap:10px;
        backdrop-filter:blur(6px);
      ">
        <div style="text-align:right;">
          <div style="color:#aaa;font-size:9px;letter-spacing:2px;
            margin-bottom:2px;">LAMBO COIN</div>
          <div id="coin-balance" style="
            color:#ffd700;font-size:16px;font-weight:bold;
            text-shadow:0 0 10px rgba(255,215,0,0.4);
          ">${this._coins.toLocaleString()} LC</div>
        </div>
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#ffd700,#ff8800);
          display:flex;align-items:center;justify-content:center;
          font-weight:bold;font-size:12px;color:#000;
          box-shadow:0 0 12px rgba(255,215,0,0.4);
        ">LC</div>
      </div>
    `;
    hud.appendChild(br);
  },

  // ── ACTION BAR ──────────────────────────────────────
  _buildActionBar(hud) {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position:absolute;bottom:20px;left:50%;
      transform:translateX(-50%);
      display:flex;gap:6px;align-items:center;
      pointer-events:all;
    `;

    const actions = [
      { key: 'E', label: 'INTERACT' },
      { key: 'M', label: 'MAP'      },
      { key: 'I', label: 'INVENTORY'},
      { key: 'T', label: 'PHONE'    },
      { key: 'P', label: 'SETTINGS' },
    ];

    actions.forEach(a => {
      const btn = document.createElement('div');
      btn.style.cssText = `
        background:rgba(0,0,0,0.72);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:8px;padding:6px 12px;
        display:flex;align-items:center;gap:6px;
        backdrop-filter:blur(4px);
        cursor:pointer;
      `;
      btn.innerHTML = `
        <span style="
          background:rgba(255,255,255,0.15);
          border-radius:4px;padding:2px 7px;
          color:white;font-size:11px;font-weight:bold;
        ">${a.key}</span>
        <span style="color:#aaa;font-size:10px;
          letter-spacing:1px;">${a.label}</span>
      `;
      bar.appendChild(btn);
    });

    hud.appendChild(bar);
  },

  // ── MINIMAP DRAW ────────────────────────────────────
  _drawMinimap(playerPos) {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 220, H = 160;

    ctx.clearRect(0, 0, W, H);

    // BG
    ctx.fillStyle = 'rgba(10,10,20,0.95)';
    ctx.fillRect(0, 0, W, H);

    // WATER
    ctx.fillStyle = 'rgba(0,60,100,0.7)';
    ctx.fillRect(0, 80, W, H);

    // ROADS
    ctx.strokeStyle = 'rgba(80,80,80,0.8)';
    ctx.lineWidth = 4;
    // Main road horizontal
    ctx.beginPath(); ctx.moveTo(0,80); ctx.lineTo(W,80); ctx.stroke();
    // Dock vertical
    ctx.strokeStyle = '#8b5e3c';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(110,0); ctx.lineTo(110,H); ctx.stroke();
    // Side roads
    ctx.strokeStyle = 'rgba(60,60,60,0.6)';
    ctx.lineWidth = 3;
    [40,80,140,180].forEach(x => {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,80); ctx.stroke();
    });

    // STAGE
    ctx.fillStyle = '#9900ff';
    ctx.fillRect(90,10,40,12);
    ctx.shadowColor = '#9900ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(90,10,40,12);
    ctx.shadowBlur = 0;

    // YACHT CLUB
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(140,85,30,12);

    // YACHT
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(150,100,25,8);

    // BUILDINGS
    [
      {x:10,y:20,w:25,h:35,c:'#1a1a3e'},
      {x:40,y:15,w:20,h:40,c:'#0d0d2b'},
      {x:155,y:20,w:22,h:32,c:'#1a1a3e'},
      {x:182,y:12,w:18,h:38,c:'#0d0d2b'},
    ].forEach(b => {
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x,b.y,b.w,b.h);
      // Windows
      ctx.fillStyle = 'rgba(255,238,136,0.6)';
      for(let r=0;r<3;r++) for(let c=0;c<2;c++) {
        if(Math.random()>0.3) ctx.fillRect(b.x+3+c*8,b.y+4+r*10,5,4);
      }
    });

    // ZONE ICONS
    const zones = [
      {x:95,y:8,icon:'🎵',color:'#9900ff'},
      {x:143,y:82,icon:'⚓',color:'#00ffff'},
      {x:30,y:55,icon:'🏆',color:'#ffd700'},
      {x:170,y:55,icon:'🚗',color:'#ff4400'},
    ];
    zones.forEach(z => {
      ctx.font = '10px Arial';
      ctx.fillText(z.icon, z.x, z.y+10);
    });

    // PLAYER DOT
    const px = playerPos ? 110 + playerPos.x * 0.6 : 110;
    const py = playerPos ? 100 + playerPos.z * 0.4 : 100;
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(Math.max(5,Math.min(W-5,px)), Math.max(5,Math.min(H-5,py)), 5, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // HEADING INDICATOR
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', 110, 12);
  },

  // ── RADIO ANIMATION ─────────────────────────────────
  _startRadio() {
    let p = 0;
    this._radioInterval = setInterval(() => {
      if (!this._radioPlaying) return;
      p = (p + 0.4) % 100;
      const bar = document.getElementById('radio-wave');
      if (bar) bar.style.width = p + '%';
      // Update clock
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2,'0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const timeStr = `${h}:${m} ${ampm}`;
      const clk = document.getElementById('hud-clock');
      if (clk) clk.textContent = timeStr;
    }, 100);
  },

  // ── UPDATE ───────────────────────────────────────────
  update(delta, context) {
    const player = context.player;
    if (!player) return;

    this._drawMinimap(player.position);

    // BOARDING PASS PROGRESS
    const dx = player.position.x - 35;
    const dz = player.position.z + 25;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const progress = Math.min(100, Math.max(0, ((60-dist)/60)*100));

    // UPDATE COINS based on movement
    if (Math.random() < 0.002) {
      this._coins += 1;
      const el = document.getElementById('coin-balance');
      if (el) el.textContent = this._coins.toLocaleString() + ' LC';
      const el2 = document.getElementById('hud-coins');
      if (el2) el2.textContent = this._coins.toLocaleString();
    }

    if (progress >= 100) this._showBoardingPass();
  },

  _showBoardingPass() {
    if (this._boardingPassShown) return;
    this._boardingPassShown = true;
    const card = document.createElement('div');
    card.style.cssText = `
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:linear-gradient(135deg,#0a0020,#1a0040);
      border:2px solid #ffd700;border-radius:16px;
      padding:30px 40px;color:white;text-align:center;
      z-index:500;pointer-events:all;
      box-shadow:0 0 60px rgba(255,215,0,0.4);
    `;
    card.innerHTML = `
      <div style="color:#ffd700;font-size:10px;letter-spacing:4px;margin-bottom:8px;">
        ⚓ YOU MADE IT ⚓
      </div>
      <div style="font-size:22px;font-weight:bold;letter-spacing:3px;margin-bottom:12px;">
        BOARDING PASS
      </div>
      <div style="
        border:1px solid rgba(255,215,0,0.3);border-radius:8px;
        padding:14px 20px;margin:12px 0;background:rgba(255,215,0,0.05);
      ">
        <div style="color:#00ffff;font-size:12px;letter-spacing:2px;">
          LAMBO CITY YACHT CLUB
        </div>
        <div style="
          font-size:30px;letter-spacing:6px;margin:10px 0;
          color:#ffd700;font-weight:bold;
        ">LC-2024</div>
        <div style="color:#666;font-size:9px;letter-spacing:1px;">
          CITIZEN OF LAMBO CITY • LONG BEACH, CA
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background:linear-gradient(90deg,#9900ff,#ff00aa);
        border:none;border-radius:20px;color:white;
        padding:10px 28px;font-size:12px;letter-spacing:2px;cursor:pointer;
      ">⚓ BOARD THE YACHT →</button>
    `;
    document.body.appendChild(card);
  }
};
