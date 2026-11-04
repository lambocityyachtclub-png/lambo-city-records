/*
 * LAMBO CITY RECORDS
 * MONOPHONIC VOCAL PITCH CORRECTION — AUDIO WORKLET
 *
 * Original normalized-autocorrelation pitch detector and two-head granular shifter.
 * Designed for a single lead-vocal signal, not polyphonic instruments.
 */
const PITCH_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

function midiFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function nearestScaleNote(note, root, scaleName) {
  const intervals = PITCH_INTERVALS[scaleName] || PITCH_INTERVALS.major;
  const center = Math.round(note);
  let best = center;
  let distance = Infinity;
  for (let candidate = center - 12; candidate <= center + 12; candidate += 1) {
    const pitchClass = ((candidate - root) % 12 + 12) % 12;
    if (!intervals.includes(pitchClass)) continue;
    const delta = Math.abs(candidate - note);
    if (delta < distance) {
      best = candidate;
      distance = delta;
    }
  }
  return best;
}

class GranularPitchShifter {
  constructor() {
    this.size = 4096;
    this.mask = this.size - 1;
    this.buffer = new Float32Array(this.size);
    this.write = 0;
    this.phaseA = 0;
    this.phaseB = 0.5;
    this.grain = 1024;
    this.ratioSum = 0;
    this.calls = 0;
  }

  read(delay) {
    let position = (this.write - delay) % this.size;
    if (position < 0) position += this.size;
    const first = Math.floor(position);
    const fraction = position - first;
    const a = this.buffer[first & this.mask];
    const b = this.buffer[(first + 1) & this.mask];
    return a + (b - a) * fraction;
  }

  process(sample, ratio) {
    this.ratioSum += ratio;
    this.calls += 1;
    this.buffer[this.write & this.mask] = sample;
    this.write += 1;
    if (Math.abs(ratio - 1) < 0.0005) return sample;
    const increment = (1 - ratio) / this.grain;
    this.phaseA = (this.phaseA + increment + 1) % 1;
    this.phaseB = (this.phaseB + increment + 1) % 1;
    const windowA = 0.5 - 0.5 * Math.cos(2 * Math.PI * this.phaseA);
    const windowB = 0.5 - 0.5 * Math.cos(2 * Math.PI * this.phaseB);
    return this.read(this.phaseA * this.grain + 2) * windowA +
      this.read(this.phaseB * this.grain + 2) * windowB;
  }
}

class LamboCityPitchCorrectionProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.settings = {
      root: 0,
      scale: "major",
      amount: 100,
      speedMs: 25,
      enabled: false,
      ...(options.processorOptions || {})
    };
    this.windowSize = 1024;
    this.analysisHop = 512;
    this.ring = new Float32Array(this.windowSize);
    this.write = 0;
    this.sinceAnalysis = 0;
    this.shifters = [];
    this.detectedMidi = null;
    this.correctedMidi = null;
    this.targetRatio = 1;
    this.currentRatio = 1;
    this.hasPitch = false;
    this.missedHops = 0;
    this.pitchActiveSamples = 0;
    this.port.onmessage = event => {
      const next = event.data || {};
      if (Number.isFinite(Number(next.root))) this.settings.root = Math.max(0, Math.min(11, Math.round(Number(next.root))));
      if (PITCH_INTERVALS[next.scale]) this.settings.scale = next.scale;
      if (Number.isFinite(Number(next.amount))) this.settings.amount = Math.max(0, Math.min(100, Number(next.amount)));
      if (Number.isFinite(Number(next.speedMs))) this.settings.speedMs = Math.max(0, Math.min(120, Number(next.speedMs)));
      if (typeof next.enabled === "boolean") this.settings.enabled = next.enabled;
    };
  }

  detectPitch() {
    const frame = new Float32Array(this.windowSize);
    for (let index = 0; index < this.windowSize; index += 1) {
      frame[index] = this.ring[(this.write + index) % this.windowSize];
    }
    let mean = 0;
    for (let index = 0; index < this.windowSize; index += 1) mean += frame[index];
    mean /= this.windowSize;
    let energy = 0;
    for (let index = 0; index < this.windowSize; index += 1) {
      frame[index] -= mean;
      energy += frame[index] * frame[index];
    }
    if (energy / this.windowSize < 0.000002) {
      this.missedHops += 1;
      if (this.missedHops > 24) {
        this.hasPitch = false;
        this.targetRatio = 1;
      }
      return;
    }

    const minLag = Math.max(2, Math.floor(sampleRate / 1200));
    const maxLag = Math.min(551, Math.floor(sampleRate / 80));
    const correlations = new Float32Array(maxLag + 2);
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      let cross = 0;
      let energyA = 0;
      let energyB = 0;
      for (let index = 0; index < this.windowSize - lag; index += 2) {
        const a = frame[index];
        const b = frame[index + lag];
        cross += a * b;
        energyA += a * a;
        energyB += b * b;
      }
      const normalization = Math.sqrt(energyA * energyB);
      correlations[lag] = normalization > 1e-9 ? cross / normalization : 0;
    }

    let bestLag = -1;
    let confidence = 0;
    for (let lag = minLag + 1; lag < maxLag; lag += 1) {
      const value = correlations[lag];
      if (value >= 0.72 && value >= correlations[lag - 1] && value >= correlations[lag + 1]) {
        bestLag = lag;
        confidence = value;
        break;
      }
    }
    if (bestLag < 0) {
      this.missedHops += 1;
      if (this.missedHops > 24) {
        this.hasPitch = false;
        this.targetRatio = 1;
      }
      return;
    }

    const left = correlations[bestLag - 1];
    const center = correlations[bestLag];
    const right = correlations[bestLag + 1];
    const denominator = left - 2 * center + right;
    const correction = Math.abs(denominator) > 1e-9 ? 0.5 * (left - right) / denominator : 0;
    const period = bestLag + Math.max(-0.5, Math.min(0.5, correction));
    const frequency = sampleRate / period;
    if (!Number.isFinite(frequency) || frequency < 80 || frequency > 1200) {
      this.missedHops += 1;
      if (this.missedHops > 24) {
        this.hasPitch = false;
        this.targetRatio = 1;
      }
      return;
    }

    const midi = 69 + 12 * Math.log2(frequency / 440);
    const corrected = nearestScaleNote(Math.round(midi), this.settings.root, this.settings.scale);
    const strength = this.settings.enabled ? this.settings.amount / 100 : 0;
    const targetMidi = midi + (corrected - midi) * strength;
    this.missedHops = 0;
    this.detectedMidi = midi;
    this.correctedMidi = corrected;
    this.hasPitch = true;
    this.targetRatio = midiFrequency(targetMidi) / frequency;
    this.port.postMessage({
      detectedMidi: midi,
      correctedMidi: corrected,
      targetRatio: this.targetRatio,
      confidence
    });
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length || !output || !output.length) return true;

    const channels = output.length;
    while (this.shifters.length < channels) this.shifters.push(new GranularPitchShifter());
    const frames = output[0].length;
    const speedSeconds = Math.max(0, this.settings.speedMs) / 1000;
    const smoothing = speedSeconds <= 0 ? 1 : 1 - Math.exp(-1 / (speedSeconds * sampleRate));

    for (let frame = 0; frame < frames; frame += 1) {
      let mono = 0;
      for (let channel = 0; channel < input.length; channel += 1) mono += input[channel][frame] || 0;
      mono /= input.length;
      this.ring[this.write] = mono;
      this.write = (this.write + 1) % this.windowSize;
      this.sinceAnalysis += 1;
      if (this.sinceAnalysis >= this.analysisHop) {
        this.sinceAnalysis = 0;
        this.detectPitch();
      }

      if (this.settings.enabled && this.hasPitch) this.pitchActiveSamples += 1;
      const desired = this.settings.enabled && this.hasPitch ? this.targetRatio : 1;
      this.currentRatio += (desired - this.currentRatio) * smoothing;
      for (let channel = 0; channel < output.length; channel += 1) {
        const source = input[Math.min(channel, input.length - 1)] || input[0];
        const dry = source[frame] || 0;
        output[channel][frame] = this.shifters[channel].process(dry, this.currentRatio);
      }
    }
    return true;
  }
}

registerProcessor("lambo-city-pitch-correction", LamboCityPitchCorrectionProcessor);
