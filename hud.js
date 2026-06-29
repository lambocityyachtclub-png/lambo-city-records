export default {
  init() {
    this.reputation = 0;
    this.zone = 'LAMBO DOCKS';
    this.city = 'LONG BEACH, CA';
    this._buildHUD();
  },

  _buildHUD() {
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      pointer-events:none; font-family:'Arial Black',sans-serif; z-index:100;
    `;

    // TOP LEFT — mission / location
    hud.innerHTML += `
      <div id="hud-topleft" style="
        position:absolute; top:20px; left:20px;
        color:white; text-shadow:0 0 10px rgba(0,0,0,0.8);
      ">
        <div style="font-size:13px;color:#ffd700;letter-spacing:2px;margin-bottom:4px;">
          WELCOME TO LAMBO CITY
        </div>
        <div style="font-size:11px;color:#aaa;letter-spacing:1px;">
          ◆ Walk the Dock
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:2px;">
          ◈ Reach the Stage
        </div>
      </div>
    `;

    // TOP RIGHT — reputation + money
    hud.innerHTML += `
      <div id="hud-topright" style="
        position:absolute; top:20px; right:20px; text-align:right;
        color:white;
      ">
        <div style="font-size:14px;color:#ffd700;letter-spacing:1px;margin-bottom:4px;">
          $ 1,000,000,000
        </div>
        <div style="font-size:10px;color:#aaa;letter-spacing:2px;">REPUTATION: LEGEND</div>
        <div style="
          width:160px; height:8px; background:#333;
          border-radius:4px; margin-top:5px; margin-left:auto;
          overflow:hidden;
        ">
          <div id="rep-bar" style="
            width:85%; height:100%;
            background: linear-gradient(90deg, #9900ff, #ff00aa);
            border-radius:4px;
            box-shadow: 0 0 8px #9900ff;
          "></div>
        </div>
        <div style="margin-top:6px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Lamborghini_Logo.svg/120px-Lamborghini_Logo.svg.png"
            style="width:28px;opacity:0.8;" onerror="this.style.display='none'">
        </div>
      </div>
    `;

    // BOTTOM LEFT — minimap + location
    hud.innerHTML += `
      <div style="
        position:absolute; bottom:20px; left:20px;
      ">
        <canvas id="minimap" width="140" height="140" style="
          border-radius:50%;
          border:2px solid rgba(255,215,0,0.5);
          box-shadow:0 0 15px rgba(153,0,255,0.4);
          display:block;
        "></canvas>
        <div style="color:white;font-size:11px;letter-spacing:1px;margin-top:6px;
          text-shadow:0 0 8px rgba(0,0,0,0.9);">
          <div style="color:#ffd700;">LAMBO DOCKS</div>
          <div style="color:#888;font-size:10px;">LONG BEACH, CA</div>
        </div>
      </div>
    `;

    // BOTTOM RIGHT — controls
    hud.innerHTML += `
      <div style="
        position:absolute; bottom:20px; right:20px; text-align:right;
        color:white; font-size:11px; letter-spacing:1px;
      ">
        <div style="margin-bottom:6px;">
          <span style="
            background:rgba(255,255,255,0.15); padding:3px 8px;
            border-radius:3px; margin-right:6px; font-size:10px;
          ">E</span>
          <span style="color:#aaa;">INTERACT</span>
        </div>
        <div>
          <span style="
            background:rgba(255,255,255,0.15); padding:3px 8px;
            border-radius:3px; margin-right:6px; font-size:10px;
          ">F</span>
          <span style="color:#aaa;">PHONE</span>
        </div>
      </div>
    `;

    // BOTTOM CENTER — WASD hint
    hud.innerHTML += `
      <div id="wasd-hint" style="
        position:absolute; bottom:12px; left:50%; transform:translateX(-50%);
        color:rgba(255,255,255,0.4); font-size:10px; letter-spacing:2px;
      ">WASD TO MOVE</div>
    `;

    document.body.appendChild(hud);
    this._drawMinimap();

    // FADE WASD HINT after 5s
    setTimeout(() => {
      const hint = document.getElementById('wasd-hint');
      if (hint) hint.style.transition = 'opacity 2s', hint.style.opacity = '0';
    }, 5000);
  },

  _drawMinimap() {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 70, cy = 70;

    // BG
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fill();

    // DOCK LINE
    ctx.strokeStyle = '#8b5e3c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 50);
    ctx.lineTo(cx, cy - 50);
    ctx.stroke();

    // WATER
    ctx.fillStyle = 'rgba(0,100,150,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.fill();

    // DOCK OVERLAY
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(cx - 5, cy - 50, 10, 100);

    // YACHT
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 20, cy - 10, 20, 8);

    // STAGE
    ctx.fillStyle = '#9900ff';
    ctx.fillRect(cx - 15, cy - 55, 30, 8);

    // PLAYER DOT
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(cx, cy + 20, 4, 0, Math.PI * 2);
    ctx.fill();

    // COMPASS N
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy - 56);
  },

  update(delta, context) {
    // Update player dot on minimap dynamically
    const player = context.player;
    if (!player) return;
    this._drawMinimapWithPlayer(player.position);
  },

  _drawMinimapWithPlayer(pos) {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 70, cy = 70;
    const scale = 0.8;

    ctx.clearRect(0, 0, 140, 140);

    // CLIP CIRCLE
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.clip();

    // BG WATER
    ctx.fillStyle = 'rgba(0,60,100,0.85)';
    ctx.fillRect(0, 0, 140, 140);

    // DOCK
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(cx - 5, 10, 10, 120);

    // STAGE
    ctx.fillStyle = '#9900ff';
    ctx.fillRect(cx - 15, 8, 30, 8);

    // YACHT
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 22, cy - 8, 20, 7);

    // PLAYER DOT
    const px = cx + pos.x * scale;
    const py = cy + pos.z * scale;
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // GLOW
    ctx.fillStyle = 'rgba(255,50,0,0.3)';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // COMPASS
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px Arial Black';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 16);
  }
};
