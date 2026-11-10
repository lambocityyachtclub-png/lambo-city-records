let THREE = null;
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioRecordingEngine from "./studioRecordingEngine.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import StudioTalkback from "./studioTalkback.js";

let activePanel = null;
let recordingStartedAt = 0;
let recordingActive = false;
let takeCount = 0;

function formatTime(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(seconds / 60)).padStart(2,"0") + ":" + String(seconds % 60).padStart(2,"0");
}

export function createVocalBoothPanel({ beatLab } = {}) {
  const root = document.createElement("section");
  root.className = "lc-vocal-booth";
  root.style.cssText = "display:grid;gap:14px;min-height:calc(100vh - 150px);padding:clamp(12px,2vw,24px);border-radius:14px;background:radial-gradient(ellipse at 50% 15%,#4c285f,#24142f 62%,#100d19);color:#f5eef8;font-family:Arial,sans-serif;box-sizing:border-box";
  root.innerHTML =
    '<header style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><div style="font-size:10px;letter-spacing:2.5px;color:#d9a8ed">LAMBO CITY RECORDS · PRIVATE VOCAL ROOM</div><h2 style="margin:5px 0;font-size:clamp(22px,3vw,30px);letter-spacing:1px">VOCAL BOOTH</h2><div style="font-size:10px;color:#c3a6d2">VOICE NOTES · VOCAL TAKES · SESSION RECORDING</div></div><div data-vocal-timer style="padding:10px 16px;border:1px solid #a85dd0;border-radius:9px;background:#130e1c;color:#f5d6ff;font:700 24px monospace">00:00</div></header>' +
    '<nav aria-label="Recording mode" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:6px;border:1px solid rgba(223,156,245,.35);border-radius:12px;background:rgba(10,8,16,.72)"><button type="button" data-booth-mode-switch="vocal" aria-pressed="true">VOCAL BOOTH</button><button type="button" data-booth-mode-switch="notes" aria-pressed="false">VOICE NOTES</button></nav>' +
    '<section data-booth-mode="vocal" style="display:grid;gap:12px">' +
    '<div style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(220px,.85fr);gap:12px">' +
      '<section style="padding:14px;border:1px solid rgba(223,156,245,.45);border-radius:12px;background:linear-gradient(145deg,rgba(29,18,39,.95),rgba(12,12,22,.95));box-shadow:inset 0 0 28px rgba(174,62,211,.08)">' +
        '<div style="font-size:10px;letter-spacing:2px;color:#d6a3ec">LAMBO CITY · LIVE INPUT</div><canvas data-vocal-wave width="720" height="170" style="width:100%;height:150px;display:block;margin:10px 0"></canvas>' +
        '<div style="display:flex;gap:9px;flex-wrap:wrap"><button type="button" data-vocal-action="start-beat">▶ PLAY BEAT</button><button type="button" data-vocal-action="stop-beat">■ STOP BEAT</button><button type="button" data-vocal-action="record">● RECORD</button><button type="button" data-vocal-action="stop-recording">■ STOP & SAVE</button></div>' +
        '<div data-vocal-status role="status" aria-live="polite" style="min-height:20px;margin-top:10px;color:#e5b7f2;font-size:11px">Microphone ready · Permission is requested when recording starts.</div>' +
      '</section>' +
      '<section style="display:grid;align-content:center;gap:10px;padding:14px;border:1px solid rgba(223,156,245,.4);border-radius:12px;background:linear-gradient(145deg,#24152f,#100e18)">' +
        '<div style="font-size:10px;letter-spacing:2px;color:#d6a3ec">SESSION MONITOR</div><strong style="font-size:17px;color:#f5e4ff">Ready for your next take</strong><p style="margin:0;color:#c5b4cf;font-size:12px;line-height:1.5">Your vocal recordings, effects and takes stay connected to the shared Studio timeline.</p>' +
        '<div style="font-size:10px;letter-spacing:1.5px;color:#d6a3ec">RECORDING MODE</div><strong style="color:#f5e4ff">FULL VOCAL SESSION</strong>' +
      '</section>' +
    '</div>' +
    '<section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:14px;border:1px solid rgba(223,156,245,.35);border-radius:12px;background:rgba(12,10,19,.7)">' +
      '<label style="display:grid;gap:7px;color:#e6c5f0;font-size:10px;letter-spacing:1px">DELAY MIX <input data-vocal-effect="delay" type="range" min="0" max="1" step=".01" value="' + (beatLab?.vocalEffectSettings?.delay ?? 0) + '" style="width:100%;accent-color:#d78df2"></label>' +
      '<label style="display:grid;gap:7px;color:#e6c5f0;font-size:10px;letter-spacing:1px">REVERB MIX <input data-vocal-effect="reverb" type="range" min="0" max="1" step=".01" value="' + (beatLab?.vocalEffectSettings?.reverb ?? 0) + '" style="width:100%;accent-color:#d78df2"></label>' +
    '</section>' +
    '<section style="display:grid;gap:12px;padding:14px;border:1px solid rgba(224,190,111,.45);border-radius:12px;background:linear-gradient(145deg,#211b19,#11131b)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong style="font-size:10px;letter-spacing:2px;color:#e6c58b">PITCH CORRECTION · LIVE VOCAL TUNING</strong><label style="display:flex;align-items:center;gap:8px;color:#f3dfb5;font-size:11px;font-weight:800"><input type="checkbox" data-vocal-pitch="enabled" ' + (beatLab?.pitchCorrectionSettings?.enabled ? 'checked' : '') + '> ENABLE</label></div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
        '<label style="display:grid;gap:6px;color:#d8c7a7;font-size:10px">KEY <select data-vocal-pitch="root" style="min-height:38px;background:#171923;color:#fff;border:1px solid #67563c;border-radius:7px;padding:7px">' + ['C','C♯ / D♭','D','D♯ / E♭','E','F','F♯ / G♭','G','G♯ / A♭','A','A♯ / B♭','B'].map((note,index)=>'<option value="' + index + '"' + (Number(beatLab?.pitchCorrectionSettings?.root ?? 0)===index?' selected':'') + '>' + note + '</option>').join('') + '</select></label>' +
        '<label style="display:grid;gap:6px;color:#d8c7a7;font-size:10px">SCALE <select data-vocal-pitch="scale" style="min-height:38px;background:#171923;color:#fff;border:1px solid #67563c;border-radius:7px;padding:7px"><option value="major"' + ((beatLab?.pitchCorrectionSettings?.scale||'major')==='major'?' selected':'') + '>MAJOR</option><option value="minor"' + ((beatLab?.pitchCorrectionSettings?.scale||'major')==='minor'?' selected':'') + '>MINOR</option><option value="chromatic"' + ((beatLab?.pitchCorrectionSettings?.scale||'major')==='chromatic'?' selected':'') + '>CHROMATIC</option></select></label>' +
      '</div>' +
      '<label style="display:grid;gap:6px;color:#d8c7a7;font-size:10px">CORRECTION AMOUNT <input data-vocal-pitch="amount" type="range" min="0" max="100" step="1" value="' + (beatLab?.pitchCorrectionSettings?.amount ?? 100) + '" style="width:100%;accent-color:#e6bb69"></label>' +
      '<label style="display:grid;gap:6px;color:#d8c7a7;font-size:10px">RETUNE SPEED <input data-vocal-pitch="speedMs" type="range" min="0" max="120" step="1" value="' + (beatLab?.pitchCorrectionSettings?.speedMs ?? 25) + '" style="width:100%;accent-color:#e6bb69"></label>' +
      '<div data-pitch-status role="status" aria-live="polite" style="color:#c9b58d;font-size:11px">Set the song key and scale. Correction is printed into new vocal takes when enabled.</div>' +
    '</section>' +
    '</section>' +
    '<section data-booth-mode="notes" hidden style="display:grid;align-content:start;gap:16px;padding:clamp(16px,3vw,28px);border:1px solid rgba(168,237,112,.38);border-radius:14px;background:linear-gradient(145deg,#18231a,#10131a)">' +
      '<div style="font-size:10px;letter-spacing:2px;color:#b7e99b">LAMBO CITY RECORDS · QUICK CAPTURE</div>' +
      '<h3 style="margin:0;color:#f1f4ed;font-size:clamp(22px,3vw,30px)">VOICE NOTES</h3>' +
      '<p style="margin:0;max-width:620px;color:#c6d2c3;font-size:13px;line-height:1.65">Capture a melody, hook, lyric, verse or production idea without opening the full vocal recording workflow. Your note is saved as an audio clip in the current song session.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-vocal-action="quick-note-start" style="min-height:50px;padding:13px 18px;background:linear-gradient(#a8ed70,#4d963e);color:#11200e;border:1px solid #c5ff9a">● RECORD VOICE NOTE</button><button type="button" data-vocal-action="quick-note-stop" disabled>■ SAVE VOICE NOTE</button></div>' +
      '<div data-voice-note-status role="status" aria-live="polite" style="min-height:22px;color:#b7e99b;font-size:12px">Ready to capture an idea into this song session.</div>' +
      '<div style="padding:14px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:rgba(0,0,0,.18)"><div style="font-size:10px;letter-spacing:1.5px;color:#b7e99b">LATEST TAKE</div><div data-vocal-take-name style="margin-top:7px;color:#f5e4ff;font-size:13px">No take recorded yet</div><div data-vocal-take-format style="margin-top:4px;color:#aa94b8;font-size:10px">—</div></div>' +
    '</section>' +
    '<section style="display:grid;gap:11px;padding:14px;border:1px solid rgba(223,156,245,.45);border-radius:12px;background:linear-gradient(145deg,#21192b,#100e18)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong style="font-size:10px;letter-spacing:2px;color:#e5b7f2">PRODUCER TALKBACK · LIVE MONITOR</strong><button type="button" data-vocal-talkback>TALKBACK</button></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">' +
        '<label style="display:grid;gap:6px;color:#e6c5f0;font-size:10px">TALKBACK LEVEL <input data-talkback-setting="volume" type="range" min="0" max="1" step=".01" value="' + StudioTalkback.volume + '" style="width:100%;accent-color:#d78df2"></label>' +
        '<label style="display:grid;gap:6px;color:#e6c5f0;font-size:10px">HEADPHONE SIDETONE <input data-talkback-setting="sidetone" type="range" min="0" max="1" step=".01" value="' + StudioTalkback.sidetone + '" style="width:100%;accent-color:#d78df2"></label>' +
        '<label style="display:grid;gap:6px;color:#e6c5f0;font-size:10px">BEAT DUCKING <input data-talkback-setting="duckAmount" type="range" min="0" max=".8" step=".01" value="' + StudioTalkback.duckAmount + '" style="width:100%;accent-color:#d78df2"></label>' +
      '</div>' +
      '<div data-talkback-status role="status" aria-live="polite" style="color:#cbb7d5;font-size:11px">Tap TALKBACK to toggle, or press and hold to talk. Use headphones to prevent speaker feedback. Talkback is isolated from recorded takes.</div>' +
    '</section>' +
    '<div data-booth-mode="vocal" style="display:flex;gap:9px;flex-wrap:wrap"><button type="button" data-vocal-action="export-vocals">EXPORT VOCALS</button><button type="button" data-vocal-action="export-mix">EXPORT MASTER MIX</button></div>';
  const style=document.createElement("style");
  style.textContent=".lc-vocal-booth [data-booth-mode][hidden]{display:none!important}.lc-vocal-booth [data-booth-mode-switch]{min-height:46px;border:1px solid rgba(223,156,245,.45);border-radius:8px;background:#171320;color:#d8c7e3;font-weight:900;letter-spacing:1px}.lc-vocal-booth [data-booth-mode-switch][aria-pressed=true]{background:linear-gradient(#e6c58b,#9d6c36);border-color:#f1d49c;color:#17130d}.lc-vocal-booth button{min-height:42px;padding:10px 13px;border:1px solid rgba(218,163,239,.55);border-radius:8px;background:linear-gradient(145deg,#39234a,#171320);color:#f5e8fb;font-size:11px;font-weight:800;letter-spacing:.5px;touch-action:manipulation}.lc-vocal-booth button:disabled{opacity:.45}.lc-vocal-booth [data-vocal-action=record]{background:linear-gradient(#ec777e,#8d263b);border-color:#ffb2b8}.lc-vocal-booth [data-vocal-action=quick-note-start]{background:linear-gradient(#a8ed70,#4d963e);color:#11200e;border-color:#c5ff9a}@media(max-width:640px){.lc-vocal-booth>div:nth-of-type(1){grid-template-columns:1fr!important}.lc-vocal-booth section[style*=grid-template-columns]{grid-template-columns:1fr!important}}";
  root.prepend(style);
  const status=message=>{const node=root.querySelector("[data-vocal-status]");if(node)node.textContent=message;};
  let boothMode="vocal";
  const setBoothMode=mode=>{
    if(mode!=="vocal"&&mode!=="notes")return;
    if(recordingActive){const message="Finish and save the active recording before switching modes.";status(message);const noteStatus=root.querySelector("[data-voice-note-status]");if(noteStatus)noteStatus.textContent=message;return;}
    boothMode=mode;
    root.querySelectorAll("[data-booth-mode]").forEach(view=>{view.hidden=view.dataset.boothMode!==mode;});
    root.querySelectorAll("[data-booth-mode-switch]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.boothModeSwitch===mode)));
  };
  root.querySelectorAll("[data-booth-mode-switch]").forEach(button=>button.addEventListener("click",()=>setBoothMode(button.dataset.boothModeSwitch)));
  setBoothMode("vocal");
  const voiceStatus=message=>{const node=root.querySelector("[data-voice-note-status]");if(node)node.textContent=message;};
  const talkbackStatus=message=>{const node=root.querySelector("[data-talkback-status]");if(node)node.textContent=message;};
  StudioTalkback.bindControl(root.querySelector("[data-vocal-talkback]"),{beatLab});
  const onTalkbackState=event=>{
    if(event.detail?.active)talkbackStatus("Talkback monitor active · beat ducking engaged · not being recorded.");
    else talkbackStatus("Talkback off · recording path remains isolated.");
  };
  const onTalkbackError=event=>talkbackStatus("TALKBACK ERROR · "+(event.detail?.message||"Microphone unavailable."));
  const onCountIn=event=>{
    const detail=event.detail||{};
    if(detail.cancelled){status("Count-in cancelled · recording did not start.");return;}
    status(detail.complete?"Count-in complete · recording.":"GET READY · "+detail.beat+" / 4");
  };
  window.addEventListener("lc-vocal-count-in",onCountIn);
  window.addEventListener("lc-talkback-state",onTalkbackState);
  window.addEventListener("lc-talkback-error",onTalkbackError);
  root.addEventListener("lc-vocal-booth-dispose",()=>{
    window.removeEventListener("lc-vocal-count-in",onCountIn);
    window.removeEventListener("lc-talkback-state",onTalkbackState);
    window.removeEventListener("lc-talkback-error",onTalkbackError);
  },{once:true});
  const showTake=(name,format)=>{root.querySelector("[data-vocal-take-name]").textContent=name;root.querySelector("[data-vocal-take-format]").textContent=format||"Original audio take";};
  root.addEventListener("click",async event=>{
    const button=event.target.closest("[data-vocal-action]");
    if(!button||!beatLab)return;
    try{
      switch(button.dataset.vocalAction){
        case "start-beat":
          await beatLab.start();
          status("Beat session playing.");
          break;
        case "stop-beat":
          beatLab.stop();
          status("Beat session stopped.");
          break;
        case "record":
          if(recordingActive||beatLab.recordingStartPending)return;
          status("Four-count starting…");
          await beatLab.startRecording();
          if(!StudioRecordingEngine.activeTake)return;
          recordingStartedAt=performance.now();
          recordingActive=true;
          status("Recording vocals and session stems.");
          window.dispatchEvent(new CustomEvent("lc-vocal-recording-state",{detail:{recording:true,mode:"vocal"}}));
          break;
        case "stop-recording":
          if(!recordingActive||!StudioRecordingEngine.activeTake)return;
          await beatLab.stopRecording();
          recordingActive=false;
          takeCount+=1;
          const format=beatLab.lastRecordedTake?.recordingFormat||"Session recording";
          showTake("Vocal Take "+String(takeCount).padStart(2,"0"),format);
          status("Vocal take saved to the shared session.");
          window.dispatchEvent(new CustomEvent("lc-vocal-recording-state",{detail:{recording:false,name:"Vocal Take "+String(takeCount).padStart(2,"0")}}));
          break;
        case "quick-note-start":{
          if(StudioRecordingEngine.activeTake||StudioRecordingEngine.activeTrackTake)throw new Error("Finish the current recording before starting a Voice Note.");
          const audio=await StudioAudioEngine.resume();
          if(!audio||audio.state!=="running")throw new Error("Studio audio could not start.");
          let track=StudioMultitrackWorkspace.tracks.find(item=>item.type==="audio"&&item.name==="Voice Notes");
          if(!track){StudioMultitrackWorkspace.recordHistory("Create Voice Notes track");track=StudioMultitrackWorkspace.createTrack("audio","Voice Notes");}
          await StudioRecordingEngine.startTrackRecording({audio,trackId:track.id});
          root.dataset.voiceNoteTrackId=track.id;
          recordingStartedAt=performance.now();
          recordingActive=true;
          button.disabled=true;
          root.querySelector('[data-vocal-action="quick-note-stop"]').disabled=false;
          voiceStatus("Recording your idea…");
          window.dispatchEvent(new CustomEvent("lc-vocal-recording-state",{detail:{recording:true,mode:"voice-note"}}));
          break;
        }
        case "quick-note-stop":{
          const trackId=root.dataset.voiceNoteTrackId;
          if(!trackId)return;
          const take=await StudioRecordingEngine.stopTrackRecording(trackId);
          const track=StudioMultitrackWorkspace.tracks.find(item=>item.id===trackId);
          const date=new Date();
          const name="Voice Note · "+date.toLocaleString();
          const clip={id:take.id,name,blob:take.blob,recordingFormat:take.recordingFormat,durationMs:take.durationMs,createdAt:date.toISOString(),startBar:Math.max(1,Number(StudioMultitrackWorkspace.playheadBar)||1),lengthBars:Math.max(.25,(take.durationMs/1000)/(240/Math.max(20,Number(StudioMultitrackWorkspace.getTempoAtBar(StudioMultitrackWorkspace.playheadBar))||100))),objectUrl:take.blob?.size?URL.createObjectURL(take.blob):null};
          track.clips.push(clip);
          StudioMultitrackWorkspace.render();
          StudioMultitrackWorkspace.scheduleProjectAutosave();
          recordingActive=false;
          button.disabled=false;
          root.querySelector('[data-vocal-action="quick-note-start"]').disabled=false;
          root.querySelector('[data-vocal-action="quick-note-stop"]').disabled=true;
          voiceStatus("Saved to the shared song timeline.");
          showTake(name,take.recordingFormat);
          window.dispatchEvent(new CustomEvent("lc-vocal-recording-state",{detail:{recording:false,name,format:take.recordingFormat}}));
          delete root.dataset.voiceNoteTrackId;
          break;
        }
        case "export-vocals":
          if(!beatLab.lastRecordedTake?.vocal?.size){status("Record a vocal take before exporting.");return;}
          beatLab.exportRecordingTrack("vocal");status("Vocal export requested.");
          break;
        case "export-mix":
          if(!beatLab.lastRecordedTake?.mix?.size){status("Record a session take before exporting the master mix.");return;}
          beatLab.exportRecordingTrack("mix");status("Master mix export requested.");
          break;
      }
    }catch(error){status("STUDIO ERROR · "+(error?.message||error));}
  });
  const pitchStatus=message=>{const node=root.querySelector("[data-pitch-status]");if(node)node.textContent=message;};
  const syncPitchSettings=control=>{
    if(!beatLab)return;
    beatLab.pitchCorrectionSettings=beatLab.pitchCorrectionSettings||{enabled:false,root:0,scale:"major",amount:100,speedMs:25};
    const key=control.dataset.vocalPitch;
    beatLab.pitchCorrectionSettings[key]=key==="enabled"?Boolean(control.checked):(key==="scale"?control.value:Number(control.value));
    const enabled=beatLab.pitchCorrectionSettings.enabled;
    pitchStatus(enabled
      ? "Pitch correction ON · " + ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"][beatLab.pitchCorrectionSettings.root] + " " + beatLab.pitchCorrectionSettings.scale.toUpperCase() + " · Applies to new vocal takes."
      : "Pitch correction bypassed · Original vocal tone is preserved.");
  };
  root.addEventListener("change",event=>{
    const control=event.target.closest("[data-vocal-pitch]");
    if(control)syncPitchSettings(control);
  });
  root.addEventListener("input",event=>{
    const talkback=event.target.closest("[data-talkback-setting]");
    if(talkback){
      const value=Number(talkback.value);
      if(talkback.dataset.talkbackSetting==="volume")StudioTalkback.setVolume(value);
      if(talkback.dataset.talkbackSetting==="sidetone")StudioTalkback.setSidetone(value);
      if(talkback.dataset.talkbackSetting==="duckAmount")StudioTalkback.setDuckAmount(value);
      return;
    }
    const pitch=event.target.closest("[data-vocal-pitch]");
    if(pitch && pitch.type==="range")syncPitchSettings(pitch);
    const slider=event.target.closest("[data-vocal-effect]");
    if(!slider||!beatLab)return;
    const effect=slider.dataset.vocalEffect;
    const value=Number(slider.value);
    beatLab.vocalEffectSettings[effect]=value;
    if(beatLab.vocalEffects){
      if(effect==="delay")beatLab.vocalEffects.setDelayMix(value);
      if(effect==="reverb")beatLab.vocalEffects.setReverbMix(value);
    }
    status(effect.toUpperCase()+" mix updated.");
  });
  activePanel={root,canvas:root.querySelector("[data-vocal-wave]"),timer:root.querySelector("[data-vocal-timer]")};
  return root;
}

function material(color,metalness=.35,roughness=.4,emissive=0x000000,intensity=0){
  return new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:intensity});
}

export default {
  booth:null,
  screenCanvas:null,
  screenContext:null,
  screenTexture:null,
  recordingHandler:null,
  frameElapsed:0,
  async init(scene){
    THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    const studio=scene?.getObjectByName("recordsHQFloor2Studio");
    const booth=studio?.getObjectByName("floor2RecordingBooth");
    if(!booth){console.warn("LAMBO CITY Vocal Booth: existing booth not found.");return;}
    this.booth=booth;
    if(booth.userData.lcVocalBoothVisualsReady)return;
    booth.userData.lcVocalBoothVisualsReady=true;
    const walnut=material(0x633a2e,.28,.5);
    const walnutLight=material(0x9a5a3d,.35,.42);
    const mauve=material(0x6d4b79,.25,.48,0x281039,.18);
    const led=material(0xd34bff,.4,.25,0x9b25cf,1.6);
    const boothX=4.8,boothZ=3.65;
    for(let i=0;i<22;i++){
      const slatL=new THREE.Mesh(new THREE.BoxGeometry(.055,3.12,.08),i%3===0?walnutLight:walnut);
      slatL.position.set(boothX-2.02,1.72,boothZ-1.35+i*.13);booth.add(slatL);
      const slatR=new THREE.Mesh(new THREE.BoxGeometry(.055,3.12,.08),i%3===0?walnutLight:walnut);
      slatR.position.set(boothX+2.02,1.72,boothZ-1.35+i*.13);booth.add(slatR);
    }
    const backAccent=new THREE.Mesh(new THREE.BoxGeometry(4.12,3.12,.045),mauve);
    backAccent.position.set(boothX,1.82,boothZ+1.39);booth.add(backAccent);
    [1.0,1.75,2.55].forEach(y=>{
      const strip=new THREE.Mesh(new THREE.BoxGeometry(4.08,.025,.035),led);
      strip.position.set(boothX,y,boothZ+1.34);booth.add(strip);
    });
    const ceilingRing=new THREE.Mesh(new THREE.TorusGeometry(.78,.035,8,64),material(0xff9b66,.35,.25,0xff713b,1.1));
    ceilingRing.position.set(boothX,3.52,boothZ);ceilingRing.rotation.x=Math.PI/2;booth.add(ceilingRing);
    const ceilingCore=new THREE.Mesh(new THREE.CircleGeometry(.55,48),material(0x4c315d,.2,.5,0x5d276c,.35));
    ceilingCore.position.set(boothX,3.49,boothZ);ceilingCore.rotation.x=-Math.PI/2;booth.add(ceilingCore);
    const tvCanvas=document.createElement("canvas");tvCanvas.width=768;tvCanvas.height=320;
    const ctx=tvCanvas.getContext("2d");ctx.fillStyle="#090b14";ctx.fillRect(0,0,768,320);
    ctx.fillStyle="#e7e9ef";ctx.font="italic bold 54px Arial";ctx.textAlign="center";ctx.fillText("LAMBO CITY",384,76);
    ctx.fillStyle="#bd72e6";ctx.font="bold 17px Arial";ctx.fillText("VOCAL MONITOR",384,112);
    const texture=new THREE.CanvasTexture(tvCanvas);texture.colorSpace=THREE.SRGBColorSpace;
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.05),new THREE.MeshBasicMaterial({map:texture}));
    screen.position.set(boothX,2.45,boothZ+1.31);screen.rotation.y=Math.PI;booth.add(screen);
    this.screenCanvas=tvCanvas;this.screenContext=ctx;this.screenTexture=texture;
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,1.55,12),material(0x11131a,.8,.25));
    stand.position.set(boothX+.45,.88,boothZ+.55);booth.add(stand);
    const mic=new THREE.Mesh(new THREE.CylinderGeometry(.075,.055,.32,20),material(0x24242b,.85,.22,0x9b5b38,.22));
    mic.position.set(boothX+.45,1.72,boothZ+.55);booth.add(mic);
    const micTop=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),material(0xb87558,.75,.2));
    micTop.position.set(boothX+.45,1.90,boothZ+.55);booth.add(micTop);
    const filter=new THREE.Mesh(new THREE.BoxGeometry(.95,1.15,.10),material(0x17151b,.55,.35));
    filter.position.set(boothX+.45,1.75,boothZ+.80);booth.add(filter);
    const trim=new THREE.Mesh(new THREE.BoxGeometry(1.02,.035,.12),material(0xb87558,.65,.25));
    trim.position.set(boothX+.45,2.34,boothZ+.80);booth.add(trim);
    const headphoneStand=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.55,12),material(0x171820,.8,.25));
    headphoneStand.position.set(boothX+1.55,.38,boothZ+.18);booth.add(headphoneStand);
    const headphones=new THREE.Mesh(new THREE.TorusGeometry(.20,.035,8,24,Math.PI),material(0x14151b,.8,.22));
    headphones.position.set(boothX+1.55,.72,boothZ+.18);booth.add(headphones);
  },
  update(delta){
    this.frameElapsed+=Math.max(0,Number(delta)||0);
    if(this.frameElapsed<0.05)return;
    this.frameElapsed=0;
    if(!this.screenContext||!this.screenCanvas)return;
    const ctx=this.screenContext;
    const input=StudioRecordingEngine.getInputWaveform?.();
    const meter=StudioAudioEngine.getMasterMeter?.()||{peak:0,rms:0};
    ctx.fillStyle="#080b14";ctx.fillRect(0,0,768,320);
    ctx.fillStyle="#e7e9ef";ctx.font="italic bold 50px Arial";ctx.textAlign="center";ctx.fillText("LAMBO CITY",384,66);
    ctx.fillStyle="#bd72e6";ctx.font="bold 15px Arial";ctx.fillText(recordingActive?"RECORDING INPUT":"VOCAL / SESSION MONITOR",384,96);
    const samples=input||null;
    const center=212;
    ctx.beginPath();ctx.moveTo(20,center);
    for(let i=0;i<720;i++){
      let value=0;
      if(samples)value=samples[Math.floor(i/720*samples.length)]||0;
      else value=Math.sin(i*.09+performance.now()*.002)*(meter.rms||0)*.7;
      const y=center+value*78;
      ctx.lineTo(20+i,y);
    }
    ctx.strokeStyle=recordingActive?"#9df45f":"#b86cf1";ctx.lineWidth=3;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=9;ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle="#a7f079";ctx.font="bold 13px monospace";
    ctx.fillText(recordingActive?"INPUT ACTIVE":"READY",384,294);
    this.screenTexture.needsUpdate=true;
    if(activePanel?.root?.isConnected){
      if(recordingActive)activePanel.timer.textContent=formatTime(performance.now()-recordingStartedAt);
      const canvas=activePanel.canvas;
      const c=canvas?.getContext("2d");
      if(c){
        c.fillStyle="#080b14";c.fillRect(0,0,canvas.width,canvas.height);
        const source=input||null;
        c.beginPath();
        for(let i=0;i<canvas.width;i++){
          let value=source?(source[Math.floor(i/canvas.width*source.length)]||0):Math.sin(i*.08+performance.now()*.003)*(meter.rms||0)*.7;
          const y=canvas.height/2+value*canvas.height*.38;
          if(i===0)c.moveTo(i,y);else c.lineTo(i,y);
        }
        c.strokeStyle=recordingActive?"#a4ef69":"#c27cf1";c.lineWidth=2;c.shadowColor=c.strokeStyle;c.shadowBlur=7;c.stroke();c.shadowBlur=0;
      }
    }
  },
  destroy(){
    this.booth?.userData&&(this.booth.userData.lcVocalBoothVisualsReady=false);
    this.booth=null;
  }
};
