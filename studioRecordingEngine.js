/*
 * LAMBO CITY RECORDS
 * SHARED STUDIO RECORDING ENGINE — V1
 *
 * Records three separate audio outputs:
 * 1. Beat Lab
 * 2. Microphone / vocals
 * 3. Combined beat + vocals
 *
 * Designed for reuse by the standalone Studio
 * and the Floor 2 in-game studio.
 */

import { createStudioPCMRecorder } from "./studioPCMRecorder.js";

function getSupportedMimeType() {
  if (!window.MediaRecorder) {
    throw new Error(
      "Audio recording is not supported by this browser."
    );
  }

  const formats = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];

  return formats.find((format) =>
    MediaRecorder.isTypeSupported(format)
  ) || "";
}

function createRecorder(stream) {
  const mimeType = getSupportedMimeType();

  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);

  const chunks = [];

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  return {
    recorder,

    finish() {
      return new Promise((resolve, reject) => {
        if (recorder.state === "inactive") {
          const blob = new Blob(chunks, {
            type: recorder.mimeType || mimeType
          });

          resolve(blob);
          return;
        }

        recorder.addEventListener("stop", () => {
          const blob = new Blob(chunks, {
            type: recorder.mimeType || mimeType
          });

          if (blob.size > 0) {
            resolve(blob);
          } else {
            reject(
              new Error("No audio was captured.")
            );
          }
        }, { once: true });

        recorder.addEventListener("error", (event) => {
          reject(
            event.error ||
            new Error("Audio recording failed.")
          );
        }, { once: true });

        recorder.stop();
      });
    }
  };
}

const StudioRecordingEngine = {

  activeTake: null,
  activeTrackTake: null,
  activeTrackTakes: [],
  inputAnalyser: null,
  inputMeterBuffer: new Float32Array(512),
  takes: [],
  playback: null,

  async startTrackRecording({ audio, trackId, vocalEffects, inputNode, pitchCorrectionNode, monitorInput = false, inputDeviceId = "", inputChannel = null, allowConcurrent = false } = {}) {
    if (this.activeTake || (this.activeTrackTake && !allowConcurrent)) {
      throw new Error("Another studio recording is already in progress.");
    }
    if (!audio || audio.state !== "running") throw new Error("Start the studio audio before recording.");
    if (!trackId) throw new Error("Choose and arm an audio track before recording.");
    if (!inputNode && !navigator.mediaDevices?.getUserMedia) {
      try { pitchCorrectionNode?.disconnect(); } catch {}
      throw new Error("Microphone access is unavailable. Open LAMBO CITY over HTTPS.");
    }
    let microphoneStream;
    let microphoneSource;
    let recordingSource;
    let channelSplitter;
    let channelGain;
    let destination;
    let pcmRecorder;
    let monitorGain;
    let inputAnalyser;
    try {
      microphoneStream = inputNode ? null : await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...(inputDeviceId ? { deviceId: { exact: inputDeviceId } } : {}),
          ...(Number.isInteger(inputChannel) && inputChannel >= 0 ? { channelCount: { ideal: inputChannel + 1 } } : {})
        }
      });
      microphoneSource = inputNode || audio.createMediaStreamSource(microphoneStream);
      recordingSource = microphoneSource;
      if (!inputNode && Number.isInteger(inputChannel) && inputChannel >= 0) {
        const reportedChannels = Number(microphoneStream?.getAudioTracks?.()[0]?.getSettings?.().channelCount);
        const availableChannels = Math.max(1, reportedChannels || Number(microphoneSource.channelCount) || 1);
        if (inputChannel >= availableChannels) throw new Error("The selected microphone input channel is not available on this device.");
        channelSplitter = audio.createChannelSplitter(Math.max(2, inputChannel + 1));
        channelGain = audio.createGain();
        microphoneSource.connect(channelSplitter);
        channelSplitter.connect(channelGain, inputChannel);
        recordingSource = channelGain;
      }
      inputAnalyser = audio.createAnalyser();
      inputAnalyser.fftSize = 512;
      recordingSource.connect(inputAnalyser);
      this.inputAnalyser = inputAnalyser;
      try {
        pcmRecorder = await createStudioPCMRecorder(audio);
      } catch (error) {
        console.warn("LAMBO CITY PCM capture unavailable; using browser MediaRecorder fallback:", error);
      }
      destination = pcmRecorder?.node || audio.createMediaStreamDestination();
      if (!inputNode && monitorInput) {
        monitorGain = audio.createGain();
        monitorGain.gain.value = 0.65;
        monitorGain.connect(audio.destination);
      }
      if (!inputNode && pitchCorrectionNode) {
        recordingSource.connect(pitchCorrectionNode);
        if (vocalEffects) {
          if (!vocalEffects.input || !vocalEffects.output) {
            throw new Error("The vocal effects audio connection is incomplete.");
          }
          pitchCorrectionNode.connect(vocalEffects.input);
          vocalEffects.output.connect(destination);
          if (monitorGain) vocalEffects.output.connect(monitorGain);
        } else {
          pitchCorrectionNode.connect(destination);
          if (monitorGain) pitchCorrectionNode.connect(monitorGain);
        }
      } else if (vocalEffects && !inputNode) {
        if (!vocalEffects.input || !vocalEffects.output) {
          throw new Error("The vocal effects audio connection is incomplete.");
        }
        recordingSource.connect(vocalEffects.input);
        vocalEffects.output.connect(destination);
        if (monitorGain) vocalEffects.output.connect(monitorGain);
      } else {
        recordingSource.connect(destination);
        if (monitorGain) recordingSource.connect(monitorGain);
      }
      const recorder = pcmRecorder || createRecorder(destination.stream);
      if (recorder.recorder) recorder.recorder.start();
      const take = {
        id: `track-take-${Date.now()}-${trackId}`,
        trackId,
        startedAt: new Date().toISOString(),
        startedAtMs: Date.now(),
        microphoneStream,
        microphoneSource,
        recordingSource,
        channelSplitter,
        channelGain,
        inputChannel,
        inputNode: Boolean(inputNode),
        destination,
        pcmRecorder,
        recordingFormat: pcmRecorder?.recordingFormat || "Browser MediaRecorder",
        monitorGain,
        inputAnalyser,
        vocalEffects,
        pitchCorrectionNode,
        recorder
      };
      this.activeTrackTakes.push(take);
      if (!this.activeTrackTake) this.activeTrackTake = take;
      return { id: take.id, trackId, startedAt: take.startedAt, recordingFormat: take.recordingFormat };
    } catch (error) {
      try {
        if (pitchCorrectionNode && !inputNode) recordingSource?.disconnect(pitchCorrectionNode);
        else if (vocalEffects && !inputNode) recordingSource?.disconnect(vocalEffects.input);
        else recordingSource?.disconnect(destination);
      } catch {}
      try { pitchCorrectionNode?.disconnect(); } catch {}
      try { recordingSource?.disconnect(inputAnalyser); } catch {}
      try { microphoneSource?.disconnect(channelSplitter); } catch {}
      try { channelSplitter?.disconnect(); } catch {}
      try { channelGain?.disconnect(); } catch {}
      try { inputAnalyser?.disconnect(); } catch {}
      try { if (this.inputAnalyser === inputAnalyser) this.inputAnalyser = null; } catch {}
      try { if (vocalEffects) vocalEffects.output.disconnect(destination); } catch {}
      try { destination?.disconnect(); } catch {}
      try { pcmRecorder?.dispose(); } catch {}
      try { monitorGain?.disconnect(); } catch {}
      microphoneStream?.getTracks().forEach(track => track.stop());
      throw error;
    }
  },

  getInputWaveform() {
    const analyser = this.inputAnalyser;
    if (!analyser) return null;
    analyser.getFloatTimeDomainData(this.inputMeterBuffer);
    return this.inputMeterBuffer;
  },

  getInputLevel() {
    const samples = this.getInputWaveform();
    if (!samples) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
    return Math.min(1, Math.sqrt(sum / samples.length) * 3.2);
  },

  async stopTrackRecording(trackId = null) {
    const take = trackId
      ? (this.activeTrackTakes.find(item => item.trackId === trackId) || (this.activeTrackTake?.trackId === trackId ? this.activeTrackTake : null))
      : this.activeTrackTake;
    if (!take) throw new Error("There is no armed-track recording in progress.");
    this.activeTrackTakes = this.activeTrackTakes.filter(item => item !== take);
    this.activeTrackTake = this.activeTrackTakes[0] || null;
    try {
      // Disconnect the capture feed before flushing so no new worklet frames
      // can arrive after the final PCM chunk has been acknowledged.
      try {
        if (take.pitchCorrectionNode && !take.inputNode) take.recordingSource.disconnect(take.pitchCorrectionNode);
        else if (take.vocalEffects && !take.inputNode) take.recordingSource.disconnect(take.vocalEffects.input);
        else take.recordingSource.disconnect(take.destination);
      } catch {}
      try { if (take.vocalEffects) take.vocalEffects.output.disconnect(take.destination); } catch {}

      const blob = await take.recorder.finish();
      return {
        id: take.id,
        trackId: take.trackId,
        startedAt: take.startedAt,
        stoppedAt: new Date().toISOString(),
        durationMs: Math.max(0, Date.now() - take.startedAtMs),
        recordingFormat: take.recordingFormat,
        blob
      };
    } finally {
      try {
        if (take.pitchCorrectionNode && !take.inputNode) take.recordingSource.disconnect(take.pitchCorrectionNode);
        else if (take.vocalEffects && !take.inputNode) take.recordingSource.disconnect(take.vocalEffects.input);
        else take.recordingSource.disconnect(take.destination);
      } catch {}
      try { take.pitchCorrectionNode?.disconnect(); } catch {}
      try { if (take.vocalEffects) take.vocalEffects.output.disconnect(take.destination); } catch {}
      try { take.destination.disconnect(); } catch {}
      try { take.pcmRecorder?.dispose(); } catch {}
      try { take.recordingSource.disconnect(take.inputAnalyser); } catch {}
      try { take.microphoneSource.disconnect(take.channelSplitter); } catch {}
      try { take.channelSplitter?.disconnect(); } catch {}
      try { take.channelGain?.disconnect(); } catch {}
      try { take.inputAnalyser?.disconnect(); } catch {}
      if (this.inputAnalyser === take.inputAnalyser) this.inputAnalyser = null;
      try { take.monitorGain?.disconnect(); } catch {}
      take.microphoneStream?.getTracks().forEach(track => track.stop());
    }
  },

 async startTake({ audio, beatOutput, vocalEffects } = {}) {
    if (this.activeTake || this.activeTrackTake) {
      throw new Error("A recording is already in progress.");
    }
    if (!audio || audio.state !== "running") {
      throw new Error("Start the studio audio before recording.");
    }
    if (!beatOutput) {
      throw new Error("The Beat Lab recording output is unavailable.");
    }
    if (vocalEffects && (!vocalEffects.input || !vocalEffects.output)) {
      throw new Error("The vocal effects audio connection is incomplete.");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is unavailable. Open LAMBO CITY over HTTPS.");
    }

    const microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    let microphoneSource;
    let beatDestination;
    let vocalDestination;
    let mixDestination;
    let pcmRecorders = [];

    try {
      microphoneSource = audio.createMediaStreamSource(microphoneStream);

      // Prefer three independent uncompressed PCM captures. If the browser
      // cannot initialize every worklet, keep the original three MediaRecorder
      // streams together as the compatibility path.
      try {
        for (let index = 0; index < 3; index += 1) {
          const recorder = await createStudioPCMRecorder(audio);
          if (!recorder) throw new Error("AudioWorklet PCM capture is unavailable.");
          pcmRecorders.push(recorder);
        }
      } catch (error) {
        pcmRecorders.forEach(recorder => recorder.dispose());
        pcmRecorders = [];
        console.warn("LAMBO CITY combined PCM capture unavailable; using MediaRecorder fallback:", error);
      }

      const [beatPCM, vocalPCM, mixPCM] = pcmRecorders;
      beatDestination = beatPCM?.node || audio.createMediaStreamDestination();
      vocalDestination = vocalPCM?.node || audio.createMediaStreamDestination();
      mixDestination = mixPCM?.node || audio.createMediaStreamDestination();

      if (vocalEffects) {
        microphoneSource.connect(vocalEffects.input);
        vocalEffects.output.connect(vocalDestination);
        vocalEffects.output.connect(mixDestination);
      } else {
        microphoneSource.connect(vocalDestination);
        microphoneSource.connect(mixDestination);
      }

      beatOutput.connect(beatDestination);
      beatOutput.connect(mixDestination);

      const beatRecorder = beatPCM || createRecorder(beatDestination.stream);
      const vocalRecorder = vocalPCM || createRecorder(vocalDestination.stream);
      const mixRecorder = mixPCM || createRecorder(mixDestination.stream);
      [beatRecorder, vocalRecorder, mixRecorder].forEach(recorder => {
        if (recorder.recorder) recorder.recorder.start();
      });

      const startedAt = new Date().toISOString();
      this.activeTake = {
        id: `take-${Date.now()}`,
        startedAt,
        audio,
        microphoneStream,
        microphoneSource,
        beatOutput,
        vocalEffects,
        beatDestination,
        vocalDestination,
        mixDestination,
        beatRecorder,
        vocalRecorder,
        mixRecorder,
        pcmRecorders,
        recordingFormat: pcmRecorders.length === 3 ? "24-bit PCM WAV" : "Browser MediaRecorder"
      };

      return {
        id: this.activeTake.id,
        startedAt,
        recordingFormat: this.activeTake.recordingFormat
      };
    } catch (error) {
      try { microphoneSource?.disconnect(); } catch {}
      try {
        if (vocalEffects) {
          vocalEffects.output.disconnect(vocalDestination);
          vocalEffects.output.disconnect(mixDestination);
        }
      } catch {}
      try {
        if (beatOutput && beatDestination) {
          beatOutput.disconnect(beatDestination);
          beatOutput.disconnect(mixDestination);
        }
      } catch {}
      try { beatDestination?.disconnect(); } catch {}
      try { vocalDestination?.disconnect(); } catch {}
      try { mixDestination?.disconnect(); } catch {}
      pcmRecorders.forEach(recorder => { try { recorder.dispose(); } catch {} });
      microphoneStream.getTracks().forEach(track => track.stop());
      throw error;
    }
  },

  async stopTake() {
    const take = this.activeTake;
    if (!take) throw new Error("There is no active recording.");
    this.activeTake = null;

    try {
      // Stop all feeds before asking the worklets to flush their final buffers.
      try { take.microphoneSource.disconnect(); } catch {}
      try {
        if (take.vocalEffects) {
          take.vocalEffects.output.disconnect(take.vocalDestination);
          take.vocalEffects.output.disconnect(take.mixDestination);
        }
      } catch {}
      try {
        take.beatOutput.disconnect(take.beatDestination);
        take.beatOutput.disconnect(take.mixDestination);
      } catch {}

      const [beatBlob, vocalBlob, mixBlob] = await Promise.all([
        take.beatRecorder.finish(),
        take.vocalRecorder.finish(),
        take.mixRecorder.finish()
      ]);

      const completedTake = {
        id: take.id,
        startedAt: take.startedAt,
        stoppedAt: new Date().toISOString(),
        audio: take.audio,
        recordingFormat: take.recordingFormat,
        beat: beatBlob,
        vocal: vocalBlob,
        mix: mixBlob
      };
      this.takes.push(completedTake);
      return completedTake;
    } finally {
      try { take.microphoneSource.disconnect(); } catch {}
      try {
        if (take.vocalEffects) {
          take.vocalEffects.output.disconnect(take.vocalDestination);
          take.vocalEffects.output.disconnect(take.mixDestination);
        }
      } catch {}
      try {
        take.beatOutput.disconnect(take.beatDestination);
        take.beatOutput.disconnect(take.mixDestination);
      } catch {}
      try { take.beatDestination.disconnect(); } catch {}
      try { take.vocalDestination.disconnect(); } catch {}
      try { take.mixDestination.disconnect(); } catch {}
      take.pcmRecorders.forEach(recorder => { try { recorder.dispose(); } catch {} });
      take.microphoneStream.getTracks().forEach(track => track.stop());
    }
  },

  getTakes() {

    return this.takes.map((take, index) => ({
      id: take.id,
      number: index + 1,
      startedAt: take.startedAt,
      stoppedAt: take.stoppedAt,
      recordingFormat: take.recordingFormat || "Browser MediaRecorder",

      beatBytes: take.beat.size,
      vocalBytes: take.vocal.size,
      mixBytes: take.mix.size
    }));
  },

  async playTake(takeId, trackName = "mix") {

    const take = this.takes.find(
      (item) => item.id === takeId
    );

    if (!take) {
      throw new Error("Recording take not found.");
    }

    if (
      !["beat", "vocal", "mix"].includes(trackName)
    ) {
      throw new Error("Invalid recording track.");
    }

    const blob = take[trackName];

    if (!blob || !blob.size) {
      throw new Error("This recording track is empty.");
    }

    this.stopPlayback();

    const audio = take.audio;

    if (!audio || audio.state === "closed") {
      throw new Error(
        "The studio audio context is unavailable."
      );
    }

    if (audio.state !== "running") {
      await audio.resume();
    }

    const arrayBuffer = await blob.arrayBuffer();

    const audioBuffer =
      await audio.decodeAudioData(
        arrayBuffer.slice(0)
      );

    const source = audio.createBufferSource();

    source.buffer = audioBuffer;
    source.connect(audio.destination);

    source.addEventListener("ended", () => {
      if (this.playback === source) {
        this.playback = null;
      }
    }, { once: true });

    this.playback = source;
    source.start();

    return true;
  },

  stopPlayback() {

    if (!this.playback) return;

    try {
      this.playback.stop();
    } catch {}

    this.playback.disconnect();
    this.playback = null;
  },

  download(blob, filename = "lambo-city-recording") {

    if (!(blob instanceof Blob) || !blob.size) {
      throw new Error("No recorded audio is available.");
    }

    const extension =
      blob.type.includes("mp4") ? "m4a" :
      blob.type.includes("ogg") ? "ogg" :
      blob.type.includes("webm") ? "webm" :
      "audio";

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${filename}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  },

  clearTakes() {

    if (this.activeTake) {
      throw new Error(
        "Stop recording before clearing takes."
      );
    }

    this.stopPlayback();
    this.takes = [];
  }
};

export default StudioRecordingEngine;
