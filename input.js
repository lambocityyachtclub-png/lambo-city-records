export default {
  keys: {},
  joystick: {x:0,y:0,active:false},
  _touchId: null, _centerX:0, _centerY:0, _radius:55,
  init() {
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase()==='f') this._togglePhone();
    });
    window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()]=false; });
    this._buildJoystick();
    this._buildMobileButtons();
  },
  _buildJoystick() {
    const self = this;
    const zone = document.createElement('div');
    zone.style.cssText=`position:fixed;bottom:30px;left:30px;width:130px;height:130px;z-index:300;pointer-events:all;`;
    const base = document.createElement('div');
    base.style.cssText=`width:120px;height:120px;border-radius:50%;background:rgba(0,0,0,0.35);border:2px solid rgba(255,215,0,0.25);position:relative;`;
    const knob = document.createElement('div');
    knob.style.cssText=`width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#9900ff,#ff00aa);box-shadow:0 0 18px rgba(153,0,255,0.7);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);`;
    base.appendChild(knob); zone.appendChild(base); document.body.appendChild(zone);
    zone.addEventListener('touchstart',e=>{
      e.preventDefault();
      const t=e.changedTouches[0]; self._touchId=t.identifier;
      const r=base.getBoundingClientRect();
      self._centerX=r.left+r.width/2; self._centerY=r.top+r.height/2;
      self.joystick.active=true;
    },{passive:false});
    window.addEventListener('touchmove',e=>{
      if(!self.joystick.active)return;
      let t=null;
      for(let i=0;i<e.touches.length;i++){if(e.touches[i].identifier===self._touchId){t=e.touches[i];break;}}
      if(!t)return; e.preventDefault();
      let dx=t.clientX-self._centerX, dy=t.clientY-self._centerY;
      const dist=Math.sqrt(dx*dx+dy*dy), maxR=self._radius;
      if(dist>maxR){dx=(dx/dist)*maxR;dy=(dy/dist)*maxR;}
      self.joystick.x=dx/maxR; self.joystick.y=dy/maxR;
      knob.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    },{passive:false});
    window.addEventListener('touchend',e=>{
      for(let i=0;i<e.changedTouches.length;i++){
        if(e.changedTouches[i].identifier===self._touchId){
          self.joystick.x=0;self.joystick.y=0;self.joystick.active=false;self._touchId=null;
          knob.style.transform='translate(-50%,-50%)'; break;
        }
      }
    });
  },
  _buildMobileButtons() {
    const self=this;
    const btns=document.createElement('div');
    btns.style.cssText=`position:fixed;bottom:40px;right:30px;display:flex;flex-direction:column;gap:12px;z-index:300;pointer-events:all;`;
    btns.appendChild(this._makeBtn('E','#9900ff',()=>{self.keys['e']=true;setTimeout(()=>{self.keys['e']=false;},200);}));
    btns.appendChild(this._makeBtn('F','#ff00aa',()=>self._togglePhone()));
    document.body.appendChild(btns);
  },
  _makeBtn(label,color,fn) {
    const btn=document.createElement('button');
    btn.textContent=label;
    btn.style.cssText=`width:54px;height:54px;border-radius:50%;background:${color};border:none;color:white;font-size:18px;font-weight:bold;cursor:pointer;opacity:0.85;`;
    btn.addEventListener('touchstart',e=>{e.preventDefault();fn();},{passive:false});
    btn.addEventListener('click',fn);
    return btn;
  },
  _phoneOpen:false,
  _togglePhone() {
    this._phoneOpen=!this._phoneOpen;
    const ex=document.getElementById('phone-ui');
    if(ex){ex.remove();return;}
    this._openPhone();
  },
  _openPhone() {
    const phone=document.createElement('div');
    phone.id='phone-ui';
    phone.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:280px;background:linear-gradient(180deg,#0a0020,#050010);border:2px solid rgba(255,215,0,0.4);border-radius:28px;z-index:400;pointer-events:all;box-shadow:0 0 60px rgba(153,0,255,0.4);overflow:hidden;font-family:Arial,sans-serif;`;
    const apps=['🎵 MUSIC','🏠 REAL ESTATE','💎 NFT STUDIO','📈 PORTFOLIO','🎥 TIKTOK','▶ YOUTUBE','📸 INSTAGRAM','🎓 COURSES'];
    phone.innerHTML=`<div style="background:linear-gradient(135deg,#1a0040,#0a0020);padding:20px;text-align:center;border-bottom:1px solid rgba(255,215,0,0.15);"><div style="color:#ffd700;font-size:9px;letter-spacing:3px;">LAMBO CITY</div><div style="color:white;font-size:24px;margin:6px 0;">📱</div><div style="color:#aaa;font-size:10px;">CITIZEN PHONE</div></div><div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">${apps.map(a=>`<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 8px;text-align:center;cursor:pointer;"><div style="font-size:22px;">${a.split(' ')[0]}</div><div style="color:white;font-size:9px;margin-top:5px;letter-spacing:1px;">${a.split(' ').slice(1).join(' ')}</div></div>`).join('')}</div><div style="padding:0 16px 20px;text-align:center;"><button onclick="document.getElementById('phone-ui').remove()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:20px;color:white;padding:8px 30px;font-size:12px;cursor:pointer;">CLOSE</button></div>`;
    document.body.appendChild(phone);
  },
  update() {}
};
