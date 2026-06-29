export default {
  _boardingPassShown: false,

  init() {
    this._buildHUD();
    this._initMusicPlayer();
  },

  _buildHUD() {
    // REMOVE OLD HUD IF EXISTS
    var old = document.getElementById('hud');
    if (old) old.remove();

    var hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:100;
      font-family:'Arial Black',Arial,sans-serif;
    `;
    document.body.appendChild(hud);

    // TOP LEFT — missions
    this._add(hud, `
      <div style="position:absolute;top:20px;left:20px;color:white;">
        <div style="color:#ffd700;font-size:13px;letter-spacing:2px;">WELCOME TO LAMBO CITY</div>
        <div style="color:#aaa;font-size:11px;margin-top:5px;">◆ Walk the Dock</div>
        <div style="color:#aaa;font-size:11px;margin-top:2px;">◈ Reach the Stage</div>
        <div style="color:#aaa;font-size:11px;margin-top:2px;">◈ Earn Boarding Pass</div>
      </div>
    `);

    // TOP RIGHT — money + rep
    this._add(hud, `
      <div style="position:absolute;top:20px;right:20px;text-align:right;color:white;">
        <div style="color:#ffd700;font-size:15px;font-weight:bold;">$ 1,000,000,000</div>
        <div style="color:#aaa;font-size:10px;letter-spacing:2px;margin-top:2px;">REPUTATION: LEGEND</div>
        <div style="width:160px;height:8px;background:#222;border-radius:4px;
          margin-top:5px;margin-left:auto;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
          <div style="width:72%;height:100%;
            background:linear-gradient(90deg,#9900ff,#ff00aa);
            border-radius:4px;box-shadow:0 0 8px #9900ff;"></div>
        </div>
      </div>
    `);

    // TOP CENTER — music player
    this._add(hud, `
      <div id="music-hud" style="
        position:absolute;top:16px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.75);
        border:1px solid rgba(255,215,0,0.35);
        border-radius:24px;padding:7px 18px;
        display:flex;align-items:center;gap:10px;
        pointer-events:all;
        box-shadow:0 0 20px rgba(153,0,255,0.25);
        white-space:nowrap;
      ">
        <div style="color:#9900ff;font-size:16px;">♪</div>
        <div>
          <div style="color:#ffd700;font-size:9px;letter-spacing:2px;">NOW PLAYING</div>
          <div style="color:white;font-size:11px;">LAMBO CITY — THE TAKEOVER</div>
        </div>
        <div style="width:70px;height:3px;background:#333;border-radius:2px;overflow:hidden;">
          <div id="music-progress" style="width:0%;height:100%;
            background:linear-gradient(90deg,#9900ff,#ff00aa);border-radius:2px;
            transition:width 0.1s linear;"></div>
        </div>
        <button id="music-btn" style="
          background:linear-gradient(135deg,#9900ff,#ff00aa);
          border:none;border-radius:50%;width:28px;height:28px;
          color:white;font-size:13px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 10px rgba(153,0,255,0.5);
        ">▶</button>
      </div>
    `);

    // BOTTOM LEFT — minimap
    this._add(hud, `
      <div style="position:absolute;bottom:20px;left:20px;">
        <canvas id="minimap" width="140" height="140" style="
          border-radius:50%;
          border:2px solid rgba(255,215,0,0.5);
          box-shadow:0 0 15px rgba(153,0,255,0.4);
          display:block;
        "></canvas>
        <div style="color:#ffd700;font-size:11px;margin-top:6px;letter-spacing:1px;">LAMBO DOCKS</div>
        <div style="color:#888;font-size:10px;">LONG BEACH, CA</div>
      </div>
    `);

    // BOTTOM CENTER — boarding pass
    this._add(hud, `
      <div style="position:absolute;bottom:22px;left:50%;transform:translateX(-50%);text-align:center;">
        <div style="color:#ffd700;font-size:9px;letter-spacing:2px;margin-bottom:4px;">
          BOARDING PASS PROGRESS
        </div>
        <div style="width:220px;height:6px;background:#222;border-radius:3px;
          overflow:hidden;border:1px solid rgba(255,215,0,0.3);">
          <div id="bp-bar" style="width:0%;height:100%;
            background:linear-gradient(90deg,#ffd700,#ff8800);
            border-radius:3px;box-shadow:0 0 6px #ffd700;
            transition:width 0.8s ease;"></div>
        </div>
        <div id="bp-label" style="color:#666;font-size:9px;margin-top:3px;letter-spacing:1px;">
          WALK THE DOCK TO EARN ACCESS
        </div>
      </div>
    `);

    // BOTTOM RIGHT — controls
    this._add(hud, `
      <div style="position:absolute;bottom:20px;right:20px;color:white;
        font-size:11px;text-align:right;letter-spacing:1px;">
        <div style="margin-bottom:6px;">
          <span style="background:rgba(255,255,255,0.15);padding:3px 8px;
            border-radius:3px;margin-right:6px;">E</span>
          <span style="color:#aaa;">INTERACT</span>
        </div>
        <div>
          <span style="background:rgba(255,255,255,0.15);padding:3px 8px;
            border-radius:3px;margin-right:6px;">F</span>
          <span style="color:#aaa;">PHONE</span>
        </div>
      </div>
    `);

    this._drawMinimap(null);
  },

  _add(parent, html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    parent.appendChild(div.firstElementChild);
  },

  _initMusicPlayer() {
    var self = this;
    var playing = false;
    var progress = 0;
    var interval = null;

    setTimeout(function() {
      var btn = document.getElementById('music-btn');
      if (!btn) return;
      btn.addEventListener('click', function() {
        playing = !playing;
        btn.textContent = playing ? '⏸' : '▶';
        if (playing) {
          interval = setInterval(function() {
            progress = (progress + 0.2) % 100;
            var bar = document.getElementById('music-progress');
            if (bar) bar.style.width = progress + '%';
          }, 100);
        } else {
          clearInterval(interval);
        }
      });
    }, 500);
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

    ctx.fillStyle = 'rgba(0,30,60,0.95)';
    ctx.fillRect(0, 0, 140, 140);

    // DOCK
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(cx - 5, 15, 10, 115);

    // WATER
    ctx.fillStyle = 'rgba(0,60,120,0.6)';
    ctx.fillRect(0, 0, cx - 5, 140);
    ctx.fillRect(cx + 5, 0, 70, 140);

    // STAGE
    ctx.fillStyle = '#9900ff';
    ctx.fillRect(cx - 15, 10, 30, 8);

    // YACHT
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(cx + 22, cy - 5, 18, 6);

    // CARS
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(cx - 20, cy + 5, 5, 3);
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(cx + 16, cy + 5, 5, 3);

    // PLAYER
    var px = playerPos ? cx + playerPos.x * 0.75 : cx;
    var py = playerPos ? cy + playerPos.z * 0.75 : cy + 18;
    ctx.fillStyle = 'rgba(255,50,0,0.3)';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 14);
  },

  update(delta, context) {
    var player = context.player;
    if (!player) return;

    this._drawMinimap(player.position);

    // BOARDING PASS — fills as player walks toward stage (z goes from 10 to -75)
    var startZ = 10;
    var endZ = -75;
    var range = startZ - endZ;
    var walked = startZ - player.position.z;
    var progress = Math.min(100, Math.max(0, (walked / range) * 100));

    var bpBar = document.getElementById('bp-bar');
    var bpLabel = document.getElementById('bp-label');
    if (bpBar) bpBar.style.width = progress + '%';
    if (bpLabel) {
      if (progress < 25) {
        bpLabel.textContent = 'WALK THE DOCK TO EARN ACCESS';
        bpLabel.style.color = '#666';
      } else if (progress < 60) {
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

  _showBoardingPass() {
    if (this._boardingPassShown) return;
    this._boardingPassShown = true;

    var card = document.createElement('div');
    card.style.cssText = `
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:linear-gradient(135deg,#0a0020,#1a0040);
      border:2px solid #ffd700;border-radius:16px;
      padding:30px 40px;color:white;text-align:center;
      z-index:500;pointer-events:all;
      box-shadow:0 0 60px rgba(255,215,0,0.4),0 0 120px rgba(153,0,255,0.2);
    `;
    card.innerHTML = `
      <div style="color:#ffd700;font-size:10px;letter-spacing:4px;margin-bottom:8px;">✦ CONGRATULATIONS ✦</div>
      <div style="font-size:22px;font-weight:bold;letter-spacing:3px;margin-bottom:12px;">BOARDING PASS</div>
      <div style="border:1px solid rgba(255,215,0,0.3);border-radius:8px;
        padding:14px 20px;margin:12px 0;background:rgba(255,215,0,0.05);">
        <div style="color:#ffd700;font-size:12px;letter-spacing:2px;">LAMBO CITY YACHT CLUB</div>
        <div style="color:#aaa;font-size:10px;margin-top:4px;">VIP ACCESS — FINANCIAL DISTRICT</div>
        <div style="font-size:30px;letter-spacing:6px;margin:10px 0;
          color:#ffd700;font-weight:bold;text-shadow:0 0 20px rgba(255,215,0,0.5);">
          LC-2024
        </div>
        <div style="color:#666;font-size:9px;letter-spacing:1px;">CITIZEN OF LAMBO CITY</div>
      </div>
      <div style="color:#aaa;font-size:11px;line-height:1.6;margin-bottom:16px;">
        You've unlocked access to exclusive<br>
        financial tools & the Yacht Club.
      </div>
      <button onclick="this.parentElement.remove()" style="
        background:linear-gradient(90deg,#9900ff,#ff00aa);
        border:none;border-radius:20px;color:white;
        padding:10px 28px;font-size:12px;letter-spacing:2px;
        cursor:pointer;box-shadow:0 0 20px rgba(153,0,255,0.5);
      ">ENTER THE YACHT CLUB →</button>
    `;
    document.body.appendChild(card);
  }
};
