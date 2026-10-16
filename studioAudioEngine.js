
/*
 * LAMBO CITY RECORDS
 * SHARED STUDIO AUDIO ENGINE — V2
 *
 * One shared audio context.
 * One master output chain.
 * Separate instrument channels.
 *
 * Keeps the existing API used by floor2StudioApp.js.
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

    // Prevent multiple simultaneous initializations.
    if (this.initializing) {
      await this.initializing;
    }

    if (!this.context) {
      this.initializing = this.initialize(
        AudioContextClass
      );

      try {
        await this.initializing;
      } finally {
        this.initializing = null;
      }
    }

    // Resume the same shared context on each PLAY request.
    if (this.context.state !== "running") {
      await this.context.resume();
    }

    if (this.context.state !== "running") {
      throw new Error(
        `Studio audio did not start. State: ${this.context.state}`
      );
    }

    return this.context;
  },

  async initialize(AudioContextClass) {
    const context = new AudioContextClass();

    const master = context.createGain();
    master.gain.value = 1;

    const compressor = context.createDynamicsCompressor();

    // Gentle protection against excessive output peaks.
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

    // Shared signal path:
    // instruments -> master -> compressor -> speakers
    master.connect(compressor);
    compressor.connect(context.destination);

    this.context = context;
    this.master = master;
    this.compressor = compressor;
    this.channels = channels;

    // Resume immediately while the user's PLAY interaction
    // is still initiating the audio workflow.
    if (context.state !== "running") {
      await context.resume();
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

    const safeVolume = Math.max(
      0,
      Math.min(1, value)
    );

    channel.gain.setTargetAtTime(
      safeVolume,
      this.context.currentTime,
      0.015
    );
  },

  setMasterVolume(volume) {
    if (!this.master || !this.context) {
      return;
    }

    const value = Number(volume);

    if (!Number.isFinite(value)) {
      throw new Error(
        "Master volume must be a valid number."
      );
    }

    const safeVolume = Math.max(
      0,
      Math.min(1, value)
    );

    this.master.gain.setTargetAtTime(
      safeVolume,
      this.context.currentTime,
      0.015
    );
  }
};

export default StudioAudioEngine;
