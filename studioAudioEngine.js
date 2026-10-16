// LAMBO CITY RECORDS
// SHARED STUDIO AUDIO ENGINE — V1
//
// Purpose:
// - One shared Web Audio context
// - One master output
// - Separate instrument channels
// - Foundation for the future studio mixer
//
// This module does not modify the existing game engine.

const StudioAudioEngine = {
  context: null,
  master: null,
  channels: null,

  async resume() {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error(
        "Web Audio is not supported by this browser."
      );
    }

    // Create the shared audio system only once.
    if (!this.context) {
      this.context = new AudioContextClass();

      this.master = this.context.createGain();

      this.master.gain.value = 1;

      this.channels = {
        kick: this.context.createGain(),
        snare: this.context.createGain(),
        hat: this.context.createGain()
      };

      // Every instrument routes through its own channel,
      // then into the shared master output.

      Object.values(this.channels).forEach(
        (channel) => {
          channel.gain.value = 1;
          channel.connect(this.master);
        }
      );

      this.master.connect(
        this.context.destination
      );
    }

    // Browsers may suspend audio until the user interacts.
    if (this.context.state !== "running") {
      await this.context.resume();
    }

    return this.context;
  },

  getContext() {
    return this.context;
  },

  getTrackGain(trackName) {
    const channel =
      this.channels?.[trackName];

    if (!channel) {
      throw new Error(
        `Unknown studio audio channel: ${trackName}`
      );
    }

    return channel;
  },

  setTrackVolume(trackName, volume) {
    const channel =
      this.getTrackGain(trackName);

    const safeVolume = Math.max(
      0,
      Math.min(1, Number(volume))
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

    const safeVolume = Math.max(
      0,
      Math.min(1, Number(volume))
    );

    this.master.gain.setTargetAtTime(
      safeVolume,
      this.context.currentTime,
      0.015
    );
  }
};

export default StudioAudioEngine;
