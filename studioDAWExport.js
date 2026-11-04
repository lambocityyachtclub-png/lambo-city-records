import StudioAudioEngine from "./studioAudioEngine.js";
import StudioVocalEffects from "./studioVocalEffects.js";
import { createStudioPitchCorrectionNode } from "./studioPitchCorrection.js";

const MAX_RENDER_SECONDS = 900;
const SAMPLE_RATE = 44100;

function encodeWav(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const frames = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataBytes = frames * blockAlign;
  const output = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(output);
  const writeText = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataBytes, true);

  const channelData = Array.from({ length: channels }, (_, channel) => audioBuffer.getChannelData(channel));
  let offset = 44;
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }
  return new Blob([output], { type: "audio/wav" });
}

async function renderStudioSessionToAudioBuffer({
  tracks = [],
  tempo = 100,
  timeSignature = "4/4",
  tempoChanges = [],
  timeSignatureChanges = [],
  masterVolume = StudioAudioEngine.master?.gain?.value ?? 1,
  masterSettings = {}
} = {}) {
  const bpm = Number(tempo);
  if (!Number.isFinite(bpm) || bpm < 60 || bpm > 180) {
    throw new Error("Set a valid session tempo before exporting.");
  }

  const liveContext = await StudioAudioEngine.resume();
  const anySolo = tracks.some(track => track.solo);
  const hasSeparateStems =
    tracks.some(track => track.name === "Vocals") &&
    tracks.some(track => track.name === "Beats");
  const decoded = [];
  const midiTracks = [];
  let renderDuration = 0;
  const getTempoAtBar = bar => [...tempoChanges].filter(point=>Number(point.bar)<=bar).sort((a,b)=>a.bar-b.bar).pop()?.bpm || bpm;
  const getMeterAtBar = bar => { const point=[...timeSignatureChanges].filter(item=>Number(item.bar)<=bar).sort((a,b)=>a.bar-b.bar).pop(); const fallback=String(timeSignature||"4/4").split("/"); return {numerator:Number(point?.numerator)||Number(fallback[0])||4,denominator:Number(point?.denominator)||Number(fallback[1])||4}; };
  const getSecondsAtBar = bar => { const target=Math.max(1,Math.min(129,Number(bar)||1)); const boundaries=[...new Set([1,target,...tempoChanges.map(point=>Number(point.bar)),...timeSignatureChanges.map(point=>Number(point.bar))].filter(value=>value>=1&&value<=target))].sort((a,b)=>a-b); let seconds=0; for(let index=0;index<boundaries.length-1;index+=1){const start=boundaries[index],end=boundaries[index+1],meter=getMeterAtBar(start);seconds+=(end-start)*60/Math.max(1,Number(getTempoAtBar(start))||bpm)*meter.numerator*(4/meter.denominator);} return seconds; };

  for (const track of tracks) {
    if (track.muted || (anySolo && !track.solo)) continue;
    if (!anySolo && hasSeparateStems && track.name === "Master Mix") continue;
    if ((track.type === "midi" || track.type === "instrument") && Array.isArray(track.midiNotes) && track.midiNotes.length) {
      midiTracks.push(track);
      track.midiNotes.forEach(note => { renderDuration = Math.max(renderDuration, getSecondsAtBar(Math.max(1, Number(note.startBar) || 1) + Math.max(0.0625, Number(note.lengthBars) || 0.25))); });
    }
    for (const clip of (track.clips || [])) {
      if (!(clip.blob instanceof Blob) || !clip.blob.size) continue;
      const bytes = await clip.blob.arrayBuffer();
      const buffer = await liveContext.decodeAudioData(bytes.slice(0));
      const startBar = Math.max(1, Number(clip.startBar) || 1);
      const start = getSecondsAtBar(startBar);
      const sourceOffset = Math.max(0, Math.min(buffer.duration, Number(clip.sourceOffsetSeconds) || 0));
      const sourceAvailable = Math.max(0, buffer.duration - sourceOffset);
      const clipBars = Math.max(.0625, Number(clip.lengthBars) || 4);
      const clipTimelineDuration = Math.max(0, getSecondsAtBar(startBar + clipBars) - start);
      const sourceDuration = Math.max(0, Math.min(sourceAvailable, clipTimelineDuration, Number(clip.playDurationSeconds) > 0 ? Number(clip.playDurationSeconds) : sourceAvailable));
      if (sourceDuration <= 0.001) continue;
      decoded.push({
        track, buffer, start, sourceOffset, sourceDuration,
        clipGainDb: Math.max(-24, Math.min(12, Number(clip.clipGainDb) || 0)),
        fadeInSeconds: Math.max(0, Number(clip.fadeInSeconds) || 0),
        fadeOutSeconds: Math.max(0, Number(clip.fadeOutSeconds) || 0)
      });
      renderDuration = Math.max(renderDuration, start + sourceDuration);
    }
  }

  if (!decoded.length && !midiTracks.length) throw new Error("There are no audio clips or MIDI notes to export.");
  if (renderDuration > MAX_RENDER_SECONDS || decoded.some(item => item.start >= MAX_RENDER_SECONDS)) {
    throw new Error("The arrangement extends beyond the 15-minute WAV export limit.");
  }
  const reverbTail = Math.max(0.1, ...[...decoded.map(({ track }) => track), ...midiTracks].map(track => Number(track.effects?.reverbDecay) || 0.1));
  renderDuration = Math.max(0.1, renderDuration + reverbTail + 0.1);

  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineContext) throw new Error("Offline audio rendering is not supported in this browser.");
  const frameCount = Math.ceil(renderDuration * SAMPLE_RATE);
  const offline = new OfflineContext(2, frameCount, SAMPLE_RATE);
  const master = offline.createGain();
  const masterCompressor = offline.createDynamicsCompressor();
  master.gain.value = Math.max(0, Math.min(1, Number(masterSettings.volume ?? masterVolume) || 0));
  masterCompressor.threshold.value = -8;
  masterCompressor.knee.value = 12;
  masterCompressor.ratio.value = Math.max(1, Math.min(8, Number(masterSettings.compressionRatio ?? 3)));
  masterCompressor.attack.value = 0.003;
  masterCompressor.release.value = 0.18;
  const splitter = offline.createChannelSplitter(2);
  const merger = offline.createChannelMerger(2);
  const mid = offline.createGain(); const side = offline.createGain(); const sideWidth = offline.createGain();
  const leftOut = offline.createGain(); const rightOut = offline.createGain();
  const sideLeft = offline.createGain(); const sideRight = offline.createGain();
  mid.gain.value = 0.5; side.gain.value = 0.5; sideWidth.gain.value = Math.max(0, Math.min(2, Number(masterSettings.stereoWidth ?? 100) / 100));
  sideLeft.gain.value = 1; sideRight.gain.value = -1;
  master.connect(splitter); splitter.connect(mid, 0); splitter.connect(mid, 1); splitter.connect(side, 0); splitter.connect(side, 1);
  mid.connect(leftOut); mid.connect(rightOut); leftOut.connect(merger, 0, 0); rightOut.connect(merger, 0, 1);
  side.connect(sideWidth); sideWidth.connect(sideLeft); sideWidth.connect(sideRight); sideLeft.connect(merger, 0, 0); sideRight.connect(merger, 0, 1);
  merger.connect(masterCompressor); masterCompressor.connect(offline.destination);

  const channels = new Map();
  const effectsOutputs = new Map();
  const mixTracks = [...new Map([...decoded.map(item => item.track), ...midiTracks, ...tracks.filter(track => track.type === "bus")].map(track => [track.id, track])).values()]
    .filter(track => !track.muted && (!anySolo || track.solo) && !( !anySolo && hasSeparateStems && track.name === "Master Mix"))
    .sort((a, b) => (a.type === "bus" ? 0 : 1) - (b.type === "bus" ? 0 : 1));
  for (const track of mixTracks) {
    if (channels.has(track.id)) continue;
    const gain = offline.createGain();
    const automationGain = offline.createGain();
    const low = offline.createBiquadFilter();
    const mid = offline.createBiquadFilter();
    const high = offline.createBiquadFilter();
    const compressor = offline.createDynamicsCompressor();
    const panner = offline.createStereoPanner ? offline.createStereoPanner() : null;
    const trackEffects = StudioVocalEffects.create(offline);
    const pitchCorrectionNode = track.effects?.pitchCorrection?.enabled
      ? await createStudioPitchCorrectionNode(offline, track.effects.pitchCorrection)
      : null;
    low.type = "lowshelf"; low.frequency.value = 120;
    mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 0.8;
    high.type = "highshelf"; high.frequency.value = 8000;
    gain.gain.value = Math.max(0, Math.min(1, Number(track.volume ?? 80) / 100));
    low.gain.value = Math.max(-12, Math.min(12, Number(track.eq?.low) || 0));
    mid.gain.value = Math.max(-12, Math.min(12, Number(track.eq?.mid) || 0));
    high.gain.value = Math.max(-12, Math.min(12, Number(track.eq?.high) || 0));
    compressor.threshold.value = Math.max(-48, Math.min(0, Number(track.compression?.threshold ?? -18)));
    compressor.ratio.value = Math.max(1, Math.min(8, Number(track.compression?.ratio ?? 1)));
    compressor.knee.value = 18;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    gain.connect(automationGain); automationGain.connect(low);
    low.connect(mid); mid.connect(high); high.connect(compressor);
    if (pitchCorrectionNode) {
      compressor.connect(pitchCorrectionNode);
      pitchCorrectionNode.connect(trackEffects.input);
    } else {
      compressor.connect(trackEffects.input);
    }
    const outputBus = track.type !== "bus" && track.outputBusId ? channels.get(track.outputBusId) : null;
    const routeOutput = outputBus || master;
    if (panner) {
      trackEffects.output.connect(panner);
      panner.connect(routeOutput);
    } else {
      trackEffects.output.connect(routeOutput);
    }
    const effects = track.effects || {};
    trackEffects.setDelayTime(effects.delayTime ?? 0.28);
    trackEffects.setDelayFeedback(effects.delayFeedback ?? 0.25);
    trackEffects.setDelayMix(effects.delayMix ?? 0);
    trackEffects.setReverbMix(effects.reverbMix ?? 0);
    if (effects.reverbDecay !== undefined) trackEffects.setReverbDecay(effects.reverbDecay);
    automationGain.gain.setValueAtTime(1, 0);
    (track.automation?.volume || []).slice().sort((a, b) => a.bar - b.bar).forEach(point => {
      const time = getSecondsAtBar(Math.max(1, Number(point.bar) || 1));
      const value = Math.max(0, Math.min(1, Number(point.value) / 100));
      if (time <= 0.001) automationGain.gain.setValueAtTime(value, 0);
      else automationGain.gain.linearRampToValueAtTime(value, time);
    });
    if (panner) panner.pan.value = Math.max(-1, Math.min(1, Number(track.pan) || 0));
    channels.set(track.id, gain);
    effectsOutputs.set(track.id, trackEffects.output);
  }
  mixTracks.forEach(track => (track.sends || []).forEach(send => {
    const source = effectsOutputs.get(track.id);
    const busGain = channels.get(send.busId);
    if (!source || !busGain || track.id === send.busId) return;
    const sendGain = offline.createGain();
    sendGain.gain.value = Math.max(0, Math.min(1, Number(send.level) || 0) / 100);
    source.connect(sendGain); sendGain.connect(busGain);
  }));

  decoded.forEach(({ track, buffer, start, sourceOffset, sourceDuration, clipGainDb, fadeInSeconds, fadeOutSeconds }) => {
    const source = offline.createBufferSource();
    const clipGain = offline.createGain();
    source.buffer = buffer;
    const linearGain = Math.pow(10, clipGainDb / 20);
    const fadeIn = Math.max(0, Math.min(sourceDuration, fadeInSeconds));
    const fadeOut = Math.max(0, Math.min(sourceDuration, fadeOutSeconds));
    const end = start + sourceDuration;
    clipGain.gain.setValueAtTime(linearGain, start);
    if (fadeIn > 0) {
      const curve = new Float32Array(32);
      for (let index = 0; index < curve.length; index += 1) {
        curve[index] = linearGain * Math.sin((index / (curve.length - 1)) * Math.PI / 2);
      }
      clipGain.gain.setValueAtTime(0, start);
      clipGain.gain.setValueCurveAtTime(curve, start, fadeIn);
    }
    if (fadeOut > 0) {
      const curve = new Float32Array(32);
      for (let index = 0; index < curve.length; index += 1) {
        curve[index] = linearGain * Math.cos((index / (curve.length - 1)) * Math.PI / 2);
      }
      const fadeStart = Math.max(start, end - fadeOut);
      clipGain.gain.setValueAtTime(linearGain, fadeStart);
      clipGain.gain.setValueCurveAtTime(curve, fadeStart, end - fadeStart);
    }
    source.connect(clipGain);
    clipGain.connect(channels.get(track.id));
    source.start(start, sourceOffset, sourceDuration);
  });

  midiTracks.forEach(track => {
    const channel = channels.get(track.id);
    if (!channel) return;
    (track.midiNotes || []).forEach(note => {
      const pitch = Math.max(0, Math.min(127, Number(note.pitch) || 60));
      const startBar = Math.max(1, Number(note.startBar) || 1);
      const duration = Math.max(0.01, getSecondsAtBar(startBar + Math.max(0.0625, Number(note.lengthBars) || 0.25)) - getSecondsAtBar(startBar));
      const start = getSecondsAtBar(startBar);
      const velocity = Math.max(0, Math.min(1, Number(note.velocity ?? 0.8)));
      const oscillator = offline.createOscillator();
      const envelope = offline.createGain();
      oscillator.type = track.instrumentWave || "triangle";
      oscillator.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(Math.max(0.0001, velocity * 0.22), start + Math.min(0.012, duration / 2));
      envelope.gain.linearRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope); envelope.connect(channel);
      oscillator.start(start); oscillator.stop(start + duration + 0.01);
    });
  });

  const rendered = await offline.startRendering();
  return rendered;
}

export async function renderStudioSessionToWav(options = {}) {
  const audioBuffer = await renderStudioSessionToAudioBuffer(options);
  return encodeWav(audioBuffer);
}

let mp3EncoderLibraryPromise = null;

async function loadMp3EncoderLibrary() {
  if (window.lamejs?.Mp3Encoder) return window.lamejs;
  if (mp3EncoderLibraryPromise) return mp3EncoderLibraryPromise;
  mp3EncoderLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = new URL("./vendor/lamejs/lame.min.js", import.meta.url).href;
    script.onload = () => {
      if (window.lamejs?.Mp3Encoder) resolve(window.lamejs);
      else reject(new Error("The MP3 encoder loaded but its API was unavailable."));
    };
    script.onerror = () => {
      mp3EncoderLibraryPromise = null;
      reject(new Error("The local MP3 encoder could not be loaded."));
    };
    document.head.appendChild(script);
  });
  return mp3EncoderLibraryPromise;
}

export async function renderStudioSessionToMp3({
  tracks = [],
  tempo = 100,
  timeSignature = "4/4",
  tempoChanges = [],
  timeSignatureChanges = [],
  masterVolume,
  masterSettings = {}
} = {}) {
  const audioBuffer = await renderStudioSessionToAudioBuffer({ tracks, tempo, timeSignature, tempoChanges, timeSignatureChanges, masterVolume, masterSettings });
  const lamejs = await loadMp3EncoderLibrary();
  const encoder = new lamejs.Mp3Encoder(2, SAMPLE_RATE, 192);
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.numberOfChannels > 1
    ? audioBuffer.getChannelData(1)
    : left;
  const sampleBlockSize = 1152;
  const mp3Chunks = [];

  for (let offset = 0; offset < audioBuffer.length; offset += sampleBlockSize) {
    const length = Math.min(sampleBlockSize, audioBuffer.length - offset);
    const leftSamples = new Int16Array(length);
    const rightSamples = new Int16Array(length);
    for (let index = 0; index < length; index += 1) {
      const l = Math.max(-1, Math.min(1, left[offset + index]));
      const r = Math.max(-1, Math.min(1, right[offset + index]));
      leftSamples[index] = l < 0 ? l * 0x8000 : l * 0x7fff;
      rightSamples[index] = r < 0 ? r * 0x8000 : r * 0x7fff;
    }
    const encoded = encoder.encodeBuffer(leftSamples, rightSamples);
    if (encoded?.length) mp3Chunks.push(encoded);
  }

  const finalChunk = encoder.flush();
  if (finalChunk?.length) mp3Chunks.push(finalChunk);
  if (!mp3Chunks.length) throw new Error("The MP3 encoder did not produce audio data.");
  return new Blob(mp3Chunks, { type: "audio/mpeg" });
}

export function downloadStudioMp3(blob, title = "lambo-city-song") {
  if (!(blob instanceof Blob) || !blob.size) throw new Error("The MP3 export is empty.");
  const safeName = String(title).replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, "-") || "lambo-city-song";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName + ".mp3";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function downloadStudioWav(blob, title = "lambo-city-song") {
  if (!(blob instanceof Blob) || !blob.size) throw new Error("The WAV export is empty.");
  const safeName = String(title).replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, "-") || "lambo-city-song";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName + ".wav";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default renderStudioSessionToWav;
