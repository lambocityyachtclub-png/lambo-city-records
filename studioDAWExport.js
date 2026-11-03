import StudioAudioEngine from "./studioAudioEngine.js";

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

export async function renderStudioSessionToWav({
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
      decoded.push({ track, buffer, start });
      renderDuration = Math.max(renderDuration, start + buffer.duration);
    }
  }

  if (!decoded.length) throw new Error("There are no audio clips to export.");
  if (renderDuration > MAX_RENDER_SECONDS || decoded.some(item => item.start >= MAX_RENDER_SECONDS)) {
    throw new Error("The arrangement extends beyond the 15-minute WAV export limit.");
  }
  renderDuration = Math.max(0.1, renderDuration + 0.1);

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
    automationGain.gain.setValueAtTime(1, 0);
    (track.automation?.volume || []).slice().sort((a, b) => a.bar - b.bar).forEach(point => {
      const time = (Math.max(1, Number(point.bar) || 1) - 1) * secondsPerBar;
      automationGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, Number(point.value) / 100)), time);
    });
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, Number(track.pan) || 0));
      compressor.connect(panner); panner.connect(master);
    } else compressor.connect(master);
    channels.set(track.id, gain);
  }

  decoded.forEach(({ track, buffer, start }) => {
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(channels.get(track.id));
    source.start(start);
  });

  const rendered = await offline.startRendering();
  return encodeWav(rendered);
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
