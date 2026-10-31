
/*
 * LAMBO CITY RECORDS
 * SHARED STUDIO VOCAL EFFECTS — V1
 *
 * Dedicated vocal processing module.
 * Designed for reuse by:
 * - Floor 2 Studio
 * - Standalone LAMBO CITY Studio
 *
 * Includes:
 * - Dry vocal signal
 * - Delay
 * - Delay feedback
 * - Reverb
 *
 * This module does not alter the existing Beat Lab
 * or shared StudioAudioEngine.
 */

const StudioVocalEffects = {

  create(audio) {
    if (!audio || audio.state === "closed") {
      throw new Error(
        "A valid studio audio context is required."
      );
    }

    const input = audio.createGain();
    const output = audio.createGain();

    const dry = audio.createGain();
    const delay = audio.createDelay(2);
    const delayFeedback = audio.createGain();
    const delayWet = audio.createGain();

    const reverb = audio.createConvolver();
    const reverbWet = audio.createGain();

    const master = audio.createGain();

    // Initial effect levels.
    dry.gain.value = 1;
    delay.delayTime.value = 0.28;
    delayFeedback.gain.value = 0.25;
    delayWet.gain.value = 0;
    reverbWet.gain.value = 0;
    master.gain.value = 1;

    // Generate an original built-in reverb impulse.
    reverb.buffer = this.createImpulse(audio, 2.2, 2.0);

    // Dry vocal path.
    input.connect(dry);
    dry.connect(master);

    // Delay path with controlled feedback.
    input.connect(delay);
    delay.connect(delayWet);
    delayWet.connect(master);

    delay.connect(delayFeedback);
    delayFeedback.connect(delay);

    // Reverb path.
    input.connect(reverb);
    reverb.connect(reverbWet);
    reverbWet.connect(master);

    master.connect(output);

    const effects = {
      audio,
      input,
      output,
      delay,
      delayFeedback,
      delayWet,
      reverb,
      reverbWet,
      dry,
      master,

      setDelayTime(value) {
        const seconds = Math.max(
          0.05,
          Math.min(1.5, Number(value))
        );

        if (!Number.isFinite(seconds)) return;

        delay.delayTime.setTargetAtTime(
          seconds,
          audio.currentTime,
          0.015
        );
      },

      setDelayFeedback(value) {
        const amount = Math.max(
          0,
          Math.min(0.75, Number(value))
        );

        if (!Number.isFinite(amount)) return;

        delayFeedback.gain.setTargetAtTime(
          amount,
          audio.currentTime,
          0.015
        );
      },

      setDelayMix(value) {
        const amount = Math.max(
          0,
          Math.min(1, Number(value))
        );

        if (!Number.isFinite(amount)) return;

        delayWet.gain.setTargetAtTime(
          amount,
          audio.currentTime,
          0.015
        );
      },

      setReverbMix(value) {
        const amount = Math.max(
          0,
          Math.min(1, Number(value))
        );

        if (!Number.isFinite(amount)) return;

        reverbWet.gain.setTargetAtTime(
          amount,
          audio.currentTime,
          0.015
        );
      },

      setReverbDecay(seconds) {
        const decay = Math.max(
          0.3,
          Math.min(6, Number(seconds))
        );

        if (!Number.isFinite(decay)) return;

        reverb.buffer =
          StudioVocalEffects.createImpulse(
            audio,
            decay,
            2
          );
      },

      destroy() {
        [
          input,
          output,
          dry,
          delay,
          delayFeedback,
          delayWet,
          reverb,
          reverbWet,
          master
        ].forEach((node) => {
          try {
            node.disconnect();
          } catch {}
        });
      }
    };

    return effects;
  },

  createImpulse(audio, duration, decay) {
    const length = Math.floor(
      audio.sampleRate * duration
    );

    const impulse = audio.createBuffer(
      2,
      length,
      audio.sampleRate
    );

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        const progress = i / length;

        data[i] =
          (Math.random() * 2 - 1) *
          Math.pow(1 - progress, decay);
      }
    }

    return impulse;
  }
};

export default StudioVocalEffects;
