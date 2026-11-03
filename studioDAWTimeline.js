/*
 * LAMBO CITY RECORDS
 * SONG EDITOR WAVEFORM TIMELINE — V2
 *
 * Draws decoded audio from the shared studio AudioContext.
 * Uses the existing session clips and arrangement positions.
 * Does not create another audio engine or recorder.
 */

import StudioAudioEngine from "./studioAudioEngine.js";

const BAR_WIDTH = 72;
const TOTAL_BARS = 128;
const decodedWaveforms = new WeakMap();

async function decodeClip(clip) {
  if (!clip?.blob || !clip.blob.size) return null;
  if (decodedWaveforms.has(clip.blob)) {
    return decodedWaveforms.get(clip.blob);
  }

  const pending = (async () => {
    const context = StudioAudioEngine.context;
    if (!context || context.state === "closed") return null;

    const bytes = await clip.blob.arrayBuffer();
    return context.decodeAudioData(bytes.slice(0));
  })();

  decodedWaveforms.set(clip.blob, pending);

  try {
    return await pending;
  } catch (error) {
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

    for (let sample = start; sample < end; sample += 1) {
      peak = Math.max(peak, Math.abs(channel[sample]));
    }

    const barHeight = Math.max(1, peak * amplitude);
    context.fillRect(x, center - barHeight, 1, barHeight * 2);
  }

  context.strokeStyle = "rgba(255,255,255,.12)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, center + 0.5);
  context.lineTo(width, center + 0.5);
  context.stroke();
}

export function renderStudioDAWTimeline({
  container,
  track,
  onChange = () => {}
}) {
  if (!container || !track) {
    throw new Error("Timeline container or track unavailable.");
  }

  const clips = Array.isArray(track.clips) ? track.clips : [];

  clips.forEach((clip, index) => {
    if (!Number.isFinite(clip.startBar)) {
      clip.startBar = 1 + (index * 4);
    }

    if (!Number.isFinite(clip.lengthBars)) {
      clip.lengthBars = 4;
    }

    clip.lengthBars = Math.max(1, Math.min(TOTAL_BARS, clip.lengthBars));
    clip.startBar = Math.max(
      1,
      Math.min(TOTAL_BARS - clip.lengthBars + 1, clip.startBar)
    );
  });

  container.replaceChildren();

  const style = document.createElement("style");
  style.textContent = `
    .lc-arrangement {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      background: #0b0e14;
      border: 1px solid #343946;
      border-radius: 8px;
      -webkit-overflow-scrolling: touch;
      scrollbar-color: #80643a #171a22;
    }
    .lc-arrangement-inner {
      width: ${BAR_WIDTH * TOTAL_BARS}px;
      min-width: ${BAR_WIDTH * TOTAL_BARS}px;
    }
    .lc-arrangement-ruler {
      display: grid;
      grid-template-columns: repeat(${TOTAL_BARS}, ${BAR_WIDTH}px);
      height: 30px;
      background: #1b202a;
      border-bottom: 1px solid #665438;
    }
    .lc-arrangement-ruler span {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d8b36e;
      font-size: 10px;
      border-right: 1px solid #343946;
    }
    .lc-arrangement-lane {
      position: relative;
      width: ${BAR_WIDTH * TOTAL_BARS}px;
      min-height: 92px;
      background:
        repeating-linear-gradient(90deg,transparent 0,transparent ${BAR_WIDTH - 1}px,#343946 ${BAR_WIDTH - 1}px,#343946 ${BAR_WIDTH}px),
        repeating-linear-gradient(90deg,transparent 0,transparent ${BAR_WIDTH * 4 - 1}px,#665438 ${BAR_WIDTH * 4 - 1}px,#665438 ${BAR_WIDTH * 4}px),
        #10141c;
    }
    .lc-arrangement-clip {
      position: absolute;
      top: 8px;
      height: 76px;
      padding: 0 8px 7px;
      overflow: hidden;
      background: linear-gradient(180deg,rgba(105,129,104,.26),rgba(52,73,59,.32));
      border: 1px solid #8d9d75;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .lc-arrangement-clip-title {
      display: block;
      width: 100%;
      height: 25px;
      padding: 5px 2px 3px;
      overflow: hidden;
      color: #e9e5d9;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .2px;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }
    .lc-arrangement-clip-title:active { cursor: grabbing; }
    .lc-arrangement-waveform {
      display: block;
      width: 100%;
      height: 38px;
      border-radius: 3px;
      background: rgba(9,13,16,.42);
    }
    .lc-arrangement-wave-empty {
      display: flex;
      align-items: center;
      height: 38px;
      padding-left: 7px;
      color: #b8b4a8;
      font-size: 10px;
      background: rgba(9,13,16,.35);
      border-radius: 3px;
    }
    .lc-arrangement-empty {
      padding: 18px 12px;
      color: #777f90;
      font-size: 11px;
    }
    .lc-arrangement-help {
      padding: 7px 9px;
      color: #999fad;
      font-size: 10px;
      border-top: 1px solid #343946;
    }
  `;

  const scroll = document.createElement("div");
  scroll.className = "lc-arrangement";

  const inner = document.createElement("div");
  inner.className = "lc-arrangement-inner";

  const ruler = document.createElement("div");
  ruler.className = "lc-arrangement-ruler";

  for (let bar = 1; bar <= TOTAL_BARS; bar += 1) {
    const mark = document.createElement("span");
    mark.textContent = String(bar).padStart(2, "0");
    ruler.appendChild(mark);
  }

  const lane = document.createElement("div");
  lane.className = "lc-arrangement-lane";

  if (!clips.length) {
    const empty = document.createElement("div");
    empty.className = "lc-arrangement-empty";
    empty.textContent = "No audio clips on this track yet. Record vocals or a beat to add a waveform.";
    lane.appendChild(empty);
  }

  clips.forEach(clip => {
    const block = document.createElement("div");
    block.className = "lc-arrangement-clip";

    const title = document.createElement("div");
    title.className = "lc-arrangement-clip-title";
    title.textContent = clip.name || "Audio Clip";
    title.title = "Touch and drag to move this audio clip";

    const updatePosition = () => {
      block.style.left = `${(clip.startBar - 1) * BAR_WIDTH}px`;
      block.style.width = `${clip.lengthBars * BAR_WIDTH - 4}px`;
    };
    updatePosition();

    title.addEventListener("pointerdown", event => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      event.preventDefault();

      const startX = event.clientX;
      const originalBar = clip.startBar;
      const maxStart = TOTAL_BARS - clip.lengthBars + 1;
      title.setPointerCapture(event.pointerId);

      const move = moveEvent => {
        const distance = moveEvent.clientX - startX;
        const barOffset = Math.round(distance / BAR_WIDTH);
        clip.startBar = Math.max(1, Math.min(maxStart, originalBar + barOffset));
        updatePosition();
      };

      const finish = () => {
        title.removeEventListener("pointermove", move);
        title.removeEventListener("pointerup", finish);
        title.removeEventListener("pointercancel", finish);
        onChange(clip);
      };

      title.addEventListener("pointermove", move);
      title.addEventListener("pointerup", finish);
      title.addEventListener("pointercancel", finish);
    });

    block.appendChild(title);

    if (clip.blob && clip.blob.size > 0) {
      const canvas = document.createElement("canvas");
      canvas.className = "lc-arrangement-waveform";
      canvas.setAttribute("aria-label", `Waveform for ${clip.name || "audio clip"}`);
      block.appendChild(canvas);

      decodeClip(clip).then(buffer => {
        if (buffer && canvas.isConnected) {
          paintWaveform(canvas, buffer);
        } else if (canvas.isConnected) {
          const fallback = document.createElement("div");
          fallback.className = "lc-arrangement-wave-empty";
          fallback.textContent = "Audio waveform loading";
          canvas.replaceWith(fallback);
        }
      });
    } else {
      const note = document.createElement("div");
      note.className = "lc-arrangement-wave-empty";
      note.textContent = "Empty audio region";
      block.appendChild(note);
    }

    lane.appendChild(block);
  });

  const help = document.createElement("div");
  help.className = "lc-arrangement-help";
  help.textContent = "32-BAR SONG TIMELINE · Drag a clip name to move its waveform · Swipe horizontally to navigate the session.";

  inner.append(ruler, lane, help);
  scroll.appendChild(inner);
  container.append(style, scroll);

  return {
    refresh() {
      renderStudioDAWTimeline({ container, track, onChange });
    }
  };
}
