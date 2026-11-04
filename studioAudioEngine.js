
/*
 * LAMBO CITY RECORDS
 * SHARED STUDIO AUDIO ENGINE — V3
 *
 * One shared AudioContext.
 * One master output chain.
 * Separate instrument channels.
 * Preserves the API used by existing Floor Two modules.
 */

const StudioAudioEngine = {
  context: null,
  master: null,
  compressor: null,
  stereoWidth: null,
  stereoWidthNode: null,
  masterVolumeValue: 1,
  stereoWidthValue: 1,
  masterCompressionRatio: 3,
  channels: null,
  initializing: null,

  async resume() {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error(
        "Web Audio is not supported by this browser."
      );
    }

    if (this.initializing) {
      await this.initializing;
    }

    if (!this.context) {
      this.initializing =
        this.initialize(AudioContextClass);

      try {
        await this.initializing;
      } finally {
        this.initializing = null;
      }
    }

    const context = this.context;

    // Request playback whenever a studio control is used.
    if (context.state !== "running") {
      await context.resume();
    }

    if (context.state !== "running") {
      throw new Error(
        `Audio context is not running: ${context.state}`
      );
    }

    // Nudge the browser's output path from the user's
    // interaction. This is inaudible and creates no
    // additional persistent audio engine.
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    gain.gain.value = 0.000001;
    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    oscillator.start(now);
    oscillator.stop(now + 0.05);

    return context;
  },

  async initialize(AudioContextClass) {
    let context;

    try {
      context = new AudioContextClass({
        latencyHint: "interactive"
      });
    } catch {
      context = new AudioContextClass();
    }

    const master = context.createGain();
    master.gain.value = this.masterVolumeValue;

    const compressor =
      context.createDynamicsCompressor();

    compressor.threshold.value = -8;
    compressor.knee.value = 12;
    compressor.ratio.value = this.masterCompressionRatio;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;

    const channels = {
      kick: context.createGain(),
      snare: context.createGain(),
      hat: context.createGain()
    };

    Object.values(channels).forEach((channel) => {
      channel.gain.value = 1;
      channel.connect(master);
    });

    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);
    const mid = context.createGain();
    const side = context.createGain();
    const sideWidth = context.createGain();
    const leftOut = context.createGain();
    const rightOut = context.createGain();
    const sideLeft = context.createGain();
    const sideRight = context.createGain();
    mid.gain.value = 0.5;
    side.gain.value = 0.5;
    sideWidth.gain.value = this.stereoWidthValue;
    leftOut.gain.value = 1;
    rightOut.gain.value = 1;
    sideLeft.gain.value = 1;
    sideRight.gain.value = -1;
    master.connect(splitter);
    splitter.connect(mid, 0); splitter.connect(mid, 1);
    splitter.connect(side, 0); splitter.connect(side, 1);
    mid.connect(leftOut); mid.connect(rightOut);
    leftOut.connect(merger, 0, 0); rightOut.connect(merger, 0, 1);
    side.connect(sideWidth); sideWidth.connect(sideLeft); sideWidth.connect(sideRight);
    sideLeft.connect(merger, 0, 0); sideRight.connect(merger, 0, 1);
    merger.connect(compressor);
    compressor.connect(context.destination);

    // Keep the existing shared engine and its API.
    this.context = context;
    this.master = master;
    this.compressor = compressor;
    this.stereoWidth = sideWidth;
    this.stereoWidthNode = { splitter, merger, mid, side, sideLeft, sideRight, leftOut, rightOut };
    this.channels = channels;

    if (context.state !== "running") {
      await context.resume();
    }

    if (context.state !== "running") {
      throw new Error(
        `Could not start studio audio: ${context.state}`
      );
    }
  },

  getContext() {
    return this.context;
  },

  getTrackGain(trackName) {
    const channel = this.channels?.[trackName];

    if (!channel) {
      throw new Error(
        `Unknown studio audio channel: ${trackName}`
      );
    }

    return channel;
  },

  setTrackVolume(trackName, volume) {
    const channel = this.getTrackGain(trackName);
    const value = Number(volume);

    if (!Number.isFinite(value)) {
      throw new Error(
        "Track volume must be a valid number."
      );
    }

    channel.gain.setTargetAtTime(
      Math.max(0, Math.min(1, value)),
      this.context.currentTime,
      0.015
    );
  },

  setStereoWidth(percent) {
    const value = Math.max(0, Math.min(200, Number(percent) || 0)) / 100;
    this.stereoWidthValue = value;
    if (this.stereoWidth && this.context) this.stereoWidth.gain.setTargetAtTime(value, this.context.currentTime, 0.025);
  },

  setMasterCompressionRatio(ratio) {
    const value = Math.max(1, Math.min(8, Number(ratio) || 1));
    this.masterCompressionRatio = value;
    if (this.compressor && this.context) this.compressor.ratio.setTargetAtTime(value, this.context.currentTime, 0.025);
  },

  setMasterVolume(volume) {
    const value = Number(volume);

    if (!Number.isFinite(value)) {
      throw new Error(
        "Master volume must be a valid number."
      );
    }

    this.masterVolumeValue = Math.max(0, Math.min(1, value));
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.masterVolumeValue, this.context.currentTime, 0.015);
  }
};

export default StudioAudioEngine;
