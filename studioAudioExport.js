
/*
 * LAMBO CITY RECORDS
 * STUDIO AUDIO EXPORT V1
 *
 * Records the Beat Lab output to a downloadable audio file.
 * Does not replace the shared audio engine.
 */

const StudioAudioExport = {
  context: null,
  output: null,
  streamDestination: null,
  recorder: null,
  chunks: [],
  recording: false,
  mimeType: "",

  getOutput(audio) {
    if (!audio) {
      throw new Error("Studio audio is not ready.");
    }

    if (this.context !== audio || !this.output) {
      this.context = audio;
      this.output = audio.createGain();

      // Keep sounds audible while allowing recording.
      this.output.connect(audio.destination);
    }

    return this.output;
  },

  start(audio) {
    if (this.recording) {
      throw new Error("Recording is already in progress.");
    }

    if (!audio || audio.state !== "running") {
      throw new Error("Start studio audio before recording.");
    }

    if (!window.MediaRecorder) {
      throw new Error(
        "Audio recording is not supported in this browser."
      );
    }

    const output = this.getOutput(audio);

    this.streamDestination =
      audio.createMediaStreamDestination();

    output.connect(this.streamDestination);

    const formats = [
      "audio/mp4",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus"
    ];

    this.mimeType = formats.find((type) =>
      MediaRecorder.isTypeSupported(type)
    ) || "";

    try {
      this.recorder = this.mimeType
        ? new MediaRecorder(
            this.streamDestination.stream,
            { mimeType: this.mimeType }
          )
        : new MediaRecorder(
            this.streamDestination.stream
          );
    } catch (error) {
      output.disconnect(this.streamDestination);
      this.streamDestination = null;
      throw new Error(
        "Could not start audio recording: " +
        (error?.message || error)
      );
    }

    this.chunks = [];

    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    });

    this.recording = true;

    this.recorder.start();
    return true;
  },

  stop() {
    if (!this.recording || !this.recorder) {
      throw new Error("There is no recording to stop.");
    }

    return new Promise((resolve, reject) => {
      const recorder = this.recorder;

      recorder.addEventListener("stop", () => {
        this.recording = false;

        if (this.output && this.streamDestination) {
          try {
            this.output.disconnect(this.streamDestination);
          } catch {
            // The connection may already be disconnected.
          }
        }

        const type =
          recorder.mimeType ||
          this.mimeType ||
          "application/octet-stream";

        const blob = new Blob(this.chunks, { type });

        this.chunks = [];
        this.recorder = null;
        this.streamDestination = null;

        if (!blob.size) {
          reject(new Error("The recording was empty."));
          return;
        }

        resolve(blob);
      }, { once: true });

      recorder.addEventListener("error", (event) => {
        this.recording = false;
        reject(
          event.error ||
          new Error("Audio recording failed.")
        );
      }, { once: true });

      recorder.stop();
    });
  },

  download(blob) {
    if (!(blob instanceof Blob) || !blob.size) {
      throw new Error("There is no audio file to download.");
    }

    const extension = blob.type.includes("mp4")
      ? "m4a"
      : blob.type.includes("ogg")
        ? "ogg"
        : blob.type.includes("webm")
          ? "webm"
          : "audio";

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `lambo-city-beat-${new Date().toISOString()
        .replace(/[:.]/g, "-")}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Keep the URL alive briefly so mobile browsers can
    // begin the download before it is released.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
};

export default StudioAudioExport;
