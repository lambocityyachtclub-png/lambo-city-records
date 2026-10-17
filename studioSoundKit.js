
 // LAMBO CITY RECORDS
// ORIGINAL SYNTH SOUND KIT V1
// Beat Lab isolation: send sounds directly to this AudioContext's output.
// The shared audio engine and all 3D systems remain unchanged.

const StudioSoundKit = {
  play(audio, profile, sound, time, noiseBuffer) {
    if (!audio || audio.state !== "running") return;

    // Bypass per-track routing for this focused audio test.
    const destination = audio.destination;

    if (sound === "kick") {
      this.playKick(audio, destination, time, profile);
      return;
    }

    if (sound === "snare") {
      this.playSnare(audio, destination, time, profile, noiseBuffer);
      return;
    }

    if (sound === "hat") {
      this.playHat(audio, destination, time, profile, noiseBuffer);
    }
  },

  playKick(audio, destination, time, profile) {
    const vintage = profile === "mpc";
    const osc = audio.createOscillator();
    const body = audio.createGain();
    const output = audio.createGain();

    osc.type = vintage ? "sine" : "triangle";
    osc.frequency.setValueAtTime(vintage ? 125 : 175, time);
    osc.frequency.exponentialRampToValueAtTime(
      vintage ? 42 : 55,
      time + (vintage ? 0.19 : 0.12)
    );

    body.gain.setValueAtTime(vintage ? 1 : 0.8, time);
    body.gain.exponentialRampToValueAtTime(
      0.001,
      time + (vintage ? 0.38 : 0.20)
    );

    if (vintage) {
      const click = audio.createOscillator();
      const clickGain = audio.createGain();

      click.type = "triangle";
      click.frequency.setValueAtTime(900, time);
      click.frequency.exponentialRampToValueAtTime(140, time + 0.025);
      clickGain.gain.setValueAtTime(0.12, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.028);

      click.connect(clickGain);
      clickGain.connect(destination);
      click.start(time);
      click.stop(time + 0.03);
    }

    output.gain.setValueAtTime(vintage ? 0.82 : 0.72, time);
    osc.connect(body);
    body.connect(output);
    output.connect(destination);

    osc.start(time);
    osc.stop(time + (vintage ? 0.4 : 0.22));
  },

  playSnare(audio, destination, time, profile, noiseBuffer) {
    const vintage = profile === "mpc";

    if (noiseBuffer) {
      const noise = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const envelope = audio.createGain();

      noise.buffer = noiseBuffer;
      filter.type = vintage ? "bandpass" : "highpass";
      filter.frequency.setValueAtTime(vintage ? 1900 : 3200, time);

      if (vintage) filter.Q.value = 0.7;

      envelope.gain.setValueAtTime(vintage ? 0.55 : 0.34, time);
      envelope.gain.exponentialRampToValueAtTime(
        0.001,
        time + (vintage ? 0.19 : 0.11)
      );

      noise.connect(filter);
      filter.connect(envelope);
      envelope.connect(destination);

      noise.start(time);
      noise.stop(time + (vintage ? 0.20 : 0.12));
    }

    const tone = audio.createOscillator();
    const toneGain = audio.createGain();

    tone.type = vintage ? "triangle" : "sine";
    tone.frequency.setValueAtTime(vintage ? 185 : 240, time);
    toneGain.gain.setValueAtTime(vintage ? 0.20 : 0.10, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    tone.connect(toneGain);
    toneGain.connect(destination);
    tone.start(time);
    tone.stop(time + 0.10);
  },

  playHat(audio, destination, time, profile, noiseBuffer) {
    if (!noiseBuffer) return;

    const vintage = profile === "mpc";
    const noise = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const envelope = audio.createGain();

    noise.buffer = noiseBuffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(vintage ? 6500 : 8500, time);

    envelope.gain.setValueAtTime(vintage ? 0.22 : 0.13, time);
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      time + (vintage ? 0.075 : 0.04)
    );

    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);

    noise.start(time);
    noise.stop(time + (vintage ? 0.08 : 0.045));
  }
};

export default StudioSoundKit;
