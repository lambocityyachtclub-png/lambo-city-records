/*
 * LAMBO CITY RECORDS — STUDIO INTERFACE VISUAL SYSTEM
 * Visual-only treatment for the existing Vocal Booth and City Synth panels.
 * The recording, MIDI, transport, and shared-session logic remain untouched.
 */

let installed = false;

const STUDIO_VISUAL_CSS = `
.lc-vocal-booth {
  position:relative;
  isolation:isolate;
  display:grid!important;
  gap:15px!important;
  padding:clamp(12px,2vw,22px)!important;
  overflow:hidden;
  border:1px solid rgba(221,174,239,.32);
  border-radius:16px;
  background:
    radial-gradient(ellipse at 50% 0%,rgba(205,105,231,.32),transparent 48%),
    linear-gradient(145deg,#17101e,#090a11 72%)!important;
  color:#f7effb!important;
}
.lc-vocal-booth > * { position:relative; z-index:1; }
.lc-vocal-booth > header {
  align-items:center;
  padding:2px 3px 12px;
  border-bottom:1px solid rgba(229,174,248,.22);
}
.lc-vocal-booth > header h2 {
  color:#fff!important;
  letter-spacing:2px!important;
  text-shadow:0 0 18px rgba(225,135,255,.35);
}
.lc-vocal-booth .lc-vocal-room-hero {
  position:relative;
  min-height:clamp(230px,35vw,390px);
  aspect-ratio:2.25/1;
  overflow:hidden;
  isolation:isolate;
  border:1px solid rgba(240,180,255,.42);
  border-radius:12px;
  background:
    linear-gradient(90deg,rgba(9,6,13,.08),transparent 18%,transparent 82%,rgba(9,6,13,.08)),
    linear-gradient(180deg,#4b2a58 0%,#34203f 58%,#100d18 100%);
  box-shadow:0 18px 42px #0009,inset 0 0 55px rgba(236,112,255,.14);
}
.lc-vocal-room-hero:before,
.lc-vocal-room-hero:after {
  content:"";
  position:absolute;
  z-index:-1;
  top:0;bottom:0;width:17%;
  background:
    repeating-linear-gradient(90deg,#170f17 0 5px,#4a2739 5px 8px,#24131f 8px 13px),
    linear-gradient(90deg,#130d15,#6a3b54,#160f18);
  box-shadow:inset -10px 0 18px #0008,inset 4px 0 12px #f4a7ff22;
}
.lc-vocal-room-hero:before { left:0; }
.lc-vocal-room-hero:after { right:0; transform:scaleX(-1); }
.lc-vocal-room-ceiling {
  position:absolute;left:15%;right:15%;top:-24%;height:32%;
  border-radius:0 0 50% 50%;
  background:radial-gradient(ellipse,#d69bfa 0%,#8654a0 38%,#382447 72%,transparent 74%);
  box-shadow:0 12px 25px #f3a4ff44;
}
.lc-vocal-room-light {
  position:absolute;left:16%;right:16%;top:46%;height:2px;
  background:#f4b4ff;
  box-shadow:0 0 7px 2px #ed91ff,0 0 22px 5px #b24bd8;
}
.lc-vocal-room-screen {
  position:absolute;left:23%;right:23%;top:12%;height:44%;
  display:grid;grid-template-columns:54px minmax(0,1fr);gap:12px;
  align-items:center;padding:12px 15px;
  border:5px solid #17151e;border-radius:4px;
  background:linear-gradient(145deg,#111725,#070b13);
  box-shadow:0 0 0 1px #b9a0c7,0 10px 22px #000a,0 0 24px #d76cf044;
}
.lc-vocal-room-brand {
  grid-column:1/-1;
  color:#f5e7fa;text-align:center;font-weight:1000;
  font-size:clamp(13px,2.4vw,23px);font-style:italic;letter-spacing:2px;
  text-shadow:0 2px 3px #000,0 0 12px #d9a0ef88;
}
.lc-vocal-room-mic-icon {
  justify-self:center;align-self:center;
  width:24px;height:48px;border:2px solid #d8dce7;border-radius:15px;
  background:repeating-linear-gradient(180deg,#d7dbe5 0 2px,#606b7b 2px 4px);
  box-shadow:0 0 10px #d6c8ef55;
}
.lc-vocal-room-wave {
  height:clamp(35px,7vw,66px);
  border:1px solid #4e9c79;border-radius:4px;
  background:
    repeating-linear-gradient(90deg,transparent 0 5px,#55ed9a 5px 7px,transparent 7px 10px),
    linear-gradient(180deg,#102b25,#081b18);
  clip-path:polygon(0 43%,3% 37%,5% 60%,8% 20%,11% 71%,14% 32%,17% 57%,20% 15%,23% 80%,26% 34%,29% 54%,32% 18%,35% 68%,38% 25%,41% 74%,44% 40%,47% 59%,50% 12%,53% 81%,56% 33%,59% 65%,62% 22%,65% 76%,68% 37%,71% 59%,74% 16%,77% 72%,80% 29%,83% 64%,86% 20%,89% 79%,92% 35%,95% 61%,98% 39%,100% 50%,100% 100%,0 100%);
  box-shadow:0 0 14px #58f0a455;
}
.lc-vocal-room-screen small {
  grid-column:2;color:#b9c4d3;font:9px monospace;letter-spacing:.5px;
}
.lc-vocal-room-microphone {
  position:absolute;left:50%;bottom:5%;width:3px;height:34%;
  background:linear-gradient(90deg,#17151a,#b8a2a4,#17151a);
  box-shadow:0 0 8px #000;
}
.lc-vocal-room-microphone:before {
  content:"";position:absolute;left:50%;top:0;transform:translate(-50%,-25%);
  width:17px;height:39px;border-radius:9px 9px 6px 6px;
  border:2px solid #a87978;
  background:repeating-linear-gradient(180deg,#d7a0a0 0 2px,#3d2530 2px 4px);
  box-shadow:0 0 10px #e9a5cf88;
}
.lc-vocal-room-microphone:after {
  content:"";position:absolute;left:50%;bottom:0;transform:translateX(-50%);
  width:92px;height:3px;background:#1a1720;
  box-shadow:0 0 0 1px #8d778b;
}
.lc-vocal-booth [data-booth-mode-switch] {
  min-height:46px!important;
  border:1px solid #a86cc1!important;
  border-radius:7px!important;
  background:linear-gradient(145deg,#272033,#100d18)!important;
  color:#e8c9f3!important;
  letter-spacing:1.2px;
}
.lc-vocal-booth [data-booth-mode-switch][aria-pressed=true] {
  background:linear-gradient(180deg,#f0d5a0,#a87839)!important;
  border-color:#ffe4b0!important;color:#1b140d!important;
  box-shadow:0 0 15px #df9ff044;
}
.lc-vocal-booth [data-booth-mode="vocal"] > div:first-child > section,
.lc-vocal-booth [data-booth-mode="vocal"] > section {
  border-color:rgba(220,159,242,.34)!important;
  box-shadow:inset 0 0 24px rgba(210,104,244,.06),0 8px 20px #0004;
}
.lc-vocal-booth [data-vocal-wave] {
  border:1px solid rgba(117,239,177,.35);
  border-radius:8px;
  background:linear-gradient(180deg,#071b18,#0a1118);
}
.lc-vocal-booth button {
  transition:filter .15s ease,transform .15s ease;
}
.lc-vocal-booth button:active { filter:brightness(1.2);transform:translateY(1px); }
.lc-vocal-booth [data-vocal-action="record"] {
  background:linear-gradient(#ed858d,#8d263b)!important;
  border-color:#ffb8bd!important;
}
.lc-vocal-booth [data-vocal-talkback] {
  background:linear-gradient(145deg,#d7b16c,#8a622f)!important;
  color:#17120b!important;border-color:#f2d79d!important;
}
.lc-vocal-booth [data-booth-mode="notes"] {
  border-color:rgba(168,237,112,.42)!important;
}
@media(max-width:640px) {
  .lc-vocal-room-screen {left:19%;right:19%;grid-template-columns:34px minmax(0,1fr);gap:7px;padding:7px;border-width:3px}
  .lc-vocal-room-mic-icon {width:18px;height:36px}
  .lc-vocal-room-screen small {font-size:7px}
}
@media(prefers-reduced-motion:reduce) {
  .lc-vocal-booth button {transition:none}
}

/* CITY SYNTH mk1 — brushed gold chassis, carbon control bank, illuminated keybed */
.lc-city-synth {
  position:relative;
  overflow:hidden;
  border:2px solid #f0d38d!important;
  border-radius:12px!important;
  background:
    linear-gradient(115deg,rgba(255,255,255,.23),transparent 22%,rgba(72,46,14,.12) 54%,rgba(255,255,255,.18)),
    repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,rgba(40,25,8,.025) 1px 3px),
    linear-gradient(145deg,#f0d895,#a77a38 42%,#d5b86c 72%,#87602d)!important;
  box-shadow:0 18px 40px #0008,inset 0 1px 0 #fff9,inset 0 -8px 18px #53381255;
  color:#17140e!important;
}
.lc-city-synth > header {
  padding:9px 10px 13px;
  border-bottom:2px solid #72532b;
  text-shadow:0 1px #fff6;
}
.lc-city-synth > header h2 {
  font-size:clamp(21px,3vw,30px)!important;
  letter-spacing:1.5px!important;
  color:#1c1a15!important;
  text-shadow:0 1px 0 #fff7,0 2px 2px #76562b55;
}
.lc-city-synth > header button,
.lc-city-synth button[data-midi-arm] {
  border:1px solid #f6dfaa!important;
  background:linear-gradient(180deg,#fff0c4,#c69b4e 55%,#805a29)!important;
  color:#1b1409!important;
  box-shadow:inset 0 1px #fff,0 3px 6px #53371266;
}
.lc-city-synth > div {
  border-color:#e4c47b!important;
}
.lc-city-synth canvas[data-synth-wave] {
  border:1px solid #62707c;
  border-radius:4px;
  background:radial-gradient(ellipse,#162c3b,#080d15 75%);
}
.lc-city-synth [data-synth-knob] {
  min-height:78px;
  align-content:start;
  justify-items:center;
  padding:7px 4px;
  border:1px solid #3e4148;
  border-radius:7px;
  background:linear-gradient(145deg,#292d35,#090c12);
  color:#e8d5ad!important;
  box-shadow:inset 0 1px 0 #ffffff12,0 3px 6px #0008;
}
.lc-city-synth [data-synth-knob] input { accent-color:#e2bd69!important; }
.lc-city-synth [data-synth-keys] {
  min-height:clamp(175px,28vh,260px)!important;
  padding:5px 5px 0;
  border:1px solid #c8a65d;
  border-radius:5px 5px 9px 9px;
  background:linear-gradient(180deg,#080a10,#20232b);
  box-shadow:inset 0 5px 12px #000b;
}
.lc-city-synth [data-synth-white] {
  border-color:#aaa79d!important;
  background:linear-gradient(90deg,#b9b8b1,#fff 17%,#f7f3e9 82%,#c6c3b9)!important;
  box-shadow:inset 0 -8px 0 rgba(0,0,0,.08),0 2px 3px #0008;
}
.lc-city-synth [data-synth-black] {
  border-color:#050609!important;
  background:linear-gradient(90deg,#030407,#343842 48%,#080a0e)!important;
  box-shadow:0 4px 5px #000b;
}
.lc-city-synth [data-synth-waveform],
.lc-city-synth select {
  border-radius:5px!important;
}
.lc-city-synth input[type=range] { accent-color:#d8b15e; }
@media(max-width:640px) {
  .lc-city-synth > div:first-of-type { grid-template-columns:1fr!important; }
  .lc-city-synth [data-synth-knob] { min-height:68px; }
}
`;

export function installStudioInterfaceVisuals() {
  if (installed || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.id = "lc-studio-interface-visuals";
  style.textContent = STUDIO_VISUAL_CSS;
  document.head.appendChild(style);
  installed = true;
}

export function applyVocalBoothVisual(root) {
  if (!root || root.dataset.lcVisualReady === "true") return root;
  installStudioInterfaceVisuals();
  root.dataset.lcVisualReady = "true";
  root.classList.add("lc-vocal-booth");

  const hero = document.createElement("div");
  hero.className = "lc-vocal-room-hero";
  hero.setAttribute("aria-hidden", "true");
  hero.innerHTML = `
    <div class="lc-vocal-room-ceiling"></div>
    <div class="lc-vocal-room-light"></div>
    <div class="lc-vocal-room-screen">
      <div class="lc-vocal-room-brand">LAMBO CITY</div>
      <div class="lc-vocal-room-mic-icon"></div>
      <div class="lc-vocal-room-wave"></div>
      <small>VOICE NOTE · VOCAL TAKE · SESSION MONITOR</small>
    </div>
    <div class="lc-vocal-room-microphone"></div>
  `;
  const header = root.querySelector(":scope > header");
  if (header) header.after(hero);
  else root.prepend(hero);
  return root;
}

export function applyCitySynthVisual(root) {
  if (!root || root.dataset.lcVisualReady === "true") return root;
  installStudioInterfaceVisuals();
  root.dataset.lcVisualReady = "true";
  root.classList.add("lc-city-synth");
  const header = root.querySelector(":scope > header");
  if (header) header.dataset.lcSynthHeader = "true";
  return root;
}

export default { installStudioInterfaceVisuals, applyVocalBoothVisual, applyCitySynthVisual };
