
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
    master.gain.value = 1;

    const compressor =
      context.createDynamicsCompressor();

    compressor.threshold.value = -8;
    compressor.knee.value = 12;
    compressor.ratio.value = 3;
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

    master.connect(compressor);
    compressor.connect(context.destination);

    // Keep the existing shared engine and its API.
    this.context = context;
    this.master = master;
    this.compressor = compressor;
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

  setMasterVolume(volume) {
    if (!this.master || !this.context) return;

    const value = Number(volume);

    if (!Number.isFinite(value)) {
      throw new Error(
        "Master volume must be a valid number."
      );
    }

    this.master.gain.setTargetAtTime(
      Math.max(0, Math.min(1, value)),
      this.context.currentTime,
      0.015
    );
  }
};

export default StudioAudioEngine;
