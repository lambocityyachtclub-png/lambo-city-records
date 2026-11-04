/*
 * LAMBO CITY RECORDS
 * DAW ARRANGEMENT PLAYBACK — V2
 *
 * Schedules session clips through one live channel strip
 * per track and the existing shared StudioAudioEngine.
 * Supports live gain, pan, mute, and solo changes.
 */

import StudioVocalEffects from "./studioVocalEffects.js";
import { createStudioPitchCorrectionNode, normalizePitchCorrectionSettings } from "./studioPitchCorrection.js";

export function createStudioDAWArrangementPlayback({
  getAudioContext,
  getOutput,
  getTempo,
  getSecondsAtBar = bar => (Math.max(1, Number(bar) || 1) - 1) * 240 / Math.max(1, Number(getTempo()) || 100),
  getBarAtSeconds = seconds => 1 + Number(seconds || 0) * Math.max(1, Number(getTempo()) || 100) / 240,
  onPosition = () => {},
  onStatus = () => {}
} = {}) {
  if (typeof getAudioContext !== "function" || typeof getTempo !== "function") {
    throw new Error("Arrangement playback requires audio-context and tempo providers.");
  }

  const decodedBuffers = new WeakMap();

  return {
    sources: [],
    trackChannels: new Map(),
    activeTracks: [],
    runId: 0,
    playing: false,
    loopTimer: null,
    positionTimer: null,

    async decodeClip(context, blob) {
      if (decodedBuffers.has(blob)) return decodedBuffers.get(blob);
      const pending = (async () => {
        const bytes = await blob.arrayBuffer();
        return context.decodeAudioData(bytes.slice(0));
      })();
      decodedBuffers.set(blob, pending);
      try {
        return await pending;
      } catch (error) {
        decodedBuffers.delete(blob);
        throw error;
      }
    },

    disposeChannels() {
      this.trackChannels.forEach(({ gain, automationGain, low, mid, high, compressor, panner, effects, pitchCorrectionNode }) => {
        try { gain.disconnect(); } catch {}
        try { automationGain.disconnect(); } catch {}
        try { low.disconnect(); } catch {}
        try { mid.disconnect(); } catch {}
        try { high.disconnect(); } catch {}
        try { compressor.disconnect(); } catch {}
        try { panner?.disconnect(); } catch {}
        try { pitchCorrectionNode?.disconnect(); } catch {}
        try { effects?.destroy(); } catch {}
      });
      this.trackChannels.clear();
      this.activeTracks = [];
    },

    stop() {
      this.runId += 1;
      this.playing = false;
      if (this.loopTimer) clearTimeout(this.loopTimer);
      if (this.positionTimer) clearInterval(this.positionTimer);
      this.loopTimer = null;
      this.positionTimer = null;
      const active = this.sources.splice(0);
      active.forEach(({ source }) => {
        source.onended = null;
        try { source.stop(); } catch {}
        try { source.disconnect(); } catch {}
      });
      this.disposeChannels();
    },

    async createTrackChannel(context, track, output) {
      const gain = context.createGain();
      const automationGain = context.createGain();
      const low = context.createBiquadFilter();
      const mid = context.createBiquadFilter();
      const high = context.createBiquadFilter();
      const compressor = context.createDynamicsCompressor();
      const panner = typeof context.createStereoPanner === "function"
        ? context.createStereoPanner()
        : null;
      low.type = "lowshelf";
      low.frequency.value = 120;
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 0.8;
      high.type = "highshelf";
      high.frequency.value = 8000;
      compressor.knee.value = 18;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      gain.connect(automationGain);
      automationGain.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(compressor);
      const trackEffects = StudioVocalEffects.create(context);
      const pitchSettings = normalizePitchCorrectionSettings(track.effects?.pitchCorrection);
      const pitchCorrectionNode = pitchSettings.enabled
        ? await createStudioPitchCorrectionNode(context, pitchSettings)
        : null;
      trackEffects.setReverbDecay(track.effects?.reverbDecay ?? 2.2);
      if (pitchCorrectionNode) {
        compressor.connect(pitchCorrectionNode);
        pitchCorrectionNode.connect(trackEffects.input);
      } else {
        compressor.connect(trackEffects.input);
      }
      if (panner) {
        trackEffects.output.connect(panner);
        panner.connect(output);
      } else {
        trackEffects.output.connect(output);
      }
      const channel = { gain, automationGain, low, mid, high, compressor, panner, effects: trackEffects, pitchCorrectionNode, track };
      this.trackChannels.set(track.id, channel);
      this.applyTrackState(track);
      return channel;
    },

    applyTrackState(track) {
      const channel = this.trackChannels.get(track.id);
      if (!channel) return;
      const anySolo = this.activeTracks.some(item => item.solo);
      const hasSeparateStems =
        this.activeTracks.some(item => item.name === "Vocals") &&
        this.activeTracks.some(item => item.name === "Beats");
      const excludedMaster = !anySolo && hasSeparateStems && track.name === "Master Mix";
      const muted = Boolean(track.muted || (anySolo && !track.solo) || excludedMaster);
      const volume = Math.max(0, Math.min(1, Number(track.volume ?? 80) / 100));
      const pan = Math.max(-1, Math.min(1, Number(track.pan ?? 0)));
      const now = channel.gain.context.currentTime;
      channel.gain.gain.setTargetAtTime(muted ? 0 : volume, now, 0.015);
      if (channel.panner) channel.panner.pan.setTargetAtTime(pan, now, 0.015);
      const eq = track.eq || {};
      channel.low.gain.setTargetAtTime(Math.max(-12, Math.min(12, Number(eq.low) || 0)), now, 0.02);
      channel.mid.gain.setTargetAtTime(Math.max(-12, Math.min(12, Number(eq.mid) || 0)), now, 0.02);
      channel.high.gain.setTargetAtTime(Math.max(-12, Math.min(12, Number(eq.high) || 0)), now, 0.02);
      const compression = track.compression || {};
      channel.compressor.threshold.setTargetAtTime(Math.max(-48, Math.min(0, Number(compression.threshold ?? -18))), now, 0.02);
      channel.compressor.ratio.setTargetAtTime(Math.max(1, Math.min(8, Number(compression.ratio ?? 1))), now, 0.02);
      const effects = track.effects || {};
      channel.effects.setDelayTime(effects.delayTime ?? 0.28);
      channel.effects.setDelayFeedback(effects.delayFeedback ?? 0.25);
      channel.effects.setDelayMix(effects.delayMix ?? 0);
      channel.effects.setReverbMix(effects.reverbMix ?? 0);
      if (channel.pitchCorrectionNode) {
        channel.pitchCorrectionNode.port.postMessage(normalizePitchCorrectionSettings(effects.pitchCorrection));
      }
    },

    syncTrackState(tracks = this.activeTracks) {
      this.activeTracks = tracks;
      tracks.forEach(track => this.applyTrackState(track));
    },

    setTrackVolume(trackId, value) {
      const track = this.activeTracks.find(item => item.id === trackId);
      if (!track) return;
      track.volume = Math.max(0, Math.min(100, Number(value) || 0));
      this.applyTrackState(track);
    },

    setTrackPan(trackId, value) {
      const track = this.activeTracks.find(item => item.id === trackId);
      if (!track) return;
      track.pan = Math.max(-1, Math.min(1, Number(value) || 0));
      this.applyTrackState(track);
    },

    setTrackEQ(trackId, band, value) {
      const track = this.activeTracks.find(item => item.id === trackId);
      if (!track || !["low", "mid", "high"].includes(band)) return;
      track.eq = { ...(track.eq || {}), [band]: Math.max(-12, Math.min(12, Number(value) || 0)) };
      this.applyTrackState(track);
    },

    setTrackCompression(trackId, ratio) {
      const track = this.activeTracks.find(item => item.id === trackId);
      if (!track) return;
      track.compression = { ...(track.compression || {}), ratio: Math.max(1, Math.min(8, Number(ratio) || 1)) };
      this.applyTrackState(track);
    },

    async setTrackEffects(trackId, values = {}) {
      const track = this.activeTracks.find(item => item.id === trackId);
      if (!track) return;
      track.effects = { ...(track.effects || {}), ...values };
      const channel = this.trackChannels.get(trackId);
      if (channel && track.effects.pitchCorrection?.enabled && !channel.pitchCorrectionNode) {
        const node = await createStudioPitchCorrectionNode(
          channel.gain.context,
          track.effects.pitchCorrection
        );
        channel.compressor.disconnect();
        channel.compressor.connect(node);
        node.connect(channel.effects.input);
        channel.pitchCorrectionNode = node;
      }
      this.applyTrackState(track);
    },

    scheduleVolumeAutomation(track, startTime, secondsPerBar) {
      const channel = this.trackChannels.get(track.id);
      if (!channel) return;
      const parameter = channel.automationGain.gain;
      const points = [...(track.automation?.volume || [])]
        .filter(point => Number.isFinite(Number(point.bar)) && Number.isFinite(Number(point.value)))
        .sort((a, b) => a.bar - b.bar);
      const now = channel.gain.context.currentTime;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(1, startTime);
      points.forEach(point => {
        const time = startTime + Math.max(0, getSecondsAtBar(Math.max(1, Number(point.bar))) - getSecondsAtBar(1));
        const value = Math.max(0, Math.min(1, Number(point.value) / 100));
        if (time <= startTime + 0.001) parameter.setValueAtTime(value, startTime);
        else parameter.linearRampToValueAtTime(value, time);
      });
    },

    async play(tracks = [], startBar = 1, loopRange = null) {
      this.stop();
      const runId = this.runId;
      const clips = [];

      tracks.forEach(track => {
        (Array.isArray(track.clips) ? track.clips : []).forEach(clip => {
          if (clip.blob && clip.blob.size > 0) clips.push({ track, clip });
        });
      });

      if (!clips.length) {
        onStatus("No recorded audio clips available for arrangement playback.");
        return false;
      }

      try {
        const context = await getAudioContext();
        if (!context || context.state !== "running") {
          throw new Error("The shared studio audio is not running.");
        }

        const tempo = Number(getTempo());
        if (!Number.isFinite(tempo) || tempo <= 0) {
          throw new Error("Set a valid song tempo before playback.");
        }

        const decoded = await Promise.all(clips.map(async item => ({
          ...item,
          buffer: await this.decodeClip(context, item.clip.blob)
        })));

        if (runId !== this.runId) return false;

        const output = getOutput ? getOutput(context) : context.destination;
        if (!output) throw new Error("The studio playback output is unavailable.");

        this.activeTracks = tracks;
        await Promise.all(tracks.map(async track => {
          if (!this.trackChannels.has(track.id)) {
            await this.createTrackChannel(context, track, output);
          }
        }));
        this.syncTrackState(tracks);

        const cursorBar = Math.max(1, Math.min(128, Number(startBar) || 1));
        const activeLoop = loopRange?.enabled && Number(loopRange.endBar) > Number(loopRange.startBar) ? { startBar: Math.max(1, Number(loopRange.startBar)), endBar: Math.min(129, Number(loopRange.endBar)) } : null;
        const actualStartBar = activeLoop && (cursorBar < activeLoop.startBar || cursorBar >= activeLoop.endBar) ? activeLoop.startBar : cursorBar;
        const cursorSeconds = getSecondsAtBar(actualStartBar);
        const startTime = context.currentTime + 0.12;
        tracks.forEach(track => this.scheduleVolumeAutomation(track, startTime, 0));
        decoded.forEach(({ track, clip, buffer }) => {
          const channel = this.trackChannels.get(track.id);
          if (!channel) return;

          const clipStartBar = Number.isFinite(Number(clip.startBar))
            ? Math.max(1, Number(clip.startBar))
            : 1;
          const clipSourceOffset = Math.max(0, Number(clip.sourceOffsetSeconds) || 0);
          const clipEndBar = clipStartBar + Math.max(.0625, Number(clip.lengthBars) || 4);
          const clipStartSeconds = getSecondsAtBar(clipStartBar);
          const clipTimelineDuration = Math.max(0, getSecondsAtBar(clipEndBar) - clipStartSeconds);
          const sourceDuration = Math.min(clipTimelineDuration, Number(clip.playDurationSeconds) > 0 ? Number(clip.playDurationSeconds) : buffer.duration - clipSourceOffset, Math.max(0, buffer.duration - clipSourceOffset));
          const clipEndSeconds = clipStartSeconds + sourceDuration;
          const cycleEndSeconds = activeLoop ? getSecondsAtBar(activeLoop.endBar) : Infinity;
          const scheduleStartSeconds = Math.max(clipStartSeconds, cursorSeconds, activeLoop ? getSecondsAtBar(activeLoop.startBar) : cursorSeconds);
          const scheduleEndSeconds = Math.min(clipEndSeconds, cycleEndSeconds);
          const elapsedBeforeCursor = Math.max(0, scheduleStartSeconds - clipStartSeconds);
          const sourceOffset = clipSourceOffset + elapsedBeforeCursor;
          const remainingDuration = scheduleEndSeconds - scheduleStartSeconds;
          const timelineDelay = Math.max(0, scheduleStartSeconds - cursorSeconds);
          if (remainingDuration <= 0.001 || sourceOffset >= buffer.duration) return;

          const source = context.createBufferSource();
          const clipGain = context.createGain();
          source.buffer = buffer;
          const gainDb = Math.max(-24, Math.min(12, Number(clip.clipGainDb) || 0));
          const linearGain = Math.pow(10, gainDb / 20);
          const fadeIn = Math.max(0, Math.min(remainingDuration, Number(clip.fadeInSeconds) || 0));
          const fadeOut = Math.max(0, Math.min(remainingDuration, Number(clip.fadeOutSeconds) || 0));
          const clipStartTime = startTime + timelineDelay;
          const clipEndTime = clipStartTime + remainingDuration;
          clipGain.gain.setValueAtTime(linearGain, clipStartTime);
          if (fadeIn > 0) {
            const curve = new Float32Array(32);
            for (let index = 0; index < curve.length; index += 1) {
              curve[index] = linearGain * Math.sin((index / (curve.length - 1)) * Math.PI / 2);
            }
            clipGain.gain.setValueAtTime(0, clipStartTime);
            clipGain.gain.setValueCurveAtTime(curve, clipStartTime, fadeIn);
          }
          if (fadeOut > 0) {
            const curve = new Float32Array(32);
            for (let index = 0; index < curve.length; index += 1) {
              curve[index] = linearGain * Math.cos((index / (curve.length - 1)) * Math.PI / 2);
            }
            const fadeStart = Math.max(clipStartTime, clipEndTime - fadeOut);
            clipGain.gain.setValueAtTime(linearGain, fadeStart);
            clipGain.gain.setValueCurveAtTime(curve, fadeStart, clipEndTime - fadeStart);
          }
          source.connect(clipGain);
          clipGain.connect(channel.gain);
          source.onended = () => {
            try { clipGain.disconnect(); } catch {} 
            try { source.disconnect(); } catch {}
            if (runId !== this.runId) return;
            this.sources = this.sources.filter(item => item.source !== source);
            if (!this.sources.length) {
              this.playing = false;
              this.disposeChannels();
              onStatus("Arrangement playback finished.");
            }
          };
          this.sources.push({ source, trackId: track.id });
          source.start(clipStartTime, sourceOffset, remainingDuration);
        });

        this.playing = this.sources.length > 0;
        this.positionTimer = setInterval(() => {
          const elapsed = Math.max(0, context.currentTime - startTime);
          onPosition(Math.max(1, Math.min(128, Number(getBarAtSeconds(cursorSeconds + elapsed)) || actualStartBar)));
        }, 80);
        if (activeLoop) {
          const loopDuration = getSecondsAtBar(activeLoop.endBar) - getSecondsAtBar(actualStartBar);
          if (loopDuration > 0.05) this.loopTimer = setTimeout(() => { void this.play(tracks, activeLoop.startBar, loopRange); }, loopDuration * 1000);
        }
        onStatus(`Arrangement playing from bar ${actualStartBar} · ${tempo} BPM · ${decoded.length} audio clip(s).`);
        return this.playing;
      } catch (error) {
        if (runId === this.runId) {
          this.stop();
          onStatus(`ARRANGEMENT PLAYBACK ERROR: ${error?.message || error}`);
        }
        console.error("LAMBO CITY arrangement playback error:", error);
        return false;
      }
    }
  };
}

export default createStudioDAWArrangementPlayback;
