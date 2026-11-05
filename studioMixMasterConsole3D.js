let THREE = null;
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import StudioRecordingEngine from "./studioRecordingEngine.js";

const CHANNELS = 13;
const clamp = (value,min,max)=>Math.max(min,Math.min(max,value));

export function styleMixMasterPanel(root) {
  if(!root||root.dataset.lcMixSkin==="1")return root;
  root.dataset.lcMixSkin="1";
  root.classList.add("lc-mix-master-console");
  const style=document.createElement("style");
  style.textContent="\n.lc-mix-master-console{box-sizing:border-box!important;width:100%!important;max-width:none!important;min-height:100%;padding:clamp(14px,2vw,28px)!important;gap:clamp(14px,1.8vw,24px)!important;border:1px solid #3d424b;border-radius:16px;background:radial-gradient(ellipse at 50% -20%,rgba(174,43,55,.17),transparent 42%),linear-gradient(145deg,#20242b 0%,#101319 48%,#080a0e 100%)!important;color:#f1f1f0!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 18px 48px rgba(0,0,0,.38);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;overflow:visible}\n.lc-mix-master-console *{box-sizing:border-box}\n.lc-mix-master-console>div:first-of-type{position:relative;padding:10px 0 16px 18px;border-bottom:1px solid rgba(206,170,103,.28);border-left:3px solid #a72b38;min-width:0}\n.lc-mix-master-console>div:first-of-type:before{content:\"LAMBO CITY\";display:block;margin-bottom:7px;color:#f0e6d7;font-size:clamp(19px,2.2vw,28px);font-weight:900;letter-spacing:.2em;text-shadow:0 0 16px rgba(190,36,52,.38)}\n.lc-mix-master-console>div:first-of-type>div:first-child{color:#d5ad67!important;font-size:10px!important;letter-spacing:2.8px!important}\n.lc-mix-master-console h2{margin:5px 0!important;color:#fff!important;font-size:clamp(18px,2vw,25px)!important;letter-spacing:2px!important;font-weight:800}\n.lc-mix-master-console>div:first-of-type p{max-width:760px;margin:7px 0 0!important;color:#aeb4be!important;font-size:12px!important}\n.lc-mix-master-console>section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:18px!important;padding:17px!important;border:1px solid #50545b!important;border-radius:10px!important;background:linear-gradient(180deg,#242932,#11151c)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 8px 24px rgba(0,0,0,.22)}\n.lc-mix-master-console>section label{min-width:0;color:#c8cbd1!important}\n.lc-mix-master-console>section label strong{color:#e4c27f!important;font-size:10px!important;letter-spacing:1.3px}\n.lc-mix-master-console input[type=range]{width:100%;min-width:0;accent-color:#d6ad68;cursor:pointer;touch-action:pan-y;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}\n.lc-mix-master-console button{min-height:38px!important;padding:8px 12px!important;border-radius:6px!important;border:1px solid #66583e!important;background:linear-gradient(180deg,#29251f,#171511)!important;color:#f0d7a5!important;font-size:10px!important;font-weight:800!important;letter-spacing:1px;touch-action:manipulation;transition:filter .15s ease,border-color .15s ease}\n.lc-mix-master-console button:hover{filter:brightness(1.22);border-color:#c59a56!important}\n.lc-mix-master-console button:focus-visible,.lc-mix-master-console input:focus-visible{outline:2px solid #d7b36f;outline-offset:3px}\n.lc-mix-master-console>div:nth-of-type(2){display:flex;flex-wrap:wrap;gap:9px!important;align-items:center}\n.lc-mix-master-console>div:nth-of-type(2) button:first-child{background:linear-gradient(180deg,#574329,#2a2116)!important;color:#ffe1a7!important}\n.lc-mix-master-console>div:nth-of-type(2) button:last-child{border-color:#8f303a!important;background:linear-gradient(180deg,#54232b,#241217)!important;color:#ffe4e4!important}\n.lc-mix-master-console>div:nth-of-type(3)>div:first-child{margin:0 0 10px!important;padding:0 0 9px;border-bottom:1px solid rgba(208,172,104,.25);color:#d9b56e!important;font-size:10px!important;letter-spacing:2.2px!important;font-weight:800}\n.lc-mix-master-console [data-mix-tracks]{display:grid!important;grid-auto-flow:column;grid-auto-columns:minmax(188px,1fr);grid-template-rows:minmax(260px,auto);gap:8px!important;padding:5px 2px 13px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#78613d #11151c}\n.lc-mix-master-console [data-mix-tracks]::-webkit-scrollbar{height:9px}\n.lc-mix-master-console [data-mix-tracks]::-webkit-scrollbar-track{background:#10141a;border-radius:8px}\n.lc-mix-master-console [data-mix-tracks]::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#65502f,#c09a59);border-radius:8px}\n.lc-mix-master-console [data-mix-tracks]>[data-track-id]{min-width:0;min-height:250px;align-content:start;gap:13px!important;padding:13px 11px!important;border:1px solid #4b515c!important;border-top:2px solid #9b814f!important;border-radius:7px!important;background:linear-gradient(180deg,#2b3039 0%,#1b2028 34%,#11151c 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 6px 16px rgba(0,0,0,.24);scroll-snap-align:start}\n.lc-mix-master-console [data-mix-tracks]>[data-track-id] strong{color:#f0d59f!important;font-size:12px!important;letter-spacing:.4px}\n.lc-mix-master-console [data-mix-tracks]>[data-track-id] label{color:#aeb6c0!important;font-size:10px!important}\n.lc-mix-master-console [data-mix-tracks]>[data-track-id] input[type=range]{accent-color:#c8a15d}\n.lc-mix-master-console [data-mix-tracks]>[data-track-id] button[aria-pressed=\"true\"]{background:linear-gradient(180deg,#9d343d,#4b171d)!important;border-color:#d65a62!important;color:#fff!important}\n.lc-mix-master-console [data-mix-tracks]>[data-track-id] button[data-track-control=\"solo\"][aria-pressed=\"true\"]{background:linear-gradient(180deg,#2d9662,#155238)!important;border-color:#59ca8b!important}\n.lc-mix-master-console>div:nth-of-type(4){display:flex;flex-wrap:wrap;gap:9px!important;padding-top:4px}\n.lc-mix-master-console>div:nth-of-type(4) button{min-height:43px!important;padding:11px 15px!important}\n.lc-mix-master-console>div:nth-of-type(4) button[data-mix-action=\"export\"],.lc-mix-master-console>div:nth-of-type(4) button[data-mix-action=\"export-mp3\"]{border-color:#9b303b!important;background:linear-gradient(180deg,#6c2730,#32151a)!important;color:#fff!important}\n.lc-mix-master-console [data-mix-status]{padding:10px 13px;border:1px solid rgba(207,170,101,.25);border-radius:6px;background:rgba(8,11,15,.72);color:#e3c27f!important;font-size:11px!important;letter-spacing:.35px}\n@media(max-width:700px){.lc-mix-master-console{padding:12px!important;border-radius:10px}.lc-mix-master-console [data-mix-tracks]{grid-auto-columns:minmax(174px,72vw);grid-template-rows:minmax(250px,auto)}.lc-mix-master-console>section{grid-template-columns:1fr}}\n@media(prefers-reduced-motion:reduce){.lc-mix-master-console button{transition:none}}\n";
  root.prepend(style);
  return root;
}

function metal(color,emissive=0x000000,intensity=0){
  return new THREE.MeshStandardMaterial({color,metalness:.82,roughness:.26,emissive,emissiveIntensity:intensity});
}

const labelMaterials = new Map();

function makeLabelMaterial(text, color = "#e8e6df", background = "#080b10", glow = null) {
  const key = [text,color,background,glow].join("|");
  if (labelMaterials.has(key)) return labelMaterials.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 62px Arial";
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 18; }
  ctx.fillStyle = color;
  ctx.fillText(text,256,66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map:texture, transparent:true });
  labelMaterials.set(key,material);
  return material;
}

function makeDynamicReadout() {
  const canvas=document.createElement("canvas");
  canvas.width=256;canvas.height=96;
  const ctx=canvas.getContext("2d");
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.13,.045),material);
  let last="";
  const draw=value=>{
    if(value===last)return;
    last=value;
    ctx.fillStyle="#05080d";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#dce2e8";ctx.font="bold 62px monospace";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(value,128,48);
    texture.needsUpdate=true;
  };
  return {mesh,draw};
}

function dbText(value){
  if(value<=0.01)return "-∞";
  return (20*Math.log10(value/100)).toFixed(1);
}

export default {
  scene:null,
  renderer:null,
  consoleGroup:null,
  strips:[],
  dragging:null,
  frameElapsed:0,
  pointerDown:null,
  async init(scene,context){
    THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    this.scene=scene;
    this.renderer=context?.renderer||null;
    const studio=scene?.getObjectByName("recordsHQFloor2Studio");
    const parent=studio?.getObjectByName("floor2MixMasterControls");
    if(!parent){console.warn("LAMBO CITY Mix Console: producer control surface unavailable.");return;}
    if(parent.userData.lcMixConsoleReady)return;
    parent.userData.lcMixConsoleReady=true;
    const group=new THREE.Group();
    group.name="floor2LamboCityMixConsoleVisual";
    group.position.set(0,1.17,0.02);
    parent.add(group);
    this.consoleGroup=group;
    const chassis=metal(0x252a31);
    const channelMat=metal(0x343a43);
    const dark=metal(0x090c11);
    const blue=metal(0x2f5fa8,0x081b3b,.28);
    const green=metal(0x2e8b4d,0x123b1b,.25);
    const gold=metal(0xc6a15b,0x6d4a15,.22);
    const muteIdle=metal(0x090c11);
    const muteActive=metal(0xb43b42,0x5d0a12,.4);
    const soloIdle=metal(0x090c11);
    const soloActive=metal(0x36a66a,0x0c5328,.4);
    this.controlMaterials={muteIdle,muteActive,soloIdle,soloActive};
    const red=metal(0x9e2937,0x4d0912,.3);
    const boxGeo=new THREE.BoxGeometry(1,1,1);
    const makeBox=(name,w,h,d,mat,x,y,z,parentGroup=group)=>{
      const mesh=new THREE.Mesh(boxGeo,mat);
      mesh.name=name;mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.userData.sharedGeometry=true;
      parentGroup.add(mesh);return mesh;
    };
    makeBox("mixConsoleChassis",2.92,.08,1.02,chassis,0,0,0);
    const stripWidth=.18,gap=.018,startX=-1.37;
    const meterMaterials=[
      new THREE.MeshBasicMaterial({color:0x1bb56b}),
      new THREE.MeshBasicMaterial({color:0x83c94b}),
      new THREE.MeshBasicMaterial({color:0xe5c34f}),
      new THREE.MeshBasicMaterial({color:0xe18a39}),
      new THREE.MeshBasicMaterial({color:0xd94a3e})
    ];
    for(let i=0;i<CHANNELS;i++){
      const x=startX+i*(stripWidth+gap);
      const strip=new THREE.Group();strip.name="mixChannelStrip"+(i+1);strip.position.set(x,.055,0);group.add(strip);
      makeBox("channelPlate",stripWidth,.025,1.50,channelMat,0,0,0,strip);
      for(let slot=0;slot<4;slot++){
        makeBox("insertSlot",stripWidth*.78,.018,.055,blue,0,.023,-.37+slot*.07,strip);
      }
      makeBox("pluginWindow",stripWidth*.78,.012,.13,dark,0,.023,-.06,strip);
      const sendKnobs=[];
      for(let send=0;send<3;send++){
        makeBox("sendSlot",stripWidth*.48,.018,.035,dark,-.025,.024,.04+send*.06,strip);
        const sendKnob=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.018,12),dark);
        sendKnob.position.set(.045,.038,.04+send*.06);strip.add(sendKnob);sendKnobs.push(sendKnob);
      }
      makeBox("routeLabel",stripWidth*.8,.018,.045,dark,0,.024,.25,strip);
      const routeText=new THREE.Mesh(new THREE.PlaneGeometry(stripWidth*.72,.03),makeLabelMaterial("ST OUT","#d5dbe3","#111722"));
      routeText.rotation.x=-Math.PI/2;routeText.position.set(0,.036,.25);strip.add(routeText);
      const readButton=makeBox("automationRead",stripWidth*.78,.018,.045,dark,0,.024,.31,strip);
      const insertLabels=["EQ","COMP","DELAY","REVERB"];
      insertLabels.forEach((text,slot)=>{
        const label=new THREE.Mesh(new THREE.PlaneGeometry(stripWidth*.74,.035),makeLabelMaterial(text,"#e5efff","#2f5fa8"));
        label.rotation.x=-Math.PI/2;label.position.set(0,.034,-.37+slot*.07);strip.add(label);
      });
      const readLabel=new THREE.Mesh(new THREE.PlaneGeometry(stripWidth*.72,.032),makeLabelMaterial("READ","#ffffff","#277a42"));
      readLabel.rotation.x=-Math.PI/2;readLabel.position.set(0,.036,.31);strip.add(readLabel);
      const nameLabel=new THREE.Mesh(new THREE.PlaneGeometry(stripWidth*.82,.035),makeLabelMaterial("TRACK "+String(i+1).padStart(2,"0"),"#d8dce2","#080b10"));
      nameLabel.rotation.x=-Math.PI/2;nameLabel.position.set(0,.034,-.47);strip.add(nameLabel);
      const pan=new THREE.Mesh(new THREE.CylinderGeometry(.043,.043,.025,20),dark);
      pan.position.set(0,.045,.40);pan.userData.control="pan";pan.userData.channelIndex=i;strip.add(pan);
      const faderRail=makeBox("faderRail",.035,.012,.30,dark,0,.03,.61,strip);
      const fader=makeBox("channelFader",.105,.035,.055,gold,0,.055,.61,strip);
      fader.userData.control="fader";fader.userData.channelIndex=i;
      const surface=makeBox("faderHitSurface",.15,.012,.31,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,.02,.61,strip);
      surface.userData.control="faderSurface";surface.userData.channelIndex=i;
      const meterGroup=new THREE.Group();meterGroup.position.set(.062,.035,.61);strip.add(meterGroup);
      const segments=[];
      for(let s=0;s<12;s++){
        const seg=new THREE.Mesh(new THREE.BoxGeometry(.025,.012,.018),meterMaterials[Math.min(4,Math.floor(s/3))]);
        seg.position.set(0,0,.135-s*.023);meterGroup.add(seg);segments.push(seg);
      }
      const mute=makeBox("muteButton",.065,.025,.055,dark,-.04,.045,.70,strip);mute.userData.control="mute";mute.userData.channelIndex=i;
      const solo=makeBox("soloButton",.065,.025,.055,dark,.04,.045,.70,strip);solo.userData.control="solo";solo.userData.channelIndex=i;
      const muteText=new THREE.Mesh(new THREE.PlaneGeometry(.045,.028),makeLabelMaterial("M","#ffffff","#10151d"));muteText.rotation.x=-Math.PI/2;muteText.position.set(-.04,.06,.70);strip.add(muteText);
      const soloText=new THREE.Mesh(new THREE.PlaneGeometry(.045,.028),makeLabelMaterial("S","#ffffff","#10151d"));soloText.rotation.x=-Math.PI/2;soloText.position.set(.04,.06,.70);strip.add(soloText);
      const readout=makeDynamicReadout();readout.mesh.rotation.x=-Math.PI/2;readout.mesh.position.set(0,.036,.48);strip.add(readout.mesh);
      const label=makeBox("channelNameplate",stripWidth*.8,.015,.045,dark,0,.025,-.47,strip);
      label.userData.channelIndex=i;
      this.strips.push({strip,fader,meter:segments,mute,solo,pan,index:i,readout,readButton,sendKnobs});
    }
    const masterX=1.27;
    const master=new THREE.Group();master.name="mixMasterOut";master.position.set(masterX,.055,0);group.add(master);
    makeBox("masterPlate",.28,.03,.90,dark,0,0,0,master);
    makeBox("masterLabel",.23,.02,.08,gold,0,.025,-.39,master);
    const masterText=new THREE.Mesh(new THREE.PlaneGeometry(.22,.045),makeLabelMaterial("MASTER OUT","#241805","#d4ad63"));
    masterText.rotation.x=-Math.PI/2;masterText.position.set(0,.04,-.39);master.add(masterText);
    const masterSegments=[];
    for(let side=0;side<2;side++){
      const meter=new THREE.Group();meter.position.set(side===0?-.065:.065,.035,-.05);master.add(meter);
      for(let s=0;s<16;s++){
        const seg=new THREE.Mesh(new THREE.BoxGeometry(.045,.012,.018),meterMaterials[Math.min(4,Math.floor(s/4))]);
        seg.position.set(0,0,.19-s*.024);meter.add(seg);masterSegments.push(seg);
      }
    }
    this.masterSegments=masterSegments;
    const masterFader=makeBox("masterFader",.14,.035,.065,gold,0,.055,.61,master);
    masterFader.userData.control="masterFader";
    this.masterFader=masterFader;
    const patchColors=[0xf0c94e,0x54d28c,0x9e77e8,0x56bce9];
    patchColors.forEach((color,index)=>{
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.22+index*.08,-.05,.55),
        new THREE.Vector3(-1.12+index*.1,-.18,.78),
        new THREE.Vector3(-.65+index*.22,-.22,.86),
        new THREE.Vector3(-.2+index*.18,-.08,.63)
      ]);
      const cable=new THREE.Mesh(new THREE.TubeGeometry(curve,18,.009,5,false),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.2}));
      group.add(cable);
    });
    this.pointerDown=event=>{
      if(!this.renderer?.domElement||window.__lamboCityFloor2SessionMode!=="seated"||document.getElementById("lambo-city-daw-app"))return;
      const rect=this.renderer.domElement.getBoundingClientRect();
      this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
      this.raycaster.setFromCamera(this.pointer,context.camera);
      const hit=this.raycaster.intersectObject(group,true)[0];
      if(!hit)return;
      const target=hit.object;
      const index=target.userData.channelIndex;
      const track=StudioMultitrackWorkspace.tracks[index];
      if(target.userData.control==="faderSurface"&&track){StudioMultitrackWorkspace.recordHistory("Track volume");this.dragging={index};this.setFaderFromHit(hit.point,index);event.preventDefault();}
      else if(target.userData.control==="mute"&&track){StudioMultitrackWorkspace.recordHistory("Toggle mute");track.muted=!track.muted;StudioMultitrackWorkspace.arrangementPlayback?.syncTrackState(StudioMultitrackWorkspace.tracks);StudioMultitrackWorkspace.scheduleProjectAutosave();}
      else if(target.userData.control==="solo"&&track){StudioMultitrackWorkspace.recordHistory("Toggle solo");track.solo=!track.solo;StudioMultitrackWorkspace.arrangementPlayback?.syncTrackState(StudioMultitrackWorkspace.tracks);StudioMultitrackWorkspace.scheduleProjectAutosave();}
      else if(target.userData.control==="pan"&&track){StudioMultitrackWorkspace.recordHistory("Track pan");const local=target.parent.worldToLocal(hit.point.clone());track.pan=clamp(local.x/.05,-1,1);StudioMultitrackWorkspace.arrangementPlayback?.setTrackPan(track.id,track.pan);StudioMultitrackWorkspace.scheduleProjectAutosave();}
      else if(target.userData.control==="masterFader"){StudioMultitrackWorkspace.recordHistory("Master volume");const local=master.worldToLocal(hit.point.clone());const value=clamp(100-(local.z-.455)/.31*100,0,100);StudioAudioEngine.setMasterVolume(value/100);StudioMultitrackWorkspace.scheduleProjectAutosave();}
    };
    this.pointerMove=event=>{
      if(!this.dragging||!this.renderer?.domElement)return;
      const rect=this.renderer.domElement.getBoundingClientRect();
      this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
      this.raycaster.setFromCamera(this.pointer,context.camera);
      const hit=this.raycaster.intersectObject(group,true).find(item=>item.object.userData.control==="faderSurface");
      if(hit)this.setFaderFromHit(hit.point,this.dragging.index);
    };
    this.pointerUp=()=>{if(this.dragging)StudioMultitrackWorkspace.scheduleProjectAutosave();this.dragging=null;};
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.renderer?.domElement?.addEventListener("pointerdown",this.pointerDown);
    this.renderer?.domElement?.addEventListener("pointermove",this.pointerMove);
    window.addEventListener("pointerup",this.pointerUp);
  },
  setFaderFromHit(point,index){
    const item=this.strips[index];const track=StudioMultitrackWorkspace.tracks[index];if(!item||!track)return;
    const local=item.strip.worldToLocal(point.clone());
    const value=clamp(100-(local.z-.455)/.31*100,0,100);
    track.volume=value;
    if(track.type==="midi"){
      const anySolo=StudioMultitrackWorkspace.tracks.some(other=>other.solo);
      const isAudible=!track.muted&&(!anySolo||track.solo);
      const instrumentChannel=StudioAudioEngine.channels?.instrument;
      if(instrumentChannel)instrumentChannel.gain.value=isAudible?value/100:0;
    } else StudioMultitrackWorkspace.arrangementPlayback?.setTrackVolume(track.id,value);
  },
  update(delta){
    this.frameElapsed+=Math.max(0,Number(delta)||0);
    if(this.frameElapsed<0.033)return;
    this.frameElapsed=0;
    const tracks=StudioMultitrackWorkspace.tracks||[];
    this.strips.forEach(item=>{
      const track=tracks[item.index];if(!track)return;
      const volume=clamp(Number(track.volume??80),0,100);
      item.readout?.draw(dbText(volume));
      item.readButton.material=track.automation?.volume?.length?green:dark;
      item.sendKnobs.forEach((knob,index)=>{knob.material=track.sends?.[index]?green:dark;});
      item.fader.position.z=.765-(volume/100)*.31;
      item.mute.material=track.muted?this.controlMaterials.muteActive:this.controlMaterials.muteIdle;
      item.solo.material=track.solo?this.controlMaterials.soloActive:this.controlMaterials.soloIdle;
      if(track.type==="midi"){
        const anySolo=tracks.some(other=>other.solo);
        const isAudible=!track.muted&&(!anySolo||track.solo);
        const instrumentChannel=StudioAudioEngine.channels?.instrument;
        if(instrumentChannel)instrumentChannel.gain.value=isAudible?volume/100:0;
      }
      const recordingInputActive=Boolean(StudioRecordingEngine.activeTake||StudioRecordingEngine.activeTrackTake);
      const isVocalInput=recordingInputActive&&/vocal|voice note/i.test(track.name||"");
      const meter=isVocalInput?{peak:StudioRecordingEngine.getInputLevel?.()||0}:(track.type==="midi"?(StudioAudioEngine.getInstrumentMeter?.()||{peak:0}):(StudioMultitrackWorkspace.arrangementPlayback?.getTrackMeter?.(track.id)||{peak:0}));
      const active=Math.round(clamp(meter.peak*18,0,12));
      item.meter.forEach((segment,index)=>{segment.visible=index>=12-active;});
    });
    const master=StudioAudioEngine.getMasterMeter?.()||{peak:0};
    const active=Math.round(clamp(master.peak*24,0,16));
    this.masterSegments?.forEach((segment,index)=>{segment.visible=index%16>=16-active;});
    if(this.masterFader)this.masterFader.position.z=.765-clamp(StudioAudioEngine.masterVolumeValue*100,0,100)/100*.31;
  },
  destroy(){
    const canvas=this.renderer?.domElement;
    if(canvas&&this.pointerDown)canvas.removeEventListener("pointerdown",this.pointerDown);
    if(canvas&&this.pointerMove)canvas.removeEventListener("pointermove",this.pointerMove);
    if(this.pointerUp)window.removeEventListener("pointerup",this.pointerUp);
    this.pointerDown=this.pointerMove=this.pointerUp=null;
    this.strips=[];this.consoleGroup=null;
  }
};
