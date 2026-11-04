/*
 * LAMBO CITY RECORDS — ZOOMABLE WAVEFORM ARRANGEMENT
 * Uses the existing shared audio context and session clips.
 */
import StudioAudioEngine from "./studioAudioEngine.js";

const TOTAL_BARS = 128;
const decodedWaveforms = new WeakMap();

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

function paintWaveform(canvas, audioBuffer) {
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
  const samplesPerPixel = Math.max(1, Math.floor(channel.length / width));
  const center = height / 2;
  const amplitude = height * 0.43;
  context.fillStyle = "#d8b36e";
  for (let x = 0; x < width; x += 1) {
    const start = x * samplesPerPixel;
    const end = Math.min(channel.length, start + samplesPerPixel);
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
  barWidth = 72, selectedClipId = null, playheadBar = null
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
    mark.addEventListener("click",()=>onPlayheadChange(bar));
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
    title.title="Select and drag to move this region";
    title.addEventListener("pointerdown",event=>{
      if(event.button!==0&&event.pointerType==="mouse")return;
      event.preventDefault(); onSelect(clip); onEditStart();
      const startX=event.clientX, originalBar=clip.startBar, maxStart=TOTAL_BARS-clip.lengthBars+1;
      title.setPointerCapture(event.pointerId);
      const move=e=>{clip.startBar=Math.max(1,Math.min(maxStart,originalBar+Math.round((e.clientX-startX)/width)));update();};
      const finish=()=>{title.removeEventListener("pointermove",move);title.removeEventListener("pointerup",finish);title.removeEventListener("pointercancel",finish);onChange(clip);};
      title.addEventListener("pointermove",move);title.addEventListener("pointerup",finish);title.addEventListener("pointercancel",finish);
    });
    title.addEventListener("click",()=>onSelect(clip));
    block.appendChild(title);
    if(clip.blob&&clip.blob.size){
      const canvas=document.createElement("canvas");canvas.className="lc-arrangement-waveform";
      canvas.setAttribute("aria-label","Waveform for "+(clip.name||"audio clip"));block.appendChild(canvas);
      decodeClip(clip).then(buffer=>{if(buffer&&canvas.isConnected)paintWaveform(canvas,buffer);else if(canvas.isConnected){const fallback=document.createElement("div");fallback.className="lc-arrangement-wave-empty";fallback.textContent="Waveform unavailable";canvas.replaceWith(fallback);}});
    }else{const note=document.createElement("div");note.className="lc-arrangement-wave-empty";note.textContent="Empty audio region";block.appendChild(note);}
    const beginResize=(handle,edge)=>{
      handle.addEventListener("pointerdown",event=>{
        event.preventDefault();event.stopPropagation();onSelect(clip);onEditStart();
        const startX=event.clientX,originalStart=clip.startBar,originalLength=clip.lengthBars;
        const originalOffset=Number(clip.sourceOffsetSeconds)||0;
        const originalPlay=Number(clip.playDurationSeconds||clip.duration||0);
        handle.setPointerCapture(event.pointerId);
        const move=e=>{
          const delta=Math.round((e.clientX-startX)/width);
          if(edge==="right"){
            const next=Math.max(.25,Math.min(TOTAL_BARS-clip.startBar+1,originalLength+delta));
            clip.lengthBars=next;
            if(originalPlay>0)clip.playDurationSeconds=originalPlay*(next/originalLength);
          }else{
            const nextStart=Math.max(1,Math.min(originalStart+originalLength-.25,originalStart+delta));
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
        const finish=()=>{handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",finish);handle.removeEventListener("pointercancel",finish);onChange(clip);};
        handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",finish);handle.addEventListener("pointercancel",finish);
      });
    };
    const leftResize=document.createElement("div");leftResize.className="lc-arrangement-resize left";leftResize.title="Drag to trim the region start";leftResize.style.cssText="position:absolute;left:0;right:auto;top:0;bottom:0;width:12px;cursor:ew-resize;touch-action:none;background:linear-gradient(90deg,rgba(241,212,156,.22),transparent)";
    beginResize(leftResize,"left");
    const rightResize=document.createElement("div");rightResize.className="lc-arrangement-resize";rightResize.title="Drag to trim the region end";
    beginResize(rightResize,"right");
    block.append(leftResize,rightResize);lane.appendChild(block);
  });
  if(Number.isFinite(Number(playheadBar))){const line=document.createElement("div");line.className="lc-arrangement-playhead";line.style.left=((Number(playheadBar)-1)*width)+"px";lane.appendChild(line);}
  const help=document.createElement("div");help.className="lc-arrangement-help";help.textContent="128-BAR ARRANGEMENT · Select a region · Drag its title to move · Drag the right edge to trim · Tap a bar number to set the edit cursor.";
  inner.append(ruler,lane,help);scroll.appendChild(inner);container.append(style,scroll);
  return {refresh(){renderStudioDAWTimeline({container,track,onChange,onSelect,onEditStart,onPlayheadChange,barWidth:width,selectedClipId,playheadBar});}};
}
