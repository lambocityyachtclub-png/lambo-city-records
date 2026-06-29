export default {
  init() {
    this.reputation = 0;
    this.maxRep = 100;
    this._buildHUD();
    this._startMusicPlayer();
  },

  _buildHUD() {
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:100;font-family:Arial,sans-serif;
    `;

    // TOP LEFT
    const tl = document.createElement('div');
    tl.style.cssText = 'position:absolute;top:20px;left:20px;color:white;';
    tl.innerHTML = `
      <div style="color:#ffd700;font-size:13px;letter-spacing:2px;font-weight:bold;">
        WELCOME TO LAMBO CITY
      </div>
      <div style="color:#aaa;font-size:11px;margin-top:6px;">◆ Walk the Dock</div>
      <div style="color:#aaa;font-size:11px;margin-top:2px;">◈ Reach the Stage</div>
      <div style="color:#aaa;font-size:11px;margin-top:2px;">◈ Find the Boarding Pass</div>
    `;
    hud.appendChild(tl);

    // TOP RIGHT
    const tr = document.createElement('div');
    tr.style.cssText = 'position:absolute;top:20px;right:20px;color:white;text-align:right;';
    tr.innerHTML = `
      <div style="color:#ffd700;font-size:15px;font-weight:bold;">$ 1,000,000,000</div>
      <div style="color:#aaa;font-size:10px;letter-spacing:2px;margin-top:2px;">REPUTATION: LEGEND</div>
      <div style="
        width:160px;height:8px;background:#222;
        border-radius:4px;margin-top:5px;margin-left:auto;overflow:hidden;
        border:1px solid rgba(255,255,255,0.1);
      ">
        <div id="rep-bar" style="
          width:72%;height:100%;
          background:linear-gradient(90deg,#9900ff,#ff00aa);
          border-radius:4px;
          box-shadow:0 0 8px #9900ff;
          transition:width 0.5s ease;
        "></div>
      </div>
    `;
    hud.appendChild(tr);

    // BOTTOM LEFT — minimap
    const bl = document.createElement('div');
    bl.style.cssText = 'position:absolute;bottom:20px;left:20px;';
    bl.innerHTML = `
      <canvas id="minimap" width="140" height="140" style="
        border-radius:50%;
        border:2px solid rgba(255,215,0,0.5);
        box-shadow:0 0 15px rgba(153,0,255,0.4);
        display:block;
      "></canvas>
      <div style="color:#ffd700;font-size:11px;margin-top:6px;letter-spacing:1px;">LAMBO DOCKS</div>
      <div style="color:#888;font-size:10px;">LONG BEACH, CA</div>
    `;
    hud.appendChild(bl);

    // BOTTOM RIGHT — controls
    const br = document.createElement('div');
    br.style.cssText = `
      position:absolute;bottom:20px;right:20px;
      color:white;font-size:11px;text-align:right;letter-spacing:1px;
    `;
    br.innerHTML = `
      <div style="margin-bottom:6px;">
        <span style="background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:3px;margin-right:6px;">E</span>
        <span style="color:#aaa;">INTERACT</span>
      </div>
      <div>
        <span style="background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:3px;margin-right:6px;">F</span>
        <span style="color:#aaa;">PHONE</span>
      </div>
    `;
    hud.appendChild(br);

    // BOARDING PASS PROGRESS BAR
    const bp = document.createElement('div');
    bp.style.cssText = `
      position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
      text-align:center;color:white;
    `;
    bp.innerHTML = `
      <div style="font-size:10px;color:#ffd700;letter-spacing:2px;margin-bottom:4px;">
        BOARDING PASS PROGRESS
      </div>
      <div style="
        width:200px;height:6px;background:#222;
        border-radius:3px;overflow:hidden;
        border:1px solid rgba(255,215,0,0.3);
      ">
        <div id="bp-bar" style="
          width:0%;height:100%;
          background:linear-gradient(90deg,#ffd700,#ff8800);
          border-radius:3px;
          transition:width 1s ease;
          box-shadow:0 0 6px #ffd700;
        "></div>
      </div>
      <div id="bp-label" style="font-size:9px;color:#888;margin-top:3px;letter-spacing:1px;">
        WALK THE DOCK TO EARN ACCESS
      </div>
    `;
    hud.appendChild(bp);

    // MUSIC PLAYER
    const music = document.createElement('div');
    music.id = 'music-player';
    music.style.cssText = `
      position:absolute;top:20px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.7);
      border:1px solid rgba(255,215,0,0.3);
      border-radius:20px;padding:8px 20px;
      color:white;font-size:11px;letter-spacing:1px;
      display:flex;align-items:center;gap:12px;
      pointer-events:all;
      box-shadow:0 0 20px rgba(153,0,255,0.3);
    `;
    music.innerHTML = `
      <div style="color:#9900ff;font-size:14px;">♪</div>
      <div>
        <div style="color:#ffd700;font-size:10px;">NOW PLAYING</div>
        <div id="track-name" style="font-size:11px;color:white;">LAMBO CITY — THE TAKEOVER</div>
      </div>
      <div style="
        width:80px;height:3px;background:#333;border-radius:2px;overflow:hidden;
      ">
        <div id="music-bar" style="
          width:0%;height:100%;
          background:linear-gradient(90deg,#9900ff,#ff00aa);
          border-radius:2px;
        "></div>
      </div>
      <button id="music-btn" style="
        background:linear-gradient(90deg,#9900ff,#ff00aa);
        border:none;border-radius:50%;
        width:26px;height:26px;
        color:white;font-size:12px;
        cursor:pointer;display:flex;
        align-items:center;justify-content:center;
      ">▶</button>
    `;
    hud.appendChild(music);

    document.body.appendChild(hud);
    this._drawMinimap();
  },

  _startMusicPlayer() {
    var progress = 0;
    var playing = false;
    var interval = null;

    var btn  = document.getElementById('music-btn');
    var bar  = document.getElementById('music-bar');

    if (!btn) return;

    btn.addEventListener('click', function() {
      playing = !playing;
      btn.textContent = playing ? '⏸' : '▶';
      if (playing) {
        interval = setInterval(function() {
          progress = (progress + 0.3) % 100;
          if (bar) bar.style.width = progress + '%';
        }, 100);
      } else {
        clearInterval(interval);
      }
    });
  },

  _drawMinimap(playerPos) {
    var canvas = document.getElementById('minimap');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var cx = 70, cy = 70;

    ctx.clearRect(0, 0, 140, 140);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.clip();

    // WATER BG
    ctx.fillStyle = 'rgba(0,40,80,0.9)';
    ctx.fillRect(0, 0, 140, 140);

    // DOCK
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(cx - 5, 15, 10, 115);

    // STAGE
    ctx.fillStyle = '#9900ff';
    ctx.fillRect(cx - 15, 10, 30, 8);

    // YACHT
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 22, cy - 8, 20, 7);

    // CARS
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(cx - 20, cy + 5, 6, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 22, cy + 14, 6, 4);
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(cx + 16, cy + 5, 6, 4);

    // PLAYER DOT
    var px = playerPos ? cx + playerPos.x * 0.8 : cx;
    var py = playerPos ? cy + playerPos.z * 0.8 : cy + 15;
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,50,0,0.3)';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // COMPASS N
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 14);
  },

  update(delta, context) {
    var player = context.player;
    if (!player) return;

    this._drawMinimap(player.position);

    // BOARDING PASS PROGRESS based on distance walked toward stage
    var distToStage = Math.max(0, player.position.z + 75);
    var maxDist = 85;
    var progress = Math.min(100, ((maxDist - distToStage) / maxDist) * 100);

    var bpBar = document.getElementById('bp-bar');
    var bpLabel = document.getElementById('bp-label');
    if (bpBar) bpBar.style.width = progress + '%';
    if (bpLabel) {
      if (progress < 30) {
        bpLabel.textContent = 'WALK THE DOCK TO EARN ACCESS';
      } else if (progress < 70) {
        bpLabel.textContent = 'GETTING CLOSER — KEEP MOVING';
        bpLabel.style.color = '#ff8800';
      } else if (progress < 100) {
        bpLabel.textContent = 'ALMOST THERE — REACH THE STAGE';
        bpLabel.style.color = '#ffd700';
      } else {
        bpLabel.textContent = '✦ BOARDING PASS UNLOCKED ✦';
        bpLabel.style.color = '#ffd700';
        this._showBoardingPass();
      }
    }
  },

  _boardingPassShown: false,
  _showBoardingPass() {
    if (this._boardingPassShown) return;
    this._boardingPassShown = true;

    var card = document.createElement('div');
    card.style.cssText = `
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:linear-gradient(135deg,#0a0020,#1a0040);
      border:2px solid #ffd700;
      border-radius:16px;padding:30px 40px;
      color:white;text-align:center;
      z-index:500;
      box-shadow:0 0 60px rgba(255,215,0,0.4),0 0 120px rgba(153,0,255,0.2);
      animation:fadeIn 0.6s ease;
      pointer-events:all;
    `;
    card.innerHTML = `
      <div style="color:#ffd700;font-size:10px;letter-spacing:4px;margin-bottom:8px;">
        ✦ CONGRATULATIONS ✦
      </div>
      <div style="font-size:22px;font-weight:bold;letter-spacing:2px;margin-bottom:6px;">
        BOARDING PASS
      </div>
      <div style="
        border:1px solid rgba(255,215,0,0.3);
        border-radius:8px;padding:12px 20px;margin:12px 0;
        background:rgba(255,215,0,0.05);
      ">
        <div style="color:#ffd700;font-size:12px;letter-spacing:2px;">LAMBO CITY YACHT CLUB</div>
        <div style="color:#aaa;font-size:10px;margin-top:4px;">VIP ACCESS — FINANCIAL DISTRICT</div>
        <div style="
          font-size:28px;letter-spacing:6px;margin:8px 0;
          color:#ffd700;font-weight:bold;
        ">LC-2024</div>
        <div style="color:#666;font-size:9px;">HOLDER: CITIZEN OF LAMBO CITY</div>
      </div>
      <div style="color:#aaa;font-size:11px;margin-bottom:16px;">
        You've unlocked access to exclusive financial tools,<br>
        digital real estate & the Yacht Club.
      </div>
      <button onclick="this.closest('div[style]').remove()" style="
        background:linear-gradient(90deg,#9900ff,#ff00aa);
        border:none;border-radius:20px;
        color:white;padding:10px 28px;
        font-size:12px;letter-spacing:2px;
        cursor:pointer;
        box-shadow:0 0 20px rgba(153,0,255,0.5);
      ">ENTER THE YACHT CLUB →</button>
    `;
    document.body.appendChild(card);
  }
};
