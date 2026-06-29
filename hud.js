export default {
  init() {
    this._buildHUD();
  },

  _buildHUD() {
    const hud = document.createElement('div');
    hud.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:100;font-family:Arial,sans-serif;
    `;

    // TOP LEFT
    const tl = document.createElement('div');
    tl.style.cssText = 'position:absolute;top:20px;left:20px;color:white;';
    tl.innerHTML = `
      <div style="color:#ffd700;font-size:13px;letter-spacing:2px;">WELCOME TO LAMBO CITY</div>
      <div style="color:#aaa;font-size:11px;margin-top:4px;">◆ Walk the Dock</div>
      <div style="color:#aaa;font-size:11px;margin-top:2px;">◈ Reach the Stage</div>
    `;
    hud.appendChild(tl);

    // TOP RIGHT
    const tr = document.createElement('div');
    tr.style.cssText = 'position:absolute;top:20px;right:20px;color:white;text-align:right;';
    tr.innerHTML = `
      <div style="color:#ffd700;font-size:14px;">$ 1,000,000,000</div>
      <div style="color:#aaa;font-size:10px;letter-spacing:2px;margin-top:2px;">REPUTATION: LEGEND</div>
      <div style="width:160px;height:8px;background:#333;border-radius:4px;margin-top:5px;margin-left:auto;overflow:hidden;">
        <div style="width:85%;height:100%;background:linear-gradient(90deg,#9900ff,#ff00aa);border-radius:4px;"></div>
      </div>
    `;
    hud.appendChild(tr);

    // BOTTOM LEFT — minimap
    const bl = document.createElement('div');
    bl.style.cssText = 'position:absolute;bottom:20px;left:20px;';
    bl.innerHTML = `
      <canvas id="minimap" width="140" height="140" style="border-radius:50%;border:2px solid rgba(255,215,0,0.5);display:block;"></canvas>
      <div style="color:#ffd700;font-size:11px;margin-top:6px;">LAMBO DOCKS</div>
      <div style="color:#888;font-size:10px;">LONG BEACH, CA</div>
    `;
    hud.appendChild(bl);

    // BOTTOM RIGHT
    const br = document.createElement('div');
    br.style.cssText = 'position:absolute;bottom:20px;right:20px;color:white;font-size:11px;text-align:right;';
    br.innerHTML = `
      <div style="margin-bottom:6px;"><span style="background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:3px;">E</span> INTERACT</div>
      <div><span style="background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:3px;">F</span> PHONE</div>
    `;
    hud.appendChild(br);

    document.body.appendChild(hud);
    this._drawMinimap();
  },

  _drawMinimap(playerPos) {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 70, cy = 70;

    ctx.clearRect(0, 0, 140, 140);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.clip();

    // water bg
    ctx.fillStyle = 'rgba(0,60,100,0.85)';
    ctx.fillRect(0, 0, 140, 140);

    // dock
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(cx - 5, 10, 10, 120);

    // stage
    ctx.fillStyle = '#9900ff';
    ctx.fillRect(cx - 15, 8, 30, 8);

    // yacht
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 22, cy - 8, 20, 7);

    // player dot
    const px = playerPos ? cx + playerPos.x * 0.8 : cx;
    const py = playerPos ? cy + playerPos.z * 0.8 : cy + 20;
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // compass
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 14);
  },

  update(delta, context) {
    if (context.player) {
      this._drawMinimap(context.player.position);
    }
  }
};
