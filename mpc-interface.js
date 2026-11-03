// mpc-interface.js
// LAMBO CITY RECORDS — Full-screen MPC hardware interface.

import StudioAudioEngine from "./studioAudioEngine.js";
import StudioMPCLibrary from "./studioMPCLibrary.js";
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
`;
}

function tile(label, svg, active = false, lower = false) {
  return `<button type="button" class="screen-tile ${active ? "active" : ""} ${lower ? "lower-tile" : ""}" data-placeholder="${esc(label)}">
    <span class="tile-icon">${svg}</span><span class="tile-label">${esc(label)}</span>
  </button>`;
}

function control(main, strip = "", lit = false) {
  return `<div class="hardware-control"><button type="button" class="hw-button ${lit ? "lit" : ""}" data-placeholder="${esc(main)}">${esc(main)}</button>${strip ? `<span class="label-strip">${esc(strip)}</span>` : ""}</div>`;
}

function buildMarkup() {
  const topTiles = [
    ["FA LOOP", icon.sliders, true], ["R2EG", icon.lines], ["COPY", icon.gamepad],
    ["RECORD", icon.record], ["SLAPE", icon.window], ["NOTES", icon.keys]
  ].map(([label, svg, active]) => tile(label, svg, active)).join("");

  const lowerTiles = [
    ["CONSPER", icon.note], ["LAER / WPM", icon.sliders],
    ["LOOP / IOPM", icon.apple], ["LEGAN SOWL", icon.compass]
  ].map(([label, svg]) => tile(label, svg, false, true)).join("");

  const meterTop = ["11", "A6", "GO", "OO", "VO", "647", "GAV"];
  const meterBottom = ["m", "1", "3", "5", "91", "97", ""];
  const meterHeights = [38, 68, 48, 83, 57, 94, 63];
  const meter = meterTop.map((top, i) => `<div class="meter-col">
    <span class="meter-top">${top}</span><span class="meter-bar" style="--bar:${meterHeights[i]}%"></span>
    <span class="meter-bottom">${meterBottom[i]}</span></div>`).join("");

  const pads = [
    ["PAD 13", true], ["PAD 14", false], ["PAD 15", false], ["PAD 16", false],
    ["PAD 9", true], ["PAD 10", false], ["PAD 11", false], ["PAD 12", false],
    ["PAD S", true], ["PRO 6", false], ["PAD 7", false], ["PAD 8", false],
    ["PAD 1", true], ["PAD 2", false], ["PAD 3", false], ["PAD 4", false]
  ].map(([label, red], i) => {
    const padNumbers = [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4];
    return `<div class="pad-wrap"><button type="button" class="pad ${red ? "red" : ""}" data-pad="${padNumbers[i]}" aria-label="${label}"></button><span class="pad-label">${label}</span></div>`;
  }).join("");

  const bank = [["A", "A"], ["B", "B"], ["C", "G"], ["D", "H"]]
    .map(([button, strip]) => `<div class="bank-cell"><button type="button" class="bank-btn" data-placeholder="BANK ${button}">${button}</button><span class="bank-strip">${strip}</span></div>`).join("");

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
        <div class="screen-body">
          <div class="tile-grid">${topTiles}</div>
          <div class="screen-lower">
            <div class="lower-tiles">${lowerTiles}</div>
            <div class="meter">${meter}</div>
          </div>
          <div class="dots"><i></i><i></i><i></i></div>
        </div>
        <nav class="screen-tabs">
          ${["MAIN", "SEQ EDIT", "◄ NUOF ►", "SROWST", "XY FX"].map((label, i) => `<button type="button" class="screen-tab ${i === 0 ? "active" : ""}" data-placeholder="${esc(label)}">${esc(label)}</button>`).join("")}
        </nav>
      </div></div>

      <aside class="knob-column" aria-label="Hardware knobs and bank">
        <div class="knob" aria-label="Knob one"></div>
        <div class="led-row"><i class="led on"></i><i class="led"></i><i class="led"></i><i class="led"></i></div>
        <div class="knob" aria-label="Knob two"></div>
        <div class="knob" aria-label="Knob three"></div>
        <div class="knob" aria-label="Knob four"></div>
        <div class="qlink"><span>Q:LINK</span><button class="small-hardware" type="button" data-placeholder="Q:LINK" aria-label="Q:LINK"></button></div>
        <div class="bank"><div class="bank-title">BANK</div><div class="bank-grid">${bank}</div></div>
      </aside>
    </section>

    <section class="mpc-main">
      <aside class="left-column">
        ${control("FULL LEVEL", "HAF LEVELS", true)}
        ${control("16 LEVELS", "NOTES")}
        ${control("COPY", "DELETE")}
        ${control("ERASE")}
        ${control("NOTE REPEAT", "SLOPT", true)}
      </aside>

      <div class="pads-area" aria-label="Sixteen MPC pads">${pads}</div>

      <aside class="right-controls">
        <div class="side-stack">
          ${control("MAIN", "GRID", true)}
          ${control("GRID", "PREFS")}
          ${control("", "SFIFT")}
        </div>
        <div class="middle-controls">
          <div class="middle-top">
            ${control("BROWSE", "SAVE")}
            ${control("TRACK MIA", "RRO MIK")}
            ${control("TRACK MATE", "PAO MUTE")}
            ${control("NEXT SEQ", "XYPX")}
          </div>
          <div class="data-wheel-wrap">
            <div class="data-wheel" aria-label="Data wheel"></div>
            <div class="wheel-buttons"><button type="button" data-placeholder="–">–</button><button type="button" data-placeholder="+">+</button></div>
          </div>
        </div>
        <div class="side-stack">
          ${control("TAP TEMPO", "CLOBAL", true)}
          ${control("UNDO", "REDO")}
        </div>
      </aside>
    </section>

    <section class="mpc-library-strip" aria-label="MPC sound library">
      <label>PAD SOUND LIBRARY
        <select data-mpc-sound-select aria-label="Choose a sound to assign"></select>
      </label>
      <button type="button" data-mpc-assign>ASSIGN TO PAD</button>
      <button type="button" data-mpc-unlock>UNLOCK 200</button>
      <div class="mpc-library-status" data-mpc-status role="status" aria-live="polite">100 DEMO SOUNDS · GROWING LIBRARY</div>
    </section>

    <section class="bottom-modes">
      ${control("STEP SEQ", "AUTOMATION")}
      ${control("TC", "ON/OFF")}
      ${control("SAMPLER", "LOOPER")}
      ${control("SAMPLE EDIT", "O-LINK EDIT", true)}
      ${control("PROGRAM EDIT", "MIDI CTRL")}
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

  open(options = {}) {
    if (this.root?.isConnected) return this.root;

    this.onClose = typeof options.onClose === "function" ? options.onClose : null;
    this.previousFocus = document.activeElement;
    this.beatLab = options.beatLab || Floor2StudioApp;
    this.bank = "A";
    this.selectedPad = 1;
    this.recording = false;
    this.take = StudioMPCLibrary.loadTake(this.beatLab?.currentProject?.id || "unsaved");
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

    root.addEventListener("click", event => {
      const closeButton = event.target.closest("[data-mpc-close]");
      if (closeButton || event.target === root) {
        this.close();
        return;
      }

      const pad = event.target.closest("[data-pad]");
      if (pad) {
        pad.classList.remove("flash");
        void pad.offsetWidth;
        pad.classList.add("flash");
        void this.handlePad(Number(pad.dataset.pad));
        return;
      }

      if (event.target.closest("[data-mpc-assign]")) { this.assignSelectedSound(); return; }
      if (event.target.closest("[data-mpc-unlock]")) { this.unlockLibrary(); return; }

      // Screen tiles and hardware buttons remain responsive where assigned.
      // A future MPC engine can subscribe to this event without changing the UI.
      const placeholder = event.target.closest("[data-placeholder]");
      if (placeholder) {
        const actionMap = { "REC": "record", "OVER DUB": "overdub", "STOP": "stop", "PLAY": "play", "PLAY START": "play-start" };
        if (actionMap[placeholder.dataset.placeholder]) { void this.handleAction(actionMap[placeholder.dataset.placeholder]); return; }
        if (placeholder.dataset.placeholder.indexOf("BANK ") === 0) { this.setBank(placeholder.dataset.placeholder.slice(-1)); return; }
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
      }
    };
    document.addEventListener("keydown", this.keyHandler);

    document.body.appendChild(root);
    this.root = root;
    this.refreshLibraryUI();
    this.setStatus(this.library.total + " SOUNDS READY · +" + this.library.added + " NEW SOUNDS ADDED THIS VISIT");
    root.querySelector("[data-mpc-close]")?.focus({ preventScroll: true });
    return root;
  },

  async handlePad(padNumber) {
    if (!this.root) return;
    this.selectedPad = padNumber;
    const sound = StudioMPCLibrary.getAssignment(this.bank, padNumber);
    const select = this.root.querySelector("[data-mpc-sound-select]");
    if (select) select.value = sound.id;
    const label = this.root.querySelector('.pad-wrap [data-pad="' + padNumber + '"] + .pad-label');
    if (label) label.textContent = padNumber + " · " + sound.name;
    try {
      const audio = await StudioAudioEngine.resume();
      this.beatLab.audio = audio;
      StudioMPCLibrary.play(audio, sound, audio.currentTime);
      if (this.recording) {
        const at = Math.max(0, audio.currentTime - this.recordingStartedAt + this.overdubOffset);
        this.take.events.push({ pad: padNumber, bank: this.bank, soundId: sound.id, at });
        this.take.duration = Math.max(this.take.duration || 0, at);
      }
      this.setStatus("PLAYING " + sound.name + (this.recording ? " · PAD PERFORMANCE RECORDING" : ""));
    } catch (error) { this.setStatus("MPC AUDIO ERROR: " + (error?.message || error)); }
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
    this.refreshLibraryUI();
    this.setStatus("BANK " + bank + " SELECTED");
  },

  refreshLibraryUI() {
    if (!this.root) return;
    const sounds = StudioMPCLibrary.getSounds();
    const select = this.root.querySelector("[data-mpc-sound-select]");
    if (select) {
      const current = StudioMPCLibrary.getAssignment(this.bank, this.selectedPad);
      select.innerHTML = sounds.map(sound => '<option value="' + esc(sound.id) + '">' + esc(sound.name) + ' · ' + esc(sound.family.toUpperCase()) + '</option>').join("");
      select.value = current.id;
    }
    for (const pad of this.root.querySelectorAll("[data-pad]")) {
      const number = Number(pad.dataset.pad);
      const sound = StudioMPCLibrary.getAssignment(this.bank, number);
      const label = pad.parentElement?.querySelector(".pad-label");
      if (label) label.textContent = number + " · " + sound.name;
    }
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
    this.take.duration = Math.max(this.take.duration || 0, lastEvent?.at || 0);
    try {
      this.take = StudioMPCLibrary.saveTake(projectId, this.take);
      this.setStatus("PAD TAKE SAVED · " + this.take.events.length + " HITS · READY WITH BEAT LAB");
    } catch (error) { this.setStatus(error?.message || "Could not save pad take."); }
  },

  playSavedPerformance() {
    this.stopPerformancePlayback();
    const projectId = this.beatLab?.currentProject?.id || "unsaved";
    this.take = StudioMPCLibrary.loadTake(projectId);
    if (!this.take.events.length) { this.setStatus("SONG PLAYING · NO SAVED MPC PAD TAKE YET"); return; }
    const audio = this.beatLab.audio;
    if (!audio) return;
    this.playbackStartedAt = audio.currentTime + 0.06;
    this.playbackIndex = 0;
    this.playbackTimer = window.setInterval(() => {
      if (!this.beatLab?.playing || !this.beatLab.audio) { this.stopPerformancePlayback(); return; }
      const elapsed = this.beatLab.audio.currentTime - this.playbackStartedAt;
      while (this.playbackIndex < this.take.events.length && this.take.events[this.playbackIndex].at <= elapsed + 0.09) {
        const event = this.take.events[this.playbackIndex++];
        const sound = StudioMPCLibrary.getSounds().find(item => item.id === event.soundId);
        if (sound) StudioMPCLibrary.play(this.beatLab.audio, sound, Math.max(this.beatLab.audio.currentTime, this.playbackStartedAt + event.at));
      }
      if (elapsed > this.take.duration + 0.2) this.stopPerformancePlayback();
    }, 20);
  },

  stopPerformancePlayback() {
    if (this.playbackTimer !== null) { window.clearInterval(this.playbackTimer); this.playbackTimer = null; }
  },

  close() {
    if (!this.root) return;
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