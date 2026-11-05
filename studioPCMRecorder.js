/*
 * LAMBO CITY RECORDS — PCM RECORDING ADAPTER
 *
 * Uses AudioWorklet capture where supported and produces uncompressed
 * 24-bit PCM WAV clips. The existing MediaRecorder path remains the
 * compatibility fallback in StudioRecordingEngine.
 */

import { encodeStudioWav } from "./studioDAWExport.js";

const modulePromises = new WeakMap();
const WORKLET_PROCESSOR = "lambo-city-pcm-recorder";

async function ensureWorkletModule(audio) {
  if (!audio?.audioWorklet || typeof AudioWorkletNode !== "function") return false;
  let pending = modulePromises.get(audio);
  if (!pending) {
    pending = audio.audioWorklet.addModule(
      new URL("./studioPCMRecorderWorklet.js", import.meta.url).href
    );
    modulePromises.set(audio, pending);
  }
  try {
    await pending;
    return true;
  } catch (error) {
    modulePromises.delete(audio);
    throw error;
  }
}

export async function createStudioPCMRecorder(audio) {
  if (!audio || audio.state !== "running") {
    throw new Error("Start the shared Studio audio before PCM recording.");
  }
  const supported = await ensureWorkletModule(audio);
  if (!supported) return null;

  const node = new AudioWorkletNode(audio, WORKLET_PROCESSOR, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    channelCount: 2,
    channelCountMode: "max",
    channelInterpretation: "speakers",
    processorOptions: { chunkFrames: 8192 }
  });
  const silentGain = audio.createGain();
  silentGain.gain.value = 0;
  const chunks = [];
  let flushResolve = null;
  let disposed = false;
  let finished = false;

  node.port.onmessage = event => {
    const message = event.data || {};
    if (message.type === "chunk" && Array.isArray(message.channels)) {
      chunks.push(message.channels.map(channel =>
        channel instanceof Float32Array ? channel : new Float32Array(channel)
      ));
    } else if (message.type === "flush-complete") {
      flushResolve?.();
      flushResolve = null;
    }
  };

  node.connect(silentGain);
  silentGain.connect(audio.destination);

  return {
    node,
    recordingFormat: "24-bit PCM WAV",

    async finish() {
      if (disposed || finished) throw new Error("The PCM recording is no longer active.");
      await new Promise(resolve => {
        flushResolve = resolve;
        node.port.postMessage({ type: "flush" });
      });
      finished = true;

      const channelCount = Math.max(0, ...chunks.map(chunk => chunk.length));
      const totalFrames = chunks.reduce((sum, chunk) => sum + (chunk[0]?.length || 0), 0);
      if (!channelCount || !totalFrames) throw new Error("No uncompressed audio was captured.");

      const channels = Array.from(
        { length: channelCount },
        () => new Float32Array(totalFrames)
      );
      let frameOffset = 0;
      for (const chunk of chunks) {
        const frames = chunk[0]?.length || 0;
        for (let channel = 0; channel < channelCount; channel += 1) {
          const source = chunk[channel] || chunk[0];
          if (source) channels[channel].set(source, frameOffset);
        }
        frameOffset += frames;
      }

      const audioBuffer = {
        numberOfChannels: channelCount,
        length: totalFrames,
        sampleRate: audio.sampleRate,
        getChannelData(channel) { return channels[channel]; }
      };
      return encodeStudioWav(audioBuffer, { bitDepth: 24 });
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      flushResolve = null;
      node.port.onmessage = null;
      try { node.port.close(); } catch {}
      try { node.disconnect(); } catch {}
      try { silentGain.disconnect(); } catch {}
    }
  };
}

export default createStudioPCMRecorder;
