/*
 * LAMBO CITY RECORDS
 * SHARED TALKBACK MONITOR — V1
 *
 * A separate live microphone path for producer / vocalist communication.
 * It is deliberately isolated from StudioRecordingEngine: Talkback is never
 * printed into a vocal take, beat stem, master mix, or saved project.
 *
 * V1 is local-monitor ready for the single-player Studio. A remote session
 * destination can be attached when the collaboration transport is activated.
 */
import StudioAudioEngine from "./studioAudioEngine.js";
import StudioVocalEffects from "./studioVocalEffects.js";
import { createStudioPitchCorrectionNode } from "./studioPitchCorrection.js";

const StudioTalkback = {
  active: false,
  stream: null,
  source: null,
  highPass: null,
  compressor: null,
  pitchNode: null,
  effects: null,
  outputGain: null,
  beatLab: null,
  volume: 0.72,
  sidetone: 0.58,
  duckAmount: 0.35,
  holdDelayMs: 220,
  controls: new Set(),

  emitState() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("lc-talkback-state", {
      detail: {
        active: this.active,
        volume: this.volume,
        sidetone: this.sidetone,
        duckAmount: this.duckAmount,
        destination: "local-monitor"
      }
    }));
  },

  applyOutputLevel() {
    if (!this.outputGain || !this.outputGain.context) return;
    const value = Math.max(0, Math.min(1, this.volume)) *
      Math.max(0, Math.min(1, this.sidetone));
    this.outputGain.gain.setTargetAtTime(value, this.outputGain.context.currentTime, 0.018);
  },

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value)));
    this.applyOutputLevel();
    this.emitState();
    return this.volume;
  },

  setSidetone(value) {
    this.sidetone = Math.max(0, Math.min(1, Number(value)));
    this.applyOutputLevel();
    this.emitState();
    return this.sidetone;
  },

  setDuckAmount(value) {
    this.duckAmount = Math.max(0, Math.min(0.8, Number(value)));
    if (this.active) StudioAudioEngine.setTalkbackDuck(1 - this.duckAmount);
    this.emitState();
    return this.duckAmount;
  },

  async start({ beatLab = this.beatLab || window.__lamboCityFloor2BeatLab } = {}) {
    if (this.active) return true;
    const audio = await StudioAudioEngine.resume();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Talkback microphone access requires HTTPS and browser microphone permission.");
    }

    this.beatLab = beatLab || null;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    try {
      this.stream = stream;
      this.source = audio.createMediaStreamSource(stream);
      this.highPass = audio.createBiquadFilter();
      this.highPass.type = "highpass";
      this.highPass.frequency.value = 90;
      this.compressor = audio.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.16;
      this.outputGain = audio.createGain();
      this.outputGain.gain.value = 0;

      this.effects = StudioVocalEffects.create(audio);
      const settings = this.beatLab?.vocalEffectSettings || {};
      this.effects.setDelayMix(settings.delay ?? 0);
      this.effects.setReverbMix(settings.reverb ?? 0);

      this.source.connect(this.highPass);
      this.highPass.connect(this.compressor);
      let vocalPath = this.compressor;

      const pitchSettings = this.beatLab?.pitchCorrectionSettings;
      if (pitchSettings?.enabled) {
        this.pitchNode = await createStudioPitchCorrectionNode(audio, pitchSettings);
        vocalPath.connect(this.pitchNode);
        vocalPath = this.pitchNode;
      }

      vocalPath.connect(this.effects.input);
      this.effects.output.connect(this.outputGain);
      // Local headphone monitor only. No connection to recording destinations.
      this.outputGain.connect(audio.destination);
      this.applyOutputLevel();
      StudioAudioEngine.setTalkbackDuck(1 - this.duckAmount);
      this.active = true;
      this.emitState();
      return true;
    } catch (error) {
      this.cleanupGraph();
      throw error;
    }
  },

  cleanupGraph() {
    try { this.source?.disconnect(); } catch {}
    try { this.highPass?.disconnect(); } catch {}
    try { this.compressor?.disconnect(); } catch {}
    try { this.pitchNode?.disconnect(); } catch {}
    try { this.effects?.destroy?.(); } catch {}
    try { this.outputGain?.disconnect(); } catch {}
    this.stream?.getTracks?.().forEach(track => track.stop());
    this.stream = null;
    this.source = null;
    this.highPass = null;
    this.compressor = null;
    this.pitchNode = null;
    this.effects = null;
    this.outputGain = null;
  },

  stop() {
    this.active = false;
    this.cleanupGraph();
    try { StudioAudioEngine.setTalkbackDuck(1); } catch {}
    this.emitState();
    return true;
  },

  async toggle(options = {}) {
    if (this.active) {
      this.stop();
      return false;
    }
    await this.start(options);
    return true;
  },

  bindControl(button, { beatLab = this.beatLab || window.__lamboCityFloor2BeatLab } = {}) {
    if (!button || this.controls.has(button)) return () => {};
    this.controls.add(button);
    button.title = "Tap to toggle Talkback · Press and hold to talk";
    button.setAttribute("aria-label", "Talkback microphone. Tap to toggle or press and hold to talk.");
    button.setAttribute("aria-pressed", String(this.active));

    const render = active => {
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "● TALKBACK ON" : "TALKBACK";
      button.style.borderColor = active ? "#f17b8b" : "#b58b4e";
      button.style.background = active ? "linear-gradient(#a92e42,#681c2b)" : "linear-gradient(#3a3022,#19150f)";
      button.style.color = "#fff0d1";
    };

    let pointerDown = false;
    let holdStarted = false;
    let holdTimer = null;
    const clearHold = () => {
      if (holdTimer !== null) window.clearTimeout(holdTimer);
      holdTimer = null;
    };
    const startHold = async () => {
      holdStarted = true;
      try { await this.start({ beatLab }); }
      catch (error) { this.statusError(error); }
    };
    const onPointerDown = event => {
      if (event.button !== undefined && event.button !== 0) return;
      pointerDown = true;
      holdStarted = false;
      clearHold();
      holdTimer = window.setTimeout(startHold, this.holdDelayMs);
    };
    const onPointerUp = async () => {
      if (!pointerDown) return;
      pointerDown = false;
      clearHold();
      if (holdStarted) {
        this.stop();
        holdStarted = false;
        return;
      }
      try { await this.toggle({ beatLab }); }
      catch (error) { this.statusError(error); }
    };
    const onPointerCancel = () => {
      pointerDown = false;
      clearHold();
      if (holdStarted) this.stop();
      holdStarted = false;
    };
    const onKeyboardClick = async event => {
      if (event.detail !== 0) return;
      try { await this.toggle({ beatLab }); }
      catch (error) { this.statusError(error); }
    };
    const onState = event => render(Boolean(event.detail?.active));

    button.addEventListener("pointerdown", onPointerDown);
    button.addEventListener("pointerup", onPointerUp);
    button.addEventListener("pointercancel", onPointerCancel);
    button.addEventListener("lostpointercapture", onPointerCancel);
    button.addEventListener("click", onKeyboardClick);
    window.addEventListener("lc-talkback-state", onState);
    render(this.active);

    const cleanup = () => {
      clearHold();
      button.removeEventListener("pointerdown", onPointerDown);
      button.removeEventListener("pointerup", onPointerUp);
      button.removeEventListener("pointercancel", onPointerCancel);
      button.removeEventListener("lostpointercapture", onPointerCancel);
      button.removeEventListener("click", onKeyboardClick);
      window.removeEventListener("lc-talkback-state", onState);
      this.controls.delete(button);
    };
    button.addEventListener("remove", cleanup, { once: true });
    return cleanup;
  },

  statusError(error) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lc-talkback-error", {
        detail: { message: error?.message || String(error) }
      }));
    }
  }
};

export default StudioTalkback;
