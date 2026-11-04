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
  masterVolume = StudioAudioEngine.master?.gain?.value ?? 1
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
  let renderDuration = 0;
  const secondsPerBar = 240 / bpm;

  for (const track of tracks) {
    if (track.muted || (anySolo && !track.solo)) continue;
    if (!anySolo && hasSeparateStems && track.name === "Master Mix") continue;
    for (const clip of (track.clips || [])) {
      if (!(clip.blob instanceof Blob) || !clip.blob.size) continue;
      const bytes = await clip.blob.arrayBuffer();
      const buffer = await liveContext.decodeAudioData(bytes.slice(0));
      const start = (Math.max(1, Number(clip.startBar) || 1) - 1) * secondsPerBar;
      const sourceOffset = Math.max(0, Math.min(buffer.duration, Number(clip.sourceOffsetSeconds) || 0));
      const sourceAvailable = Math.max(0, buffer.duration - sourceOffset);
      const sourceDuration = Math.max(0, Math.min(sourceAvailable, Number(clip.playDurationSeconds) > 0 ? Number(clip.playDurationSeconds) : sourceAvailable));
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

  if (!decoded.length) throw new Error("There are no audio clips to export.");
  if (renderDuration > MAX_RENDER_SECONDS || decoded.some(item => item.start >= MAX_RENDER_SECONDS)) {
    throw new Error("The arrangement extends beyond the 15-minute WAV export limit.");
  }
  const reverbTail = Math.max(0.1, ...decoded.map(({ track }) => Number(track.effects?.reverbDecay) || 0.1));
  renderDuration = Math.max(0.1, renderDuration + reverbTail + 0.1);

  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineContext) throw new Error("Offline audio rendering is not supported in this browser.");
  const frameCount = Math.ceil(renderDuration * SAMPLE_RATE);
  const offline = new OfflineContext(2, frameCount, SAMPLE_RATE);
  const master = offline.createGain();
  const masterCompressor = offline.createDynamicsCompressor();
  master.gain.value = Math.max(0, Math.min(1, Number(masterVolume) || 0));
  masterCompressor.threshold.value = -8;
  masterCompressor.knee.value = 12;
  masterCompressor.ratio.value = 3;
  masterCompressor.attack.value = 0.003;
  masterCompressor.release.value = 0.18;
  master.connect(masterCompressor);
  masterCompressor.connect(offline.destination);

  const channels = new Map();
  for (const { track } of decoded) {
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
    if (panner) {
      trackEffects.output.connect(panner);
      panner.connect(master);
    } else {
      trackEffects.output.connect(master);
    }
    const effects = track.effects || {};
    trackEffects.setDelayTime(effects.delayTime ?? 0.28);
    trackEffects.setDelayFeedback(effects.delayFeedback ?? 0.25);
    trackEffects.setDelayMix(effects.delayMix ?? 0);
    trackEffects.setReverbMix(effects.reverbMix ?? 0);
    if (effects.reverbDecay !== undefined) trackEffects.setReverbDecay(effects.reverbDecay);
    automationGain.gain.setValueAtTime(1, 0);
    (track.automation?.volume || []).slice().sort((a, b) => a.bar - b.bar).forEach(point => {
      const time = (Math.max(1, Number(point.bar) || 1) - 1) * secondsPerBar;
      const value = Math.max(0, Math.min(1, Number(point.value) / 100));
      if (time <= 0.001) automationGain.gain.setValueAtTime(value, 0);
      else automationGain.gain.linearRampToValueAtTime(value, time);
    });
    if (panner) panner.pan.value = Math.max(-1, Math.min(1, Number(track.pan) || 0));
    channels.set(track.id, gain);
  }

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
  masterVolume
} = {}) {
  const audioBuffer = await renderStudioSessionToAudioBuffer({ tracks, tempo, masterVolume });
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
