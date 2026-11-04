/*
 * LAMBO CITY RECORDS — ZOOMABLE WAVEFORM ARRANGEMENT
 * Uses the existing shared audio context and session clips.
 */
import StudioAudioEngine from "./studioAudioEngine.js";

const TOTAL_BARS = 128;
const decodedWaveforms = new WeakMap();

function snapBar(value, mode, tempo) {
  if (mode === "off") return Math.round(value * 1000) / 1000;
  const step = mode === "beats" ? .25 : mode === "subdivisions" ? .0625 : mode === "seconds" ? (Number(tempo) || 100) / 240 / 10 : 1;
  return Math.round(value / step) * step;
}

async function decodeClip(clip) {
  if (!clip?.blob || !clip.blob.size) return null;
  if (decodedWaveforms.has(clip.blob)) return decodedWaveforms.get(clip.blob);
  const pending = (async () => {
    const context = StudioAudioEngine.context;
    if (!context || context.state === "closed") return null;
    const bytes = await clip.blob.arrayBuffer();
    const buffer = await context.decodeAudioData(bytes.slice(0));
    if (!Number.isFinite(Number(clip.duration)) || Number(clip.duration) <= 0) {
      clip.duration = buffer.duration;
    }
    return buffer;
  })();
  decodedWaveforms.set(clip.blob, pending);
  try { return await pending; }
  catch (error) {
    decodedWaveforms.delete(clip.blob);
    console.warn("LAMBO CITY waveform decode failed:", error);
    return null;
  }
}

function paintWaveform(canvas, audioBuffer, clip = {}) {
  if (!canvas || !audioBuffer) return;
  const width = Math.max(1, Math.floor(canvas.clientWidth || 480));
  const height = Math.max(1, Math.floor(canvas.clientHeight || 38));
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  const channel = audioBuffer.getChannelData(0);
  const sourceStart = Math.max(0, Math.min(audioBuffer.duration, Number(clip.sourceOffsetSeconds) || 0));
  const sourceAvailable = Math.max(0, audioBuffer.duration - sourceStart);
  const audibleDuration = Math.max(0, Math.min(sourceAvailable, Number(clip.playDurationSeconds) > 0 ? Number(clip.playDurationSeconds) : sourceAvailable));
  const firstSample = Math.floor(sourceStart / audioBuffer.duration * channel.length);
  const lastSample = Math.min(channel.length, Math.ceil((sourceStart + audibleDuration) / audioBuffer.duration * channel.length));
  const audibleSamples = Math.max(1, lastSample - firstSample);
  const samplesPerPixel = Math.max(1, audibleSamples / width);
  const center = height / 2;
  const amplitude = height * 0.43;
  context.fillStyle = "#d8b36e";
  for (let x = 0; x < width; x += 1) {
    const start = Math.min(lastSample - 1, firstSample + Math.floor(x * samplesPerPixel));
    const end = Math.min(lastSample, Math.max(start + 1, firstSample + Math.floor((x + 1) * samplesPerPixel)));
    let peak = 0;
    for (let sample = start; sample < end; sample += 1) peak = Math.max(peak, Math.abs(channel[sample]));
    const barHeight = Math.max(1, peak * amplitude);
    context.fillRect(x, center - barHeight, 1, barHeight * 2);
  }
  context.strokeStyle = "rgba(255,255,255,.12)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, center + .5);
  context.lineTo(width, center + .5);
  context.stroke();
}

export function renderStudioDAWTimeline({
  container, track, onChange = () => {}, onSelect = () => {},
  onEditStart = () => {}, onPlayheadChange = () => {},
  barWidth = 72, selectedClipId = null, playheadBar = null,
  snapMode = "bars", tempo = 100, slipMode = false
}) {
  if (!container || !track) throw new Error("Timeline container or track unavailable.");
  const clips = Array.isArray(track.clips) ? track.clips : [];
  const width = Math.max(24, Math.min(288, Number(barWidth) || 72));
  clips.forEach((clip, index) => {
    if (!Number.isFinite(clip.startBar)) clip.startBar = 1 + index * 4;
    if (!Number.isFinite(clip.lengthBars)) clip.lengthBars = 4;
    clip.lengthBars = Math.max(.25, Math.min(TOTAL_BARS, clip.lengthBars));
    clip.startBar = Math.max(1, Math.min(TOTAL_BARS - clip.lengthBars + 1, clip.startBar));
  });
  container.replaceChildren();
  const style = document.createElement("style");
  style.textContent = `
    .lc-arrangement{width:100%;overflow:auto;background:#0b0e14;border:1px solid #343946;border-radius:8px;-webkit-overflow-scrolling:touch;scrollbar-color:#80643a #171a22;touch-action:pan-x pan-y}
    .lc-arrangement-inner{width:${width * TOTAL_BARS}px;min-width:${width * TOTAL_BARS}px;position:relative}
    .lc-arrangement-ruler{display:grid;grid-template-columns:repeat(${TOTAL_BARS},${width}px);height:30px;background:#1b202a;border-bottom:1px solid #665438}
    .lc-arrangement-ruler button{display:flex;align-items:center;justify-content:center;padding:0;border:0;border-right:1px solid #343946;background:transparent;color:#d8b36e;font-size:10px;min-height:30px;touch-action:manipulation}
    .lc-arrangement-ruler button:nth-child(4n+1){border-right-color:#80643a}
    .lc-arrangement-ruler button.active{background:#594321;color:#fff}
    .lc-arrangement-lane{position:relative;width:${width * TOTAL_BARS}px;min-height:92px;background:repeating-linear-gradient(90deg,transparent 0,transparent ${width-1}px,#343946 ${width-1}px,#343946 ${width}px),repeating-linear-gradient(90deg,transparent 0,transparent ${width*4-1}px,#665438 ${width*4-1}px,#665438 ${width*4}px),#10141c}
    .lc-arrangement-clip{position:absolute;top:8px;height:76px;padding:0 8px 7px;overflow:hidden;background:linear-gradient(180deg,rgba(105,129,104,.26),rgba(52,73,59,.32));border:1px solid #8d9d75;border-radius:6px;box-sizing:border-box}
    .lc-arrangement-clip.selected{border:2px solid #f1d49c;box-shadow:0 0 0 1px #d8b36e,0 0 12px rgba(216,179,110,.2)}
    .lc-arrangement-clip-title{display:block;width:100%;height:25px;padding:5px 2px 3px;overflow:hidden;color:#e9e5d9;font-size:10px;font-weight:700;white-space:nowrap;text-overflow:ellipsis;cursor:grab;touch-action:none;user-select:none}
    .lc-arrangement-waveform{display:block;width:100%;height:38px;border-radius:3px;background:rgba(9,13,16,.42);pointer-events:none}
    .lc-arrangement-wave-empty{display:flex;align-items:center;height:38px;padding-left:7px;color:#b8b4a8;font-size:10px;background:rgba(9,13,16,.35);border-radius:3px}
    .lc-arrangement-empty{padding:18px 12px;color:#777f90;font-size:11px}
    .lc-arrangement-help{padding:7px 9px;color:#999fad;font-size:10px;border-top:1px solid #343946}
    .lc-arrangement-playhead{position:absolute;top:0;bottom:0;width:2px;background:#f1d49c;z-index:5;pointer-events:none;box-shadow:0 0 7px rgba(241,212,156,.6)}
    .lc-arrangement-resize{position:absolute;right:0;top:0;bottom:0;width:12px;cursor:ew-resize;touch-action:none;background:linear-gradient(90deg,transparent,rgba(241,212,156,.22))}
    @media(pointer:coarse){.lc-arrangement-resize{width:18px}}
  `;
  const scroll = document.createElement("div"); scroll.className = "lc-arrangement";
  const inner = document.createElement("div"); inner.className = "lc-arrangement-inner";
  const ruler = document.createElement("div"); ruler.className = "lc-arrangement-ruler";
  for (let bar=1; bar<=TOTAL_BARS; bar+=1) {
    const mark=document.createElement("button"); mark.type="button"; mark.textContent=String(bar).padStart(2,"0");
    if (Number(playheadBar)===bar) mark.classList.add("active");
    mark.addEventListener("click",()=>onPlayheadChange(snapBar(bar,snapMode,tempo)));
    ruler.appendChild(mark);
  }
  const lane=document.createElement("div"); lane.className="lc-arrangement-lane";
  if (!clips.length) { const empty=document.createElement("div"); empty.className="lc-arrangement-empty"; empty.textContent="Import audio or record a take to create a waveform region."; lane.appendChild(empty); }
  clips.forEach(clip=>{
    const block=document.createElement("div"); block.className="lc-arrangement-clip"+(clip.id===selectedClipId?" selected":"");
    block.dataset.clipId=clip.id;
    const update=()=>{block.style.left=((clip.startBar-1)*width)+"px";block.style.width=Math.max(12,clip.lengthBars*width-3)+"px";};
    update();
    const title=document.createElement("div"); title.className="lc-arrangement-clip-title"; title.textContent=clip.name||"Audio Clip";
    title.title=slipMode?"Select and drag to slip source audio inside this region":"Select and drag to move this region";
    title.addEventListener("pointerdown",event=>{
      if(event.button!==0&&event.pointerType==="mouse")return;
      event.preventDefault(); onSelect(clip);
      const startX=event.clientX, originalBar=clip.startBar, originalOffset=Number(clip.sourceOffsetSeconds)||0;
      const sourceDuration=Number(clip.playDurationSeconds||clip.duration||0);
      let changed=false;
      title.setPointerCapture(event.pointerId);
      const move=e=>{
        const raw=(e.clientX-startX)/width;
        const step=snapMode==="beats"?.25:snapMode==="subdivisions"?.0625:snapMode==="off"?.001:snapMode==="seconds"?(Number(tempo)||100)/240/10:1;
        const delta=Math.round(raw/step)*step;
        if(Math.abs(e.clientX-startX)<2)return;
        if(slipMode&&sourceDuration>0){
          const secondsPerBar=240/Math.max(1,Number(tempo)||100);
          const next=Math.max(0,Math.min(Math.max(0,Number(clip.duration||sourceDuration)-sourceDuration),originalOffset+delta*secondsPerBar));
          if(Math.abs(next-Number(clip.sourceOffsetSeconds||0))<.0001)return;
          if(!changed){onEditStart("Slip audio source");changed=true;}
          clip.sourceOffsetSeconds=next;
        }else{
          const next=Math.max(1,Math.min(TOTAL_BARS-clip.lengthBars+1,originalBar+delta));
          if(next===clip.startBar)return;
          if(!changed){onEditStart("Move audio region");changed=true;}
          clip.startBar=next;
        }
        update();
      };
      const finish=()=>{
        title.removeEventListener("pointermove",move);title.removeEventListener("pointerup",finish);title.removeEventListener("pointercancel",finish);
        if(changed)onChange(clip);
      };
      title.addEventListener("pointermove",move);title.addEventListener("pointerup",finish);title.addEventListener("pointercancel",finish);
    });
    title.addEventListener("click",()=>onSelect(clip));
    block.appendChild(title);
    if(clip.blob&&clip.blob.size){
      const canvas=document.createElement("canvas");canvas.className="lc-arrangement-waveform";
      canvas.setAttribute("aria-label","Waveform for "+(clip.name||"audio clip"));block.appendChild(canvas);
      decodeClip(clip).then(buffer=>{if(buffer&&canvas.isConnected)paintWaveform(canvas,buffer,clip);else if(canvas.isConnected){const fallback=document.createElement("div");fallback.className="lc-arrangement-wave-empty";fallback.textContent="Waveform unavailable";canvas.replaceWith(fallback);}});
    }else{const note=document.createElement("div");note.className="lc-arrangement-wave-empty";note.textContent="Empty audio region";block.appendChild(note);}
    const beginResize=(handle,edge)=>{
      handle.addEventListener("pointerdown",event=>{
        event.preventDefault();event.stopPropagation();onSelect(clip);
        const startX=event.clientX,originalStart=clip.startBar,originalLength=clip.lengthBars;
        const originalOffset=Number(clip.sourceOffsetSeconds)||0;
        const originalPlay=Number(clip.playDurationSeconds||clip.duration||0);
        let changed=false;
        handle.setPointerCapture(event.pointerId);
        const move=e=>{
          const delta=snapBar((e.clientX-startX)/width,snapMode,tempo);
          if(edge==="right"){
            const next=Math.max(.25,Math.min(TOTAL_BARS-clip.startBar+1,originalLength+delta));
            if(next===clip.lengthBars)return;
            if(!changed){onEditStart();changed=true;}
            clip.lengthBars=next;
            if(originalPlay>0)clip.playDurationSeconds=originalPlay*(next/originalLength);
          }else{
            const nextStart=Math.max(1,Math.min(originalStart+originalLength-.25,originalStart+delta));
            if(nextStart===clip.startBar)return;
            if(!changed){onEditStart();changed=true;}
            const removed=nextStart-originalStart;
            clip.startBar=nextStart;
            clip.lengthBars=originalLength-removed;
            if(originalPlay>0){
              clip.sourceOffsetSeconds=originalOffset+originalPlay*(removed/originalLength);
              clip.playDurationSeconds=originalPlay*(clip.lengthBars/originalLength);
            }
          }
          update();
        };
        const finish=()=>{
          handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",finish);handle.removeEventListener("pointercancel",finish);
          if(changed)onChange(clip);
        };
        handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",finish);handle.addEventListener("pointercancel",finish);
      });
    };
    const leftResize=document.createElement("div");leftResize.className="lc-arrangement-resize left";leftResize.title="Drag to trim the region start";leftResize.style.cssText="position:absolute;left:0;right:auto;top:0;bottom:0;width:12px;cursor:ew-resize;touch-action:none;background:linear-gradient(90deg,rgba(241,212,156,.22),transparent)";
    beginResize(leftResize,"left");
    const rightResize=document.createElement("div");rightResize.className="lc-arrangement-resize";rightResize.title="Drag to trim the region end";
    beginResize(rightResize,"right");
    block.append(leftResize,rightResize);
    const addFadeHandle=(edge)=>{
      const handle=document.createElement("div");
      handle.style.cssText="position:absolute;top:0;width:16px;height:14px;z-index:4;touch-action:none;cursor:ew-resize;border-top:3px solid #f1d49c;"+(edge==="in"?"left:0;border-left:3px solid #f1d49c":"right:0;border-right:3px solid #f1d49c");
      handle.title=edge==="in"?"Drag to set fade in":"Drag to set fade out";
      handle.addEventListener("pointerdown",event=>{
        event.preventDefault();event.stopPropagation();onSelect(clip);
        const startX=event.clientX;
        const key=edge==="in"?"fadeInSeconds":"fadeOutSeconds";
        const initial=Math.max(0,Number(clip[key])||0);
        const clipSeconds=Math.max(.01,Number(clip.playDurationSeconds||clip.duration||clip.lengthBars*240/tempo));
        const maxFade=clipSeconds/2;
        let changed=false;
        handle.setPointerCapture(event.pointerId);
        const move=e=>{
          const direction=edge==="in"?1:-1;
          const next=Math.max(0,Math.min(maxFade,initial+direction*(e.clientX-startX)/Math.max(1,block.clientWidth)*clipSeconds));
          if(Math.abs(next-(Number(clip[key])||0))<.005)return;
          if(!changed){onEditStart(edge==="in"?"Fade in":"Fade out");changed=true;}
          clip[key]=next;
          handle.style.width=Math.max(16,next/clipSeconds*block.clientWidth)+"px";
        };
        const finish=()=>{
          handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",finish);handle.removeEventListener("pointercancel",finish);
          if(changed)onChange(clip);
        };
        handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",finish);handle.addEventListener("pointercancel",finish);
      });
      const seconds=Math.max(0,Number(clip[edge==="in"?"fadeInSeconds":"fadeOutSeconds"])||0);
      const duration=Math.max(.01,Number(clip.playDurationSeconds||clip.duration||clip.lengthBars*240/tempo));
      handle.style.width=Math.max(16,seconds/duration*Math.max(18,block.clientWidth))+"px";
      block.appendChild(handle);
    };
    addFadeHandle("in");addFadeHandle("out");
    const gainRow=document.createElement("label");gainRow.style.cssText="position:absolute;left:7px;right:7px;bottom:2px;height:14px;display:flex;align-items:center;gap:4px;color:#d8c69f;font-size:8px";
    const gainLabel=document.createElement("span");gainLabel.textContent="CLIP";
    const gain=document.createElement("input");gain.type="range";gain.min="-24";gain.max="12";gain.step="0.5";gain.value=String(Number(clip.clipGainDb)||0);gain.setAttribute("aria-label","Clip gain in decibels");gain.style.cssText="width:100%;height:12px;min-width:20px;accent-color:#d8b36e";
    const gainValue=document.createElement("span");gainValue.textContent=(Number(clip.clipGainDb)||0).toFixed(1);
    gain.addEventListener("pointerdown",()=>onEditStart("Clip gain"));
    gain.addEventListener("input",()=>{clip.clipGainDb=Number(gain.value);gainValue.textContent=clip.clipGainDb.toFixed(1);});
    gain.addEventListener("change",()=>onChange(clip));
    gainRow.append(gainLabel,gain,gainValue);block.appendChild(gainRow);lane.appendChild(block);
  });
  if(Number.isFinite(Number(playheadBar))){const line=document.createElement("div");line.className="lc-arrangement-playhead";line.style.left=((Number(playheadBar)-1)*width)+"px";lane.appendChild(line);}
  const help=document.createElement("div");help.className="lc-arrangement-help";help.textContent="128-BAR ARRANGEMENT · Select a region · Drag its title to move · Drag the right edge to trim · Tap a bar number to set the edit cursor.";
  inner.append(ruler,lane,help);scroll.appendChild(inner);container.append(style,scroll);
  return {refresh(){renderStudioDAWTimeline({container,track,onChange,onSelect,onEditStart,onPlayheadChange,barWidth:width,selectedClipId,playheadBar,snapMode,tempo,slipMode});}};
}
