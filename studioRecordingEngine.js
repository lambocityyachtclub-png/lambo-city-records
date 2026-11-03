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
  takes: [],
  playback: null,

  async startTrackRecording({ audio, trackId } = {}) {
    if (this.activeTake || this.activeTrackTake) {
      throw new Error("Another studio recording is already in progress.");
    }
    if (!audio || audio.state !== "running") throw new Error("Start the studio audio before recording.");
    if (!trackId) throw new Error("Choose and arm an audio track before recording.");
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is unavailable. Open LAMBO CITY over HTTPS.");
    }
    const microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    let microphoneSource;
    let destination;
    try {
      microphoneSource = audio.createMediaStreamSource(microphoneStream);
      destination = audio.createMediaStreamDestination();
      microphoneSource.connect(destination);
      const recorder = createRecorder(destination.stream);
      recorder.recorder.start();
      this.activeTrackTake = {
        id: `track-take-${Date.now()}`,
        trackId,
        startedAt: new Date().toISOString(),
        startedAtMs: Date.now(),
        microphoneStream,
        microphoneSource,
        destination,
        recorder
      };
      return { id: this.activeTrackTake.id, trackId, startedAt: this.activeTrackTake.startedAt };
    } catch (error) {
      try { microphoneSource?.disconnect(); } catch {}
      try { destination?.disconnect(); } catch {}
      microphoneStream.getTracks().forEach(track => track.stop());
      throw error;
    }
  },

  async stopTrackRecording() {
    const take = this.activeTrackTake;
    if (!take) throw new Error("There is no armed-track recording in progress.");
    this.activeTrackTake = null;
    try {
      const blob = await take.recorder.finish();
      return {
        id: take.id,
        trackId: take.trackId,
        startedAt: take.startedAt,
        stoppedAt: new Date().toISOString(),
        durationMs: Math.max(0, Date.now() - take.startedAtMs),
        blob
      };
    } finally {
      try { take.microphoneSource.disconnect(); } catch {}
      try { take.destination.disconnect(); } catch {}
      take.microphoneStream.getTracks().forEach(track => track.stop());
    }
  },

 async startTake({ audio, beatOutput, vocalEffects } = {}) {

    if (this.activeTake || this.activeTrackTake) {
      throw new Error(
        "A recording is already in progress."
      );
    }

    if (!audio || audio.state !== "running") {
      throw new Error(
        "Start the studio audio before recording."
      );
    }

    if (!beatOutput) {
      throw new Error(
        "The Beat Lab recording output is unavailable."
      );
    }
if (
  vocalEffects &&
  (!vocalEffects.input || !vocalEffects.output)
) {
  throw new Error(
    "The vocal effects audio connection is incomplete."
  );
}
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Microphone access is unavailable. Open LAMBO CITY over HTTPS."
      );
    }

    // Request permission for the device microphone.
    const microphoneStream =
      await navigator.mediaDevices.getUserMedia({
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

    try {

      microphoneSource =
        audio.createMediaStreamSource(
          microphoneStream
        );

      // Separate recording destinations.
      beatDestination =
        audio.createMediaStreamDestination();

      vocalDestination =
        audio.createMediaStreamDestination();

      mixDestination =
        audio.createMediaStreamDestination();

      // Route vocals through LAMBO CITY effects when supplied.
if (vocalEffects) {
  microphoneSource.connect(vocalEffects.input);

  vocalEffects.output.connect(vocalDestination);
  vocalEffects.output.connect(mixDestination);
} else {
  // Preserve the original clean microphone path.
  microphoneSource.connect(vocalDestination);
  microphoneSource.connect(mixDestination);
}
      // Capture the Beat Lab output separately.
      beatOutput.connect(beatDestination);

      // Send the beat into the combined mix.
      beatOutput.connect(mixDestination);

      const beatRecorder =
        createRecorder(beatDestination.stream);

      const vocalRecorder =
        createRecorder(vocalDestination.stream);

      const mixRecorder =
        createRecorder(mixDestination.stream);

      const startedAt = new Date().toISOString();

      beatRecorder.recorder.start();
      vocalRecorder.recorder.start();
      mixRecorder.recorder.start();

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
        mixRecorder
      };

      return {
        id: this.activeTake.id,
        startedAt
      };

    } catch (error) {

     try {
  if (microphoneSource) {
    microphoneSource.disconnect();
  }
} catch {}

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

      microphoneStream
        .getTracks()
        .forEach((track) => track.stop());

      throw error;
    }
  },

  async stopTake() {

    const take = this.activeTake;

    if (!take) {
      throw new Error(
        "There is no active recording."
      );
    }

    this.activeTake = null;

    try {

      const [
        beatBlob,
        vocalBlob,
        mixBlob
      ] = await Promise.all([
        take.beatRecorder.finish(),
        take.vocalRecorder.finish(),
        take.mixRecorder.finish()
      ]);

      const completedTake = {
        id: take.id,
        startedAt: take.startedAt,
        stoppedAt: new Date().toISOString(),

        // Keep the audio context for playback.
        audio: take.audio,

        beat: beatBlob,
        vocal: vocalBlob,
        mix: mixBlob
      };

      this.takes.push(completedTake);

      return completedTake;

    } finally {

  try {
    take.microphoneSource.disconnect();
  } catch {}

  try {
    if (take.vocalEffects) {
      take.vocalEffects.output.disconnect(
        take.vocalDestination
      );

      take.vocalEffects.output.disconnect(
        take.mixDestination
      );
    }
  } catch {}

  try {
    take.beatOutput.disconnect(take.beatDestination);
    take.beatOutput.disconnect(take.mixDestination);
  } catch {}

  take.microphoneStream
    .getTracks()
    .forEach((track) => track.stop());
}
  },

  getTakes() {

    return this.takes.map((take, index) => ({
      id: take.id,
      number: index + 1,
      startedAt: take.startedAt,
      stoppedAt: take.stoppedAt,

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
