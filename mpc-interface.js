// mpc-interface.js
// LAMBO CITY RECORDS — Full-screen MPC hardware interface.

import StudioAudioEngine from "./studioAudioEngine.js";
import StudioMPCLibrary from "./studioMPCLibrary.js";
import StudioMPCSampler from "./studioMPCSampler.js";
import Floor2StudioApp from "./floor2StudioApp.js";
// Standalone module: no Three.js dependency.
// Integration:
//   import MPCInterface from "./mpc-interface.js";
//   MPCInterface.open({ onClose: () => window.__lamboCityReturnToFloor2Room?.() });

const ROOT_ID = "lambo-city-mpc-interface";
const STYLE_ID = "lambo-city-mpc-interface-style";

const esc = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const icon = {
  sliders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 3v6M16 9v6M10 15v6"/></svg>',
  lines: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h11M4 18h16"/></svg>',
  gamepad: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9h10a4 4 0 0 1 3.8 5.2l-.7 2.3a2 2 0 0 1-3.2 1l-2.4-1.8h-5l-2.4 1.8a2 2 0 0 1-3.2-1l-.7-2.3A4 4 0 0 1 7 9Z"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"/></svg>',
  record: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18"/><circle cx="7" cy="6" r=".7"/><circle cx="10" cy="6" r=".7"/><path d="M7 12h10M7 16h6"/></svg>',
  window: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18"/></svg>',
  keys: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3z"/><path d="M7 5v8M11 5v8M15 5v8M19 5v8M5 13h2M9 13h2M13 13h2M17 13h2"/></svg>',
  note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 11h8M8 14h5"/><path d="m15 17 4-4 2 2-4 4-3 1z"/></svg>',
  apple: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c-2-3-6-2-7 1-2 5 2 11 5 11 1 0 1.5-.6 2-.6s1 .6 2 .6c3 0 7-6 5-11-1-3-5-4-7-1Z"/><path d="M12 7c0-3 2-4 4-4-1 2-2 3-4 4Z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5-4.8 2 2-4.8z"/></svg>',
  bluetooth: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10-5 4V3l5 4L7 17"/></svg>',
  battery: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="17" height="10" rx="2"/><path d="M22 10v4M6 10h10v4H6z"/></svg>',
  shield: '<svg viewBox="0 0 28 30" aria-hidden="true"><path d="M14 2 24 6v8c0 7-4.5 11-10 14C8.5 25 4 21 4 14V6z"/><path d="m8 8 2-4 4 3 4-3 2 4M9 13h10l-1 7h-8z"/><path d="M12 16h4"/></svg>'
};

function makeStyles() {
  return `
#${ROOT_ID},#${ROOT_ID} *{box-sizing:border-box}
#${ROOT_ID}{
  position:fixed;inset:0;z-index:100500;display:flex;align-items:center;justify-content:center;
  padding:clamp(0px,1.4vw,18px);overflow:auto;background:
  radial-gradient(ellipse at 50% 20%,rgba(112,138,34,.18),transparent 52%),
  rgba(2,4,4,.97);color:#e8e9df;font-family:Arial,Helvetica,sans-serif;
  -webkit-tap-highlight-color:transparent;overscroll-behavior:contain;
}
#${ROOT_ID} button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation}
#${ROOT_ID} .mpc-unit{
  position:relative;width:min(100%,1500px);min-height:min(96dvh,940px);padding:clamp(8px,1.2vw,17px);
  border:1px solid #806a3c;border-radius:clamp(10px,1.4vw,20px);
  background:linear-gradient(145deg,#25282a 0%,#090b0d 35%,#17191a 70%,#050607 100%);
  box-shadow:0 28px 90px #000,0 0 0 2px #080909, inset 0 1px 0 #77715b;
  display:flex;flex-direction:column;gap:clamp(7px,.8vw,12px);isolation:isolate;
}
#${ROOT_ID} .mpc-nameplate{
  min-height:clamp(42px,6.2vw,76px);display:flex;align-items:center;justify-content:center;gap:clamp(8px,1.4vw,20px);
  position:relative;overflow:hidden;border:1px solid #d1b77a;border-radius:7px;padding:5px 42px;
  color:#173b20;background:linear-gradient(110deg,#6e5129 0%,#d8c18b 17%,#9d824d 32%,#ead9a9 50%,#9b804b 72%,#dfc88e 88%,#72572e 100%);
  box-shadow:inset 0 1px 2px #fff8c8,inset 0 -3px 7px #38280e,0 2px 8px #000;
}
#${ROOT_ID} .mpc-nameplate:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(174deg,transparent 0 3px,rgba(255,255,255,.12) 4px,transparent 5px 8px);opacity:.45;pointer-events:none}
#${ROOT_ID} .brand-script{position:relative;font-family:"Brush Script MT","Segoe Script",cursive;font-style:italic;font-weight:700;font-size:clamp(25px,4vw,48px);line-height:1;text-shadow:0 1px 0 #e6d7a8}
#${ROOT_ID} .brand-records{position:relative;font-size:clamp(12px,1.7vw,20px);font-weight:900;letter-spacing:.12em;align-self:center;margin-top:8px}
#${ROOT_ID} .mpc-close{
  position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:3;width:32px;height:32px;border:1px solid #594927;border-radius:50%;
  background:linear-gradient(#343a35,#101411);color:#e4d19a;font-size:20px;line-height:1;box-shadow:0 0 10px #000;
}
#${ROOT_ID} .mpc-upper{display:grid;grid-template-columns:minmax(0,2.2fr) minmax(130px,.72fr);gap:clamp(8px,1vw,15px);min-height:clamp(205px,28vw,330px)}
#${ROOT_ID} .mpc-screen-frame{min-width:0;position:relative;padding:clamp(5px,.8vw,10px);border:2px solid #050607;border-radius:13px;background:linear-gradient(145deg,#292c2d,#070808 40%,#1d2020);box-shadow:inset 0 0 0 1px #5b5e59,0 5px 14px #000}
#${ROOT_ID} .mpc-screen-frame:after{content:"";position:absolute;right:8px;top:7px;width:32%;height:25%;pointer-events:none;background:linear-gradient(135deg,transparent 20%,rgba(255,255,255,.075),transparent 72%);transform:skewX(-18deg);border-radius:8px}
#${ROOT_ID} .mpc-screen{height:100%;min-height:195px;overflow:hidden;border:1px solid #65713b;border-radius:5px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.018) 0 2px,transparent 2px 8px),linear-gradient(145deg,#24291b,#10150e 70%,#20251a);display:flex;flex-direction:column}
#${ROOT_ID} .screen-header{min-height:29px;display:flex;align-items:center;gap:clamp(4px,.8vw,12px);padding:4px 8px;background:linear-gradient(#9fca35,#638c1d);color:#14220b;font-size:clamp(8px,.85vw,12px);font-weight:900;letter-spacing:.045em;white-space:nowrap}
#${ROOT_ID} .crest{width:20px;height:22px;flex:0 0 auto;stroke:#18320e;fill:none;stroke-width:1.7}
#${ROOT_ID} .project-title{overflow:hidden;text-overflow:ellipsis;flex:1}
#${ROOT_ID} .screen-stat{display:flex;align-items:center;gap:3px}
#${ROOT_ID} .screen-stat svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8}
#${ROOT_ID} .screen-body{padding:clamp(5px,.8vw,11px);display:flex;flex-direction:column;gap:clamp(6px,.8vw,10px);flex:1}
#${ROOT_ID} .tile-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:clamp(3px,.55vw,8px)}
#${ROOT_ID} .screen-tile{min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid transparent;background:transparent;padding:3px 2px;color:#e1e4d7}
#${ROOT_ID} .screen-tile.active{border-color:#e9efdc;border-radius:4px;background:rgba(255,255,255,.06);box-shadow:0 0 7px rgba(228,255,185,.28)}
#${ROOT_ID} .tile-icon{height:clamp(26px,3.2vw,43px);width:100%;display:flex;align-items:center;justify-content:center;border:1px solid #4e573b;border-radius:3px;background:linear-gradient(145deg,#343a2a,#171d14);color:#d4e5a7}
#${ROOT_ID} .tile-icon svg{width:clamp(17px,2vw,26px);height:clamp(17px,2vw,26px);stroke:currentColor;fill:none;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
#${ROOT_ID} .tile-label{font-size:clamp(6px,.65vw,9px);font-weight:800;white-space:nowrap;letter-spacing:.025em}
#${ROOT_ID} .screen-lower{display:grid;grid-template-columns:minmax(0,1fr) minmax(80px,.38fr);gap:8px;align-items:end}
#${ROOT_ID} .lower-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
#${ROOT_ID} .lower-tile .tile-icon{height:clamp(23px,2.8vw,35px)}
#${ROOT_ID} .meter{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;align-items:end;height:55px;padding:3px 2px 2px;border-left:1px solid #475237}
#${ROOT_ID} .meter-col{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:2px;min-width:0}
#${ROOT_ID} .meter-top,#${ROOT_ID} .meter-bottom{font-size:clamp(5px,.48vw,7px);color:#d0d8b8;line-height:1}
#${ROOT_ID} .meter-bar{width:100%;height:var(--bar);background:linear-gradient(90deg,#6e9e25,#c3ed56);box-shadow:0 0 5px #8fc834}
#${ROOT_ID} .dots{display:flex;justify-content:center;gap:7px;padding:0}
#${ROOT_ID} .dots i{width:5px;height:5px;border-radius:50%;background:#62685b}
#${ROOT_ID} .dots i:first-child{background:#fff;box-shadow:0 0 5px #fff}
#${ROOT_ID} .screen-tabs{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid #4c5639;margin-top:auto}
#${ROOT_ID} .screen-tab{padding:6px 2px 5px;background:transparent;border:0;border-bottom:2px solid transparent;font-size:clamp(6px,.68vw,9px);font-weight:900;white-space:nowrap;color:#cbd2b8}
#${ROOT_ID} .screen-tab.active{border-bottom-color:#a6e33d;color:#c4f36d}
#${ROOT_ID} .knob-column{display:flex;flex-direction:column;justify-content:space-around;align-items:center;padding:4px 2px;border:1px solid #383b34;border-radius:10px;background:linear-gradient(150deg,#202321,#080a09);box-shadow:inset 0 0 10px #000}
#${ROOT_ID} .knob{width:clamp(35px,4.7vw,58px);height:clamp(35px,4.7vw,58px);border-radius:50%;position:relative;background:radial-gradient(circle at 36% 28%,#7a7c73,#292b27 43%,#090b09 72%);border:3px solid #9aa05e;box-shadow:0 0 0 3px #38421b,0 0 13px #91cf2d, inset 0 2px 5px #b7b8a5,0 4px 7px #000}
#${ROOT_ID} .knob:before{content:"";position:absolute;inset:5px;border-radius:50%;background:repeating-conic-gradient(#b3a36d 0 2deg,#514b35 2deg 5deg);box-shadow:inset 0 0 4px #000}
#${ROOT_ID} .knob:after{content:"";position:absolute;left:50%;top:3px;height:9px;width:2px;background:#e6d49b;transform:translateX(-50%);box-shadow:0 0 4px #d7ef88}
#${ROOT_ID} .led-row{display:flex;gap:7px}
#${ROOT_ID} .led{width:7px;height:7px;border-radius:50%;background:#4b4d48;box-shadow:inset 0 1px 2px #111}
#${ROOT_ID} .led.on{background:#a9f344;box-shadow:0 0 8px #9df13a}
#${ROOT_ID} .qlink{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:9px;font-weight:900;letter-spacing:.08em}
#${ROOT_ID} .small-hardware{width:27px;height:18px;border:1px solid #6d7547;border-radius:4px;background:linear-gradient(#42473b,#141713);box-shadow:inset 0 1px 3px #000}
#${ROOT_ID} .bank{width:100%;padding:4px 2px}
#${ROOT_ID} .bank-title{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:900;letter-spacing:.2em;justify-content:center;margin-bottom:7px}
#${ROOT_ID} .bank-title:before,#${ROOT_ID} .bank-title:after{content:"";height:1px;background:#8c8d68;flex:1}
#${ROOT_ID} .bank-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}
#${ROOT_ID} .bank-cell{display:flex;flex-direction:column;gap:2px;align-items:stretch}
#${ROOT_ID} .bank-btn{height:24px;border:1px solid #51544b;border-radius:4px;background:linear-gradient(#30332f,#101210);font-size:11px;font-weight:900}
#${ROOT_ID} .bank-strip{height:8px;border:1px solid #77a52d;background:#18230d;color:#b5eb4a;text-align:center;font-size:6px;line-height:6px;box-shadow:0 0 5px rgba(145,211,44,.5)}
#${ROOT_ID} .mpc-main{display:grid;grid-template-columns:minmax(48px,.55fr) minmax(0,3.1fr) minmax(115px,1.25fr);gap:clamp(6px,.8vw,12px);min-height:0}
#${ROOT_ID} .left-column{display:flex;flex-direction:column;justify-content:space-between;gap:5px}
#${ROOT_ID} .hardware-control{display:flex;flex-direction:column;align-items:stretch;gap:3px;min-width:0}
#${ROOT_ID} .hw-button{min-height:clamp(28px,3.4vw,43px);border:1px solid #4b4e45;border-radius:5px;background:linear-gradient(145deg,#3a3d38,#151815 65%,#080a08);color:#d9ddd1;font-size:clamp(6px,.68vw,9px);font-weight:900;letter-spacing:.025em;box-shadow:inset 0 1px 2px rgba(255,255,255,.12),0 2px 4px #000;padding:3px 2px}
#${ROOT_ID} .hw-button.lit{background:linear-gradient(145deg,#d2f879,#78b82b 55%,#3e7018);border-color:#d5ff8c;color:#14210a;box-shadow:0 0 10px rgba(154,235,54,.72),inset 0 1px 2px #f4ffd9}
#${ROOT_ID} .label-strip{min-height:11px;padding:2px 1px;border:1px solid #739b2b;border-radius:2px;background:linear-gradient(#202d13,#10170b);color:#b7e45b;text-align:center;font-size:clamp(5px,.55vw,7px);font-weight:900;letter-spacing:.06em;line-height:1}
#${ROOT_ID} .pads-area{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(5px,.8vw,12px);align-content:center;padding:2px}
#${ROOT_ID} .pad{position:relative;min-width:0;aspect-ratio:1/1;border:2px solid #9bdc36;border-radius:clamp(7px,1vw,13px);background:linear-gradient(145deg,#3a3d3b,#151817 55%,#090b0a);box-shadow:0 0 4px #a3e947,0 0 11px rgba(139,223,45,.55),inset 0 2px 5px rgba(255,255,255,.13),inset 0 -5px 9px #000;display:flex;align-items:center;justify-content:center;transition:filter .08s,transform .08s,box-shadow .08s}
#${ROOT_ID} .pad.red{border-color:#ff695d;box-shadow:0 0 4px #ff6258,0 0 12px rgba(255,76,67,.62),inset 0 2px 5px rgba(255,255,255,.12),inset 0 -5px 9px #000}
#${ROOT_ID} .pad:before{content:"";position:absolute;inset:5px;border:1px solid rgba(255,255,255,.08);border-radius:5px;pointer-events:none}
#${ROOT_ID} .pad:active,#${ROOT_ID} .pad.flash{transform:scale(.96);filter:brightness(1.9);box-shadow:0 0 12px #d9ff9a,0 0 28px #9fe943,inset 0 0 18px rgba(213,255,160,.4)}
#${ROOT_ID} .pad.red:active,#${ROOT_ID} .pad.red.flash{box-shadow:0 0 12px #ffb0a5,0 0 28px #ff5d53,inset 0 0 18px rgba(255,190,180,.4)}
#${ROOT_ID} .pad-label{position:absolute;bottom:-16px;left:0;right:0;text-align:center;font-size:clamp(6px,.68vw,9px);font-weight:900;color:#d6dacd;white-space:nowrap}
#${ROOT_ID} .pad-wrap{position:relative;margin-bottom:15px;min-width:0}
#${ROOT_ID} .right-controls{display:grid;grid-template-columns:minmax(42px,.62fr) minmax(0,1.8fr) minmax(45px,.68fr);gap:clamp(4px,.65vw,9px);align-items:stretch}
#${ROOT_ID} .side-stack{display:flex;flex-direction:column;justify-content:space-between;gap:5px}
#${ROOT_ID} .middle-controls{display:flex;flex-direction:column;gap:6px;justify-content:space-between}
#${ROOT_ID} .middle-top{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
#${ROOT_ID} .middle-top .hw-button{font-size:clamp(5px,.58vw,8px);min-height:31px}
#${ROOT_ID} .data-wheel-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px}
#${ROOT_ID} .data-wheel{width:clamp(48px,6.5vw,78px);aspect-ratio:1;border-radius:50%;border:5px solid #272b29;background:radial-gradient(circle at 35% 28%,#e4e5dc,#9a9d96 28%,#555a58 57%,#171a19 60%,#080a09 70%);box-shadow:0 0 0 2px #85877f,0 0 0 6px #121514,0 7px 12px #000,inset 0 0 7px #000;position:relative}
#${ROOT_ID} .data-wheel:after{content:"";position:absolute;inset:17%;border-radius:50%;border:1px solid rgba(255,255,255,.4);box-shadow:inset 0 0 7px rgba(0,0,0,.5)}
#${ROOT_ID} .wheel-buttons{display:flex;gap:8px}
#${ROOT_ID} .wheel-buttons button{width:25px;height:20px;border:1px solid #555a54;border-radius:4px;background:linear-gradient(#353934,#101310);font-weight:900}
#${ROOT_ID} .bottom-modes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(4px,.7vw,10px)}
#${ROOT_ID} .transport{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(4px,.7vw,10px);padding-top:5px;border-top:1px solid #343831}
#${ROOT_ID} .transport .hw-button{background:linear-gradient(#34382d,#171b12);min-height:clamp(27px,3vw,39px)}
#${ROOT_ID} .transport-item{position:relative}
#${ROOT_ID} .transport-led{position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:#42483b;box-shadow:inset 0 1px 2px #000}
#${ROOT_ID} .transport-led.on{background:#a5ef3d;box-shadow:0 0 7px #9be83b}
#${ROOT_ID} .mpc-footer{display:flex;justify-content:space-between;align-items:center;color:#737a6b;font-size:7px;letter-spacing:.12em;padding:0 3px}
#${ROOT_ID} button:focus-visible{outline:2px solid #d3ff81;outline-offset:2px}
#${ROOT_ID} .mpc-library-strip{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center;padding:7px;border:1px solid #4c4b3e;border-radius:7px;background:linear-gradient(145deg,#171b17,#080a08)}
#${ROOT_ID} .mpc-library-strip label{display:flex;align-items:center;gap:7px;min-width:0;color:#d9d9c8;font-size:9px;font-weight:900;letter-spacing:.08em}
#${ROOT_ID} .mpc-library-strip select{min-width:0;width:100%;height:34px;padding:4px 7px;border:1px solid #737b4b;border-radius:4px;background:#171d12;color:#e8edda;font-size:10px}
#${ROOT_ID} .mpc-library-strip button{min-height:34px;padding:5px 8px;border:1px solid #806b43;border-radius:4px;background:linear-gradient(#45402e,#191a14);color:#e9d7a5;font-size:8px;font-weight:900}
#${ROOT_ID} .mpc-library-status{grid-column:1/-1;min-height:13px;color:#b8d77d;font-size:8px;letter-spacing:.04em}
#${ROOT_ID} .pad-label{overflow:hidden;text-overflow:ellipsis;padding:0 2px}

#${ROOT_ID} .mpc-screen-workspace{min-height:0;overflow:auto}
#${ROOT_ID} .mpc-screen-panel{display:none;gap:7px;min-height:0;overflow:auto;color:#e7edda;font-size:clamp(8px,.72vw,10px)}
#${ROOT_ID} .mpc-screen-panel.active{display:flex;flex-direction:column}
#${ROOT_ID} .mpc-welcome{display:flex;flex-direction:column;gap:4px;padding:4px 2px}
#${ROOT_ID} .mpc-welcome strong,#${ROOT_ID} .mpc-panel-heading{font-size:clamp(10px,1vw,14px);letter-spacing:.12em;color:#d6f58d}
#${ROOT_ID} .mpc-panel-heading{display:flex;justify-content:space-between;align-items:center}
#${ROOT_ID} .mpc-panel-heading small{font-size:7px;color:#9cba68;border:1px solid #647b3d;padding:2px 5px;border-radius:3px}
#${ROOT_ID} .mpc-screen-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
#${ROOT_ID} .mpc-screen-actions button,#${ROOT_ID} .mpc-primary-action{min-height:28px;border:1px solid #637b3e;border-radius:4px;background:linear-gradient(#3a4828,#182111);color:#e6f4d0;font-size:8px;font-weight:900;letter-spacing:.06em;padding:5px 7px}
#${ROOT_ID} .mpc-primary-action{width:100%;background:linear-gradient(110deg,#c4a86d,#ead7a0 45%,#8d7546);color:#1b2113;border-color:#e9d8a5}
#${ROOT_ID} .mpc-screen-readout{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;padding:6px;border:1px solid #455436;background:rgba(0,0,0,.24)}
#${ROOT_ID} .mpc-screen-readout b{color:#c7f17d}
#${ROOT_ID} .mpc-screen-readout span:last-child{grid-column:1/-1;color:#b6c49d}
#${ROOT_ID} .mpc-field{display:flex;flex-direction:column;gap:3px;color:#d7e6bd;font-size:8px;font-weight:900;letter-spacing:.06em}
#${ROOT_ID} .mpc-field select{width:100%;min-height:27px;padding:4px;border:1px solid #61743e;border-radius:3px;background:#151d10;color:#edf4df;font-size:9px}
#${ROOT_ID} .mpc-field input[type=range]{width:100%;accent-color:#b5e85a}
#${ROOT_ID} .mpc-field output{float:right;color:#d2f28d;font-weight:700}
#${ROOT_ID} .mpc-help{margin:0;color:#bdc9a8;font-size:8px;line-height:1.35}
#${ROOT_ID} [data-mpc-waveform]{display:block;width:100%;height:64px;border:1px solid #5d713d;border-radius:4px;background:#10170d}
#${ROOT_ID} [data-mpc-import]{width:100%;font-size:8px;color:#dce8c9}
#${ROOT_ID} [data-mpc-import]::file-selector-button{border:1px solid #71894a;border-radius:3px;background:#26351a;color:#edf7dc;padding:5px 8px;margin-right:8px}
#${ROOT_ID} .screen-tabs{grid-template-columns:repeat(5,minmax(0,1fr))}
#${ROOT_ID} .screen-tab{cursor:pointer}
@media(max-width:680px){#${ROOT_ID} .mpc-library-strip{grid-template-columns:minmax(0,1fr) auto;gap:5px}#${ROOT_ID} .mpc-library-strip label{grid-column:1/-1}#${ROOT_ID} .mpc-library-strip button{font-size:7px;padding:4px 6px}}
@media(max-width:680px){
  #${ROOT_ID}{padding:0;align-items:stretch}
  #${ROOT_ID} .mpc-unit{width:100%;min-height:100dvh;border-radius:0;padding:7px;gap:7px}
  #${ROOT_ID} .mpc-upper{grid-template-columns:minmax(0,2.15fr) minmax(83px,.65fr);min-height:205px}
  #${ROOT_ID} .screen-header{font-size:7px;gap:4px;padding:4px}
  #${ROOT_ID} .project-title{max-width:42vw}
  #${ROOT_ID} .screen-stat{font-size:7px}
  #${ROOT_ID} .mpc-main{grid-template-columns:48px minmax(0,1fr) 105px;gap:5px}
  #${ROOT_ID} .right-controls{grid-template-columns:34px minmax(0,1fr) 40px;gap:3px}
  #${ROOT_ID} .hw-button{font-size:6px;min-height:30px}
  #${ROOT_ID} .label-strip{font-size:5px}
  #${ROOT_ID} .pads-area{gap:5px}
  #${ROOT_ID} .pad{border-width:2px}
  #${ROOT_ID} .bottom-modes{gap:4px}
  #${ROOT_ID} .bottom-modes .hw-button{font-size:6px;min-height:34px}
  #${ROOT_ID} .bottom-modes .label-strip{font-size:5px}
}
@media(max-width:390px){
  #${ROOT_ID} .mpc-nameplate{min-height:40px}
  #${ROOT_ID} .brand-script{font-size:24px}
  #${ROOT_ID} .brand-records{font-size:10px}
  #${ROOT_ID} .mpc-upper{min-height:185px;grid-template-columns:minmax(0,2fr) 76px}
  #${ROOT_ID} .mpc-main{grid-template-columns:42px minmax(0,1fr) 94px}
  #${ROOT_ID} .right-controls{grid-template-columns:30px minmax(0,1fr) 35px}
  #${ROOT_ID} .screen-body{padding:4px}
  #${ROOT_ID} .tile-label{font-size:5px}
  #${ROOT_ID} .screen-tabs .screen-tab{font-size:5px}
  #${ROOT_ID} .middle-top .hw-button{font-size:5px;padding:2px 0}
}
@media(max-height:650px) and (min-width:681px){
  #${ROOT_ID} .mpc-unit{min-height:0}
  #${ROOT_ID} .mpc-upper{min-height:190px}
  #${ROOT_ID} .mpc-main{min-height:210px}
}
#${ROOT_ID} .mpc-upper{grid-template-columns:minmax(0,1fr);min-height:clamp(270px,34vw,410px)}
#${ROOT_ID} .mpc-screen-frame{width:100%;min-height:clamp(270px,34vw,410px)}
#${ROOT_ID} .mpc-screen{min-height:clamp(255px,32vw,390px)}
#${ROOT_ID} .mpc-screen-panel{font-size:clamp(10px,.9vw,13px);gap:10px}
#${ROOT_ID} .mpc-screen-actions button,#${ROOT_ID} .mpc-primary-action{min-height:36px;font-size:9px}
#${ROOT_ID} .mpc-field{font-size:9px;gap:5px}
#${ROOT_ID} .mpc-field select{min-height:34px;font-size:10px}
#${ROOT_ID} .mpc-bank-switcher{display:flex;align-items:center;justify-content:center;gap:14px;padding:10px 14px;border:1px solid #6d5a37;border-radius:10px;background:linear-gradient(110deg,#171a18,#090b0a);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 5px 14px #000}
#${ROOT_ID} .mpc-bank-switcher .bank-title{flex:0 0 auto;margin:0;font-size:11px;color:#e5d4a0;letter-spacing:.18em}
#${ROOT_ID} .mpc-bank-switcher .bank-title:before,#${ROOT_ID} .mpc-bank-switcher .bank-title:after{display:none}
#${ROOT_ID} .mpc-bank-switcher .bank-grid{display:grid;grid-template-columns:repeat(4,minmax(54px,90px));gap:8px}
#${ROOT_ID} .mpc-bank-switcher .bank-btn{height:40px;border-radius:7px;font-size:14px;border:1px solid #9c8656;background:linear-gradient(145deg,#34352e,#111411)}
#${ROOT_ID} .mpc-bank-switcher .bank-btn.active{background:linear-gradient(145deg,#e2cb91,#a78b52);color:#171b12;border-color:#f1dda7;box-shadow:0 0 13px rgba(220,190,117,.38)}
#${ROOT_ID} .mpc-main{display:block;min-height:0;padding:4px 0}
#${ROOT_ID} .pads-area{width:min(100%,900px);margin:0 auto;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(9px,1.4vw,20px);padding:6px}
#${ROOT_ID} .pad-wrap{margin-bottom:18px}
#${ROOT_ID} .pad{border-radius:clamp(10px,1.3vw,18px);border-width:2px;background:linear-gradient(145deg,#4b5148,#171d19 48%,#080b09);box-shadow:0 0 7px rgba(173,230,89,.55),0 9px 22px rgba(0,0,0,.55),inset 0 2px 8px rgba(255,255,255,.18),inset 0 -8px 14px #000}
#${ROOT_ID} .pad-label{bottom:-18px;font-size:clamp(8px,.8vw,11px);letter-spacing:.035em}
#${ROOT_ID} .pad.selected{border-color:#e4cf93;box-shadow:0 0 0 2px rgba(226,202,141,.28),0 0 18px rgba(220,190,117,.62),inset 0 0 16px rgba(230,211,160,.22)}
#${ROOT_ID} .transport{max-width:900px;width:100%;margin:0 auto}
@media(max-width:680px){
  #${ROOT_ID} .mpc-upper,#${ROOT_ID} .mpc-screen-frame{min-height:280px}
  #${ROOT_ID} .mpc-screen{min-height:265px}
  #${ROOT_ID} .mpc-bank-switcher{gap:8px;padding:8px}
  #${ROOT_ID} .mpc-bank-switcher .bank-grid{grid-template-columns:repeat(4,minmax(45px,1fr));width:min(100%,340px);gap:5px}
  #${ROOT_ID} .mpc-bank-switcher .bank-btn{height:36px}
  #${ROOT_ID} .pads-area{gap:7px;padding:2px}
  #${ROOT_ID} .pad-wrap{margin-bottom:16px}
  #${ROOT_ID} .pad-label{font-size:7px}
}
`;
}

function buildMarkup() {
  const pads = [
    ["PAD 13", true], ["PAD 14", false], ["PAD 15", false], ["PAD 16", false],
    ["PAD 9", true], ["PAD 10", false], ["PAD 11", false], ["PAD 12", false],
    ["PAD 5", true], ["PAD 6", false], ["PAD 7", false], ["PAD 8", false],
    ["PAD 1", true], ["PAD 2", false], ["PAD 3", false], ["PAD 4", false]
  ].map(([label, red], i) => {
    const padNumbers = [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4];
    return `<div class="pad-wrap"><button type="button" class="pad ${red ? "red" : ""}" data-pad="${padNumbers[i]}" aria-label="${label}"></button><span class="pad-label">${label}</span></div>`;
  }).join("");

  const bank = ["A", "B", "C", "D"]
    .map(button => `<button type="button" class="bank-btn" data-placeholder="BANK ${button}">${button}</button>`).join("");

  return `<section class="mpc-unit" role="dialog" aria-modal="true" aria-label="Lambo City MPC">
    <header class="mpc-nameplate">
      <span class="brand-script">Lambo City</span><span class="brand-records">RECORDS</span>
      <button type="button" class="mpc-close" data-mpc-close aria-label="Close MPC">×</button>
    </header>

    <section class="mpc-upper">
      <div class="mpc-screen-frame"><div class="mpc-screen">
        <div class="screen-header">
          <svg class="crest" viewBox="0 0 28 30" aria-hidden="true">${icon.shield.replace('<svg viewBox="0 0 28 30" aria-hidden="true">','').replace('</svg>','')}</svg>
          <span class="project-title">PROJECT: NEON STREETS - TRACK: BEAT_1</span>
          <span class="screen-stat">${icon.bluetooth}</span>
          <span class="screen-stat">BPM: 128</span>
          <span class="screen-stat">${icon.battery}</span>
        </div>
        <div class="screen-body mpc-screen-workspace">
          <p class="mpc-live-status" data-mpc-status role="status" aria-live="polite">MPC READY · TAP A PAD TO PLAY</p>
          <section class="mpc-screen-panel active" data-mpc-panel="MAIN">
            <div class="mpc-welcome"><strong>PERFORMANCE</strong><span>Tap a pad to play. Hold your groove while the song runs.</span></div>
            <div class="mpc-screen-actions">
              <button type="button" data-mpc-screen-action="browse">SOUND BROWSER</button>
              <button type="button" data-mpc-screen-action="sample">SAMPLE EDIT</button>
              <button type="button" data-mpc-screen-action="timing">TIMING</button>
              <button type="button" data-mpc-screen-action="mixer">MIXER</button>
            </div>
            <div class="mpc-screen-readout"><span>SELECTED PAD</span><b data-mpc-selected-readout>BANK A · PAD 01</b><span data-mpc-pad-readout>Choose a pad to see its sound and settings.</span></div>
          </section>
          <section class="mpc-screen-panel" data-mpc-panel="SEQ">
            <div class="mpc-panel-heading">PERFORMANCE TIMING <small>ADVANCED</small></div>
            <label class="mpc-field">QUANTIZE
              <select data-mpc-quantize><option value="off">OFF · FREE PLAY</option><option value="1/4">1/4 NOTE</option><option value="1/8">1/8 NOTE</option><option value="1/16" selected>1/16 NOTE</option><option value="1/32">1/32 NOTE</option></select>
            </label>
            <label class="mpc-field">NOTE REPEAT RATE
              <select data-mpc-repeat-rate><option value="1/4">1/4 NOTE</option><option value="1/8" selected>1/8 NOTE</option><option value="1/16">1/16 NOTE</option><option value="1/32">1/32 NOTE</option></select>
            </label>
            <label class="mpc-field">SWING <output data-mpc-swing-value>0%</output>
              <input type="range" min="0" max="75" value="0" data-mpc-swing>
            </label>
            <p class="mpc-help">Quantize tightens recorded pad hits to the song grid. Swing delays alternating subdivisions for a more human pocket.</p>
          </section>
          <section class="mpc-screen-panel" data-mpc-panel="SAMPLE">
            <div class="mpc-panel-heading">SAMPLE EDITOR <small>ADVANCED</small></div>
            <label class="mpc-field">IMPORT AUDIO SAMPLE
              <input type="file" data-mpc-import accept="audio/*,.wav,.aif,.aiff,.mp3,.ogg,.m4a" multiple>
            </label>
            <label class="mpc-field">SAMPLE
              <select data-mpc-editor-sample><option value="">Choose an imported sample</option></select>
            </label>
            <div class="mpc-screen-actions">
              <button type="button" data-mpc-preview>PREVIEW</button>
              <button type="button" data-mpc-apply-sample>ASSIGN TO SELECTED PAD</button>
              <button type="button" data-mpc-delete-sample>DELETE SAMPLE</button>
              <button type="button" data-mpc-unassign>UNASSIGN PAD</button>
            </div>
            <label class="mpc-field">EVEN SLICES
              <select data-mpc-slices><option value="4">4 SLICES</option><option value="8" selected>8 SLICES</option><option value="16">16 SLICES</option></select>
            </label>
            <button type="button" data-mpc-slice class="mpc-primary-action">SPLIT SAMPLE ACROSS PADS</button>
            <canvas data-mpc-waveform width="640" height="100" aria-label="Audio waveform preview"></canvas>
            <label class="mpc-field">START <output data-mpc-start-value>0%</output>
              <input type="range" min="0" max="99" value="0" data-mpc-start>
            </label>
            <label class="mpc-field">END <output data-mpc-end-value>100%</output>
              <input type="range" min="1" max="100" value="100" data-mpc-end>
            </label>
            <label class="mpc-field">PITCH <output data-mpc-pitch-value>0 st</output>
              <input type="range" min="-12" max="12" value="0" data-mpc-pitch>
            </label>
            <label class="mpc-field">DECAY <output data-mpc-decay-value>FULL</output>
              <input type="range" min="5" max="100" value="100" data-mpc-decay>
            </label>
            <p class="mpc-help" data-mpc-editor-status>Trim and tune the selected sample, then assign it to the selected pad.</p>
          </section>
          <section class="mpc-screen-panel" data-mpc-panel="MIX">
            <div class="mpc-panel-heading">OUTPUT & PERFORMANCE <small>ADVANCED</small></div>
            <label class="mpc-field">MASTER LEVEL <output data-mpc-master-value>100%</output>
              <input type="range" min="0" max="100" value="100" data-mpc-master>
            </label>
            <div class="mpc-screen-actions">
              <button type="button" data-mpc-screen-action="record">RECORD PADS</button>
              <button type="button" data-mpc-screen-action="overdub">OVERDUB</button>
              <button type="button" data-mpc-screen-action="play">PLAY TAKE</button>
              <button type="button" data-mpc-screen-action="stop">STOP</button>
            </div>
            <p class="mpc-help">MPC pad audio routes through the shared studio master output. Your pad performance is saved with the active song project.</p>
          </section>
          <section class="mpc-screen-panel" data-mpc-panel="BROWSE">
            <div class="mpc-panel-heading">SOUND BROWSER <small>LIBRARY</small></div>
            <label class="mpc-field">SOUND
              <select data-mpc-browser-sound></select>
            </label>
            <div class="mpc-screen-actions">
              <button type="button" data-mpc-browser-preview>PREVIEW SOUND</button>
              <button type="button" data-mpc-browser-assign>ASSIGN TO PAD</button>
              <button type="button" data-mpc-unlock>UNLOCK SOUND SET</button>
            </div>
            <p class="mpc-help">Choose a sound, preview it, then assign it to the currently selected pad and bank.</p>
          </section>
        </div>
        <nav class="screen-tabs">
          ${["MAIN", "TIMING", "SAMPLE", "MIXER", "BROWSE"].map((label, i) => `<button type="button" class="screen-tab ${i === 0 ? "active" : ""}" data-mpc-tab="${["MAIN","SEQ","SAMPLE","MIX","BROWSE"][i]}">${esc(label)}</button>`).join("")}
        </nav>
      </div></div>
    </section>

    <nav class="mpc-bank-switcher" aria-label="Pad bank selection">
      <span class="bank-title">BANK A</span>
      <div class="bank-grid">${bank}</div>
    </nav>

    <section class="mpc-main">
      <div class="pads-area" aria-label="Sixteen MPC performance pads">${pads}</div>
    </section>
    <section class="transport">
      ${["REC", "OVER DUB", "STOP", "PLAY", "PLAY START"].map((label, i) => `<div class="transport-item">${i < 4 ? `<i class="transport-led ${i === 0 ? "on" : ""}"></i>` : ""}<button type="button" class="hw-button" data-placeholder="${label}">${label}</button></div>`).join("")}
    </section>
    <footer class="mpc-footer"><span>LAMBO CITY RECORDS</span><span>NEON STREETS • MPC</span></footer>
  </section>`;
}

const MPCInterface = {
  root: null,
  onClose: null,
  previousFocus: null,
  keyHandler: null,
  beatLab: Floor2StudioApp,
  bank: "A",
  selectedPad: 1,
  library: null,
  take: null,
  recording: false,
  recordingStartedAt: 0,
  overdubOffset: 0,
  playbackTimer: null,
  playbackStartedAt: 0,
  playbackIndex: 0,
  quantize: "1/16",
  swing: 0,
  noteRepeat: false,
  noteRepeatRate: "1/8",
  noteRepeatTimer: null,

  open(options = {}) {
    if (this.root?.isConnected) return this.root;

    this.onClose = typeof options.onClose === "function" ? options.onClose : null;
    this.previousFocus = document.activeElement;
    this.beatLab = options.beatLab || Floor2StudioApp;
    this.bank = "A";
    this.selectedPad = 1;
    this.recording = false;
    this.quantize = "1/16";
    this.swing = 0;
    this.take = this.beatLab?.currentProject?.mpcPerformance || StudioMPCLibrary.loadTake(this.beatLab?.currentProject?.id || "unsaved");
    this.library = StudioMPCLibrary.open();

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = makeStyles();
      document.head.appendChild(style);
    }

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = buildMarkup();

    root.addEventListener("change", event => {
      if (event.target.matches("[data-mpc-import]")) void this.importSamples(event.target.files);
      if (event.target.matches("[data-mpc-editor-sample]")) void this.refreshSampleEditor();
      if (event.target.matches("[data-mpc-quantize]")) this.quantize = event.target.value;
      if (event.target.matches("[data-mpc-repeat-rate]")) this.noteRepeatRate = event.target.value;
      if (event.target.matches("[data-mpc-swing]")) {
        this.swing = Number(event.target.value) || 0;
        const out = root.querySelector("[data-mpc-swing-value]");
        if (out) out.textContent = this.swing + "%";
      }
      if (event.target.matches("[data-mpc-start],[data-mpc-end],[data-mpc-pitch],[data-mpc-decay]")) this.saveSampleEditorSettings();
      if (event.target.matches("[data-mpc-master]")) {
        const value = Number(event.target.value) || 0;
        StudioAudioEngine.setMasterVolume(value / 100);
        const out = root.querySelector("[data-mpc-master-value]");
        if (out) out.textContent = value + "%";
      }
    });

    root.addEventListener("input", event => {
      const target = event.target;
      const map = {
        "[data-mpc-start]": "[data-mpc-start-value]",
        "[data-mpc-end]": "[data-mpc-end-value]"
      };
      for (const [selector, output] of Object.entries(map)) {
        if (target.matches(selector)) {
          const node = root.querySelector(output);
          if (node) node.textContent = target.value + "%";
        }
      }
      if (target.matches("[data-mpc-pitch]")) {
        const out = root.querySelector("[data-mpc-pitch-value]");
        if (out) out.textContent = (Number(target.value) > 0 ? "+" : "") + target.value + " st";
      }
      if (target.matches("[data-mpc-decay]")) {
        const out = root.querySelector("[data-mpc-decay-value]");
        if (out) out.textContent = Number(target.value) >= 100 ? "FULL" : target.value + "%";
      }
    });

    root.addEventListener("pointerdown", event => {
      const pad = event.target.closest("[data-pad]");
      if (!pad || event.button > 0) return;
      pad.dataset.pointerHandled = "1";
      const pressure = Number(event.pressure);
      const velocity = pressure > 0 ? 0.35 + Math.min(1, pressure) * 1.15 : 0.9;
      const padNumber = Number(pad.dataset.pad);
      pad.classList.add("flash");
      void this.handlePad(padNumber, velocity);
      if (this.noteRepeat) {
        this.stopNoteRepeat();
        const divisions = { "1/4": 1, "1/8": 2, "1/16": 4, "1/32": 8 };
        const beatMs = 60000 / (Number(this.beatLab?.pattern?.bpm) || 100);
        const interval = beatMs / (divisions[this.noteRepeatRate] || 2);
        this.noteRepeatTimer = window.setInterval(() => void this.handlePad(padNumber, velocity), interval);
      }
    });
    root.addEventListener("pointerup", () => this.stopNoteRepeat());
    root.addEventListener("pointercancel", () => this.stopNoteRepeat());

    root.addEventListener("click", event => {
      const closeButton = event.target.closest("[data-mpc-close]");
      if (closeButton || event.target === root) {
        this.close();
        return;
      }

      const pad = event.target.closest("[data-pad]");
      if (pad) {
        if (pad.dataset.pointerHandled === "1") { delete pad.dataset.pointerHandled; return; }
        pad.classList.remove("flash");
        void pad.offsetWidth;
        pad.classList.add("flash");
        void this.handlePad(Number(pad.dataset.pad), 0.9);
        return;
      }

      const tab = event.target.closest("[data-mpc-tab]");
      if (tab) { this.showScreen(tab.dataset.mpcTab); return; }

      const screenAction = event.target.closest("[data-mpc-screen-action]");
      if (screenAction) {
        const action = screenAction.dataset.mpcScreenAction;
        if (["record","overdub","stop","play"].includes(action)) { void this.handleAction(action); return; }
        this.showScreen(action === "timing" ? "SEQ" : action.toUpperCase());
        return;
      }
      if (event.target.closest("[data-mpc-preview]")) { void this.previewImportedSample(); return; }
      if (event.target.closest("[data-mpc-apply-sample]")) { this.assignImportedSample(true); return; }
      if (event.target.closest("[data-mpc-browser-preview]")) { this.previewBrowserSound(); return; }
      if (event.target.closest("[data-mpc-browser-assign]")) { this.assignBrowserSound(); return; }
      if (event.target.closest("[data-mpc-delete-sample]")) { void this.deleteSelectedSample(); return; }
      if (event.target.closest("[data-mpc-unassign]")) { this.unassignSelectedPad(); return; }
      if (event.target.closest("[data-mpc-slice]")) { void this.sliceSampleToPads(); return; }

      if (event.target.closest("[data-mpc-assign]")) { this.assignSelectedSound(); return; }
      if (event.target.closest("[data-mpc-unlock]")) { this.unlockLibrary(); return; }
      if (event.target.closest("[data-mpc-sample-assign]")) { this.assignImportedSample(); return; }

      // Screen tiles and hardware buttons remain responsive where assigned.
      // A future MPC engine can subscribe to this event without changing the UI.
      const placeholder = event.target.closest("[data-placeholder]");
      if (placeholder) {
        const actionMap = { "REC": "record", "OVER DUB": "overdub", "STOP": "stop", "PLAY": "play", "PLAY START": "play-start" };
        if (actionMap[placeholder.dataset.placeholder]) { void this.handleAction(actionMap[placeholder.dataset.placeholder]); return; }
        if (placeholder.dataset.placeholder.indexOf("BANK ") === 0) { this.setBank(placeholder.dataset.placeholder.slice(-1)); return; }
        if (placeholder.dataset.placeholder === "NOTE REPEAT") {
          this.noteRepeat = !this.noteRepeat;
          placeholder.classList.toggle("lit", this.noteRepeat);
          if (!this.noteRepeat) this.stopNoteRepeat();
          this.setStatus("NOTE REPEAT " + (this.noteRepeat ? "ON" : "OFF") + " · " + this.noteRepeatRate);
          return;
        }
        root.dispatchEvent(new CustomEvent("lambocity:mpc-control", {
          bubbles: true,
          detail: { control: placeholder.dataset.placeholder }
        }));
      }
    });

    this.keyHandler = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("input,textarea,select,[contenteditable=true]")) return;
      if (event.repeat) return;
      const padKeys = "qwerasdfzxcv";
      const padIndex = padKeys.indexOf(event.key.toLowerCase());
      if (padIndex >= 0) {
        event.preventDefault();
        void this.handlePad(padIndex + 1, 0.9);
      }
      const bankKeys = { "1": "A", "2": "B", "3": "C", "4": "D" };
      if (bankKeys[event.key]) {
        this.setBank(bankKeys[event.key]);
      }
    };
    document.addEventListener("keydown", this.keyHandler);

    document.body.appendChild(root);
    this.root = root;
    this.refreshLibraryUI();
    for (const button of root.querySelectorAll(".bank-btn")) button.classList.toggle("active", button.dataset.placeholder === "BANK A");
    void this.refreshImportedSamples();
    this.showScreen("MAIN");
    this.setStatus(this.library.total + " SOUNDS READY · +" + this.library.added + " NEW SOUNDS ADDED THIS VISIT");
    root.querySelector("[data-mpc-close]")?.focus({ preventScroll: true });
    return root;
  },

  async handlePad(padNumber, velocity = 0.9) {
    if (!this.root) return;
    this.selectedPad = padNumber;
    this.updatePadReadout();
    const importedSampleId = StudioMPCSampler.getAssignment(this.bank, padNumber);
    const sound = StudioMPCLibrary.getAssignment(this.bank, padNumber);
    const select = this.root.querySelector("[data-mpc-sound-select]");
    if (select) select.value = sound.id;
    const label = this.root.querySelector('.pad-wrap [data-pad="' + padNumber + '"] + .pad-label');
    if (label) label.textContent = padNumber + " · " + (this.sampleNames?.[importedSampleId] || sound.name);
    try {
      const audio = await StudioAudioEngine.resume();
      this.beatLab.audio = audio;
      const sampleSettings = StudioMPCSampler.getPadSettings(this.bank, padNumber);
      if (importedSampleId) {
        await StudioMPCSampler.play(importedSampleId, audio, {
          ...sampleSettings,
          pitch: sampleSettings.pitch || 1,
          velocity,
          when: audio.currentTime
        });
      } else StudioMPCLibrary.play(audio, sound, audio.currentTime, velocity);
      if (this.recording) {
        const at = Math.max(0, audio.currentTime - this.recordingStartedAt + this.overdubOffset);
        this.take.events.push({
          pad: padNumber,
          bank: this.bank,
          soundId: sound.id,
          sampleId: importedSampleId || null,
          sampleSettings: importedSampleId ? sampleSettings : null,
          velocity,
          at: this.quantizeTime(at),
          sound: {
            id: sound.id, name: sound.name, family: sound.family, style: sound.style,
            influence: sound.influence, seed: sound.seed, frequency: sound.frequency,
            decay: sound.decay, brightness: sound.brightness
          }
        });
        this.take.duration = Math.max(this.take.duration || 0, at);
      }
      this.setStatus("PLAYING " + (importedSampleId ? "IMPORTED SAMPLE" : sound.name) + (this.recording ? " · PAD PERFORMANCE RECORDING" : ""));
    } catch (error) { this.setStatus("MPC AUDIO ERROR: " + (error?.message || error)); }
  },

  async importSamples(files) {
    try {
      const audio = await StudioAudioEngine.resume();
      this.beatLab.audio = audio;
      const imported = await StudioMPCSampler.importFiles(files, audio);
      await this.refreshImportedSamples();
      const status = this.root?.querySelector("[data-mpc-editor-status]");
      if (status) status.textContent = imported.length + " AUDIO SAMPLE(S) IMPORTED · READY TO ASSIGN";
    } catch (error) {
      const status = this.root?.querySelector("[data-mpc-editor-status]");
      if (status) status.textContent = error?.message || "SAMPLE IMPORT FAILED";
    }
  },

  async refreshImportedSamples() {
    if (!this.root) return;
    const select = this.root.querySelector("[data-mpc-sample-select]");
    const samples = await StudioMPCSampler.list();
    this.sampleNames = Object.fromEntries(samples.map(sample => [sample.id, sample.name]));
    const options = samples.length
      ? samples.map(sample => '<option value="' + esc(sample.id) + '">' + esc(sample.name) + '</option>').join("")
      : '<option value="">IMPORT AUDIO TO BEGIN</option>';
    if (select) select.innerHTML = options;
    const editor = this.root.querySelector("[data-mpc-editor-sample]");
    if (editor) editor.innerHTML = '<option value="">Choose an imported sample</option>' + (samples.length ? samples.map(sample => '<option value="' + esc(sample.id) + '">' + esc(sample.name) + '</option>').join("") : "");
    const browser = this.root.querySelector("[data-mpc-browser-sound]");
    if (browser) browser.innerHTML = StudioMPCLibrary.getSounds().map(sound => '<option value="' + esc(sound.id) + '">' + esc(sound.name) + ' · ' + esc(sound.family.toUpperCase()) + '</option>').join("");
    this.refreshLibraryUI();
  },

  assignImportedSample(fromEditor = true) {
    const select = this.root?.querySelector(fromEditor ? "[data-mpc-editor-sample]" : "[data-mpc-sample-select]");
    if (!select?.value) return;
    StudioMPCSampler.assign(this.bank, this.selectedPad, select.value);
    this.saveSampleEditorSettings();
    const sample = select.selectedOptions[0]?.textContent || "SAMPLE";
    const label = this.root.querySelector('.pad-wrap [data-pad="' + this.selectedPad + '"] + .pad-label');
    if (label) label.textContent = this.selectedPad + " · " + sample;
    const status = this.root.querySelector("[data-mpc-editor-status]");
    if (status) status.textContent = sample + " ASSIGNED · BANK " + this.bank + " PAD " + this.selectedPad;
    this.refreshLibraryUI();
  },

  showScreen(name) {
    if (!this.root) return;
    const panelName = name === "TIMING" ? "SEQ" : name;
    for (const panel of this.root.querySelectorAll("[data-mpc-panel]")) {
      panel.classList.toggle("active", panel.dataset.mpcPanel === panelName);
    }
    for (const tab of this.root.querySelectorAll("[data-mpc-tab]")) {
      tab.classList.toggle("active", tab.dataset.mpcTab === panelName);
    }
    if (panelName === "SAMPLE") void this.refreshSampleEditor();
    if (panelName === "BROWSE") this.refreshLibraryUI();
  },

  updatePadReadout() {
    if (!this.root) return;
    const readout = this.root.querySelector("[data-mpc-selected-readout]");
    const detail = this.root.querySelector("[data-mpc-pad-readout]");
    for (const pad of this.root.querySelectorAll("[data-pad]")) {
      pad.classList.toggle("selected", Number(pad.dataset.pad) === this.selectedPad);
    }
    const sampleId = StudioMPCSampler.getAssignment(this.bank, this.selectedPad);
    const sound = StudioMPCLibrary.getAssignment(this.bank, this.selectedPad);
    if (readout) readout.textContent = "BANK " + this.bank + " · PAD " + String(this.selectedPad).padStart(2, "0");
    if (detail) detail.textContent = sampleId ? (this.sampleNames?.[sampleId] || "Imported sample") : sound.name + " · " + sound.family.toUpperCase();
  },

  quantizeTime(seconds) {
    const bpm = Number(this.beatLab?.pattern?.bpm) || 100;
    const divisions = { "1/4": 1, "1/8": 2, "1/16": 4, "1/32": 8 }[this.quantize];
    if (!divisions) return seconds;
    const step = (60 / bpm) / divisions;
    const index = Math.round(seconds / step);
    const swung = index % 2 === 1 ? step * (this.swing / 100) * 0.5 : 0;
    return Math.max(0, index * step + swung);
  },

  async refreshSampleEditor() {
    if (!this.root) return;
    const select = this.root.querySelector("[data-mpc-editor-sample]");
    if (!select?.value) return;
    const settings = StudioMPCSampler.getPadSettings(this.bank, this.selectedPad);
    const start = this.root.querySelector("[data-mpc-start]");
    const end = this.root.querySelector("[data-mpc-end]");
    const pitch = this.root.querySelector("[data-mpc-pitch]");
    const decay = this.root.querySelector("[data-mpc-decay]");
    if (start) start.value = String(Math.round((settings.start || 0) * 100));
    if (end) end.value = String(Math.round((settings.end ?? 1) * 100));
    if (pitch) pitch.value = String(Math.round(12 * Math.log2(settings.pitch || 1)));
    if (decay) decay.value = String(Math.round((settings.decay ?? 10) >= 10 ? 100 : (settings.decay / 10) * 100));
    this.saveSampleEditorSettings(false);
    await this.renderSampleWaveform(select.value);
  },

  saveSampleEditorSettings(commit = true) {
    if (!this.root) return;
    const start = Number(this.root.querySelector("[data-mpc-start]")?.value || 0) / 100;
    const end = Number(this.root.querySelector("[data-mpc-end]")?.value || 100) / 100;
    const semitones = Number(this.root.querySelector("[data-mpc-pitch]")?.value || 0);
    const decayPercent = Number(this.root.querySelector("[data-mpc-decay]")?.value || 100);
    const settings = StudioMPCSampler.setPadSettings(this.bank, this.selectedPad, {
      start, end, pitch: Math.pow(2, semitones / 12), decay: decayPercent >= 100 ? 10 : decayPercent / 10
    });
    const status = this.root.querySelector("[data-mpc-editor-status]");
    if (status && commit) status.textContent = "EDIT SETTINGS SAVED · BANK " + this.bank + " PAD " + this.selectedPad;
    return settings;
  },

  async renderSampleWaveform(sampleId) {
    const canvas = this.root?.querySelector("[data-mpc-waveform]");
    if (!canvas || !sampleId) return;
    try {
      const audio = await StudioAudioEngine.resume();
      const { peaks } = await StudioMPCSampler.getWaveform(sampleId, audio, 128);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const width = canvas.width, height = canvas.height, mid = height / 2;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#10170d";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#b9ed67";
      ctx.lineWidth = 2;
      ctx.beginPath();
      peaks.forEach((peak, index) => {
        const x = index * width / peaks.length;
        const amplitude = Math.max(2, peak * (height * 0.43));
        ctx.moveTo(x, mid - amplitude);
        ctx.lineTo(x, mid + amplitude);
      });
      ctx.stroke();
      const settings = StudioMPCSampler.getPadSettings(this.bank, this.selectedPad);
      ctx.fillStyle = "rgba(213,238,155,.14)";
      ctx.fillRect(0, 0, width * (settings.start || 0), height);
      ctx.fillRect(width * (settings.end ?? 1), 0, width * (1 - (settings.end ?? 1)), height);
    } catch (error) {
      const status = this.root?.querySelector("[data-mpc-editor-status]");
      if (status) status.textContent = error?.message || "WAVEFORM UNAVAILABLE";
    }
  },

  stopNoteRepeat() {
    if (this.noteRepeatTimer !== null) {
      window.clearInterval(this.noteRepeatTimer);
      this.noteRepeatTimer = null;
    }
  },

  async sliceSampleToPads() {
    const id = this.root?.querySelector("[data-mpc-editor-sample]")?.value;
    if (!id) return;
    const count = Number(this.root.querySelector("[data-mpc-slices]")?.value || 8);
    const settings = this.saveSampleEditorSettings(false);
    const firstPad = this.selectedPad;
    const available = Math.min(count, 17 - firstPad);
    if (available < 1) return;
    for (let index = 0; index < available; index++) {
      const pad = firstPad + index;
      const start = settings.start + (settings.end - settings.start) * index / count;
      const end = settings.start + (settings.end - settings.start) * (index + 1) / count;
      StudioMPCSampler.assign(this.bank, pad, id);
      StudioMPCSampler.setPadSettings(this.bank, pad, {
        start, end, pitch: settings.pitch || 1, decay: settings.decay || 10
      });
    }
    this.refreshLibraryUI();
    const status = this.root?.querySelector("[data-mpc-editor-status]");
    if (status) status.textContent = available + " EVEN SLICES ASSIGNED · BANK " + this.bank + " PADS " + firstPad + "–" + (firstPad + available - 1);
  },

  unassignSelectedPad() {
    StudioMPCSampler.unassign(this.bank, this.selectedPad);
    this.refreshLibraryUI();
    const status = this.root?.querySelector("[data-mpc-editor-status]");
    if (status) status.textContent = "IMPORTED SAMPLE REMOVED FROM BANK " + this.bank + " PAD " + this.selectedPad;
  },

  async deleteSelectedSample() {
    const id = this.root?.querySelector("[data-mpc-editor-sample]")?.value;
    if (!id) return;
    if (this.take?.events?.some(event => event.sampleId === id) || this.beatLab?.currentProject?.mpcPerformance?.events?.some(event => event.sampleId === id)) {
      const status = this.root?.querySelector("[data-mpc-editor-status]");
      if (status) status.textContent = "THIS SAMPLE IS USED IN THE SAVED PAD TAKE. KEEP IT TO PRESERVE PLAYBACK.";
      return;
    }
    const sample = await StudioMPCSampler.getSample(id);
    if (!window.confirm('Delete "' + (sample?.name || "this sample") + '" from this device? Assigned pads will be cleared.')) return;
    await StudioMPCSampler.remove(id);
    await this.refreshImportedSamples();
    const status = this.root?.querySelector("[data-mpc-editor-status]");
    if (status) status.textContent = "SAMPLE DELETED FROM THIS DEVICE.";
  },

  async previewImportedSample() {
    const id = this.root?.querySelector("[data-mpc-editor-sample]")?.value;
    if (!id) return;
    try {
      const audio = await StudioAudioEngine.resume();
      const settings = this.saveSampleEditorSettings(false);
      await StudioMPCSampler.play(id, audio, { ...settings, when: audio.currentTime, velocity: 0.9 });
    } catch (error) {
      const status = this.root?.querySelector("[data-mpc-editor-status]");
      if (status) status.textContent = error?.message || "SAMPLE PREVIEW FAILED";
    }
  },

  async previewBrowserSound() {
    const id = this.root?.querySelector("[data-mpc-browser-sound]")?.value;
    const sound = StudioMPCLibrary.getSounds().find(item => item.id === id);
    if (!sound) return;
    const audio = await StudioAudioEngine.resume();
    StudioMPCLibrary.play(audio, sound, audio.currentTime);
  },

  assignBrowserSound() {
    const id = this.root?.querySelector("[data-mpc-browser-sound]")?.value;
    if (!id) return;
    const sound = StudioMPCLibrary.assign(this.bank, this.selectedPad, id);
    StudioMPCSampler.unassign(this.bank, this.selectedPad);
    this.refreshLibraryUI();
    this.setStatus(sound.name + " ASSIGNED TO BANK " + this.bank + " PAD " + this.selectedPad);
  },

  setStatus(message) {
    const node = this.root?.querySelector("[data-mpc-status]");
    if (node) node.textContent = message;
  },

  setBank(bank) {
    if (!["A", "B", "C", "D"].includes(bank)) return;
    this.bank = bank;
    const title = this.root?.querySelector(".bank-title");
    if (title) title.textContent = "BANK " + bank;
    for (const button of this.root?.querySelectorAll(".bank-btn") || []) {
      button.classList.toggle("active", button.dataset.placeholder === "BANK " + bank);
    }
    this.refreshLibraryUI();
    if (this.root?.querySelector('[data-mpc-panel="SAMPLE"].active')) void this.refreshSampleEditor();
    this.setStatus("BANK " + bank + " SELECTED");
  },

  refreshLibraryUI() {
    if (!this.root) return;
    const sounds = StudioMPCLibrary.getSounds();
    const projectTitle = this.beatLab?.currentProject?.metadata?.title || "UNTITLED SONG";
    const titleNode = this.root.querySelector(".project-title");
    if (titleNode) titleNode.textContent = "PROJECT: " + projectTitle.toUpperCase();
    const stats = this.root.querySelectorAll(".screen-header .screen-stat");
    if (stats[1]) stats[1].textContent = "BPM: " + (this.beatLab?.pattern?.bpm || 100);
    const select = this.root.querySelector("[data-mpc-sound-select]");
    if (select) {
      const current = StudioMPCLibrary.getAssignment(this.bank, this.selectedPad);
      select.innerHTML = sounds.map(sound => '<option value="' + esc(sound.id) + '">' + esc(sound.name) + ' · ' + esc(sound.family.toUpperCase()) + ' · ' + esc(sound.style) + '</option>').join("");
      select.value = current.id;
    }
    const browser = this.root.querySelector("[data-mpc-browser-sound]");
    if (browser) {
      const selected = browser.value;
      browser.innerHTML = sounds.map(sound => '<option value="' + esc(sound.id) + '">' + esc(sound.name) + ' · ' + esc(sound.family.toUpperCase()) + ' · ' + esc(sound.style) + '</option>').join("");
      if (sounds.some(sound => sound.id === selected)) browser.value = selected;
    }
    for (const pad of this.root.querySelectorAll("[data-pad]")) {
      const number = Number(pad.dataset.pad);
      const sound = StudioMPCLibrary.getAssignment(this.bank, number);
      const label = pad.parentElement?.querySelector(".pad-label");
      const importedId = StudioMPCSampler.getAssignment(this.bank, number);
      const imported = importedId ? (this.sampleNames?.[importedId] || "USER SAMPLE") : null;
      if (label) label.textContent = number + " · " + (imported || sound.name);
    }
    this.updatePadReadout();
  },

  assignSelectedSound() {
    const select = this.root?.querySelector("[data-mpc-sound-select]");
    if (!select?.value) return;
    try {
      const sound = StudioMPCLibrary.assign(this.bank, this.selectedPad, select.value);
      this.refreshLibraryUI();
      this.setStatus(sound.name + " ASSIGNED TO BANK " + this.bank + " PAD " + this.selectedPad);
    } catch (error) { this.setStatus(error?.message || "Could not assign sound."); }
  },

  unlockLibrary() {
    const state = StudioMPCLibrary.state || {};
    const promptText = state.unlockHash
      ? "Enter your MPC unlock code to open the additional 200 sounds:"
      : "Create your MPC unlock code. This local browser code unlocks the additional 200 sounds:";
    const code = window.prompt(promptText);
    if (code === null) return;
    try {
      if (!StudioMPCLibrary.unlock(code)) { this.setStatus("UNLOCK CODE NOT RECOGNIZED."); return; }
      this.refreshLibraryUI();
      this.setStatus("200 ADDITIONAL SOUNDS UNLOCKED · " + StudioMPCLibrary.getSounds().length + " SOUNDS AVAILABLE");
    } catch (error) { this.setStatus(error?.message || "Could not unlock the library."); }
  },

  async handleAction(action) {
    if (!this.beatLab) return;
    try {
      if (action === "record" || action === "overdub") {
        const audio = await StudioAudioEngine.resume();
        this.beatLab.audio = audio;
        if (!this.beatLab.playing) await this.beatLab.start();
        if (action === "record") this.take = { events: [], duration: 0 };
        this.recording = true;
        this.overdubOffset = action === "overdub" ? (this.take.duration || 0) : 0;
        this.recordingStartedAt = audio.currentTime;
        this.root?.querySelector('[data-placeholder="REC"]')?.classList.add("lit");
        this.setStatus(action === "overdub" ? "OVERDUB ARMED · PLAY PADS OVER YOUR SONG" : "PAD RECORDING ARMED · PLAY PADS OVER YOUR SONG");
        return;
      }
      if (action === "stop") {
        this.finishRecording();
        this.stopPerformancePlayback();
        this.beatLab.stop();
        this.setStatus("MPC AND SONG PLAYBACK STOPPED.");
        return;
      }
      if (action === "play" || action === "play-start") {
        if (this.recording) this.finishRecording();
        if (!this.beatLab.playing) await this.beatLab.start();
        this.playSavedPerformance();
        this.setStatus("SONG PLAYING · MPC PERFORMANCE PLAYING");
      }
    } catch (error) { this.setStatus("MPC CONTROL ERROR: " + (error?.message || error)); }
  },

  finishRecording() {
    if (!this.recording) return;
    this.recording = false;
    this.root?.querySelector('[data-placeholder="REC"]')?.classList.remove("lit");
    const projectId = this.beatLab?.currentProject?.id || "unsaved";
    const lastEvent = this.take.events[this.take.events.length - 1];
    const elapsed = this.beatLab?.audio
      ? Math.max(0, this.beatLab.audio.currentTime - this.recordingStartedAt + this.overdubOffset)
      : 0;
    const barDuration = 60 / (this.beatLab?.pattern?.bpm || 100) * 4;
    this.take.duration = Math.max(this.take.duration || 0, elapsed, lastEvent?.at || 0, barDuration);
    try {
      this.take = StudioMPCLibrary.saveTake(projectId, this.take);
      const savedToSong = this.beatLab?.saveMPCPerformance?.(this.take) === true;
      this.setStatus("PAD TAKE SAVED · " + this.take.events.length + " HITS" + (savedToSong ? " · INCLUDED IN SONG PROJECT / .LCP" : " · BROWSER TAKE — SAVE A SONG PROJECT TO PACKAGE IT"));
    } catch (error) { this.setStatus(error?.message || "Could not save pad take."); }
  },

  async playSavedPerformance() {
    this.stopPerformancePlayback();
    const projectId = this.beatLab?.currentProject?.id || "unsaved";
    this.take = this.beatLab?.currentProject?.mpcPerformance || StudioMPCLibrary.loadTake(projectId);
    if (!this.take.events.length) { this.setStatus("SONG PLAYING · NO SAVED MPC PAD TAKE YET"); return; }
    const audio = this.beatLab.audio;
    if (!audio) return;
    try {
      await StudioMPCSampler.preload(this.take.events.map(event => event.sampleId), audio);
    } catch (error) {
      this.setStatus("SAMPLE PRELOAD ERROR · " + (error?.message || error));
      return;
    }
    this.playbackStartedAt = audio.currentTime + 0.06;
    this.playbackIndex = 0;
    const loopDuration = Math.max(0.25, this.take.duration || (60 / (this.beatLab?.pattern?.bpm || 100) * 4));
    this.playbackTimer = window.setInterval(() => {
      if (!this.beatLab?.playing || !this.beatLab.audio) { this.stopPerformancePlayback(); return; }
      const elapsed = this.beatLab.audio.currentTime - this.playbackStartedAt;
      while (this.playbackIndex < this.take.events.length && this.take.events[this.playbackIndex].at <= elapsed + 0.09) {
        const event = this.take.events[this.playbackIndex++];
        if (event.sampleId) {
          void StudioMPCSampler.play(event.sampleId, this.beatLab.audio, {
            ...(event.sampleSettings || {}),
            velocity: event.velocity || 0.9,
            when: Math.max(this.beatLab.audio.currentTime, this.playbackStartedAt + event.at)
          }).catch(() => {});
        } else {
          const sound = event.sound || StudioMPCLibrary.getSounds().find(item => item.id === event.soundId);
          if (sound) StudioMPCLibrary.play(this.beatLab.audio, sound, Math.max(this.beatLab.audio.currentTime, this.playbackStartedAt + event.at), event.velocity || 0.9);
        }
      }
      if (elapsed >= loopDuration) {
        this.playbackStartedAt += loopDuration;
        this.playbackIndex = 0;
      }
    }, 20);
  },

  stopPerformancePlayback() {
    if (this.playbackTimer !== null) { window.clearInterval(this.playbackTimer); this.playbackTimer = null; }
  },

  close() {
    if (!this.root) return;
    this.stopNoteRepeat();
    this.root.remove();
    this.root = null;

    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }

    const callback = this.onClose;
    this.onClose = null;
    callback?.();

    if (this.previousFocus?.isConnected) {
      this.previousFocus.focus({ preventScroll: true });
    }
    this.previousFocus = null;
    this.recording = false;
    this.take = null;
  },

  isOpen() {
    return !!this.root?.isConnected;
  }
};

export default MPCInterface;