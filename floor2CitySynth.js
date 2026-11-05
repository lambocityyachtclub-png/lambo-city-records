let THREE = null;
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";

const SEMITONES = [
  { name:"C", pitch:60, hz:261.63, white:true },
  { name:"C#", pitch:61, hz:277.18, white:false },
  { name:"D", pitch:62, hz:293.66, white:true },
  { name:"D#", pitch:63, hz:311.13, white:false },
  { name:"E", pitch:64, hz:329.63, white:true },
  { name:"F", pitch:65, hz:349.23, white:true },
  { name:"F#", pitch:66, hz:369.99, white:false },
  { name:"G", pitch:67, hz:392.00, white:true },
  { name:"G#", pitch:68, hz:415.30, white:false },
  { name:"A", pitch:69, hz:440.00, white:true },
  { name:"A#", pitch:70, hz:466.16, white:false },
  { name:"B", pitch:71, hz:493.88, white:true },
  { name:"C5", pitch:72, hz:523.25, white:true }
];
const WHITE_KEYS = SEMITONES.filter(note => note.white);
let activePanel = null;
let activeSynth = null;

export function createCitySynthPanel({ session = StudioMultitrackWorkspace } = {}) {
  const root = document.createElement("section");
  root.className = "lc-city-synth";
  root.style.cssText = "display:grid;gap:14px;padding:clamp(12px,2vw,24px);min-height:calc(100vh - 150px);border-radius:14px;background:linear-gradient(145deg,#c8a75f,#8e6b32 38%,#d6b86e);color:#191711;font-family:Arial,sans-serif;box-sizing:border-box";
  root.innerHTML =
    '<header style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><div style="font-size:10px;letter-spacing:2px;font-weight:900;color:#25324c">LAMBO CITY YACHT CLUB</div><h2 style="margin:4px 0;font-size:clamp(20px,3vw,30px);letter-spacing:1px">CITY SYNTH mk1</h2><div style="font-size:10px;letter-spacing:1.4px;color:#4a3a20">GOLD EDITION · PERFORMANCE KEYBOARD</div></div><button type="button" data-midi-arm style="min-height:42px;padding:10px 14px;border:1px solid #f3d48e;border-radius:8px;background:linear-gradient(#f6e1aa,#a87932);color:#20170a;font-weight:900">● ARM MIDI RECORD</button></header>' +
    '<div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(210px,.9fr);gap:12px">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch">' +
        '<div style="padding:12px;border-radius:10px;background:linear-gradient(145deg,#292b31,#090d17);border:2px solid #d7b568;color:#f4e7c4"><div style="font-size:9px;letter-spacing:1.4px;color:#9beaff">SOUND MONITOR</div><canvas data-synth-wave width="520" height="140" style="width:100%;height:90px;display:block"></canvas><div data-synth-status style="font-size:10px;color:#b8d4e8">READY · LIVE OUTPUT</div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px;border-radius:10px;background:linear-gradient(145deg,#20242c,#090c12);border:2px solid #d7b568;color:#e7d5ad"><label style="font-size:9px;display:grid;gap:5px">WAVEFORM<select data-synth-waveform style="width:100%;padding:7px;background:#111827;color:#f5d99c;border:1px solid #8d7444"><option value="triangle">TRIANGLE</option><option value="sine">SINE</option><option value="sawtooth">SAW</option><option value="square">SQUARE</option></select></label><label style="font-size:9px;display:grid;gap:5px">MASTER LEVEL<input data-synth-volume type="range" min="2" max="35" value="18" style="width:100%;accent-color:#e6bb69"></label><label style="font-size:9px;display:grid;gap:5px">FILTER<input data-synth-filter type="range" min="200" max="12000" value="9000" style="width:100%;accent-color:#58e2df"></label><label style="font-size:9px;display:grid;gap:5px">DETUNE<input data-synth-detune type="range" min="-100" max="100" value="0" style="width:100%;accent-color:#d56aff"></label></div>' +
      '</div>' +
      '<div style="padding:12px;border-radius:10px;background:linear-gradient(145deg,#252a33,#0a0d14);border:2px solid #d7b568;color:#ead9b5"><div style="font-size:10px;letter-spacing:1.5px">CITY SYNTH CONTROL BANK</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:14px">' +
        '<label data-synth-knob="attack">ATTACK<input type="range" min="1" max="500" value="18"></label><label data-synth-knob="release">RELEASE<input type="range" min="20" max="1200" value="180"></label><label data-synth-knob="resonance">RESONANCE<input type="range" min="0.1" max="18" step=".1" value="0.8"></label><label data-synth-knob="octave">OCTAVE<input type="range" min="-2" max="2" value="0"></label>' +
      '</div></div>' +
    '</div>' +
    '<div style="padding:12px;border-radius:10px;background:linear-gradient(180deg,#20232a,#080b12);border:2px solid #d7b568"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;color:#d7bd84;font-size:10px;letter-spacing:1.4px;margin-bottom:10px"><span>PERFORMANCE KEYBED</span><span data-midi-status>MIDI CAPTURE OFF</span></div><div data-synth-keys style="position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));height:clamp(150px,28vh,250px);touch-action:pan-y"></div></div>' +
    '<div style="font-size:10px;color:#45351a">Playable original synth voice · MIDI notes are stored in the shared LAMBO CITY session.</div>';
  const style = document.createElement("style");
  style.textContent = ".lc-city-synth [data-synth-knob]{display:grid;gap:7px;font-size:8px;letter-spacing:.5px;color:#d6c59f}.lc-city-synth [data-synth-knob] input{width:100%;accent-color:#d7b568}.lc-city-synth [data-synth-white]{position:relative;z-index:1;border:1px solid #9d9b94;border-radius:0 0 6px 6px;background:linear-gradient(90deg,#c8c8c4,#fff 18%,#f4f0e5 80%,#c6c4bb);color:#222;touch-action:none}.lc-city-synth [data-synth-black]{position:absolute;z-index:2;top:0;width:8%;height:62%;transform:translateX(-50%);border:1px solid #111;border-radius:0 0 5px 5px;background:linear-gradient(90deg,#050608,#333842 50%,#050608);color:#fff;font-size:8px;touch-action:none}.lc-city-synth [data-synth-white].active,.lc-city-synth [data-synth-black].active{background:linear-gradient(#9bf6ff,#56a5cf);box-shadow:0 0 16px rgba(90,222,255,.8)}@media(max-width:650px){.lc-city-synth>div:nth-of-type(1){grid-template-columns:1fr!important}.lc-city-synth [data-synth-knob]{font-size:7px}}";
  root.prepend(style);
  const keys = root.querySelector("[data-synth-keys]");
  const status = root.querySelector("[data-synth-status]");
  const midiStatus = root.querySelector("[data-midi-status]");
  const armButton = root.querySelector("[data-midi-arm]");
  const waveform = root.querySelector("[data-synth-wave]");
  const settings = { waveform:"triangle", volume:0.18, filter:9000, detune:0, attack:0.018, release:0.18, resonance:0.8, octave:0 };
  let midiArmed = false;
  let midiTrack = null;
  let captureStartedAt = 0;
  let captureStartBar = 1;
  const activeNotes = new Map();
  const ensureMidiTrack = () => {
    midiTrack = session.tracks.find(track => track.type === "midi" && /city synth|piano performance/i.test(track.name));
    if (!midiTrack) {
      session.recordHistory("Create City Synth MIDI track");
      midiTrack = session.createTrack("midi", "City Synth Performance");
      midiTrack.midiNotes = [];
    }
    return midiTrack;
  };
  const startNote = async (note, button) => {
    try {
      const audio = await StudioAudioEngine.resume();
      if (!audio || audio.state !== "running") throw new Error("Studio audio is unavailable.");
      const oscillator = audio.createOscillator();
      const filter = audio.createBiquadFilter();
      const envelope = audio.createGain();
      oscillator.type = settings.waveform;
      oscillator.frequency.setValueAtTime(note.hz * Math.pow(2, settings.octave), audio.currentTime);
      oscillator.detune.setValueAtTime(settings.detune, audio.currentTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(settings.filter, audio.currentTime);
      filter.Q.setValueAtTime(settings.resonance, audio.currentTime);
      envelope.gain.setValueAtTime(0.0001, audio.currentTime);
      envelope.gain.exponentialRampToValueAtTime(settings.volume, audio.currentTime + settings.attack);
      oscillator.connect(filter);
      filter.connect(envelope);
      envelope.connect(StudioAudioEngine.master || audio.destination);
      oscillator.start(audio.currentTime);
      const record = { oscillator, filter, envelope, audio, startedAt:audio.currentTime, midi:null };
      activeNotes.set(note.pitch, record);
      button.classList.add("active");
      window.dispatchEvent(new CustomEvent("lc-city-synth-note", { detail:{ pitch:note.pitch, active:true } }));
      if (midiArmed) {
        const track = ensureMidiTrack();
        if (!captureStartedAt) {
          captureStartedAt = audio.currentTime;
          captureStartBar = Math.max(1, Number(session.playheadBar) || 1);
        }
        const bpm = Math.max(20, Number(session.getTempoAtBar(captureStartBar)) || 100);
        const startBar = captureStartBar + (audio.currentTime - captureStartedAt) / (240 / bpm);
        record.midi = { id:"city-synth-" + Date.now() + "-" + note.pitch, pitch:note.pitch + settings.octave * 12, startBar, lengthBars:0.125, velocity:0.8 };
        track.midiNotes = Array.isArray(track.midiNotes) ? track.midiNotes : [];
        track.midiNotes.push(record.midi);
        midiStatus.textContent = "MIDI CAPTURING · " + track.midiNotes.length + " NOTES";
      }
      status.textContent = note.name + " · " + Math.round(note.hz) + " Hz";
    } catch (error) {
      status.textContent = "SYNTH ERROR · " + (error?.message || error);
    }
  };
  const stopNote = (note, button) => {
    const record = activeNotes.get(note.pitch);
    if (!record) return;
    const now = record.audio.currentTime;
    record.envelope.gain.cancelScheduledValues(now);
    record.envelope.gain.setTargetAtTime(0.0001, now, Math.max(0.01, settings.release / 1000));
    try { record.oscillator.stop(now + settings.release / 1000 + 0.04); } catch {}
    if (record.midi) {
      const bpm = Math.max(20, Number(session.getTempoAtBar(record.midi.startBar)) || 100);
      record.midi.lengthBars = Math.max(0.0625, (now - record.startedAt) / (240 / bpm));
      session.scheduleProjectAutosave();
    }
    activeNotes.delete(note.pitch);
    button.classList.remove("active");
    window.dispatchEvent(new CustomEvent("lc-city-synth-note", { detail:{ pitch:note.pitch, active:false } }));
  };
  const whiteIndex = new Map();
  WHITE_KEYS.forEach((note,index) => whiteIndex.set(note.pitch,index));
  WHITE_KEYS.forEach(note => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.synthWhite = String(note.pitch);
    button.textContent = note.name;
    button.setAttribute("aria-label","Play " + note.name);
    button.addEventListener("pointerdown",event=>{event.preventDefault();button.setPointerCapture?.(event.pointerId);startNote(note,button);});
    const release=()=>stopNote(note,button);
    button.addEventListener("pointerup",release);
    button.addEventListener("pointercancel",release);
    button.addEventListener("pointerleave",release);
    keys.appendChild(button);
  });
  const blackOffsets = [
    { pitch:61, after:0 },{ pitch:63, after:1 },{ pitch:66, after:3 },{ pitch:68, after:4 },{ pitch:70, after:5 }
  ];
  blackOffsets.forEach(item => {
    const note = SEMITONES.find(value=>value.pitch===item.pitch);
    const button=document.createElement("button");
    button.type="button";
    button.dataset.synthBlack=String(note.pitch);
    button.textContent="♯";
    button.style.left=((item.after+1)/7*100)+"%";
    button.setAttribute("aria-label","Play "+note.name);
    button.addEventListener("pointerdown",event=>{event.preventDefault();button.setPointerCapture?.(event.pointerId);startNote(note,button);});
    const release=()=>stopNote(note,button);
    button.addEventListener("pointerup",release);
    button.addEventListener("pointercancel",release);
    button.addEventListener("pointerleave",release);
    keys.appendChild(button);
  });
  armButton.addEventListener("click",()=>{
    midiArmed=!midiArmed;
    if(midiArmed){ensureMidiTrack();captureStartedAt=0;captureStartBar=Math.max(1,Number(session.playheadBar)||1);armButton.textContent="■ STOP MIDI RECORD";midiStatus.textContent="MIDI ARMED";}
    else{armButton.textContent="● ARM MIDI RECORD";midiStatus.textContent="MIDI CAPTURE OFF";session.scheduleProjectAutosave();session.render?.();}
  });
  root.querySelector("[data-synth-waveform]").addEventListener("change",event=>{settings.waveform=event.target.value;status.textContent="Oscillator waveform: "+settings.waveform.toUpperCase();});
  root.querySelector("[data-synth-volume]").addEventListener("input",event=>{settings.volume=Number(event.target.value)/100;activeNotes.forEach(note=>note.envelope.gain.setTargetAtTime(settings.volume,note.audio.currentTime,.015));});
  root.querySelector("[data-synth-filter]").addEventListener("input",event=>{settings.filter=Number(event.target.value);activeNotes.forEach(note=>note.filter.frequency.setTargetAtTime(settings.filter,note.audio.currentTime,.02));});
  root.querySelector("[data-synth-detune]").addEventListener("input",event=>{settings.detune=Number(event.target.value);activeNotes.forEach(note=>note.oscillator.detune.setTargetAtTime(settings.detune,note.audio.currentTime,.015));});
  root.querySelectorAll("[data-synth-knob]").forEach(label=>{
    const input=label.querySelector("input");
    input.addEventListener("input",()=>{
      const key=label.dataset.synthKnob;
      if(key==="attack")settings.attack=Number(input.value)/1000;
      if(key==="release")settings.release=Number(input.value);
      if(key==="resonance")settings.resonance=Number(input.value);
      if(key==="octave")settings.octave=Number(input.value);
      activeNotes.forEach(note=>{
        if(key==="resonance")note.filter.Q.setTargetAtTime(settings.resonance,note.audio.currentTime,.02);
      });
    });
  });
  activePanel = { root, waveform, status, settings };
  return root;
}

function goldMaterial(color=0xd6b45f,emissive=0x2b1b05,intensity=.15){
  return new THREE.MeshStandardMaterial({color,metalness:.86,roughness:.23,emissive,emissiveIntensity:intensity});
}

export default {
  station:null,
  leds:[],
  screenCanvas:null,
  screenContext:null,
  noteHandler:null,
  async init(scene){
    THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    const studio=scene?.getObjectByName("recordsHQFloor2Studio");
    const station=studio?.getObjectByName("floor2InstrumentStation");
    if(!station){console.warn("LAMBO CITY City Synth: piano station unavailable.");return;}
    this.station=station;
    if(station.userData.citySynthReady)return;
    station.userData.citySynthReady=true;
    const gold=goldMaterial();
    const dark=new THREE.MeshStandardMaterial({color:0x10131a,metalness:.68,roughness:.24});
    const x=5.25,y=1.18,z=-3.62;
    const panel=new THREE.Mesh(new THREE.BoxGeometry(3.72,.10,.54),gold);
    panel.name="floor2CitySynthGoldControlSurface";
    panel.position.set(x,y,z);
    station.add(panel);
    const screenCanvas=document.createElement("canvas");
    screenCanvas.width=512;screenCanvas.height=128;
    const ctx=screenCanvas.getContext("2d");
    ctx.fillStyle="#070c16";ctx.fillRect(0,0,512,128);
    ctx.fillStyle="#9efaff";ctx.font="bold 18px Arial";ctx.fillText("LC-NK I · GOLD EDITION",16,24);
    const texture=new THREE.CanvasTexture(screenCanvas);texture.colorSpace=THREE.SRGBColorSpace;
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.30),new THREE.MeshBasicMaterial({map:texture}));
    screen.position.set(x-.92,y+.07,z-.16);screen.rotation.x=-.48;station.add(screen);
    this.screenCanvas=screenCanvas;this.screenContext=ctx;this.screenTexture=texture;
    for(let i=0;i<8;i++){
      const angle=i%4;
      const row=Math.floor(i/4);
      const knob=new THREE.Mesh(new THREE.CylinderGeometry(.065,.075,.055,24),gold);
      knob.position.set(x+.35+angle*.24,y+.09,z-.16+row*.22);
      station.add(knob);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.09,.009,5,24),new THREE.MeshBasicMaterial({color:[0x4ce4db,0x4e9eff,0x9b6bff,0xf16be2][angle]}));
      ring.rotation.x=-Math.PI/2;ring.position.set(knob.position.x,y+.06,knob.position.z);station.add(ring);
    }
    for(let i=0;i<16;i++){
      const led=new THREE.Mesh(new THREE.BoxGeometry(.19,.018,.025),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(.54-i*.025,.9,.55),transparent:true,opacity:.35}));
      led.position.set(5.25-1.90+i*.22,1.145,-2.76);
      station.add(led);this.leds.push(led);
    }
    const plaque=new THREE.Mesh(new THREE.BoxGeometry(1.10,.045,.13),dark);
    plaque.position.set(x+1.18,y+.09,z-.13);station.add(plaque);
    this.noteHandler=event=>{
      const pitch=Number(event.detail?.pitch);
      const index=pitch-60;
      if(index>=0&&index<this.leds.length){
        this.leds[index].material.opacity=event.detail.active?1:.35;
        this.leds[index].material.emissive=new THREE.Color(0x1d9db0);
        this.leds[index].material.emissiveIntensity=event.detail.active?.8:0;
      }
    };
    window.addEventListener("lc-city-synth-note",this.noteHandler);
  },
  update(){
    const meter=StudioAudioEngine.getMasterMeter?.()||{peak:0,rms:0};
    const draw=(ctx,width,height)=>{
      ctx.fillStyle="#070c16";ctx.fillRect(0,0,width,height);
      ctx.fillStyle="#9efaff";ctx.font="bold "+Math.max(10,Math.round(height*.12))+"px Arial";ctx.fillText("SOUND MONITOR",12,18);
      const peak=Math.max(0,Math.min(1,meter.peak||0));
      for(let i=0;i<42;i++){
        const wave=(Math.sin(i*.72+performance.now()*.004)*.25+.25+peak*.5);
        const h=5+wave*(height*.62);
        ctx.fillStyle=i<14?"#43dce9":i<28?"#9a65f4":"#ef5bc4";
        ctx.fillRect(12+i*(width-24)/42,height-12-h,Math.max(2,width/80),h);
      }
    };
    if(this.screenContext&&this.screenCanvas){
      draw(this.screenContext,this.screenCanvas.width,this.screenCanvas.height);
      this.screenTexture.needsUpdate=true;
    }
    if(activePanel?.waveform){
      const ctx=activePanel.waveform.getContext("2d");
      if(ctx)draw(ctx,activePanel.waveform.width,activePanel.waveform.height);
    }
  },
  destroy(){
    if(this.noteHandler)window.removeEventListener("lc-city-synth-note",this.noteHandler);
    this.noteHandler=null;this.leds=[];
    if(this.station)this.station.userData.citySynthReady=false;
  }
};
